const mongoose = require('mongoose');

const transaccionSchema = new mongoose.Schema({
    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: false // O true, según prefieras
    },
    cuentaOrigen: { type: String, required: true },
    cuentaDestino: { type: String, required: true },
    monto: { type: Number, required: true },
    fecha: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Transaccion', transaccionSchema);