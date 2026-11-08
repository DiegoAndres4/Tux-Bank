export default function LoadingScreen({ mensaje = 'Cargando...' }) {
    return (
        <div style={styles.container} role="status" aria-live="polite">
            <p style={styles.logo}>🐧 Tux Bank</p>
            <p style={styles.mensaje}>{mensaje}</p>
        </div>
    );
}

const styles = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '0.5rem',
        minHeight: '100vh',
        backgroundColor: '#0f172a',
        color: '#94a3b8',
        fontFamily: 'sans-serif',
    },
    logo: { margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: '#38bdf8' },
    mensaje: { margin: 0, fontSize: '0.95rem' },
};
