import axios from 'axios';
// v1.1.0 - Estabilización de Capa de Red
import { CalendarEvent, Family, AIOptimizationResponse, AIEventProposal, Task } from '../types';

// Configuración base de Axios
const getBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    let url = import.meta.env.VITE_API_URL;
    if (url.endsWith('/')) url = url.slice(0, -1);
    return url.includes('/api') ? url : `${url}/api`;
  }
  return 'http://localhost:8000/api';
};

const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para inyectar el token de autenticación automáticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Caché simple para evitar parsear localStorage en cada petición
let cachedFamilyId: number | null = null;

const getFamilyId = () => {
  if (cachedFamilyId) return cachedFamilyId;
  const userStr = localStorage.getItem('user_profile');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      cachedFamilyId = user.family_id;
      return cachedFamilyId;
    } catch (e) {
      return null;
    }
  }
  return null;
};

export const calendarService = {
  getEvent: async (id: number): Promise<CalendarEvent> => {
    const response = await api.get(`/events/${id}`);
    return response.data;
  },

  getEvents: async (): Promise<CalendarEvent[]> => {
    try {
      const familyId = getFamilyId();
      if (!familyId) return [];
      const response = await api.get(`/events/?family_id=${familyId}`);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) return [];
      console.error("Error fetching events:", error);
      return [];
    }
  },

  createEvent: async (event: Omit<CalendarEvent, 'id'>): Promise<CalendarEvent> => {
    const response = await api.post('/events/', {
      ...event,
      family_id: getFamilyId()
    });
    return response.data;
  },

  updateEvent: async (id: number, event: Partial<CalendarEvent>): Promise<CalendarEvent> => {
    const response = await api.patch(`/events/${id}`, event);
    return response.data;
  },

  deleteEvent: async (id: number): Promise<void> => {
    await api.delete(`/events/${id}`);
  },

  interpretEvent: async (textInput: string): Promise<AIEventProposal> => {
    const response = await api.post('/ai/interpretar', { texto: textInput });
    return response.data;
  },

  interpretEventStream: async (
    textInput: string, 
    onToken: (token: string) => void,
    onDone: (result: AIEventProposal) => void,
    onError: (error: string) => void
  ) => {
    const baseUrl = getBaseUrl();
    const token = localStorage.getItem('access_token') || "";
    try {
      const response = await fetch(`${baseUrl}/ai/interpretar-stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ texto: textInput })
      });
      if (!response.ok) throw new Error("Error en la conexión con la IA");
      if (!response.body) throw new Error("No se recibió flujo de datos");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') break;
            try {
              const parsed = JSON.parse(data);
              if (parsed.token) onToken(parsed.token);
              if (parsed.proposal) onDone(parsed.proposal);
            } catch (e) {}
          }
        }
      }
    } catch (error: any) {
      onError(error.message);
    }
  },

  proposeEdit: async (eventId: number, text: string): Promise<Partial<CalendarEvent>> => {
    const response = await api.post(`/ai/propose-edit?event_id=${eventId}`, { texto: text });
    return response.data;
  },

  getProactiveInsights: async (): Promise<{ insights: any[] }> => {
    const response = await api.get('/ai/proactive-insights');
    return response.data;
  },

  applyProactiveAction: async (actionId: string, payload: any): Promise<any> => {
    const response = await api.post(`/ai/apply-action/${actionId}`, payload);
    return response.data;
  },

  optimizeSchedule: async (text: string): Promise<AIOptimizationResponse> => {
    const response = await api.post('/ai/optimizar-calendario', { texto: text });
    return response.data.optimizacion;
  },

  getCurrentFamily: async (): Promise<Family> => {
    const response = await api.get('/auth/familia/mi-familia');
    return response.data;
  },

  getFamilyMembers: async (): Promise<any[]> => {
    const response = await api.get('/auth/familia/miembros');
    return response.data;
  },

  registerNotificationToken: async (token: string, userId: string) => {
    try {
      await api.post('/notifications/register-token', {
        token,
        device_info: {
          user_agent: navigator.userAgent,
          platform: navigator.platform
        }
      });
    } catch (error) {
      console.error("Error registrando token:", error);
    }
  },

  getMetrics: async (range: string = 'month'): Promise<any> => {
    const response = await api.get(`/metrics/?range=${range}`);
    return response.data;
  }
};

export const taskService = {
  getTasks: async (status?: string, date?: string): Promise<Task[]> => {
    let url = '/tasks/';
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (date) params.append('date', date);
    const qs = params.toString();
    if (qs) url += `?${qs}`;
    const response = await api.get(url);
    return Array.isArray(response.data) ? response.data : [];
  },

  createTask: async (task: Partial<Task>): Promise<Task> => {
    const response = await api.post('/tasks/', task);
    return response.data;
  },

  updateTask: async (id: number, task: Partial<Task>): Promise<Task> => {
    const response = await api.patch(`/tasks/${id}`, task);
    return response.data;
  },

  deleteTask: async (id: number): Promise<void> => {
    await api.delete(`/tasks/${id}`);
  },
};
