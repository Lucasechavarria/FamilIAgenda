import { vi, describe, it, expect } from 'vitest';
import axios from 'axios';

// Mock de Axios con interceptores rastreables
const mockInstance = {
  interceptors: {
    request: { use: vi.fn(), eject: vi.fn() },
    response: { use: vi.fn(), eject: vi.fn() }
  },
  get: vi.fn(),
  post: vi.fn(),
  defaults: { headers: { common: {} } }
};

vi.mock('axios', () => ({
  default: {
    ...mockInstance,
    create: vi.fn(() => mockInstance)
  }
}));

// Importar servicios
import { authService } from '../services/auth';

describe('API Service', () => {
  it('debe tener el servicio de autenticación inicializado', () => {
    expect(authService).toBeDefined();
    expect(authService.login).toBeDefined();
  });

  it('debe manejar logout eliminando el token', () => {
    localStorage.setItem('access_token', 'test-token');
    authService.logout();
    expect(localStorage.getItem('access_token')).toBeNull();
  });
});
