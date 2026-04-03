/**
 * Tests Unitarios para Login
 * 
 * Valida:
 * - Renderizado correcto del formulario
 * - Validación de campos
 * - Manejo de errores
 * - Integración con contexto
 * - Navegación tras login exitoso
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from './Login';

// Mock de servicios/api
jest.mock('../servicios/api', () => ({
  login: jest.fn(),
  verificarToken: jest.fn(),
  logout: jest.fn(),
  obtenerUsuarioActual: jest.fn(),
  estaAutenticado: jest.fn()
}));

// Mock de react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

// Mock del contexto
const mockLogin = jest.fn();
const mockContextValue = {
  login: mockLogin,
  usuario: null,
  autenticado: false,
  cargandoAuth: false
};

jest.mock('../contexto/AppContext', () => ({
  ...jest.requireActual('../contexto/AppContext'),
  useAppContext: () => mockContextValue,
  AppProvider: ({ children }) => children
}));

// Helper para renderizar con contexto y router
const renderLogin = () => {
  return render(
    <BrowserRouter>
      <Login />
    </BrowserRouter>
  );
};

describe('Login - Renderizado', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renderiza el formulario de login correctamente', () => {
    renderLogin();

    expect(screen.getByText('Panel Administrativo')).toBeInTheDocument();
    expect(screen.getByText('NSG Latinoamerica E.I.R.L.')).toBeInTheDocument();
    expect(screen.getByLabelText('Usuario')).toBeInTheDocument();
    expect(screen.getByLabelText('Contraseña')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Iniciar Sesión/i })).toBeInTheDocument();
  });

  test('renderiza campos de entrada con placeholders correctos', () => {
    renderLogin();

    const usernameInput = screen.getByPlaceholderText('Ingresa tu usuario');
    const passwordInput = screen.getByPlaceholderText('Ingresa tu contraseña');

    expect(usernameInput).toBeInTheDocument();
    expect(passwordInput).toBeInTheDocument();
  });

  test('campo de contraseña es de tipo password por defecto', () => {
    renderLogin();

    const passwordInput = screen.getByLabelText('Contraseña');
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('renderiza el botón de mostrar/ocultar contraseña', () => {
    renderLogin();

    const toggleButtons = screen.getAllByRole('button');
    // Debe haber 2 botones: el de submit y el de toggle password
    expect(toggleButtons.length).toBeGreaterThanOrEqual(2);
  });
});

describe('Login - Validación de Formulario', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('muestra error cuando username está vacío', async () => {
    renderLogin();

    const submitButton = screen.getByRole('button', { name: /Iniciar Sesión/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('El nombre de usuario es requerido')).toBeInTheDocument();
    });

    expect(mockLogin).not.toHaveBeenCalled();
  });

  test('muestra error cuando username es muy corto', async () => {
    renderLogin();

    const usernameInput = screen.getByLabelText('Usuario');
    fireEvent.change(usernameInput, { target: { value: 'ab' } });

    const submitButton = screen.getByRole('button', { name: /Iniciar Sesión/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('El nombre de usuario debe tener al menos 3 caracteres')).toBeInTheDocument();
    });

    expect(mockLogin).not.toHaveBeenCalled();
  });

  test('muestra error cuando password está vacío', async () => {
    renderLogin();

    const usernameInput = screen.getByLabelText('Usuario');
    fireEvent.change(usernameInput, { target: { value: 'admin' } });

    const submitButton = screen.getByRole('button', { name: /Iniciar Sesión/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('La contraseña es requerida')).toBeInTheDocument();
    });

    expect(mockLogin).not.toHaveBeenCalled();
  });

  test('muestra error cuando password es muy corto', async () => {
    renderLogin();

    const usernameInput = screen.getByLabelText('Usuario');
    const passwordInput = screen.getByLabelText('Contraseña');

    fireEvent.change(usernameInput, { target: { value: 'admin' } });
    fireEvent.change(passwordInput, { target: { value: '12345' } });

    const submitButton = screen.getByRole('button', { name: /Iniciar Sesión/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('La contraseña debe tener al menos 6 caracteres')).toBeInTheDocument();
    });

    expect(mockLogin).not.toHaveBeenCalled();
  });

  test('limpia errores de validación cuando el usuario escribe', async () => {
    renderLogin();

    const submitButton = screen.getByRole('button', { name: /Iniciar Sesión/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('El nombre de usuario es requerido')).toBeInTheDocument();
    });

    const usernameInput = screen.getByLabelText('Usuario');
    fireEvent.change(usernameInput, { target: { value: 'admin' } });

    await waitFor(() => {
      expect(screen.queryByText('El nombre de usuario es requerido')).not.toBeInTheDocument();
    });
  });
});

describe('Login - Funcionalidad de Mostrar/Ocultar Contraseña', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('cambia el tipo de input al hacer clic en mostrar contraseña', async () => {
    renderLogin();

    const passwordInput = screen.getByLabelText('Contraseña');
    expect(passwordInput).toHaveAttribute('type', 'password');

    // Buscar el botón de toggle (el segundo botón que no es el de submit)
    const buttons = screen.getAllByRole('button');
    const toggleButton = buttons.find(btn => btn.type === 'button' && btn !== screen.getByRole('button', { name: /Iniciar Sesión/i }));

    if (toggleButton) {
      fireEvent.click(toggleButton);

      await waitFor(() => {
        expect(passwordInput).toHaveAttribute('type', 'text');
      });

      fireEvent.click(toggleButton);

      await waitFor(() => {
        expect(passwordInput).toHaveAttribute('type', 'password');
      });
    }
  });
});

describe('Login - Envío de Formulario', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
    mockLogin.mockClear();
  });

  test('llama a login con credenciales correctas', async () => {
    mockLogin.mockResolvedValue({ exito: true });

    renderLogin();

    const usernameInput = screen.getByLabelText('Usuario');
    const passwordInput = screen.getByLabelText('Contraseña');
    const submitButton = screen.getByRole('button', { name: /Iniciar Sesión/i });

    fireEvent.change(usernameInput, { target: { value: 'admin' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('admin', 'password123');
    });
  });

  test('muestra estado de carga durante el login', async () => {
    mockLogin.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ exito: true }), 100)));

    renderLogin();

    const usernameInput = screen.getByLabelText('Usuario');
    const passwordInput = screen.getByLabelText('Contraseña');
    const submitButton = screen.getByRole('button', { name: /Iniciar Sesión/i });

    fireEvent.change(usernameInput, { target: { value: 'admin' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Iniciando sesión...')).toBeInTheDocument();
    });
  });

  test('deshabilita el formulario durante el login', async () => {
    mockLogin.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ exito: true }), 100)));

    renderLogin();

    const usernameInput = screen.getByLabelText('Usuario');
    const passwordInput = screen.getByLabelText('Contraseña');
    const submitButton = screen.getByRole('button', { name: /Iniciar Sesión/i });

    fireEvent.change(usernameInput, { target: { value: 'admin' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(usernameInput).toBeDisabled();
      expect(passwordInput).toBeDisabled();
      expect(submitButton).toBeDisabled();
    });
  });

  test('navega a /admin tras login exitoso', async () => {
    mockLogin.mockResolvedValue({ exito: true });

    renderLogin();

    const usernameInput = screen.getByLabelText('Usuario');
    const passwordInput = screen.getByLabelText('Contraseña');
    const submitButton = screen.getByRole('button', { name: /Iniciar Sesión/i });

    fireEvent.change(usernameInput, { target: { value: 'admin' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/admin');
    });
  });

  test('muestra error cuando las credenciales son incorrectas', async () => {
    mockLogin.mockResolvedValue({ 
      exito: false, 
      error: 'Usuario o contraseña incorrectos' 
    });

    renderLogin();

    const usernameInput = screen.getByLabelText('Usuario');
    const passwordInput = screen.getByLabelText('Contraseña');
    const submitButton = screen.getByRole('button', { name: /Iniciar Sesión/i });

    fireEvent.change(usernameInput, { target: { value: 'admin' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Usuario o contraseña incorrectos')).toBeInTheDocument();
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('muestra error genérico cuando falla la conexión', async () => {
    mockLogin.mockRejectedValue(new Error('Network error'));

    renderLogin();

    const usernameInput = screen.getByLabelText('Usuario');
    const passwordInput = screen.getByLabelText('Contraseña');
    const submitButton = screen.getByRole('button', { name: /Iniciar Sesión/i });

    fireEvent.change(usernameInput, { target: { value: 'admin' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Error de conexión. Por favor, intenta nuevamente.')).toBeInTheDocument();
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('limpia el error cuando el usuario vuelve a escribir', async () => {
    mockLogin.mockResolvedValue({ 
      exito: false, 
      error: 'Usuario o contraseña incorrectos' 
    });

    renderLogin();

    const usernameInput = screen.getByLabelText('Usuario');
    const passwordInput = screen.getByLabelText('Contraseña');
    const submitButton = screen.getByRole('button', { name: /Iniciar Sesión/i });

    fireEvent.change(usernameInput, { target: { value: 'admin' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Usuario o contraseña incorrectos')).toBeInTheDocument();
    });

    fireEvent.change(usernameInput, { target: { value: 'admin2' } });

    await waitFor(() => {
      expect(screen.queryByText('Usuario o contraseña incorrectos')).not.toBeInTheDocument();
    });
  });
});

describe('Login - Accesibilidad', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('campos tienen labels asociados correctamente', () => {
    renderLogin();

    const usernameInput = screen.getByLabelText('Usuario');
    const passwordInput = screen.getByLabelText('Contraseña');

    expect(usernameInput).toHaveAttribute('id', 'username');
    expect(passwordInput).toHaveAttribute('id', 'password');
  });

  test('campos tienen atributos de autocompletado', () => {
    renderLogin();

    const usernameInput = screen.getByLabelText('Usuario');
    const passwordInput = screen.getByLabelText('Contraseña');

    expect(usernameInput).toHaveAttribute('autoComplete', 'username');
    expect(passwordInput).toHaveAttribute('autoComplete', 'current-password');
  });

  test('botón de submit tiene el tipo correcto', () => {
    renderLogin();

    const submitButton = screen.getByRole('button', { name: /Iniciar Sesión/i });
    expect(submitButton).toHaveAttribute('type', 'submit');
  });
});

describe('Login - Casos Edge', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('maneja espacios en blanco en username', async () => {
    renderLogin();

    const usernameInput = screen.getByLabelText('Usuario');
    const submitButton = screen.getByRole('button', { name: /Iniciar Sesión/i });

    fireEvent.change(usernameInput, { target: { value: '   ' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('El nombre de usuario es requerido')).toBeInTheDocument();
    });

    expect(mockLogin).not.toHaveBeenCalled();
  });

  test('acepta username con exactamente 3 caracteres', async () => {
    mockLogin.mockResolvedValue({ exito: true });

    renderLogin();

    const usernameInput = screen.getByLabelText('Usuario');
    const passwordInput = screen.getByLabelText('Contraseña');
    const submitButton = screen.getByRole('button', { name: /Iniciar Sesión/i });

    fireEvent.change(usernameInput, { target: { value: 'abc' } });
    fireEvent.change(passwordInput, { target: { value: '123456' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('abc', '123456');
    });
  });

  test('acepta password con exactamente 6 caracteres', async () => {
    mockLogin.mockResolvedValue({ exito: true });

    renderLogin();

    const usernameInput = screen.getByLabelText('Usuario');
    const passwordInput = screen.getByLabelText('Contraseña');
    const submitButton = screen.getByRole('button', { name: /Iniciar Sesión/i });

    fireEvent.change(usernameInput, { target: { value: 'admin' } });
    fireEvent.change(passwordInput, { target: { value: '123456' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('admin', '123456');
    });
  });

  test('maneja múltiples intentos de login fallidos', async () => {
    mockLogin.mockResolvedValue({ 
      exito: false, 
      error: 'Usuario o contraseña incorrectos' 
    });

    renderLogin();

    const usernameInput = screen.getByLabelText('Usuario');
    const passwordInput = screen.getByLabelText('Contraseña');
    const submitButton = screen.getByRole('button', { name: /Iniciar Sesión/i });

    // Primer intento
    fireEvent.change(usernameInput, { target: { value: 'admin' } });
    fireEvent.change(passwordInput, { target: { value: 'wrong1' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Usuario o contraseña incorrectos')).toBeInTheDocument();
    });

    // Segundo intento
    fireEvent.change(passwordInput, { target: { value: 'wrong2' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledTimes(2);
    });
  });
});
