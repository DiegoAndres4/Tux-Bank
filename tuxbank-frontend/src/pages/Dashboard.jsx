import { Link } from 'react-router-dom';
import { CreditCard, History, Send, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const formatoCOP = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
});

const accesosCliente = [
    {
        to: '/transferir',
        titulo: 'Transferir',
        descripcion: 'Envía dinero a otra cuenta Tux Bank.',
        Icono: Send,
        color: '#10b981',
    },
    {
        to: '/historial',
        titulo: 'Historial',
        descripcion: 'Revisa tus movimientos enviados y recibidos.',
        Icono: History,
        color: '#38bdf8',
    },
];

const accesoAdmin = {
    to: '/admin',
    titulo: 'Administración',
    descripcion: 'Consulta usuarios, cuentas y saldos del banco.',
    Icono: ShieldCheck,
    color: '#f59e0b',
};

export default function Dashboard() {
    const { user, account } = useAuth();
    const accesos =
        user?.rol === 'admin'
            ? [...accesosCliente, accesoAdmin]
            : accesosCliente;

    return (
        <div style={styles.wrapper}>
            <h2 style={styles.saludo}>Hola, {user?.nombre ?? 'cliente'} 👋</h2>

            <section style={styles.cardSaldo} aria-label="Resumen de la cuenta">
                <p style={styles.cardLabel}>Saldo Disponible</p>
                <p style={styles.cardMonto}>
                    {formatoCOP.format(account?.saldo ?? 0)} COP
                </p>
                <p style={styles.cardCuenta}>
                    <CreditCard size={16} aria-hidden="true" />
                    Número de Cuenta:{' '}
                    <strong>{account?.numeroCuenta ?? 'Sin cuenta'}</strong>
                </p>
            </section>

            <section aria-label="Accesos rápidos">
                <h3 style={styles.seccionTitulo}>Accesos rápidos</h3>
                <div style={styles.grid}>
                    {accesos.map(({ to, titulo, descripcion, Icono, color }) => (
                        <Link key={to} to={to} style={styles.cardAcceso}>
                            <span
                                style={{
                                    ...styles.iconoWrapper,
                                    backgroundColor: `${color}20`,
                                    color,
                                }}
                            >
                                <Icono size={22} aria-hidden="true" />
                            </span>
                            <span>
                                <span style={styles.cardAccesoTitulo}>
                                    {titulo}
                                </span>
                                <span style={styles.cardAccesoTexto}>
                                    {descripcion}
                                </span>
                            </span>
                        </Link>
                    ))}
                </div>
            </section>
        </div>
    );
}

const styles = {
    wrapper: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
    saludo: { margin: 0, fontSize: '1.5rem', color: '#f8fafc' },
    cardSaldo: {
        backgroundColor: '#0284c7',
        padding: '2rem',
        borderRadius: '12px',
        color: '#fff',
    },
    cardLabel: { margin: 0, fontSize: '0.9rem', opacity: 0.9 },
    cardMonto: { margin: '0.5rem 0', fontSize: '2.5rem', fontWeight: 'bold' },
    cardCuenta: {
        margin: 0,
        fontSize: '0.9rem',
        opacity: 0.9,
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
        flexWrap: 'wrap',
    },
    seccionTitulo: { margin: '0 0 0.8rem', fontSize: '1.1rem', color: '#cbd5e1' },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1rem',
    },
    cardAcceso: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.9rem',
        padding: '1.2rem',
        backgroundColor: '#1e293b',
        border: '1px solid #334155',
        borderRadius: '12px',
        textDecoration: 'none',
        color: '#f8fafc',
    },
    iconoWrapper: {
        width: '44px',
        height: '44px',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    cardAccesoTitulo: {
        display: 'block',
        fontSize: '1rem',
        fontWeight: 'bold',
        marginBottom: '0.2rem',
    },
    cardAccesoTexto: {
        display: 'block',
        fontSize: '0.85rem',
        color: '#94a3b8',
        lineHeight: 1.4,
    },
};
