import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { registroRequest } from '../services/api';

export default function Register() {
    const [nombre, setNombre] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [mostrarPassword, setMostrarPassword] = useState(false);
    const [error, setError] = useState('');
    const [cargando, setCargando] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setCargando(true);

        try {
            const data = await registroRequest(nombre, email, password);

            if (data.error) {
                setError(data.error);
            } else {
                alert('¡Registro exitoso en Tux Bank!');
                navigate('/login');
            }
        } catch (err) {
            setError('Error de conexión con el servidor');
        } finally {
            setCargando(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h1 style={styles.logo}>🐧 Tux Bank</h1>
                <h2 style={styles.titulo}>Crear Nueva Cuenta</h2>

                {error && <div style={styles.alertError}>{error}</div>}

                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.group}>
                        <label style={styles.label}>Nombre Completo</label>
                        <input
                            type="text"
                            required
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            placeholder="Diego Becerra"
                            style={styles.input}
                        />
                    </div>

                    <div style={styles.group}>
                        <label style={styles.label}>Correo Electrónico</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="ejemplo@correo.com"
                            style={styles.input}
                        />
                    </div>

                    <div style={styles.group}>
                        <label style={styles.label}>Contraseña</label>
                        <div style={styles.passwordWrapper}>
                            <input
                                type={mostrarPassword ? 'text' : 'password'}
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Min 8 car, Mayúscula, Nº y Especial"
                                style={styles.inputPassword}
                            />
                            <button
                                type="button"
                                onClick={() => setMostrarPassword(!mostrarPassword)}
                                style={styles.eyeButton}
                                title={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                            >
                                {mostrarPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    <button type="submit" disabled={cargando} style={styles.button}>
                        {cargando ? 'Registrando...' : 'Registrarse'}
                    </button>
                </form>

                <p style={styles.textFooter}>
                    ¿Ya tienes cuenta? <Link to="/login" style={styles.link}>Inicia sesión</Link>
                </p>
            </div>
        </div>
    );
}

const styles = {
    container: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#0f172a', color: '#f8fafc' },
    card: { backgroundColor: '#1e293b', padding: '2.5rem', borderRadius: '12px', width: '100%', maxWidth: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.3)' },
    logo: { textAlign: 'center', margin: '0 0 0.5rem 0', color: '#38bdf8', fontSize: '1.8rem' },
    titulo: { textAlign: 'center', margin: '0 0 1.5rem 0', fontSize: '1.2rem', fontWeight: 'normal', color: '#94a3b8' },
    form: { display: 'flex', flexDirection: 'column', gap: '1.2rem' },
    group: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
    label: { fontSize: '0.9rem', color: '#cbd5e1' },
    input: { padding: '0.75rem', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff', fontSize: '1rem', outline: 'none' },
    passwordWrapper: { position: 'relative', display: 'flex', alignItems: 'center' },
    inputPassword: { padding: '0.75rem', paddingRight: '2.5rem', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff', fontSize: '1rem', outline: 'none', width: '100%' },
    eyeButton: { position: 'absolute', right: '10px', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 },
    button: { padding: '0.75rem', borderRadius: '6px', border: 'none', backgroundColor: '#0284c7', color: '#fff', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', marginTop: '0.5rem' },
    alertError: { backgroundColor: '#7f1d1d', color: '#fca5a5', padding: '0.75rem', borderRadius: '6px', fontSize: '0.875rem', marginBottom: '1rem' },
    textFooter: { textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: '#94a3b8' },
    link: { color: '#38bdf8', textDecoration: 'none', fontWeight: 'bold' }
};