const Cuenta = require('../models/Cuenta');

//Funcion para generar numero de cuenta aleatorio
const generarNumeroCuenta = async () => {
    let numeroCuenta;
    let cuentaExiste = true;

    while(cuentaExiste){
        numeroCuenta = '10' + Math.floor(10000000 + Math.random() * 90000000);
        const existe = await Cuenta.findOne({numeroCuenta});
        if(!existe){
            cuentaExiste = false;
        }
    }
    return numeroCuenta;
};

module.exports = generarNumeroCuenta;