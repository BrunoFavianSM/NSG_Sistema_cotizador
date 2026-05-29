import { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Hook para obtener lista de emails registrados en el sistema.
 * Usado para datalist de autocompletado en campo de email.
 *
 * @returns {object} { emails: string[], cargando: boolean, error: string|null }
 */
export function useEmailsRegistrados() {
  const [emails, setEmails] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelado = false;

    async function cargarEmails() {
      try {
        setCargando(true);
        setError(null);

        const respuesta = await fetch(`${API_URL}/clientes/emails`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!respuesta.ok) {
          throw new Error(`Error ${respuesta.status}: ${respuesta.statusText}`);
        }

        const datos = await respuesta.json();

        if (!cancelado) {
          setEmails(datos.emails || []);
        }
      } catch (err) {
        if (!cancelado) {
          console.error('Error al cargar emails:', err);
          setError(err.message);
          setEmails([]);
        }
      } finally {
        if (!cancelado) {
          setCargando(false);
        }
      }
    }

    cargarEmails();

    return () => {
      cancelado = true;
    };
  }, []);

  return { emails, cargando, error };
}
