const express = require('express');
const router = express.Router();
const { 
    registrarUsuario, 
    iniciarSesion, 
    cerrarSesion, 
    obtenerPerfil 
} = require('../controllers/authController');
const verificarToken = require('../middlewares/authMiddleware');
// Rutas públicas
router.post('/registro', registrarUsuario);
router.post('/login', iniciarSesion);
router.post('/logout', cerrarSesion);

// Ruta protegida (requiere la cookie con el token)
router.get('/me', verificarToken, obtenerPerfil);

module.exports = router;