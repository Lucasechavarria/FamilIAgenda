# Walkthrough: Implementación de Autenticación en Frontend

Se ha completado la integración del sistema de autenticación en el frontend de React, conectándolo con los endpoints de FastAPI.

## 🚀 Cambios Realizados

### 1. Nueva Estructura de Navegación
- Se implementó **React Router** para manejar la navegación.
- **Rutas Públicas**: `/login`, `/register`.
- **Rutas Privadas**: `/` (Dashboard), protegida por `ProtectedRoute`.

### 2. Páginas de Autenticación (UI/UX Premium)
Se crearon páginas con diseño moderno, animaciones suaves y validación de formularios:
- **Login (`/login`)**: Permite ingresar con "Código de Invitación" y "Contraseña".
- **Registro (`/register`)**: Permite crear una nueva familia. Al registrarse, redirige al dashboard.

### 3. Gestión de Estado (Context API)
- **`AuthContext`**: Maneja el estado global del usuario (`user`, `isAuthenticated`, `loading`).
- Persistencia de sesión mediante `localStorage` y Tokens JWT.
- Manejo automático de expiración (logout).

### 4. Servicios
- **`services/auth.ts`**: Cliente HTTP configurado con Axios para comunicarse con el backend.
- Interceptores para inyectar el Token Bearer automáticamente.

## 🧪 Cómo Probar

1. **Asegúrate de que el Backend esté corriendo**:
   ```bash
   # En una terminal (backend)
   cd app
   uvicorn main:app --reload
   ```

2. **Inicia el Frontend**:
   ```bash
   # En otra terminal (frontend)
   npm run dev
   ```

3. **Flujo de Prueba**:
   - Abre `http://localhost:5173`. Deberías ser redirigido a `/login`.
   - Haz clic en "Registrar nueva familia".
   - Crea una cuenta (ej. "Familia Test", "123456").
   - Deberías entrar al Dashboard automáticamente.
   - En el sidebar, verás el nombre de tu familia y un botón de Logout.
   - Haz Logout y prueba entrar con el Código de Invitación.
