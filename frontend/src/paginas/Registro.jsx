import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from '../componentes/ui/Button';
import InputField from '../componentes/ui/InputField';
import ErrorState from '../componentes/feedback/ErrorState';
import TurnstileWidget from '../componentes/ui/TurnstileWidget';
import { useAppContext } from '../contexto/AppContext';
import { evaluarFortalezaPassword } from '../utilidades/evaluarFortalezaPassword';

export default function Registro() {
  const navigate = useNavigate();
  const { registrar } = useAppContext();

  const [username, setUsername] = useState('');
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [dni, setDni] = useState('');
  const [password, setPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [captchaToken, setCaptchaToken] = useState(null);

  const fortaleza = evaluarFortalezaPassword(password);
  const contrasenasCoinciden = password === confirmarPassword;
  const mostrarAlertaCoincidencia = confirmarPassword.length > 0 && !contrasenasCoinciden;

  const manejarSubmit = async (event) => {
    event.preventDefault();
    setError('');

    // Validaciones del lado del cliente
    if (!username.trim()) return setError('El usuario es obligatorio.');
    if (username.trim().length < 3) return setError('El usuario debe tener al menos 3 caracteres.');
    if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) return setError('El usuario solo puede contener letras, números y guion bajo.');
    if (!nombreCompleto.trim()) return setError('El nombre completo es obligatorio.');
    if (nombreCompleto.trim().length < 2) return setError('El nombre debe tener al menos 2 caracteres.');
    if (!correo.trim()) return setError('El correo electrónico es obligatorio.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim())) return setError('El formato del correo no es válido.');
    if (!telefono.trim()) return setError('El teléfono es obligatorio.');
    if (!dni.trim()) return setError('El DNI es obligatorio.');
    if (!/^[0-9]{8,15}$/.test(dni.trim())) return setError('El DNI debe tener entre 8 y 15 dígitos.');

    if (!password) return setError('La contraseña es obligatoria.');
    if (password.length < 8) return setError('La contraseña debe tener al menos 8 caracteres.');
    if (!/[A-Z]/.test(password)) return setError('La contraseña debe contener al menos una mayúscula.');
    if (!/[a-z]/.test(password)) return setError('La contraseña debe contener al menos una minúscula.');
    if (!/[0-9]/.test(password)) return setError('La contraseña debe contener al menos un número.');
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) return setError('La contraseña debe contener al menos un carácter especial.');
    if (!contrasenasCoinciden) return setError('Las contraseñas no coinciden.');

    setCargando(true);

    try {
      const resultado = await registrar({
        username: username.trim(),
        password,
        confirmarPassword,
        correo: correo.trim().toLowerCase(),
        nombre_completo: nombreCompleto.trim(),
        telefono: telefono.trim(),
        dni: dni.trim(),
        captcha_token: captchaToken
      });

      if (resultado?.exito) {
        navigate('/cotizador');
        return;
      }

      setError(resultado?.error || 'No se pudo completar el registro.');
    } catch (err) {
      setError(err?.mensaje || 'Error al procesar el registro. Intenta nuevamente.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-xl space-y-6">
      <header className="surface-elevated p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">Nueva cuenta</p>
        <h1 className="mt-1 text-2xl font-semibold text-[var(--color-text)] sm:text-3xl">Crear cuenta</h1>
        <p className="mt-2 max-w-xl text-sm text-[var(--color-text-muted)]">
          Regístrate para ver precios, crear cotizaciones y usar el asistente de configuración.
        </p>
      </header>

      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="surface-elevated p-6"
        aria-labelledby="registro-form-title"
      >
        <h2 id="registro-form-title" className="text-lg font-semibold text-[var(--color-text)]">Datos de registro</h2>

        <form onSubmit={manejarSubmit} className="mt-4 space-y-4">
          {error ? (
            <ErrorState
              title="No se pudo completar el registro"
              description={error}
              className="p-3"
            />
          ) : null}

          <InputField
            id="registro-username"
            label="Usuario"
            required
            autoComplete="username"
            value={username}
            onChange={(e) => { setUsername(e.target.value); setError(''); }}
            placeholder="Crea un nombre de usuario"
          />

          <InputField
            id="registro-nombre"
            label="Nombre completo"
            required
            autoComplete="name"
            value={nombreCompleto}
            onChange={(e) => { setNombreCompleto(e.target.value); setError(''); }}
            placeholder="Ingresa tu nombre completo"
          />

          <InputField
            id="registro-correo"
            label="Correo electrónico"
            type="email"
            required
            autoComplete="email"
            value={correo}
            onChange={(e) => { setCorreo(e.target.value); setError(''); }}
            placeholder="nombre@correo.com"
          />

          <InputField
            id="registro-telefono"
            label="Teléfono"
            type="tel"
            required
            autoComplete="tel"
            value={telefono}
            onChange={(e) => { setTelefono(e.target.value); setError(''); }}
            placeholder="+51 999 999 999"
          />

          <InputField
            id="registro-dni"
            label="DNI"
            required
            inputMode="numeric"
            value={dni}
            onChange={(e) => { setDni(e.target.value.replace(/[^0-9]/g, '')); setError(''); }}
            placeholder="Ej: 01234567 (admite ceros a la izquierda)"
          />

          <div className="space-y-1.5">
            <label htmlFor="registro-password" className="text-sm font-medium text-[var(--color-text)]">
              Contraseña
              <span className="ml-1 text-[var(--color-danger)]">*</span>
            </label>

            <div className="relative">
              <input
                id="registro-password"
                type={mostrarPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                className="w-full min-h-11 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 pr-12 text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] transition-colors duration-higNormal ease-hig hover:border-[var(--color-text-muted)]"
                placeholder="Al menos 8 caracteres, mayúscula, número y símbolo"
                aria-required="true"
              />

              <button
                type="button"
                onClick={() => setMostrarPassword((prev) => !prev)}
                className="absolute inset-y-0 right-1 my-0.5 inline-flex min-h-11 min-w-11 items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-text-muted)] transition-colors duration-higNormal ease-hig hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-text)]"
                aria-pressed={mostrarPassword}
                aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {mostrarPassword ? (
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>

            {/* Medidor de fortaleza */}
            {password.length > 0 && (
              <div className="mt-1.5 space-y-1">
                <div className="h-1.5 w-full rounded-full bg-[var(--color-surface-soft)] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300 ease-out"
                    style={{
                      width: `${fortaleza.porcentaje}%`,
                      backgroundColor: fortaleza.color,
                    }}
                  />
                </div>
                <p className="text-xs" style={{ color: fortaleza.color }}>
                  {fortaleza.label}
                  {fortaleza.nivel === 'debil' && ' — Usa mayúsculas, números y símbolos'}
                  {fortaleza.nivel === 'media' && ' — Buena, pero puedes mejorarla'}
                  {fortaleza.nivel === 'fuerte' && ' — Contraseña segura'}
                </p>
              </div>
            )}

            <p className="text-xs text-[var(--color-text-muted)]">
              Mínimo 8 caracteres, con mayúscula, minúscula, número y carácter especial.
            </p>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="registro-confirmar-password" className="text-sm font-medium text-[var(--color-text)]">
              Confirmar contraseña
              <span className="ml-1 text-[var(--color-danger)]">*</span>
            </label>
            <div className="relative">
              <input
                id="registro-confirmar-password"
                type={mostrarPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={confirmarPassword}
                onChange={(e) => {
                  setConfirmarPassword(e.target.value);
                  setError('');
                }}
                className={`w-full min-h-11 rounded-[var(--radius-sm)] border px-3 pr-12 text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] transition-colors duration-higNormal ease-hig hover:border-[var(--color-text-muted)] ${
                  mostrarAlertaCoincidencia
                    ? 'border-[var(--color-danger)]'
                    : confirmarPassword.length > 0 && contrasenasCoinciden
                      ? 'border-[var(--color-success)]'
                      : 'border-[var(--color-border)]'
                } bg-[var(--color-surface)]`}
                placeholder="Vuelve a ingresar la contraseña"
                aria-required="true"
              />
            </div>
            {mostrarAlertaCoincidencia && (
              <p className="text-xs text-[var(--color-danger)]">Las contraseñas no coinciden</p>
            )}
            {confirmarPassword.length > 0 && contrasenasCoinciden && (
              <p className="text-xs text-[var(--color-success)]">Las contraseñas coinciden</p>
            )}
          </div>

          <TurnstileWidget onToken={setCaptchaToken} />

          <div className="flex flex-col items-center gap-3 pt-2">
            <Button type="submit" loading={cargando} className="sm:min-w-[12rem]">
              Crear cuenta
            </Button>
            <p className="text-sm text-[var(--color-text-muted)]">
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" className="font-medium text-[var(--color-accent-text)] hover:underline">
                Inicia sesión
              </Link>
            </p>
          </div>
        </form>
      </motion.section>
    </div>
  );
}