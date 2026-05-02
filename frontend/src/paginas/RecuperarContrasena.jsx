import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from '../componentes/ui/Button';
import InputField from '../componentes/ui/InputField';
import { solicitarRecuperacion } from '../servicios/api';

export default function RecuperarContrasena() {
  const [correo, setCorreo] = useState('');
  const [cargando, setCargando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState('');

  const manejarSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!correo.trim()) return setError('El correo electrónico es obligatorio.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim())) return setError('El formato del correo no es válido.');

    setCargando(true);

    try {
      const resultado = await solicitarRecuperacion(correo.trim().toLowerCase());
      if (resultado?.exito) {
        setEnviado(true);
      } else {
        setError(resultado?.error || 'Error al procesar la solicitud.');
      }
    } catch (err) {
      setError(err?.mensaje || 'Error de conexión. Intenta nuevamente.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-xl space-y-6">
      <header className="surface-elevated p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">Recuperación</p>
        <h1 className="mt-1 text-2xl font-semibold text-[var(--color-text)] sm:text-3xl">Recuperar contraseña</h1>
        <p className="mt-2 max-w-xl text-sm text-[var(--color-text-muted)]">
          Ingresa tu correo electrónico y te enviaremos instrucciones para restablecer tu contraseña.
        </p>
      </header>

      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="surface-elevated p-6"
        aria-labelledby="recuperar-form-title"
      >
        <h2 id="recuperar-form-title" className="text-lg font-semibold text-[var(--color-text)]">
          {enviado ? 'Solicitud enviada' : 'Ingresa tu correo'}
        </h2>

        {enviado ? (
          <div className="mt-4 space-y-4">
            <div className="rounded-[var(--radius-sm)] bg-[color:rgba(48,209,88,0.10)] p-4 text-sm text-[var(--color-success)]">
              Si el correo existe, recibirás instrucciones para restablecer tu contraseña.
            </div>
            <p className="text-sm text-[var(--color-text-muted)]">
              Revisa tu bandeja de entrada y carpeta de spam. El enlace expira en 60 minutos.
            </p>
            <div className="flex justify-center pt-2">
              <Link
                to="/login"
                className="text-sm font-medium text-[var(--color-accent-text)] hover:underline"
              >
                Volver a iniciar sesión
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={manejarSubmit} className="mt-4 space-y-4">
            {error && (
              <div className="rounded-[var(--radius-sm)] bg-[color:rgba(255,69,58,0.10)] p-3 text-sm text-[var(--color-danger)]">
                {error}
              </div>
            )}

            <InputField
              id="recuperar-correo"
              label="Correo electrónico"
              type="email"
              required
              autoComplete="email"
              value={correo}
              onChange={(e) => { setCorreo(e.target.value); setError(''); }}
              placeholder="nombre@correo.com"
            />

            <div className="flex flex-col items-center gap-3 pt-2">
              <Button type="submit" loading={cargando} className="sm:min-w-[12rem]">
                Enviar instrucciones
              </Button>
              <p className="text-sm text-[var(--color-text-muted)]">
                ¿Recordaste tu contraseña?{' '}
                <Link to="/login" className="font-medium text-[var(--color-accent-text)] hover:underline">
                  Inicia sesión
                </Link>
              </p>
            </div>
          </form>
        )}
      </motion.section>
    </div>
  );
}