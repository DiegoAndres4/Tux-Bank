const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Petición de Iniciar Sesión
export const loginRequest = async (email, password) => {
    const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    return response.json();
};

// Petición de Registro
export const registroRequest = async (nombre, email, password) => {
    const response = await fetch(`${API_URL}/auth/registro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, email, password })
    });
    return response.json();
};

// Petición para realizar transferencias (requiere Token)
export const transferirRequest = async (cuentaDestino, monto, token) => {
    const response = await fetch(`${API_URL}/transacciones/transferir`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ cuentaDestino, monto })
    });
    return response.json();
};