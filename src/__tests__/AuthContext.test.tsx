import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { authService } from '../services/auth';

// Mock del servicio de autenticación
vi.mock('../services/auth', () => ({
  authService: {
    getCurrentUser: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn()
  }
}));

const TestComponent = () => {
  const { user, isAuthenticated, logout } = useAuth();
  return (
    <div>
      <div data-testid="auth-status">{isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</div>
      <div data-testid="user-name">{user?.full_name}</div>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.documentElement.removeAttribute('data-theme');
  });

  it('debe cargar el usuario inicial y aplicar el tema', async () => {
    const mockUser = { id: 1, full_name: 'Test User', theme: 'sunset' };
    (authService.getCurrentUser as any).mockReturnValue(mockUser);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
      expect(screen.getByTestId('user-name')).toHaveTextContent('Test User');
      expect(document.documentElement.getAttribute('data-theme')).toBe('sunset');
    });
  });

  it('debe aplicar el tema "space" por defecto si no hay usuario', async () => {
    (authService.getCurrentUser as any).mockReturnValue(null);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(document.documentElement.getAttribute('data-theme')).toBe('space');
    });
  });

  it('debe limpiar el estado al hacer logout', async () => {
    (authService.getCurrentUser as any).mockReturnValue({ id: 1, full_name: 'User' });
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const logoutButton = screen.getByText('Logout');
    logoutButton.click();

    expect(authService.logout).toHaveBeenCalled();
    await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
    });
  });
});
