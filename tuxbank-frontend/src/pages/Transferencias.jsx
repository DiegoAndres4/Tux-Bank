import { useState } from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { transferirRequest } from '../services/api';

const formatoCOP = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
});

export default function Transferencias() {
    const { refrescarCuenta } = useAuth();

    const [numeroCuentaDestino, setNumeroCuentaDestino] = useState('');
    const [monto, setMonto] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [comprobante, setComprobante] = useState(null);
    const [error, setError] = useState('');
    const [cargando, setCargando] = useState(false);

    const handleNumeroCuenta = (valor) => {
        setNumeroCuentaDestino(valor.replace(/\D/g, '').slice(0, 10));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setComprobante(null);
        setCargando(true);

        try {
            const data = await transferirRequest(
                numeroCuentaDestino,
                Number(monto),
                descripcion.trim(),
            );

            setComprobante(data?.comprobante ?? null);
            setNumeroCuentaDestino('');
            setMonto('');
            setDescripcion('');
            await refrescarCuenta();
        } catch (err) {
            setError(err.message || 'No se pudo realizar la transferencia');
        } finally {
            setCargando(false);
        }
    };

    return (
        <div style={styles.wrapper}>
            <h2 style={styles.titulo}>Transferir dinero</h2>

            <div style={styles.card}>
                {error && (
                    <div style={styles.alertError} role="alert">
                        {error}
                    </div>
                )}

                {comprobante && (
                    <div style={styles.alertExito} role="status">
                        <div style={styles.exitoHeader}>
                            <CheckCircle2 size={18} aria-hidden="true" />
                            <span>Transferencia realizada con éxito</span>
                        </div>
                        <dl style={styles.comprobante}>
                            <div style={styles.comprobanteFila}>
                                <dt style={styles.comprobanteLabel}>Origen</dt>
                                <dd style={styles.comprobanteValor}>
                                    {comprobante.origen}
                                </dd>
                            </div>
                            <div style={styles.comprobanteFila}>
                                <dt style={styles.comprobanteLabel}>Destino</dt>
                                <dd style={styles.comprobanteValor}>
                                    {comprobante.destino}
                                </dd>
                            </div>
                            <div style={styles.comprobanteFila}>
                                <dt style={styles.comprobanteLabel}>Monto</dt>
                                <dd style={styles.comprobanteValor}>
                                    {formatoCOP.format(comprobante.monto)}
                                </dd>
                            </div>
                            <div style={styles.comprobanteFila}>
                                <dt style={styles.comprobanteLabel}>
                                    Nuevo saldo
                                </dt>
                                <dd style={styles.comprobanteValor}>
                                    {formatoCOP.format(comprobante.nuevoSaldo)}
                                </dd>
                            </div>
                        </dl>
                    </div>
                )}

                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.group}>
                        <label style={styles.label} htmlFor="transferencia-destino">
                            Número de Cuenta Destino
                        </label>
                        <input
                            id="transferencia-destino"
                            type="text"
                            required
                            inputMode="numeric"
                            pattern="[0-9]{10}"
                            maxLength={10}
                            autoComplete="off"
                            value={numeroCuentaDestino}
                            onChange={(e) => handleNumeroCuenta(e.target.value)}
                            placeholder="10 dígitos, ej: 1092837482"
                            style={styles.input}
                        />
                        <span style={styles.hint}>
                            Debe tener exactamente 10 dígitos.
                        </span>
                    </div>

                    <div style={styles.group}>
                        <label style={styles.label} htmlFor="transferencia-monto">
                            Monto a Transferir (COP)
                        </label>
                        <input
                            id="transferencia-monto"
                            type="number"
                            required
                            min="1"
                            step="1"
                            inputMode="numeric"
                            value={monto}
                            onChange={(e) => setMonto(e.target.value)}
                            placeholder="50000"
                            style={styles.input}
                        />
                    </div>

                    <div style={styles.group}>
                        <label
                            style={styles.label}
                            htmlFor="transferencia-descripcion"
                        >
                            Descripción (opcional)
                        </label>
                        <input
                            id="transferencia-descripcion"
                            type="text"
                            maxLength={120}
                            value={descripcion}
                            onChange={(e) => setDescripcion(e.target.value)}
                            placeholder="Ej: Pago del almuerzo"
                            style={styles.input}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={cargando}
                        style={styles.button}
                    >
                        <span>
                            {cargando ? 'Procesando...' : 'Enviar dinero'}
                        </span>
                        <ArrowRight size={18} aria-hidden="true" />
                    </button>
                </form>
            </div>
        </div>
    );
}

const styles = {
    wrapper: { display: 'flex', flexDirection: 'column', gap: '1.2rem' },
    titulo: { margin: 0, fontSize: '1.5rem', color: '#f8fafc' },
    card: {
        backgroundColor: '#1e293b',
        padding: '2rem',
        borderRadius: '12px',
        border: '1px solid #334155',
    },
    form: { display: 'flex', flexDirection: 'column', gap: '1.2rem' },
    group: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
    label: { fontSize: '0.9rem', color: '#cbd5e1' },
    hint: { fontSize: '0.75rem', color: '#94a3b8' },
    input: {
        padding: '0.75rem',
        borderRadius: '6px',
        border: '1px solid #334155',
        backgroundColor: '#0f172a',
        color: '#fff',
        fontSize: '1rem',
        outline: 'none',
    },
    button: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        padding: '0.75rem',
        borderRadius: '6px',
        border: 'none',
        backgroundColor: '#10b981',
        color: '#fff',
        fontSize: '1rem',
        fontWeight: 'bold',
        cursor: 'pointer',
    },
    alertError: {
        backgroundColor: '#7f1d1d',
        color: '#fca5a5',
        padding: '0.75rem',
        borderRadius: '6px',
        marginBottom: '1rem',
    },
    alertExito: {
        backgroundColor: '#064e3b',
        color: '#a7f3d0',
        padding: '1rem',
        borderRadius: '6px',
        marginBottom: '1.5rem',
    },
    exitoHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        fontWeight: 'bold',
        marginBottom: '0.8rem',
    },
    comprobante: { margin: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' },
    comprobanteFila: {
        display: 'flex',
        justifyContent: 'space-between',
        gap: '1rem',
        fontSize: '0.85rem',
    },
    comprobanteLabel: { margin: 0, opacity: 0.8 },
    comprobanteValor: { margin: 0, fontWeight: 'bold' },
};
