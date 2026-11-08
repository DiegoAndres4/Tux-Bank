const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Petición base contra la API de Tux Bank.
 * La sesión viaja en la cookie HttpOnly `token`, por eso SIEMPRE se envía
 * `credentials: 'include'` y nunca se manipula un token en JavaScript.
 */
async function request(path, { method = 'GET', body } = {}) {
    const opciones = {
        method,
        credentials: 'include',
        headers: {},
    };

    if (body !== undefined) {
        opciones.headers['Content-Type'] = 'application/json';
        opciones.body = JSON.stringify(body);
    }

    let response;
    try {
        response = await fetch(`${API_URL}${path}`, opciones);
    } catch {
        const error = new Error('No se pudo conectar con el servidor');
        error.status = 0;
        throw error;
    }

    const texto = await response.text();
    let data = null;
    if (texto) {
        try {
            data = JSON.parse(texto);
        } catch {
            data = null;
        }
    }

    if (!response.ok) {
        const mensaje = data?.message;
        const textoError = Array.isArray(mensaje)
            ? mensaje.join(' · ')
            : mensaje;
        const error = new Error(textoError || `Error ${response.status}`);
        error.status = response.status;
        error.data = data;
        throw error;
    }

    return data;
}

export const loginRequest = (email, password) =>
    request('/auth/login', { method: 'POST', body: { email, password } });

export const registroRequest = (nombre, email, password) =>
    request('/auth/registro', {
        method: 'POST',
        body: { nombre, email, password },
    });

export const logoutRequest = () => request('/auth/logout', { method: 'POST' });

export const meRequest = () => request('/auth/me');

export const miCuentaRequest = () => request('/accounts/mi-cuenta');

export const transferirRequest = (numeroCuentaDestino, monto, descripcion) => {
    const body = { numeroCuentaDestino, monto };
    if (descripcion) {
        body.descripcion = descripcion;
    }
    return request('/transactions/transferir', { method: 'POST', body });
};

export const historialRequest = () => request('/transactions/historial');

export const todasLasCuentasRequest = () => request('/accounts/todas');
