const mongoose = require('mongoose');
const Cuenta = require('./src/models/Cuenta');
const connectBD = require('./src/config/db');

const generarNumeroCuenta = ()=>{
    return Math.floor(1000000000 + Math.random() * 9000000000).toString();
}

const migrarCuentas = async() =>{
    try{
        await connectBD();

        const cuentasSinNumero = await Cuenta.find({
            $or: [
                {numeroCuenta: {$exists: false}},
                {numeroCuenta: null},
            ]
        });

        console.log(`Se encontraron ${cuentasSinNumero.length} cuentas sin numero de cuenta`);

        for( const doc of cuentasSinNumero){
            let numeroNuevo = generarNumeroCuenta();

            let yaExiste = await Cuenta.findOne({numeroCuenta: numeroNuevo});
            while(yaExiste){
                numeroNuevo = generarNumeroCuenta;
                yaExiste = await Cuenta.findOne({ numeroCuenta: numeroNuevo });
            }

            doc.numeroCuenta = numeroNuevo;
            await doc.save();
            console.log(`Cuenta de ${doc.titular} actualizado con numero de cuenta: ${numeroNuevo}`);

        }

        console.log("Migracion exitosa");
        process.exit(0);

    }catch(error){
        console.log('Error durante la migracion: ' + error.message);
        process.exit(1);
    }
};

migrarCuentas();