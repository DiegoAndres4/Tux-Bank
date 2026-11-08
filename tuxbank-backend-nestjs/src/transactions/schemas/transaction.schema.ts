import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TransactionDocument = Transaction & Document;

@Schema({ timestamps: true })
export class Transaction {
  @Prop({ type: Types.ObjectId, ref: 'Account', required: true })
  cuentaOrigen: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Account', required: true })
  cuentaDestino: Types.ObjectId;

  @Prop({ required: true, min: 1 })
  monto: number;

  @Prop({ default: 'transferencia' })
  tipo: string;

  @Prop()
  descripcion?: string;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);

// Índices compuestos para el historial ordenado por fecha
TransactionSchema.index({ cuentaOrigen: 1, createdAt: -1 });
TransactionSchema.index({ cuentaDestino: 1, createdAt: -1 });