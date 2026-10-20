const mongoose = require('mongoose');

const MONGO_URI = "mongodb+srv://diegoandresbecerrabonilla_db_user:admin@cluster0.8ewgj8z.mongodb.net/mi_banco?retryWrites=true&w=majority";

const connectDB = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("¡Conectado exitosamente a MongoDB Atlas!");
    } catch (err) {
        console.error('Error al conectar a MongoDB:', err.message);
        process.exit(1); // Detener la aplicación si no hay conexión
    }
};

module.exports = connectDB;