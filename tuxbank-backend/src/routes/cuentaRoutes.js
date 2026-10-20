const express = require('express');
const router = express.Router();
const { obtenerTodasLasCuentas, obtenerCuentaPorId } = require('../controllers/cuentaController');
const verificarToken = require('../middlewares/authMiddleware');
const { esAdmin } = require('../middlewares/roleMiddleware');

// Rutas protegidas exclusivamente para Administradores
router.get('/admin/cuentas', verificarToken, esAdmin, obtenerTodasLasCuentas);
router.get('/admin/cuentas/:id', verificarToken, esAdmin, obtenerCuentaPorId);

module.exports = router;