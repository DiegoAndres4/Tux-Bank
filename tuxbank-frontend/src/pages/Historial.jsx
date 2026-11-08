import { useEffect, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { historialRequest } from '../services/api';

const formatoCOP = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
});

const formatoFecha = new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
});

const formatearFecha = (valor) => {
    const fecha = new Date(valor);
    if (Number.isNaN(fecha.getTime())) return '—';
    return formatoFecha.format(fecha);
};

export default function Historial() {
    const [cuenta, setCuenta] = useState('');
    const [movimientos, setMovimientos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let activo = true;

        const cargar = async () => {
            try {
                const data = await historialRequest();
                if (!activo) return;
                setCuenta(data?.cuenta ?? '');
                setMovimientos(data?.movimientos ?? []);
            } catch (err) {
                if (!activo) return;
                setError(
                    err.message || 'No se pudo cargar el historial de movimientos',
                );
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
                <h2 style={styles.titulo}>Historial de movimientos</h2>
                {cuenta && <p style={styles.cuenta}>Cuenta {cuenta}</p>}
            </div>

            {cargando && <p style={styles.mensaje}>Cargando movimientos...</p>}

            {!cargando && error && (
                <div style={styles.alertError} role="alert">
                    {error}
                </div>
            )}

            {!cargando && !error && movimientos.length === 0 && (
                <div style={styles.vacio}>
                    <p style={styles.vacioTitulo}>Aún no tienes movimientos</p>
                    <p style={styles.vacioTexto}>
                        Cuando envíes o recibas una transferencia aparecerá aquí.
                    </p>
                </div>
            )}

            {!cargando && !error && movimientos.length > 0 && (
                <div style={styles.tablaWrapper}>
                    <table style={styles.tabla}>
                        <thead>
                            <tr>
                                <th style={styles.th}>Movimiento</th>
                                <th style={styles.th}>Contraparte</th>
                                <th style={styles.th}>Descripción</th>
                                <th style={styles.th}>Fecha</th>
                                <th style={{ ...styles.th, textAlign: 'right' }}>
                                    Monto
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {movimientos.map((movimiento) => {
                                const enviada =
                                    movimiento.direccion === 'enviada';
                                const Icono = enviada
                                    ? ArrowUpRight
                                    : ArrowDownLeft;
                                const color = enviada
                                    ? '#f87171'
                                    : '#10b981';

                                return (
                                    <tr key={movimiento._id} style={styles.tr}>
                                        <td style={styles.td}>
                                            <span
                                                style={{
                                                    ...styles.tipo,
                                                    color,
                                                }}
                                            >
                                                <Icono
                                                    size={16}
                                                    aria-hidden="true"
                                                />
                                                {enviada ? 'Enviada' : 'Recibida'}
                                            </span>
                                        </td>
                                        <td style={styles.td}>
                                            <span style={styles.contraparteCuenta}>
                                                {movimiento.contraparte
                                                    ?.numeroCuenta ?? '—'}
                                            </span>
                                            <span style={styles.contraparteNombre}>
                                                {movimiento.contraparte?.nombre ??
                                                    '—'}
                                            </span>
                                        </td>
                                        <td style={styles.td}>
                                            {movimiento.descripcion || '—'}
                                        </td>
                                        <td style={styles.td}>
                                            {formatearFecha(movimiento.fecha)}
                                        </td>
                                        <td
                                            style={{
                                                ...styles.td,
                                                textAlign: 'right',
                                                color,
                                                fontWeight: 'bold',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {enviada ? '-' : '+'}
                                            {formatoCOP.format(movimiento.monto)}
                                        </td>
                                    </tr>
                                );
                            })}
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
    cuenta: { margin: 0, fontSize: '0.85rem', color: '#94a3b8' },
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
    td: { padding: '0.9rem 1rem', color: '#e2e8f0', verticalAlign: 'top' },
    tipo: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        fontWeight: 'bold',
        whiteSpace: 'nowrap',
    },
    contraparteCuenta: {
        display: 'block',
        fontWeight: 'bold',
        color: '#38bdf8',
    },
    contraparteNombre: { display: 'block', fontSize: '0.8rem', color: '#94a3b8' },
    alertError: {
        backgroundColor: '#7f1d1d',
        color: '#fca5a5',
        padding: '0.75rem',
        borderRadius: '6px',
    },
    vacio: {
        backgroundColor: '#1e293b',
        border: '1px solid #334155',
        borderRadius: '12px',
        padding: '2.5rem 1.5rem',
        textAlign: 'center',
    },
    vacioTitulo: { margin: 0, fontWeight: 'bold', color: '#f8fafc' },
    vacioTexto: { margin: '0.4rem 0 0', fontSize: '0.9rem', color: '#94a3b8' },
};
