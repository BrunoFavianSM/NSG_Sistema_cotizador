/**
 * Página de Importación de CSV
 * 
 * Permite a administradores importar catálogos de productos desde archivos CSV.
 * Features: drag & drop, previsualización, spinner, resumen de resultados.
 * 
 * Ruta: /admin/importar-csv (protegida)
 * Requisitos: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import LoadingSpinner from '../componentes/feedback/LoadingSpinner';
import { useAppContext } from '../contexto/AppContext';
import * as api from '../servicios/api';

const COLUMNAS_PREVIEW = ['Categoría', 'Código', 'Nombre', 'Stock', 'Precio USD', 'Garantía', 'Flete', 'Marca'];
const INDICES_COLUMNAS = {
  'Categoría': 0,
  'Código': 3,
  'Nombre': 5,
  'Stock': 8,
  'Precio USD': 11,
  'Garantía': 20,
  'Flete': 14,
  'Marca': 16,
};

function parsearCSV(texto) {
  const lineas = texto.split(/\r?\n/).filter(l => l.trim());
  if (lineas.length < 2) return [];

  return lineas.slice(1).map(linea => {
    const campos = [];
    let actual = '';
    let dentroComillas = false;
    for (let i = 0; i < linea.length; i++) {
      const c = linea[i];
      if (c === '"') {
        dentroComillas = !dentroComillas;
      } else if (c === ',' && !dentroComillas) {
        campos.push(actual.trim());
        actual = '';
      } else {
        actual += c;
      }
    }
    campos.push(actual.trim());
    return campos;
  });
}

export default function ImportarCSV() {
  const { autenticado, cargandoAuth } = useAppContext();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [archivo, setArchivo] = useState(null);
  const [preview, setPreview] = useState([]);
  const [importando, setImportando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState('');
  const [arrastrando, setArrastrando] = useState(false);

  // Protección de autenticación
  if (!cargandoAuth && !autenticado) {
    return <Navigate to="/login" replace />;
  }

  const procesarArchivo = useCallback((file) => {
    if (!file) return;
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      setError('Solo se permiten archivos .csv');
      return;
    }
    setArchivo(file);
    setError('');
    setResultado(null);

    // Leer primeras 11 líneas (encabezado + 10 filas) para previsualización
    const reader = new FileReader();
    reader.onload = (e) => {
      const texto = e.target.result;
      const todas = parsearCSV(texto);
      const primeras10 = todas.slice(0, 10);

      const filasFormateadas = primeras10.map(campos => {
        return COLUMNAS_PREVIEW.map(col => {
          const idx = INDICES_COLUMNAS[col];
          return campos[idx] || '—';
        });
      });

      setPreview(filasFormateadas);
    };
    reader.readAsText(file, 'utf-8');
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setArrastrando(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setArrastrando(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setArrastrando(false);
    const file = e.dataTransfer?.files?.[0];
    procesarArchivo(file);
  }, [procesarArchivo]);

  const handleFileInput = useCallback((e) => {
    const file = e.target.files?.[0];
    procesarArchivo(file);
  }, [procesarArchivo]);

  const importar = async () => {
    if (!archivo) return;
    setImportando(true);
    setError('');
    setResultado(null);

    try {
      const respuesta = await api.importarCSV(archivo);
      setResultado(respuesta);
    } catch (err) {
      const mensajeError = err?.mensaje || err?.error || 'Error de red al importar. Intenta nuevamente.';
      setError(mensajeError);
    } finally {
      setImportando(false);
    }
  };

  const reiniciar = () => {
    setArchivo(null);
    setPreview([]);
    setResultado(null);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (cargandoAuth) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner label="Verificando autenticación..." />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--color-text)]">Importar catálogo CSV</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Sube un archivo CSV para actualizar el catálogo de productos.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/admin/productos')}
          className="min-h-11 rounded-[var(--radius-sm)] border border-[var(--color-border)] px-4 text-sm font-medium text-[var(--color-text)] transition-colors duration-higNormal hover:bg-[var(--color-surface-hover)]"
        >
          ← Panel de admin
        </button>
      </header>

      {/* Zona Drag & Drop */}
      <section
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Zona para arrastrar archivo CSV"
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
        className={`surface-card cursor-pointer border-2 border-dashed p-10 text-center transition-all duration-higNormal ${
          arrastrando
            ? 'border-[var(--color-accent)] bg-[color:rgba(0,122,255,0.06)]'
            : 'border-[var(--color-border)] hover:border-[var(--color-accent)] hover:bg-[var(--color-surface-hover)]'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={handleFileInput}
          className="sr-only"
          id="importar-csv-input"
          aria-hidden="true"
        />

        <svg className="mx-auto h-12 w-12 text-[var(--color-text-muted)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="12" y1="18" x2="12" y2="12" />
          <polyline points="9 15 12 12 15 15" />
        </svg>

        {archivo ? (
          <div className="mt-3">
            <p className="text-sm font-semibold text-[var(--color-text)]">{archivo.name}</p>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">{(archivo.size / 1024).toFixed(1)} KB</p>
          </div>
        ) : (
          <div className="mt-3">
            <p className="text-sm font-medium text-[var(--color-text)]">Arrastra un archivo CSV aquí</p>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">o haz clic para seleccionar</p>
          </div>
        )}
      </section>

      {/* Previsualización */}
      {preview.length > 0 && (
        <section className="surface-card overflow-hidden">
          <div className="border-b border-[var(--color-border)] px-4 py-3">
            <h2 className="text-sm font-semibold text-[var(--color-text)]">
              Previsualización ({preview.length} filas)
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
                  {COLUMNAS_PREVIEW.map(col => (
                    <th key={col} className="whitespace-nowrap px-3 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((fila, i) => (
                  <tr key={i} className="border-b border-[var(--color-border)] last:border-b-0">
                    {fila.map((celda, j) => (
                      <td key={j} className="whitespace-nowrap px-3 py-2 text-sm text-[var(--color-text)]">
                        {celda}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Botón de importación */}
      {archivo && !resultado && (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={importar}
            disabled={importando}
            className="min-h-11 rounded-[var(--radius-md)] bg-[var(--color-accent)] px-6 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
          >
            {importando ? (
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                  <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
                </svg>
                Importando...
              </span>
            ) : (
              'Importar'
            )}
          </button>
          <button
            type="button"
            onClick={reiniciar}
            disabled={importando}
            className="min-h-11 rounded-[var(--radius-sm)] border border-[var(--color-border)] px-4 text-sm font-medium text-[var(--color-text)] disabled:opacity-50"
          >
            Cancelar
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="surface-card border-l-4 border-[var(--color-danger)] p-4">
          <p className="text-sm font-semibold text-[var(--color-danger)]">Error</p>
          <p className="mt-1 text-sm text-[var(--color-text)]">{error}</p>
        </div>
      )}

      {/* Resultado */}
      {resultado && (
        <section className="surface-card space-y-4 p-5">
          <h2 className="text-base font-bold text-[var(--color-text)]">Resultado de la importación</h2>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-[var(--radius-sm)] bg-[color:rgba(48,209,88,0.1)] p-3 text-center">
              <p className="text-2xl font-bold text-[var(--color-success)]">{resultado.insertados ?? 0}</p>
              <p className="text-xs font-medium text-[var(--color-text-muted)]">Insertados</p>
            </div>
            <div className="rounded-[var(--radius-sm)] bg-[color:rgba(0,122,255,0.1)] p-3 text-center">
              <p className="text-2xl font-bold text-[var(--color-accent)]">{resultado.actualizados ?? 0}</p>
              <p className="text-xs font-medium text-[var(--color-text-muted)]">Actualizados</p>
            </div>
            <div className="rounded-[var(--radius-sm)] bg-[color:rgba(255,214,10,0.1)] p-3 text-center">
              <p className="text-2xl font-bold text-[var(--color-warning)]">{resultado.omitidos ?? 0}</p>
              <p className="text-xs font-medium text-[var(--color-text-muted)]">Omitidos</p>
            </div>
            <div className="rounded-[var(--radius-sm)] bg-[color:rgba(255,69,58,0.1)] p-3 text-center">
              <p className="text-2xl font-bold text-[var(--color-danger)]">{resultado.errores ?? 0}</p>
              <p className="text-xs font-medium text-[var(--color-text-muted)]">Errores</p>
            </div>
          </div>

          {/* Detalle de errores */}
          {resultado.detalle_errores?.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-[var(--color-danger)]">Detalle de errores</h3>
              <div className="max-h-48 overflow-y-auto rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-bg)] p-3 space-y-1">
                {resultado.detalle_errores.map((err, i) => (
                  <p key={i} className="text-xs text-[var(--color-text-muted)]">
                    <span className="font-semibold text-[var(--color-danger)]">Fila {err.fila ?? i + 1}:</span>{' '}
                    {err.error || err.mensaje || JSON.stringify(err)}
                  </p>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={reiniciar}
              className="min-h-11 rounded-[var(--radius-sm)] bg-[var(--color-accent)] px-4 text-sm font-semibold text-white"
            >
              Importar otro archivo
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/productos')}
              className="min-h-11 rounded-[var(--radius-sm)] border border-[var(--color-border)] px-4 text-sm font-medium text-[var(--color-text)]"
            >
              Ver productos
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
