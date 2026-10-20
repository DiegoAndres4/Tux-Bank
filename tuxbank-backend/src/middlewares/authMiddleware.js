const jwt = require('jsonwebtoken');

const verificarToken = (req, res, next) => {
    //Extraer el token ÚNICAMENTE de la cookie HttpOnly
    const token = req.cookies?.token;

    //Si no existe la cookie, rechazar inmediatamente
    if (!token) {
        return res.status(401).json({ error: "Acceso denegado. No se proporcionó un token." });
    }

    try {
        //Verificar el token
        const verificado = jwt.verify(token, process.env.JWT_SECRET);
        
        //Adjuntar el usuario descifrado 
        req.usuario = verificado; 
        next(); 
    } catch (error) {
        return res.status(403).json({ error: "Token inválido o expirado" });
    }
};

module.exports = verificarToken;