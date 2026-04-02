import axios from 'axios';

const getApiUrl = () => {
    let baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    // Asegurar que no terminamos con una barra para normalizar
    if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);
    
    // Si la URL ya contiene /api, solo agregamos /auth. Si no, agregamos /api/auth
    return baseUrl.includes('/api') ? `${baseUrl}/auth` : `${baseUrl}/api/auth`;
};

const API_URL = getApiUrl();

export interface User {
    id: string;
    name: string;
    email: string;
    points?: number;
    level?: number;
    level_name?: string;
    theme?: string;
    color?: string;
    family_name?: string;
}

export interface LoginResponse {
    access_token: string;
    token_type: string;
    user_name: string;
    user_email: string;
    points?: number;
    level?: number;
    level_name?: string;
    theme?: string;
    family_id?: number;
}

export interface RegisterData {
    email: string;
    full_name: string;
    password: string;
    family_name?: string;
    join_family_code?: string;
}

export interface LoginData {
    email: string;
    password: string;
}

// Configurar interceptor para incluir el token
axios.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const api = axios;

export const authService = {
    api: axios,
    async register(data: RegisterData): Promise<LoginResponse> {
        console.log(`Intentando registrar en: ${API_URL}/register`);
        const response = await axios.post<LoginResponse>(`${API_URL}/register`, data);
        if (response.data.access_token) {
            localStorage.setItem('access_token', response.data.access_token);
        }
        return response.data;
    },

    async login(data: LoginData): Promise<LoginResponse> {
        console.log(`Intentando login en: ${API_URL}/token`);

        try {
            // El backend acepta JSON si lo configuramos correctamente o si usamos el router de auth estándar
            // Cambiamos a JSON para evitar el error 422 si el backend espera un objeto
            const response = await axios.post<LoginResponse>(`${API_URL}/token`, data);

            if (response.data.access_token) {
                localStorage.setItem('access_token', response.data.access_token);
                // También guardar datos básicos del usuario
                localStorage.setItem('user_profile', JSON.stringify({
                    name: response.data.user_name,
                    email: response.data.user_email
                }));
            }
            return response.data;
        } catch (error: any) {
            console.error("Error en login:", error.response?.data || error.message);
            // Lanzamos un error amigable en lugar del objeto circular que causa el Error #31
            const errorMessage = error.response?.data?.detail
                ? (typeof error.response.data.detail === 'string'
                    ? error.response.data.detail
                    : JSON.stringify(error.response.data.detail))
                : (error.response?.data?.message || "Error al iniciar sesión");
            throw new Error(errorMessage);
        }
    },

    logout() {
        localStorage.removeItem('access_token');
    },

    getCurrentUser(): User | null {
        const token = localStorage.getItem('access_token');
        if (!token) return null;

        try {
            // Decodificar payload del JWT (parte media)
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));

            const decoded = JSON.parse(jsonPayload);
            return {
                id: decoded.sub,
                name: decoded.full_name || 'Usuario', 
                email: decoded.email,
                points: decoded.points,
                level: decoded.level,
                level_name: decoded.level_name,
                theme: decoded.theme,
                family_name: decoded.family_name
            };
        } catch (error) {
            return null;
        }
    }
};
