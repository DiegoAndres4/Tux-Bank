const esAdmin = (req, res, next) => {
    if (!req.usuario) {
        return res.status(401).json({ error: "Usuario no autenticado" });
    }

    if (req.usuario.rol !== 'admin') {
        return res.status(403).json({ 
            error: "Acceso denegado: Se requieren permisos de administrador para realizar esta acción" 
        });
    }

    next();
};

module.exports = { esAdmin };