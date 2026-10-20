import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Copy, History, LogOut, ChevronDown, CreditCard } from 'lucide-react';
import { transferirRequest } from '../services/api';

export default function Dashboard() {
    const [usuario, setUsuario] = useState(null);
    const [cuentaDestino, setCuentaDestino] = useState('');
    const [monto, setMonto] = useState('');
    const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
    const [cargando, setCargando] = useState(false);
    const [menuAbierto, setMenuAbierto] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const usuarioGuardado = localStorage.getItem('usuario');
        const token = localStorage.getItem('token');

        if (!token || !usuarioGuardado) {
            navigate('/login');
        } else {
            setUsuario(JSON.parse(usuarioGuardado));
        }
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        navigate('/login');
    };

    const copiarCuenta = () => {
    const numCuenta = usuario?.numeroCuenta;

    if (!numCuenta) {
        alert('No se encontró un número de cuenta asociado.');
        return;
    }

    if (navigator.clipboard && window.isSecureContext) {
        // Método moderno
        navigator.clipboard.writeText(numCuenta)
            .then(() => alert(`¡Número de cuenta ${numCuenta} copiado!`))
            .catch(() => copiarFallback(numCuenta));
    } else {
        // Método alternativo para navegadores o entornos locales
        copiarFallback(numCuenta);
    }
};

const copiarFallback = (texto) => {
    const inputOculto = document.createElement('input');
    inputOculto.value = texto;
    document.body.appendChild(inputOculto);
    inputOculto.select();
    document.execCommand('copy');
    document.body.removeChild(inputOculto);
    alert(`¡Número de cuenta ${texto} copiado!`);
};

    const handleTransferencia = async (e) => {
        e.preventDefault();
        setMensaje({ tipo: '', texto: '' });
        setCargando(true);

        const token = localStorage.getItem('token');

        try {
            const data = await transferirRequest(cuentaDestino, Number(monto), token);

            if (data.error) {
                setMensaje({ tipo: 'error', texto: data.error });
            } else {
                setMensaje({ tipo: 'exito', texto: '¡Transferencia realizada con éxito!' });
                setCuentaDestino('');
                setMonto('');
            }
        } catch (err) {
            setMensaje({ tipo: 'error', texto: 'Error al procesar la transacción' });
        } finally {
            setCargando(false);
        }
    };

    if (!usuario) return null;

    return (
        <div style={styles.container}>
            {/* Header */}
            <header style={styles.header}>
                <h1 style={styles.logo}>🐧 Tux Bank</h1>

                {/* Menú de Perfil Desplegable */}
                <div style={styles.profileWrapper}>
                    <button 
                        onClick={() => setMenuAbierto(!menuAbierto)} 
                        style={styles.btnProfile}
                    >
                        <div style={styles.avatar}>
                            <User size={18} color="#0284c7" />
                        </div>
                        <span style={styles.profileName}>{usuario.nombre}</span>
                        <ChevronDown size={16} color="#94a3b8" />
                    </button>

                    {/* Dropdown flotante */}
                    {menuAbierto && (
                        <div style={styles.dropdownMenu}>
                            {/* Header del Dropdown */}
                            <div style={styles.dropdownHeader}>
                                <p style={styles.userName}>{usuario.nombre}</p>
                                <p style={styles.userEmail}>{usuario.email}</p>
                            </div>

                            <hr style={styles.divider} />

                            {/* Información de la Cuenta */}
                            <div style={styles.dropdownSection}>
                                <div style={styles.accountInfo}>
                                    <CreditCard size={16} color="#38bdf8" />
                                    <div>
                                        <p style={styles.accountLabel}>N° de Cuenta</p>
                                        <p style={styles.accountNumber}>{usuario.numeroCuenta || '10XXXXXX'}</p>
                                    </div>
                                </div>
                                <button onClick={copiarCuenta} style={styles.btnCopy} title="Copiar número de cuenta">
                                    <Copy size={14} />
                                </button>
                            </div>

                            <hr style={styles.divider} />

                            {/* Opciones */}
                            <button onClick={() => alert('Historial en desarrollo')} style={styles.dropdownOption}>
                                <History size={16} />
                                <span>Historial de Transferencias</span>
                            </button>

                            <button onClick={handleLogout} style={styles.dropdownOptionLogout}>
                                <LogOut size={16} />
                                <span>Cerrar Sesión</span>
                            </button>
                        </div>
                    )}
                </div>
            </header>

            {/* Contenido principal */}
            <main style={styles.main}>
                {/* Tarjeta de Resumen */}
                <div style={styles.cardSaldo}>
                    <p style={styles.cardLabel}>Saldo Disponible</p>
                    <h2 style={styles.cardMonto}>
                        ${usuario.saldo ? usuario.saldo.toLocaleString('es-CO') : '0'} COP
                    </h2>
                    <p style={styles.cardCuenta}>
                        Número de Cuenta: <strong>{usuario.numeroCuenta || '10XXXXXX'}</strong>
                    </p>
                </div>

                {/* Formulario de Transferencia */}
                <div style={styles.cardForm}>
                    <h3 style={styles.formTitulo}>Realizar Transferencia</h3>

                    {mensaje.texto && (
                        <div style={mensaje.tipo === 'error' ? styles.alertError : styles.alertExito}>
                            {mensaje.texto}
                        </div>
                    )}

                    <form onSubmit={handleTransferencia} style={styles.form}>
                        <div style={styles.group}>
                            <label style={styles.label}>Número de Cuenta Destino</label>
                            <input
                                type="text"
                                required
                                value={cuentaDestino}
                                onChange={(e) => setCuentaDestino(e.target.value)}
                                placeholder="Ej: 1092837482"
                                style={styles.input}
                            />
                        </div>

                        <div style={styles.group}>
                            <label style={styles.label}>Monto a Transferir ($ COP)</label>
                            <input
                                type="number"
                                required
                                min="1"
                                value={monto}
                                onChange={(e) => setMonto(e.target.value)}
                                placeholder="50000"
                                style={styles.input}
                            />
                        </div>

                        <button type="submit" disabled={cargando} style={styles.btnTransferir}>
                            {cargando ? 'Procesando...' : 'Enviar Dinero'}
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
}

const styles = {
    container: { minHeight: '100vh', backgroundColor: '#0f172a', color: '#f8fafc', fontFamily: 'sans-serif' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.2rem 2rem', backgroundColor: '#1e293b', borderBottom: '1px solid #334155' },
    logo: { margin: 0, color: '#38bdf8', fontSize: '1.5rem' },
    
    /* Estilos del Perfil y Dropdown */
    profileWrapper: { position: 'relative' },
    btnProfile: { display: 'flex', alignItems: 'center', gap: '0.6rem', backgroundColor: '#0f172a', border: '1px solid #334155', padding: '0.4rem 0.8rem', borderRadius: '20px', cursor: 'pointer', color: '#f8fafc' },
    avatar: { width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#0284c720', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    profileName: { fontSize: '0.9rem', fontWeight: 'bold' },
    dropdownMenu: { position: 'absolute', right: 0, top: '120%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', width: '260px', padding: '1rem', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', zIndex: 100 },
    dropdownHeader: { display: 'flex', flexDirection: 'column', gap: '0.2rem' },
    userName: { margin: 0, fontWeight: 'bold', fontSize: '1rem', color: '#f8fafc' },
    userEmail: { margin: 0, fontSize: '0.8rem', color: '#94a3b8' },
    divider: { border: 'none', borderTop: '1px solid #334155', margin: '0.8rem 0' },
    dropdownSection: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    accountInfo: { display: 'flex', alignItems: 'center', gap: '0.6rem' },
    accountLabel: { margin: 0, fontSize: '0.75rem', color: '#94a3b8' },
    accountNumber: { margin: 0, fontSize: '0.85rem', fontWeight: 'bold', color: '#38bdf8' },
    btnCopy: { backgroundColor: '#334155', border: 'none', color: '#38bdf8', padding: '0.4rem', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' },
    dropdownOption: { display: 'flex', alignItems: 'center', gap: '0.6rem', width: '100%', padding: '0.6rem 0.4rem', backgroundColor: 'transparent', border: 'none', color: '#cbd5e1', cursor: 'pointer', borderRadius: '6px', fontSize: '0.9rem', textAlign: 'left' },
    dropdownOptionLogout: { display: 'flex', alignItems: 'center', gap: '0.6rem', width: '100%', padding: '0.6rem 0.4rem', backgroundColor: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', borderRadius: '6px', fontSize: '0.9rem', textAlign: 'left', marginTop: '0.4rem' },

    /* Cuerpo Principal */
    main: { maxWidth: '800px', margin: '2rem auto', padding: '0 1rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' },
    cardSaldo: { backgroundColor: '#0284c7', padding: '2rem', borderRadius: '12px', color: '#fff' },
    cardLabel: { margin: 0, fontSize: '0.9rem', opacity: 0.9 },
    cardMonto: { margin: '0.5rem 0', fontSize: '2.5rem', fontWeight: 'bold' },
    cardCuenta: { margin: 0, fontSize: '0.9rem', opacity: 0.9 },
    cardForm: { backgroundColor: '#1e293b', padding: '2rem', borderRadius: '12px', border: '1px solid #334155' },
    formTitulo: { margin: '0 0 1.5rem 0', color: '#38bdf8' },
    form: { display: 'flex', flexDirection: 'column', gap: '1.2rem' },
    group: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
    label: { fontSize: '0.9rem', color: '#cbd5e1' },
    input: { padding: '0.75rem', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff', fontSize: '1rem', outline: 'none' },
    btnTransferir: { padding: '0.75rem', borderRadius: '6px', border: 'none', backgroundColor: '#10b981', color: '#fff', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer' },
    alertError: { backgroundColor: '#7f1d1d', color: '#fca5a5', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem' },
    alertExito: { backgroundColor: '#064e3b', color: '#a7f3d0', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem' }
};