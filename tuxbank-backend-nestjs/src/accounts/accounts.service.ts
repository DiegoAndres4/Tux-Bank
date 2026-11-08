import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import type { ClientSession } from 'mongoose';
import { Account, AccountDocument } from './schemas/account.schema';

@Injectable()
export class AccountsService {
  constructor(
    @InjectModel(Account.name) private accountModel: Model<AccountDocument>,
  ) {}

  private generateAccountNumber(): string {
    return Math.floor(1000000000 + Math.random() * 9000000000).toString();
  }

  async createAccount(
    userId: string,
    options: { session?: ClientSession } = {},
  ): Promise<AccountDocument> {
    const { session } = options;
    const userObjectId = new Types.ObjectId(userId);

    const existingAccount = await this.accountModel
      .findOne({ usuario: userObjectId })
      .session(session ?? null);

    if (existingAccount) {
      throw new BadRequestException('El usuario ya posee una cuenta activa');
    }

    let numeroCuenta = this.generateAccountNumber();
    let isUnique = false;

    while (!isUnique) {
      const accountExists = await this.accountModel
        .findOne({ numeroCuenta })
        .session(session ?? null);
      if (!accountExists) {
        isUnique = true;
      } else {
        numeroCuenta = this.generateAccountNumber();
      }
    }

    const newAccount = new this.accountModel({
      usuario: userObjectId,
      numeroCuenta,
      saldo: 500000,
      activa: true,
    });

    return newAccount.save({ session });
  }

  // Búsqueda sin excepción: permite distinguir "sin cuenta" de un error real
  async findAccountByUserId(
    userId: string,
  ): Promise<AccountDocument | null> {
    return this.accountModel.findOne({
      usuario: new Types.ObjectId(userId),
    });
  }

  async getAccountByUserId(userId: string): Promise<AccountDocument> {
    const account = await this.findAccountByUserId(userId);

    if (!account) {
      throw new NotFoundException(
        'No se encontró ninguna cuenta asociada a este usuario',
      );
    }

    return account;
  }
  async getAllAccounts(): Promise<Account[]> {
    return this.accountModel.find().populate('usuario', 'nombre email rol').exec();
  }
}