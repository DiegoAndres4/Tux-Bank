const Cuenta = require('../models/Cuenta');

// Obtener todas las cuentas (Solo Admin)
const obtenerTodasLasCuentas = async (req, res) => {
    try {
        const cuentas = await Cuenta.find().populate('usuario', 'nombre email rol');
        return res.status(200).json({ cuentas });
    } catch (error) {
        return res.status(500).json({ error: "Error al obtener las cuentas: " + error.message });
    }
};

// Obtener cuenta por ID específico (Solo Admin)
const obtenerCuentaPorId = async (req, res) => {
    try {
        const { id } = req.params;
        const cuenta = await Cuenta.findById(id).populate('usuario', 'nombre email rol');

        if (!cuenta) {
            return res.status(404).json({ error: "Cuenta no encontrada" });
        }

        return res.status(200).json({ cuenta });
    } catch (error) {
        return res.status(500).json({ error: "Error al consultar la cuenta: " + error.message });
    }
};

module.exports = {
    obtenerTodasLasCuentas,
    obtenerCuentaPorId
};