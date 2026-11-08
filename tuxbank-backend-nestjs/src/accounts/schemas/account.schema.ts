import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AccountDocument = Account & Document;

@Schema({ timestamps: true })
export class Account {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  usuario: Types.ObjectId;

  @Prop({ required: true, unique: true, trim: true })
  numeroCuenta: string;

  @Prop({ required: true, default: 500000, min: 0 })
  saldo: number;

  @Prop({ required: true, default: true })
  activa: boolean;
}

export const AccountSchema = SchemaFactory.createForClass(Account);

// Índice de búsqueda por usuario (historial y perfil de sesión)
AccountSchema.index({ usuario: 1 });