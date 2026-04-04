/**
 * Tests para AdminProductos
 * Valida Requisitos: 1.1, 1.2, 1.3, 1.4, 1.5
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AdminProductos from './AdminProductos';

// Mock de servicios/api
jest.mock('../servicios/api', () => ({
  obtenerProductos: jest.fn(),
  crearProducto: jest.fn(),
  actualizarProducto: jest.fn(),
  eliminarProducto: jest.fn(),
  verificarToken: jest.fn(),
  obtenerUsuarioActual: jest.fn()
}));

// Mock del contexto
let mockContextValue = {
  autenticado: true,
  usuario: { id: 1, username: 'admin', nombre_completo: 'Administrador' },
  cargandoAuth: false
};

jest.mock('../contexto/AppContext', () => ({
  ...jest.requireActual('../contexto/AppContext'),
  useAppContext: () => mockContextValue,
  AppProvider: ({ children }) => children
}));

const api = require('../servicios/api');

const mockProductos = [
  {
    id: 1,
    nombre: 'Intel Core i7-13700K',
    categoria: 'procesador',
    socket: 'LGA1700',
    precio_base: 1500.00,
    stock: 10,
    disponible_a_pedido: false,
    descripcion_tecnica: 'Procesador de 16 núcleos'
  },
  {
    id: 2,
    nombre: 'ASUS ROG Strix B760',
    categoria: 'placa_madre',
    socket: 'LGA1700',
    ram_type: 'DDR5',
    form_factor: 'ATX',
    precio_base: 800.00,
    stock: 0,
    disponible_a_pedido: true,
    tiempo_entrega_dias: 7
  }
];

const renderWithContext = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('AdminProductos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem('token', 'fake-token');
    localStorage.setItem('usuario', JSON.stringify({ id: 1, username: 'admin' }));
    api.verificarToken.mockResolvedValue({ valido: true });
    api.obtenerProductos.mockResolvedValue({ productos: mockProductos });
  });

  test('renderiza la página correctamente', async () => {
    renderWithContext(<AdminProductos />);
    
    await waitFor(() => {
      expect(screen.getByText('Gestión de Productos')).toBeInTheDocument();
    });
  });

  test('carga y muestra productos', async () => {
    renderWithContext(<AdminProductos />);
    
    await waitFor(() => {
      expect(screen.getByText('Intel Core i7-13700K')).toBeInTheDocument();
      expect(screen.getByText('ASUS ROG Strix B760')).toBeInTheDocument();
    });
  });

  test('abre modal de creación al hacer clic en Nuevo Producto', async () => {
    renderWithContext(<AdminProductos />);
    
    await waitFor(() => {
      expect(screen.getByText('+ Nuevo Producto')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('+ Nuevo Producto'));
    
    await waitFor(() => {
      expect(screen.getByText('Nuevo Producto')).toBeInTheDocument();
    });
  });

  test('crea un nuevo producto', async () => {
    api.crearProducto.mockResolvedValue({ exito: true });
    
    renderWithContext(<AdminProductos />);
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('+ Nuevo Producto'));
    });

    await waitFor(() => {
      expect(screen.getByText('Nuevo Producto')).toBeInTheDocument();
    });

    const textboxes = screen.getAllByRole('textbox');
    const nombreInput = textboxes.find(input => input.name === 'nombre');
    fireEvent.change(nombreInput, { target: { value: 'Nuevo Procesador' } });
    
    const spinbuttons = screen.getAllByRole('spinbutton');
    const precioInput = spinbuttons.find(input => input.name === 'precio_base');
    const stockInput = spinbuttons.find(input => input.name === 'stock');
    fireEvent.change(precioInput, { target: { value: '2000' } });
    fireEvent.change(stockInput, { target: { value: '5' } });

    const crearButton = screen.getByText('Crear');
    fireEvent.click(crearButton);

    await waitFor(() => {
      expect(api.crearProducto).toHaveBeenCalled();
    });
  });

  test('abre modal de edición con datos del producto', async () => {
    renderWithContext(<AdminProductos />);
    
    await waitFor(() => {
      expect(screen.getByText('Intel Core i7-13700K')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByText('Editar');
    fireEvent.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Editar Producto')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Intel Core i7-13700K')).toBeInTheDocument();
    });
  });

  test('actualiza un producto existente', async () => {
    api.actualizarProducto.mockResolvedValue({ exito: true });
    
    renderWithContext(<AdminProductos />);
    
    await waitFor(() => {
      const editButtons = screen.getAllByText('Editar');
      fireEvent.click(editButtons[0]);
    });

    await waitFor(() => {
      expect(screen.getByText('Editar Producto')).toBeInTheDocument();
    });

    const spinbuttons = screen.getAllByRole('spinbutton');
    const stockInput = spinbuttons.find(input => input.name === 'stock');
    fireEvent.change(stockInput, { target: { value: '15' } });

    const actualizarButton = screen.getByText('Actualizar');
    fireEvent.click(actualizarButton);

    await waitFor(() => {
      expect(api.actualizarProducto).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ stock: 15 })
      );
    });
  });

  test('abre modal de confirmación al eliminar', async () => {
    renderWithContext(<AdminProductos />);
    
    await waitFor(() => {
      expect(screen.getByText('Intel Core i7-13700K')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByText('Eliminar');
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Confirmar Eliminación')).toBeInTheDocument();
      const allTexts = screen.getAllByText(/Intel Core i7-13700K/);
      expect(allTexts.length).toBeGreaterThan(0);
    });
  });

  test('elimina un producto tras confirmación', async () => {
    api.eliminarProducto.mockResolvedValue({ exito: true });
    
    renderWithContext(<AdminProductos />);
    
    await waitFor(() => {
      const deleteButtons = screen.getAllByText('Eliminar');
      fireEvent.click(deleteButtons[0]);
    });

    await waitFor(() => {
      expect(screen.getByText('Confirmar Eliminación')).toBeInTheDocument();
    });

    const buttons = screen.getAllByRole('button');
    const confirmarButton = buttons.find(btn => btn.textContent === 'Eliminar' && btn.className.includes('bg-red-600'));
    fireEvent.click(confirmarButton);

    await waitFor(() => {
      expect(api.eliminarProducto).toHaveBeenCalledWith(1);
    });
  });

  test('filtra productos por categoría', async () => {
    renderWithContext(<AdminProductos />);
    
    await waitFor(() => {
      expect(screen.getByText('Intel Core i7-13700K')).toBeInTheDocument();
      expect(screen.getByText('ASUS ROG Strix B760')).toBeInTheDocument();
    });

    const categoriaSelect = screen.getByRole('combobox', { name: '' });
    fireEvent.change(categoriaSelect, { target: { value: 'procesador' } });

    await waitFor(() => {
      expect(screen.getByText('Intel Core i7-13700K')).toBeInTheDocument();
      expect(screen.queryByText('ASUS ROG Strix B760')).not.toBeInTheDocument();
    });
  });

  test('busca productos por nombre', async () => {
    renderWithContext(<AdminProductos />);
    
    await waitFor(() => {
      expect(screen.getByText('Intel Core i7-13700K')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Buscar por nombre/i);
    fireEvent.change(searchInput, { target: { value: 'Intel' } });

    await waitFor(() => {
      expect(screen.getByText('Intel Core i7-13700K')).toBeInTheDocument();
      expect(screen.queryByText('ASUS ROG Strix B760')).not.toBeInTheDocument();
    });
  });

  test('muestra campos condicionales según categoría', async () => {
    renderWithContext(<AdminProductos />);
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('+ Nuevo Producto'));
    });

    await waitFor(() => {
      expect(screen.getByText('Nuevo Producto')).toBeInTheDocument();
    });

    const selects = screen.getAllByRole('combobox');
    const categoriaSelect = selects.find(select => select.name === 'categoria');
    
    fireEvent.change(categoriaSelect, { target: { value: 'procesador' } });
    expect(screen.getByPlaceholderText(/AM5, LGA1700/i)).toBeInTheDocument();
    
    fireEvent.change(categoriaSelect, { target: { value: 'fuente' } });
    await waitFor(() => {
      const inputs = screen.getAllByRole('spinbutton');
      expect(inputs.length).toBeGreaterThan(0);
    });
  });

  test('muestra campo de tiempo de entrega cuando disponible a pedido está marcado', async () => {
    renderWithContext(<AdminProductos />);
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('+ Nuevo Producto'));
    });

    await waitFor(() => {
      expect(screen.getByText('Nuevo Producto')).toBeInTheDocument();
    });

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    
    await waitFor(() => {
      expect(screen.getByText(/Tiempo de entrega/i)).toBeInTheDocument();
    });
  });

  test('muestra mensaje de error al fallar la carga', async () => {
    api.obtenerProductos.mockRejectedValue(new Error('Error de red'));
    
    renderWithContext(<AdminProductos />);
    
    await waitFor(() => {
      expect(screen.getByText(/Error al cargar productos/i)).toBeInTheDocument();
    });
  });

  test('muestra estado de carga mientras obtiene productos', () => {
    api.obtenerProductos.mockImplementation(() => new Promise(() => {}));
    
    renderWithContext(<AdminProductos />);
    
    expect(screen.getByText(/Cargando productos/i)).toBeInTheDocument();
  });

  test('muestra indicador de stock correcto', async () => {
    renderWithContext(<AdminProductos />);
    
    await waitFor(() => {
      const stockCells = screen.getAllByText(/\d+/);
      expect(stockCells.length).toBeGreaterThan(0);
    });
  });

  test('muestra indicador de disponibilidad a pedido', async () => {
    renderWithContext(<AdminProductos />);
    
    await waitFor(() => {
      expect(screen.getByText(/Sí \(7d\)/i)).toBeInTheDocument();
    });
  });

  test('cierra modal al hacer clic en cancelar', async () => {
    renderWithContext(<AdminProductos />);
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('+ Nuevo Producto'));
    });

    await waitFor(() => {
      expect(screen.getByText('Nuevo Producto')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Cancelar'));

    await waitFor(() => {
      expect(screen.queryByText('Nuevo Producto')).not.toBeInTheDocument();
    });
  });

  test('requiere autenticación para acceder', () => {
    // Modificar el mock para simular no autenticado
    mockContextValue.autenticado = false;
    mockContextValue.usuario = null;
    
    renderWithContext(<AdminProductos />);
    
    expect(screen.getByText('Acceso Denegado')).toBeInTheDocument();
    
    // Restaurar el mock
    mockContextValue.autenticado = true;
    mockContextValue.usuario = { id: 1, username: 'admin', nombre_completo: 'Administrador' };
  });
});

