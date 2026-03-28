import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// ------------------------------------------------------------------
// Tipos
// ------------------------------------------------------------------
interface ProtectedRouteProps {
  children: React.ReactNode;
}

// ------------------------------------------------------------------
// Componente
// ------------------------------------------------------------------
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center min-h-screen bg-background"
        aria-label="Verificando sesión, por favor espera"
        aria-live="polite"
      >
        <div
          role="status"
          aria-busy="true"
          aria-label="Cargando..."
          className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"
        />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
