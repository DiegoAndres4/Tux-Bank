const Cuenta = require('../models/Cuenta');
const Transaccion = require('../models/Transaccion');
const mongoose = require('mongoose');

// Obtener el historial ÚNICAMENTE del usuario que tiene la sesión iniciada
const obtenerHistorial = async (req, res) => {
    try {
        // 1. Validar que el token haya pasado por el authMiddleware
        if (!req.usuario || !req.usuario.id) {
            return res.status(401).json({ error: "Usuario no autenticado" });
        }

        // 2. Buscar la cuenta que pertenece al usuario de la sesión actual
        const cuentaUsuario = await Cuenta.findOne({ usuario: req.usuario.id });

        if (!cuentaUsuario) {
            return res.status(404).json({ error: "No se encontró la cuenta vinculada al usuario" });
        }

        const numeroCuenta = cuentaUsuario.numeroCuenta;

        // 3. Buscar solo las transacciones donde esta cuenta sea origen o destino
        const historial = await Transaccion.find({
            $or: [{ cuentaOrigen: numeroCuenta }, { cuentaDestino: numeroCuenta }]
        }).sort({ fecha: -1 });

        return res.status(200).json({
            numeroCuenta,
            historial
        });
    } catch (error) {
        return res.status(500).json({ error: "Error al obtener el historial: " + error.message });
    }
};

// Realizar transferencia entre cuentas (Versión Segura con JWT y Transacción Atómica)
const transferir = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { cuentaDestino, monto } = req.body;

        if (!req.usuario || !req.usuario.id) {
            await session.abortTransaction();
            session.endSession();
            return res.status(401).json({ error: "Usuario no autenticado" });
        }

        const montoNumero = Number(monto);
        if (isNaN(montoNumero) || montoNumero <= 0) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ error: "Ingrese un monto válido" });
        }

        if (!cuentaDestino) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ error: "Debe proporcionar una cuenta de destino" });
        }

        // Buscar la cuenta origen vinculada al usuario autenticado
        const origen = await Cuenta.findOne({ usuario: req.usuario.id }).session(session);

        if (!origen) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ error: "No se encontró la cuenta del emisor" });
        }

        if (!origen.activa) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ error: "Su cuenta no se encuentra activa" });
        }

        if (origen.saldo < montoNumero) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ error: "Saldo insuficiente para realizar la transferencia" });
        }

        if (origen.numeroCuenta === cuentaDestino) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ error: "No puede transferirse dinero a su propia cuenta" });
        }

        // Buscar la cuenta destino
        const destino = await Cuenta.findOne({ numeroCuenta: cuentaDestino }).session(session);

        if (!destino) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ error: "La cuenta de destino no existe" });
        }

        if (!destino.activa) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ error: "La cuenta de destino no se encuentra activa" });
        }

        // Modificar saldos
        origen.saldo -= montoNumero;
        destino.saldo += montoNumero;

        await origen.save({ session });
        await destino.save({ session });


        // Registrar el movimiento en el historial de transacciones
        await Transaccion.create([{
            usuario: req.usuario.id,
            cuentaOrigen: origen.numeroCuenta,
            cuentaDestino: destino.numeroCuenta,
            monto: montoNumero,
        }], { session });

        await session.commitTransaction();
        session.endSession();

        return res.status(200).json({
            mensaje: "¡Transferencia realizada con éxito!",
            nuevoSaldo: origen.saldo,
            comprobante: {
                origen: origen.numeroCuenta,
                destino: destino.numeroCuenta,
                monto: montoNumero
            }
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        return res.status(500).json({ error: "Error interno al procesar la transferencia: " + error.message });
    }
};

module.exports = {
    transferir,
    obtenerHistorial,
};