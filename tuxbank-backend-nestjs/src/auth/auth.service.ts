import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../users/schemas/user.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AccountsService } from '../accounts/accounts.service';

/**
 * E11000 es el código de error de MongoDB para una violación de índice único.
 */
function esErrorDeDuplicado(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 11000
  );
}

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
    private accountsService: AccountsService,
  ) {}

  // 1. Registro de usuario + Creación automática de cuenta bancaria
  //
  // Usuario y cuenta se crean dentro de la MISMA transacción: o existen los dos
  // o no existe ninguno. Antes, si la creación de la cuenta fallaba, quedaba un
  // usuario sin cuenta que no podía operar ni volver a registrarse.
  async register(registerDto: RegisterDto) {
    const { nombre, email, password } = registerDto;

    const userExists = await this.userModel.findOne({ email });
    if (userExists) {
      throw new ConflictException('El correo electrónico ya está registrado');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const session = await this.userModel.db.startSession();

    try {
      const creados = await session.withTransaction(async () => {
        const [newUser] = await this.userModel.create(
          [{ nombre, email, password: hashedPassword }],
          { session },
        );

        // Se crea la cuenta bancaria enlazada al ID del usuario
        const newAccount = await this.accountsService.createAccount(
          newUser._id.toString(),
          { session },
        );

        return { newUser, newAccount };
      });

      const { newUser, newAccount } = creados;

      return {
        message: 'Usuario registrado y cuenta bancaria creada exitosamente',
        user: {
          id: newUser._id,
          nombre: newUser.nombre,
          email: newUser.email,
          rol: newUser.rol,
        },
        account: {
          numeroCuenta: newAccount.numeroCuenta,
          saldo: newAccount.saldo,
        },
      };
    } catch (error) {
      // Dos registros simultáneos con el mismo email: el índice único de Mongo
      // gana la carrera y devuelve E11000. Se traduce a un 409, no a un 500.
      if (esErrorDeDuplicado(error)) {
        throw new ConflictException(
          'El correo electrónico ya está registrado',
        );
      }
      throw error;
    } finally {
      await session.endSession();
    }
  }

  // 2. Validación de credenciales para Login
  async validateUser(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    return user;
  }

  // 3. Generación del JWT
  generateJwtToken(user: UserDocument) {
    const payload = { sub: user._id, email: user.email, rol: user.rol };
    return this.jwtService.sign(payload);
  }

  // 4. Perfil de la sesión actual (usuario + cuenta, sin lanzar error si no hay cuenta)
  async getProfile(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    const account = await this.accountsService.findAccountByUserId(userId);

    return {
      user: {
        id: user._id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
      },
      account: account
        ? {
            _id: account._id,
            numeroCuenta: account.numeroCuenta,
            saldo: account.saldo,
            activa: account.activa,
          }
        : null,
    };
  }
}