import { useEffect, useRef, useState } from 'react';
import {
    ChevronDown,
    Copy,
    CreditCard,
    History,
    LayoutDashboard,
    LogOut,
    Send,
    ShieldCheck,
    User,
} from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const formatoCOP = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
});

const enlacesBase = [
    { to: '/dashboard', label: 'Dashboard', Icono: LayoutDashboard },
    { to: '/transferir', label: 'Transferir', Icono: Send },
    { to: '/historial', label: 'Historial', Icono: History },
];

function copiarFallback(texto) {
    const inputOculto = document.createElement('input');
    inputOculto.value = texto;
    document.body.appendChild(inputOculto);
    inputOculto.select();
    document.execCommand('copy');
    document.body.removeChild(inputOculto);
}

export default function Layout() {
    const { user, account, logout } = useAuth();
    const navigate = useNavigate();
    const [menuAbierto, setMenuAbierto] = useState(false);
    const [copiado, setCopiado] = useState(false);
    const menuRef = useRef(null);

    const enlaces =
        user?.rol === 'admin'
            ? [
                  ...enlacesBase,
                  { to: '/admin', label: 'Admin', Icono: ShieldCheck },
              ]
            : enlacesBase;

    useEffect(() => {
        if (!menuAbierto) return;

        const cerrarAlClickFuera = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setMenuAbierto(false);
            }
        };

        document.addEventListener('mousedown', cerrarAlClickFuera);
        return () =>
            document.removeEventListener('mousedown', cerrarAlClickFuera);
    }, [menuAbierto]);

    useEffect(() => {
        if (!copiado) return;
        const id = window.setTimeout(() => setCopiado(false), 2000);
        return () => window.clearTimeout(id);
    }, [copiado]);

    const copiarCuenta = async () => {
        const numeroCuenta = account?.numeroCuenta;
        if (!numeroCuenta) return;

        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(numeroCuenta);
            } else {
                copiarFallback(numeroCuenta);
            }
            setCopiado(true);
        } catch {
            copiarFallback(numeroCuenta);
            setCopiado(true);
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login', { replace: true });
    };

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <NavLink to="/dashboard" style={styles.logoLink}>
                    <span style={styles.logo}>🐧 Tux Bank</span>
                </NavLink>

                <nav style={styles.nav} aria-label="Navegación principal">
                    {enlaces.map(({ to, label, Icono }) => (
                        <NavLink
                            key={to}
                            to={to}
                            style={({ isActive }) => ({
                                ...styles.navLink,
                                ...(isActive ? styles.navLinkActive : {}),
                            })}
                        >
                            <Icono size={16} aria-hidden="true" />
                            <span>{label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div style={styles.profileWrapper} ref={menuRef}>
                    <button
                        type="button"
                        onClick={() => setMenuAbierto((abierto) => !abierto)}
                        style={styles.btnProfile}
                        aria-expanded={menuAbierto}
                        aria-haspopup="true"
                        aria-label="Abrir menú de perfil"
                    >
                        <div style={styles.avatar}>
                            <User size={18} color="#0284c7" aria-hidden="true" />
                        </div>
                        <span style={styles.profileName}>
                            {user?.nombre ?? 'Mi cuenta'}
                        </span>
                        <ChevronDown
                            size={16}
                            color="#94a3b8"
                            aria-hidden="true"
                        />
                    </button>

                    {menuAbierto && (
                        <div style={styles.dropdownMenu}>
                            <div style={styles.dropdownHeader}>
                                <p style={styles.userName}>
                                    {user?.nombre ?? 'Usuario'}
                                </p>
                                <p style={styles.userEmail}>
                                    {user?.email ?? ''}
                                </p>
                            </div>

                            <hr style={styles.divider} />

                            <div style={styles.dropdownSection}>
                                <div style={styles.accountInfo}>
                                    <CreditCard
                                        size={16}
                                        color="#38bdf8"
                                        aria-hidden="true"
                                    />
                                    <div>
                                        <p style={styles.accountLabel}>
                                            N° de Cuenta
                                        </p>
                                        <p style={styles.accountNumber}>
                                            {account?.numeroCuenta ??
                                                'Sin cuenta'}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={copiarCuenta}
                                    style={styles.btnCopy}
                                    title="Copiar número de cuenta"
                                    aria-label="Copiar número de cuenta"
                                    disabled={!account?.numeroCuenta}
                                >
                                    <Copy size={14} aria-hidden="true" />
                                </button>
                            </div>

                            {copiado && (
                                <p style={styles.copiado} role="status">
                                    Número de cuenta copiado
                                </p>
                            )}

                            <hr style={styles.divider} />

                            <div style={styles.dropdownSection}>
                                <span style={styles.accountLabel}>
                                    Saldo disponible
                                </span>
                                <span style={styles.saldo}>
                                    {formatoCOP.format(account?.saldo ?? 0)} COP
                                </span>
                            </div>

                            <hr style={styles.divider} />

                            <button
                                type="button"
                                onClick={handleLogout}
                                style={styles.dropdownOptionLogout}
                            >
                                <LogOut size={16} aria-hidden="true" />
                                <span>Cerrar Sesión</span>
                            </button>
                        </div>
                    )}
                </div>
            </header>

            <main style={styles.main}>
                <Outlet />
            </main>
        </div>
    );
}

const styles = {
    container: {
        minHeight: '100vh',
        backgroundColor: '#0f172a',
        color: '#f8fafc',
        fontFamily: 'sans-serif',
    },
    header: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.75rem',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1.2rem 2rem',
        backgroundColor: '#1e293b',
        borderBottom: '1px solid #334155',
    },
    logoLink: { textDecoration: 'none' },
    logo: { color: '#38bdf8', fontSize: '1.5rem', fontWeight: 'bold' },
    nav: { display: 'flex', gap: '0.4rem', flexWrap: 'wrap' },
    navLink: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
        padding: '0.45rem 0.8rem',
        borderRadius: '8px',
        color: '#cbd5e1',
        textDecoration: 'none',
        fontSize: '0.9rem',
        border: '1px solid transparent',
    },
    navLinkActive: {
        color: '#38bdf8',
        backgroundColor: '#0f172a',
        border: '1px solid #334155',
    },
    profileWrapper: { position: 'relative' },
    btnProfile: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.6rem',
        backgroundColor: '#0f172a',
        border: '1px solid #334155',
        padding: '0.4rem 0.8rem',
        borderRadius: '20px',
        cursor: 'pointer',
        color: '#f8fafc',
    },
    avatar: {
        width: '28px',
        height: '28px',
        borderRadius: '50%',
        backgroundColor: '#0284c720',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    profileName: { fontSize: '0.9rem', fontWeight: 'bold' },
    dropdownMenu: {
        position: 'absolute',
        right: 0,
        top: '120%',
        backgroundColor: '#1e293b',
        border: '1px solid #334155',
        borderRadius: '12px',
        width: '280px',
        padding: '1rem',
        boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
        zIndex: 100,
    },
    dropdownHeader: { display: 'flex', flexDirection: 'column', gap: '0.2rem' },
    userName: {
        margin: 0,
        fontWeight: 'bold',
        fontSize: '1rem',
        color: '#f8fafc',
    },
    userEmail: { margin: 0, fontSize: '0.8rem', color: '#94a3b8' },
    divider: { border: 'none', borderTop: '1px solid #334155', margin: '0.8rem 0' },
    dropdownSection: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '0.5rem',
    },
    accountInfo: { display: 'flex', alignItems: 'center', gap: '0.6rem' },
    accountLabel: { margin: 0, fontSize: '0.75rem', color: '#94a3b8' },
    accountNumber: {
        margin: 0,
        fontSize: '0.85rem',
        fontWeight: 'bold',
        color: '#38bdf8',
    },
    btnCopy: {
        backgroundColor: '#334155',
        border: 'none',
        color: '#38bdf8',
        padding: '0.4rem',
        borderRadius: '6px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
    },
    copiado: { margin: '0.5rem 0 0', fontSize: '0.75rem', color: '#10b981' },
    saldo: { fontSize: '0.95rem', fontWeight: 'bold', color: '#10b981' },
    dropdownOptionLogout: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.6rem',
        width: '100%',
        padding: '0.6rem 0.4rem',
        backgroundColor: 'transparent',
        border: 'none',
        color: '#ef4444',
        cursor: 'pointer',
        borderRadius: '6px',
        fontSize: '0.9rem',
        textAlign: 'left',
    },
    main: { maxWidth: '960px', margin: '2rem auto', padding: '0 1rem' },
};
