const Usuario = require('../models/Usuario');
const Cuenta = require('../models/Cuenta');
const generarNumeroCuenta = require('../utils/generarCuenta');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

const registrarUsuario = async (req, res) => {
    try {
        const { nombre, email, password } = req.body;

        if (!nombre || !email || !password) {
            return res.status(400).json({ error: "Todos los campos son obligatorios" });
        }

        if (password.length < 8) {
            return res.status(400).json({ error: "La contraseña debe tener mínimo 8 caracteres" });
        }

        const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({ 
                error: "La contraseña debe contener al menos una letra mayúscula, un número y un carácter especial (@$!%*?&)" 
            });
        }

        const usuarioExiste = await Usuario.findOne({ email });
        if (usuarioExiste) {
            return res.status(400).json({ error: "El correo ya está registrado" });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordEncriptada = await bcrypt.hash(password, salt);

        // Se crea el usuario (por defecto Mongoose asigna 'rol': 'cliente')
        const nuevoUsuario = await Usuario.create({
            nombre,
            email,
            password: passwordEncriptada
        });

        const numeroCuentaGenerado = await generarNumeroCuenta();
        const nuevaCuenta = await Cuenta.create({
            numeroCuenta: numeroCuentaGenerado,
            usuario: nuevoUsuario._id
        });

        return res.status(201).json({
            mensaje: "Usuario y cuenta registrados exitosamente",
            usuario: {
                id: nuevoUsuario._id,
                nombre: nuevoUsuario.nombre,
                email: nuevoUsuario.email,
                rol: nuevoUsuario.rol, // <--- Útil para confirmar en el cliente
                numeroCuenta: nuevaCuenta.numeroCuenta,
                saldo: nuevaCuenta.saldo
            }
        });
    } catch (error) {
        return res.status(500).json({ error: "Error al registrar usuario: " + error.message });
    }
};

const iniciarSesion = async (req, res) => {
    try {
        const { email, password } = req.body;

        const usuario = await Usuario.findOne({ email });
        if (!usuario) {
            return res.status(404).json({ error: "Credenciales inválidas" });
        }

        const passwordValida = await bcrypt.compare(password, usuario.password);
        if (!passwordValida) {
            return res.status(400).json({ error: "Credenciales inválidas" });
        }

        const cuenta = await Cuenta.findOne({ usuario: usuario._id });

        // Token JWT por 2 horas firmado con id, email y rol
        const token = jwt.sign(
            { id: usuario._id, email: usuario.email, rol: usuario.rol },
            JWT_SECRET,
            { expiresIn: '2h' }
        );

        //Adjuntar la Cookie a la respuesta
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 2 * 60 * 60 * 1000
        })
        //Responder al cliente
        return res.status(200).json({
            mensaje: "Inicio de sesión exitoso",
            usuario: {
                id: usuario._id,
                nombre: usuario.nombre,
                email: usuario.email,
                rol: usuario.rol, // <--- Incluido en el objeto de usuario
                numeroCuenta: cuenta ? cuenta.numeroCuenta : '',
                saldo: cuenta ? cuenta.saldo : 0
            }
        });
    } catch (error) {
        return res.status(500).json({ error: "No se pudo iniciar sesión: " + error.message });
    }
};

const cerrarSesion = (req, res) => {
    // Elimina la cookie del navegador
    res.clearCookie('token');
    return res.status(200).json({ mensaje: "Sesión cerrada exitosamente" });
};

const obtenerPerfil = async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.usuario.id).select('-password');
        if (!usuario) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        const cuenta = await Cuenta.findOne({ usuario: usuario._id });

        return res.status(200).json({
            usuario: {
                id: usuario._id,
                nombre: usuario.nombre,
                email: usuario.email,
                rol: usuario.rol,
                numeroCuenta: cuenta ? cuenta.numeroCuenta : '',
                saldo: cuenta ? cuenta.saldo : 0
            }
        });
    } catch (error) {
        return res.status(500).json({ error: "Error al obtener el perfil: " + error.message });
    }
};

module.exports = {
    registrarUsuario,
    iniciarSesion,
    cerrarSesion,
    obtenerPerfil,
};