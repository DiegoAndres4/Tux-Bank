import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import AdminRoute from './components/AdminRoute';
import Layout from './components/Layout';
import LoadingScreen from './components/LoadingScreen';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider, useAuth } from './context/AuthContext';
import Admin from './pages/Admin';
import Dashboard from './pages/Dashboard';
import Historial from './pages/Historial';
import Login from './pages/Login';
import Register from './pages/Register';
import Transferencias from './pages/Transferencias';

function RutaInicial() {
    const { user, cargando } = useAuth();

    if (cargando) {
        return <LoadingScreen mensaje="Verificando sesión..." />;
    }

    return <Navigate to={user ? '/dashboard' : '/login'} replace />;
}

export default function App() {
    return (
        <Router>
            <AuthProvider>
                <Routes>
                    <Route path="/" element={<RutaInicial />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    <Route
                        element={
                            <ProtectedRoute>
                                <Layout />
                            </ProtectedRoute>
                        }
                    >
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/transferir" element={<Transferencias />} />
                        <Route path="/historial" element={<Historial />} />
                        <Route
                            path="/admin"
                            element={
                                <AdminRoute>
                                    <Admin />
                                </AdminRoute>
                            }
                        />
                    </Route>

                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </AuthProvider>
        </Router>
    );
}
