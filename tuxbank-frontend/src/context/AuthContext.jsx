import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';
import {
    loginRequest,
    logoutRequest,
    meRequest,
    miCuentaRequest,
    registroRequest,
} from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [account, setAccount] = useState(null);
    const [cargando, setCargando] = useState(true);

    // Restaura la sesión desde la cookie HttpOnly. Un 401 solo significa
    // "no hay sesión activa", no un error de la aplicación.
    const refrescarSesion = useCallback(async () => {
        try {
            const data = await meRequest();
            setUser(data?.user ?? null);
            setAccount(data?.account ?? null);
            return data;
        } catch (error) {
            setUser(null);
            setAccount(null);
            if (error.status && error.status !== 401) {
                console.error('No se pudo restaurar la sesión', error);
            }
            return null;
        }
    }, []);

    useEffect(() => {
        let activo = true;

        const restaurar = async () => {
            await refrescarSesion();
            if (activo) setCargando(false);
        };

        restaurar();

        return () => {
            activo = false;
        };
    }, [refrescarSesion]);

    const login = useCallback(async (email, password) => {
        const data = await loginRequest(email, password);
        setUser(data?.user ?? null);

        // La cuenta se consulta aparte: un usuario sin cuenta sigue teniendo
        // una sesión válida.
        try {
            const cuenta = await miCuentaRequest();
            setAccount(cuenta);
        } catch {
            setAccount(null);
        }

        return data;
    }, []);

    const registrar = useCallback(async (nombre, email, password) => {
        const data = await registroRequest(nombre, email, password);
        // El registro NO inicia sesión: la cookie la emite /auth/login.
        return data;
    }, []);

    const logout = useCallback(async () => {
        try {
            await logoutRequest();
        } catch {
            // Aunque el endpoint falle, la sesión local se limpia igual.
        }
        setUser(null);
        setAccount(null);
    }, []);

    const refrescarCuenta = useCallback(async () => {
        try {
            const cuenta = await miCuentaRequest();
            setAccount(cuenta);
            return cuenta;
        } catch (error) {
            if (error.status === 401) {
                setUser(null);
                setAccount(null);
            }
            return null;
        }
    }, []);

    const value = useMemo(
        () => ({
            user,
            account,
            cargando,
            login,
            registrar,
            logout,
            refrescarCuenta,
            refrescarSesion,
        }),
        [
            user,
            account,
            cargando,
            login,
            registrar,
            logout,
            refrescarCuenta,
            refrescarSesion,
        ],
    );

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth debe usarse dentro de un AuthProvider');
    }
    return context;
}
