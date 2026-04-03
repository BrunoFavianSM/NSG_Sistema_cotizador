import '@testing-library/jest-dom';

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
