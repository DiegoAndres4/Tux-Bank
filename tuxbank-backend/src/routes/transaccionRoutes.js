const express = require('express');
const router = express.Router();
const { transferir, obtenerHistorial } = require('../controllers/transaccionController');
const verificarToken = require('../middlewares/authMiddleware');

// Ambas rutas protegidas con 'verificarToken'
router.post('/transferir', verificarToken, transferir);
router.get('/historial', verificarToken, obtenerHistorial); // <--- Se quitó :numeroCuenta de la URL

module.exports = router;