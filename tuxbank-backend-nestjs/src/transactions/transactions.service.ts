import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Connection, Types } from 'mongoose';
import { InjectConnection } from '@nestjs/mongoose';
import {
  Transaction,
  TransactionDocument,
} from './schemas/transaction.schema';
import { Account, AccountDocument } from '../accounts/schemas/account.schema';
import { TransferDto } from './dto/transfer.dto';

export interface ContraparteInfo {
  numeroCuenta: string | null;
  nombre: string | null;
}

@Injectable()
export class TransactionsService {
  constructor(
    @InjectModel(Transaction.name)
    private transactionModel: Model<TransactionDocument>,
    @InjectModel(Account.name)
    private accountModel: Model<AccountDocument>,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  // 1. Historial de transferencias enviadas y recibidas del usuario autenticado
  async getHistorial(userId: string) {
    const cuenta = await this.accountModel.findOne({
      usuario: new Types.ObjectId(userId),
    });

    if (!cuenta) {
      throw new NotFoundException(
        'No se encontró ninguna cuenta asociada a este usuario',
      );
    }

    const cuentaId = cuenta._id as Types.ObjectId;

    const transacciones = await this.transactionModel
      .find({
        $or: [{ cuentaOrigen: cuentaId }, { cuentaDestino: cuentaId }],
      })
      .sort({ createdAt: -1 })
      .limit(100)
      .exec();

    // Cuentas del otro extremo de cada movimiento (una sola consulta)
    const idsContraparte = transacciones.map((transaccion) =>
      String(transaccion.cuentaOrigen) === String(cuentaId)
        ? transaccion.cuentaDestino
        : transaccion.cuentaOrigen,
    );

    const cuentasContraparte = idsContraparte.length
      ? await this.accountModel
          .find({ _id: { $in: idsContraparte } })
          .populate('usuario', 'nombre')
          .exec()
      : [];

    const contrapartes = new Map<string, ContraparteInfo>();
    for (const cuentaContraparte of cuentasContraparte) {
      const propietario = cuentaContraparte.usuario as unknown as {
        nombre?: string;
      } | null;

      contrapartes.set(String(cuentaContraparte._id), {
        numeroCuenta: cuentaContraparte.numeroCuenta ?? null,
        nombre: propietario?.nombre ?? null,
      });
    }

    return {
      cuenta: cuenta.numeroCuenta,
      movimientos: transacciones.map((transaccion) => {
        const esEnviada =
          String(transaccion.cuentaOrigen) === String(cuentaId);
        const idContraparte = esEnviada
          ? transaccion.cuentaDestino
          : transaccion.cuentaOrigen;
        const conFecha = transaccion as unknown as { createdAt?: Date };

        return {
          _id: String(transaccion._id),
          tipo: transaccion.tipo,
          direccion: esEnviada ? 'enviada' : 'recibida',
          monto: transaccion.monto,
          descripcion: transaccion.descripcion ?? null,
          fecha: conFecha.createdAt ? conFecha.createdAt.toISOString() : null,
          contraparte: contrapartes.get(String(idContraparte)) ?? {
            numeroCuenta: null,
            nombre: null,
          },
        };
      }),
    };
  }

  // 2. Transferencia atómica: lecturas y validaciones dentro de la sesión
  async transferir(userId: string, transferDto: TransferDto) {
    const { numeroCuentaDestino, monto, descripcion } = transferDto;
    const usuarioId = new Types.ObjectId(userId);

    const session = await this.connection.startSession();

    try {
      // withTransaction reintenta la operación completa ante un
      // TransientTransactionError (WriteConflict) y se encarga del commit/abort.
      // Sin esto, dos transferencias simultáneas sobre la misma cuenta
      // devolvían un 500 con WriteConflict.
      const comprobante = await session.withTransaction(async () => {
        // Cuenta del emisor leída dentro de la sesión
        const cuentaOrigen = await this.accountModel
          .findOne({ usuario: usuarioId })
          .session(session);

        if (!cuentaOrigen) {
          throw new NotFoundException('No posees una cuenta bancaria activa');
        }

        // Cuenta del receptor leída dentro de la sesión
        const cuentaDestino = await this.accountModel
          .findOne({ numeroCuenta: numeroCuentaDestino })
          .session(session);

        if (!cuentaDestino) {
          throw new NotFoundException('La cuenta de destino no existe');
        }

        if (cuentaOrigen.numeroCuenta === cuentaDestino.numeroCuenta) {
          throw new BadRequestException('No puedes transferirte a ti mismo');
        }

        if (cuentaDestino.activa === false) {
          throw new BadRequestException('La cuenta de destino no está activa');
        }

        // Validación de saldo con el valor leído dentro de la sesión
        if (cuentaOrigen.saldo < monto) {
          throw new BadRequestException(
            'Saldo insuficiente para la transferencia',
          );
        }

        cuentaOrigen.saldo -= monto;
        await cuentaOrigen.save({ session });

        cuentaDestino.saldo += monto;
        await cuentaDestino.save({ session });

        const nuevaTransaccion = await this.transactionModel.create(
          [
            {
              cuentaOrigen: cuentaOrigen._id,
              cuentaDestino: cuentaDestino._id,
              monto,
              descripcion: descripcion || 'Transferencia entre cuentas TuxBank',
            },
          ],
          { session },
        );

        return {
          idTransaccion: nuevaTransaccion[0]._id,
          origen: cuentaOrigen.numeroCuenta,
          destino: cuentaDestino.numeroCuenta,
          monto,
          nuevoSaldo: cuentaOrigen.saldo,
        };
      });

      return {
        message: 'Transferencia realizada con éxito',
        comprobante,
      };
    } finally {
      await session.endSession();
    }
  }
}
