import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingScreen from './LoadingScreen';

export default function ProtectedRoute({ children }) {
    const { user, cargando } = useAuth();

    if (cargando) {
        return <LoadingScreen mensaje="Verificando sesión..." />;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return children;
}
