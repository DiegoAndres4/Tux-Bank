const express = require('express');
const cookieParse = require('cookie-parser');
const connectDB = require('./config/db');
const cors = require('cors'); 
const cuentaRoutes = require('./routes/cuentaRoutes');
const transaccionRoutes = require('./routes/transaccionRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(cookieParse());

// Conexión a la base de datos
connectDB();


//Rutas de la API
app.use('/api/cuentas', cuentaRoutes);
app.use('/api', transaccionRoutes);
app.use('/api/auth', authRoutes);

module.exports = app;