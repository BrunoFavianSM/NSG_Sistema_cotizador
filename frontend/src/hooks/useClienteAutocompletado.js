/**
 * useClienteAutocompletado.js
 *
 * Hook para autocompletar datos del cliente desde la base de datos.
 * Busca por email o teléfono con debounce de 300ms.
 */

import { useState, useEffect, useCallback } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Hook para autocompletar datos del cliente
 * @param {string} valorBusqueda - Email o teléfono a buscar
 * @param {boolean} habilitado - Si la búsqueda está habilitada
 * @returns {object} { cliente, buscando, error }
 */
export function useClienteAutocompletado(valorBusqueda, habilitado = true) {
  const [cliente, setCliente] = useState(null);
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState(null);

  const buscarCliente = useCallback(async (valor) => {
    if (!valor || valor.trim().length < 3) {
      setCliente(null);
      return;
    }

    setBuscando(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/clientes/buscar?q=${encodeURIComponent(valor.trim())}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Error al buscar cliente');
      }

      const data = await response.json();

      if (data.encontrado) {
        setCliente(data.cliente);
      } else {
        setCliente(null);
      }
    } catch (err) {
      console.error('Error al buscar cliente:', err);
      setError(err.message);
      setCliente(null);
    } finally {
      setBuscando(false);
    }
  }, []);

  useEffect(() => {
    if (!habilitado) {
      return;
    }

    // Debounce de 300ms
    const timeoutId = setTimeout(() => {
      buscarCliente(valorBusqueda);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [valorBusqueda, habilitado, buscarCliente]);

  return { cliente, buscando, error };
}
