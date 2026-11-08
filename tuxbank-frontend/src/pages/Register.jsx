import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const formatoNumero = new Intl.NumberFormat('es-CO');

export default function Register() {
    const { registrar } = useAuth();
    const navigate = useNavigate();

    const [nombre, setNombre] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [mostrarPassword, setMostrarPassword] = useState(false);
    const [error, setError] = useState('');
    const [cargando, setCargando] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setCargando(true);

        try {
            const data = await registrar(nombre, email, password);
            const numeroCuenta = data?.account?.numeroCuenta;
            const saldo = data?.account?.saldo ?? 500000;

            const aviso = numeroCuenta
                ? `Cuenta creada. Tu número de cuenta es ${numeroCuenta} — saldo inicial $${formatoNumero.format(saldo)} COP`
                : 'Cuenta creada correctamente. Ya puedes iniciar sesión.';

            navigate('/login', { replace: true, state: { aviso } });
        } catch (err) {
            setError(err.message || 'No se pudo completar el registro');
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
                        <label style={styles.label} htmlFor="registro-nombre">
                            Nombre Completo
                        </label>
                        <input
                            id="registro-nombre"
                            type="text"
                            required
                            autoComplete="name"
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            placeholder="Diego Becerra"
                            style={styles.input}
                        />
                    </div>

                    <div style={styles.group}>
                        <label style={styles.label} htmlFor="registro-email">
                            Correo Electrónico
                        </label>
                        <input
                            id="registro-email"
                            type="email"
                            required
                            autoComplete="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="ejemplo@correo.com"
                            style={styles.input}
                        />
                    </div>

                    <div style={styles.group}>
                        <label style={styles.label} htmlFor="registro-password">
                            Contraseña
                        </label>
                        <div style={styles.passwordWrapper}>
                            <input
                                id="registro-password"
                                type={mostrarPassword ? 'text' : 'password'}
                                required
                                minLength={8}
                                autoComplete="new-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Ej: TuxBank2026!"
                                aria-describedby="registro-password-hint"
                                style={styles.inputPassword}
                            />
                            <button
                                type="button"
                                onClick={() =>
                                    setMostrarPassword(!mostrarPassword)
                                }
                                style={styles.eyeButton}
                                title={
                                    mostrarPassword
                                        ? 'Ocultar contraseña'
                                        : 'Mostrar contraseña'
                                }
                                aria-label={
                                    mostrarPassword
                                        ? 'Ocultar contraseña'
                                        : 'Mostrar contraseña'
                                }
                            >
                                {mostrarPassword ? (
                                    <EyeOff size={20} aria-hidden="true" />
                                ) : (
                                    <Eye size={20} aria-hidden="true" />
                                )}
                            </button>
                        </div>
                        <p id="registro-password-hint" style={styles.hint}>
                            Mínimo 8 caracteres, una mayúscula, un número y un
                            carácter especial (@$!%*?&amp;).
                        </p>
                    </div>

                    <button type="submit" disabled={cargando} style={styles.button}>
                        {cargando ? 'Registrando...' : 'Registrarse'}
                    </button>
                </form>

                <p style={styles.textFooter}>
                    ¿Ya tienes cuenta?{' '}
                    <Link to="/login" style={styles.link}>
                        Inicia sesión
                    </Link>
                </p>
            </div>
        </div>
    );
}

const styles = {
    container: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#0f172a',
        color: '#f8fafc',
    },
    card: {
        backgroundColor: '#1e293b',
        padding: '2.5rem',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
    },
    logo: {
        textAlign: 'center',
        margin: '0 0 0.5rem 0',
        color: '#38bdf8',
        fontSize: '1.8rem',
    },
    titulo: {
        textAlign: 'center',
        margin: '0 0 1.5rem 0',
        fontSize: '1.2rem',
        fontWeight: 'normal',
        color: '#94a3b8',
    },
    form: { display: 'flex', flexDirection: 'column', gap: '1.2rem' },
    group: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
    label: { fontSize: '0.9rem', color: '#cbd5e1' },
    input: {
        padding: '0.75rem',
        borderRadius: '6px',
        border: '1px solid #334155',
        backgroundColor: '#0f172a',
        color: '#fff',
        fontSize: '1rem',
        outline: 'none',
    },
    passwordWrapper: { position: 'relative', display: 'flex', alignItems: 'center' },
    inputPassword: {
        padding: '0.75rem',
        paddingRight: '2.5rem',
        borderRadius: '6px',
        border: '1px solid #334155',
        backgroundColor: '#0f172a',
        color: '#fff',
        fontSize: '1rem',
        outline: 'none',
        width: '100%',
    },
    eyeButton: {
        position: 'absolute',
        right: '10px',
        background: 'none',
        border: 'none',
        color: '#94a3b8',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        padding: 0,
    },
    button: {
        padding: '0.75rem',
        borderRadius: '6px',
        border: 'none',
        backgroundColor: '#0284c7',
        color: '#fff',
        fontSize: '1rem',
        fontWeight: 'bold',
        cursor: 'pointer',
        marginTop: '0.5rem',
    },
    alertError: {
        backgroundColor: '#7f1d1d',
        color: '#fca5a5',
        padding: '0.75rem',
        borderRadius: '6px',
        fontSize: '0.875rem',
        marginBottom: '1rem',
    },
    hint: { margin: '0.3rem 0 0', fontSize: '0.75rem', color: '#94a3b8' },
    textFooter: {
        textAlign: 'center',
        marginTop: '1.5rem',
        fontSize: '0.9rem',
        color: '#94a3b8',
    },
    link: { color: '#38bdf8', textDecoration: 'none', fontWeight: 'bold' },
};
