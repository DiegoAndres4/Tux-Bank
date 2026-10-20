const mongoose = require('mongoose');

const cuentaSchema = new mongoose.Schema({
    saldo: { type: Number, required: true, default: 500000 },
    activa: { type: Boolean, default: true },
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: false },
    numeroCuenta: {type: String, required: true, unique: true},
});

module.exports = mongoose.model('Cuenta', cuentaSchema);