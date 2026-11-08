import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingScreen from './LoadingScreen';

export default function AdminRoute({ children }) {
    const { user, cargando } = useAuth();

    if (cargando) {
        return <LoadingScreen mensaje="Verificando permisos..." />;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (user.rol !== 'admin') {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
}
