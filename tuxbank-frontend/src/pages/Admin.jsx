import { useEffect, useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { todasLasCuentasRequest } from '../services/api';

const formatoCOP = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
});

export default function Admin() {
    const [cuentas, setCuentas] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [sinPermisos, setSinPermisos] = useState(false);

    useEffect(() => {
        let activo = true;

        const cargar = async () => {
            try {
                const data = await todasLasCuentasRequest();
                if (!activo) return;
                setCuentas(Array.isArray(data) ? data : []);
            } catch (err) {
                if (!activo) return;
                if (err.status === 403) {
                    setSinPermisos(true);
                    setError(
                        'No tienes permisos de administrador para ver esta sección.',
                    );
                } else {
                    setError(
                        err.message ||
                            'No se pudo cargar la lista de cuentas',
                    );
                }
            } finally {
                if (activo) setCargando(false);
            }
        };

        cargar();

        return () => {
            activo = false;
        };
    }, []);

    return (
        <div style={styles.wrapper}>
            <div style={styles.header}>
                <h2 style={styles.titulo}>Panel de administración</h2>
                {!cargando && !error && (
                    <p style={styles.contador}>
                        {cuentas.length}{' '}
                        {cuentas.length === 1 ? 'cuenta' : 'cuentas'}
                    </p>
                )}
            </div>

            {cargando && <p style={styles.mensaje}>Cargando cuentas...</p>}

            {!cargando && error && (
                <div style={styles.alertError} role="alert">
                    {sinPermisos && (
                        <ShieldAlert
                            size={18}
                            aria-hidden="true"
                            style={styles.alertIcono}
                        />
                    )}
                    <span>{error}</span>
                </div>
            )}

            {!cargando && !error && cuentas.length === 0 && (
                <p style={styles.mensaje}>Todavía no hay cuentas registradas.</p>
            )}

            {!cargando && !error && cuentas.length > 0 && (
                <div style={styles.tablaWrapper}>
                    <table style={styles.tabla}>
                        <thead>
                            <tr>
                                <th style={styles.th}>Nombre</th>
                                <th style={styles.th}>Email</th>
                                <th style={styles.th}>Rol</th>
                                <th style={styles.th}>N° de cuenta</th>
                                <th style={{ ...styles.th, textAlign: 'right' }}>
                                    Saldo
                                </th>
                                <th style={styles.th}>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cuentas.map((cuenta) => (
                                <tr key={cuenta._id} style={styles.tr}>
                                    <td style={styles.td}>
                                        {cuenta.usuario?.nombre ?? '—'}
                                    </td>
                                    <td style={styles.td}>
                                        {cuenta.usuario?.email ?? '—'}
                                    </td>
                                    <td style={styles.td}>
                                        <span style={styles.rolBadge}>
                                            {cuenta.usuario?.rol ?? '—'}
                                        </span>
                                    </td>
                                    <td style={styles.tdNumero}>
                                        {cuenta.numeroCuenta}
                                    </td>
                                    <td
                                        style={{
                                            ...styles.td,
                                            textAlign: 'right',
                                            fontWeight: 'bold',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {formatoCOP.format(cuenta.saldo ?? 0)}
                                    </td>
                                    <td style={styles.td}>
                                        <span
                                            style={
                                                cuenta.activa
                                                    ? styles.badgeActiva
                                                    : styles.badgeInactiva
                                            }
                                        >
                                            {cuenta.activa
                                                ? 'Activa'
                                                : 'Inactiva'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

const styles = {
    wrapper: { display: 'flex', flexDirection: 'column', gap: '1.2rem' },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        flexWrap: 'wrap',
        gap: '0.4rem',
    },
    titulo: { margin: 0, fontSize: '1.5rem', color: '#f8fafc' },
    contador: { margin: 0, fontSize: '0.85rem', color: '#94a3b8' },
    mensaje: { margin: 0, color: '#94a3b8' },
    tablaWrapper: {
        backgroundColor: '#1e293b',
        border: '1px solid #334155',
        borderRadius: '12px',
        overflowX: 'auto',
    },
    tabla: { width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' },
    th: {
        textAlign: 'left',
        padding: '0.9rem 1rem',
        fontSize: '0.75rem',
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        color: '#94a3b8',
        borderBottom: '1px solid #334155',
        whiteSpace: 'nowrap',
    },
    tr: { borderBottom: '1px solid #334155' },
    td: { padding: '0.9rem 1rem', color: '#e2e8f0', verticalAlign: 'middle' },
    tdNumero: {
        padding: '0.9rem 1rem',
        color: '#38bdf8',
        fontWeight: 'bold',
        whiteSpace: 'nowrap',
        verticalAlign: 'middle',
    },
    rolBadge: {
        display: 'inline-block',
        padding: '0.15rem 0.55rem',
        borderRadius: '999px',
        fontSize: '0.75rem',
        backgroundColor: '#0f172a',
        border: '1px solid #334155',
        color: '#cbd5e1',
        textTransform: 'capitalize',
    },
    badgeActiva: {
        display: 'inline-block',
        padding: '0.15rem 0.55rem',
        borderRadius: '999px',
        fontSize: '0.75rem',
        fontWeight: 'bold',
        backgroundColor: '#064e3b',
        color: '#a7f3d0',
    },
    badgeInactiva: {
        display: 'inline-block',
        padding: '0.15rem 0.55rem',
        borderRadius: '999px',
        fontSize: '0.75rem',
        fontWeight: 'bold',
        backgroundColor: '#7f1d1d',
        color: '#fca5a5',
    },
    alertError: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        backgroundColor: '#7f1d1d',
        color: '#fca5a5',
        padding: '0.75rem',
        borderRadius: '6px',
    },
    alertIcono: { flexShrink: 0 },
};
