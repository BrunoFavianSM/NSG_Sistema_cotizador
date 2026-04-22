import '@testing-library/jest-dom';

// Mock window.matchMedia (no disponible en jsdom)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock import.meta.env for Vite
global.import = {
  meta: {
    env: {
      VITE_API_URL: 'http://localhost:3000/api'
    }
  }
};

// Mock process.env for Jest compatibility
process.env.VITE_API_URL = 'http://localhost:3000/api';

jest.mock('framer-motion', () => {
  const React = require('react');
  const passthrough = (tag) => ({ children, ...props }) => React.createElement(tag, props, children);

  return {
    AnimatePresence: ({ children }) => React.createElement(React.Fragment, null, children),
    motion: new Proxy(
      {},
      {
        get: (_, tag) => passthrough(tag)
      }
    )
  };
});

jest.mock('./componentes/feedback/ToastProvider', () => ({
  ToastProvider: ({ children }) => children,
  useToast: () => ({
    show: jest.fn(),
    info: jest.fn(),
    success: jest.fn(),
    warning: jest.fn(),
    error: jest.fn(),
    dismiss: jest.fn()
  })
}));
