import axios from 'axios';

const getApiUrl = () => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    return `${baseUrl}/api/auth`;
};

const API_URL = getApiUrl();

export interface User {
    id: string; // El backend devuelve 'sub' como string en el token, pero aquí podemos guardarlo si queremos
    name: string;
    email: string;
}

export interface LoginResponse {
    access_token: string;
    token_type: string;
    user_name: string;
    user_email: string;
}

export interface RegisterData {
    email: string;
    full_name: string;
    password: string;
    create_family_name?: string;
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
        const response = await axios.post<LoginResponse>(`${API_URL}/token`, data);
        if (response.data.access_token) {
            localStorage.setItem('access_token', response.data.access_token);
        }
        return response.data;
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
                name: decoded.user_name || 'Usuario', // El backend no siempre manda esto en el payload standard, pero lo mandamos en la respuesta de login
                email: decoded.email
            };
        } catch (error) {
            return null;
        }
    }
};
