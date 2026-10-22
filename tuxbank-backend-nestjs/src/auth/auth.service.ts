import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../users/schemas/user.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  // 1. Registro de usuario con hash de contraseña
  async register(registerDto: RegisterDto) {
    const { nombre, email, password } = registerDto;

    const userExists = await this.userModel.findOne({ email });
    if (userExists) {
      throw new ConflictException('El correo electrónico ya está registrado');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await this.userModel.create({
      nombre,
      email,
      password: hashedPassword,
    });

    return {
      message: 'Usuario registrado exitosamente',
      user: {
        id: newUser._id,
        nombre: newUser.nombre,
        email: newUser.email,
        rol: newUser.rol,
      },
    };
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
}