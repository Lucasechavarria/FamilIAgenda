import axios from 'axios';
import { CalendarEvent, Family, AIOptimizationResponse, AIEventProposal } from '../types';

// Configuración base de Axios
const getBaseUrl = () => {
  // En producción, usar la variable de entorno
  // En desarrollo, usar localhost
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  return `${apiUrl}/api`;
};

const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para inyectar el token de autenticación automáticamente
api.interceptors.request.use((config) => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user.token) {
        config.headers.Authorization = `Bearer ${user.token}`;
      }
    } catch (e) {
      console.error("Error al leer token para Axios:", e);
    }
  }
  return config;
});

// Helper to get current family ID from storage
const getFamilyId = () => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      return user.family_id;
    } catch (e) {
      return null;
    }
  }
  return null;
};

export const calendarService = {
  /**
   * Obtiene un evento específico por ID.
   */
  getEvent: async (id: number): Promise<CalendarEvent> => {
    const response = await api.get(`/events/${id}`);
    return response.data;
  },

  /**
   * Obtiene todos los eventos de la familia actual.
   */
  getEvents: async (): Promise<CalendarEvent[]> => {
    try {
      const familyId = getFamilyId();
      if (!familyId) return [];
      const response = await api.get(`/events/?family_id=${familyId}`);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      // Si es 404 (Familia no encontrada), retornamos array vacío sin hacer ruido
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return [];
      }
      console.error("Error fetching events:", error);
      return [];
    }
  },

  /**
   * Crea un nuevo evento.
   */
  createEvent: async (event: Omit<CalendarEvent, 'id'>): Promise<CalendarEvent> => {
    const response = await api.post('/events/', {
      ...event,
      family_id: getFamilyId()
    });
    return response.data;
  },

  /**
   * Actualiza un evento (útil para Drag & Drop).
   */
  updateEvent: async (id: number, event: Partial<CalendarEvent>): Promise<CalendarEvent> => {
    const response = await api.patch(`/events/${id}`, event);
    return response.data;
  },

  /**
   * Elimina un evento.
   */
  deleteEvent: async (id: number): Promise<void> => {
    await api.delete(`/events/${id}`);
  },

  /**
   * Envía texto a la IA para interpretar un evento estructurado.
   */
  interpretEvent: async (textInput: string): Promise<AIEventProposal> => {
    // Endpoint definido en routers/ai.py
    const response = await api.post('/ai/interpretar', {
      texto: textInput // Debe coincidir con el modelo PromptUsuario del backend
    });
    return response.data;
  },

  /**
   * Versión STREAMING de interpretación de eventos.
   * Utiliza Fetch + ReadableStream para obtener tokens en tiempo real.
   */
  interpretEventStream: async (
    textInput: string, 
    onToken: (token: string) => void,
    onDone: (result: AIEventProposal) => void,
    onError: (error: string) => void
  ) => {
    const baseUrl = getBaseUrl();
    const userStr = localStorage.getItem('user');
    let token = "";
    
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        token = user.token || "";
      } catch (e) {}
    }

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
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        // Procesar líneas del buffer (formato SSE: data: {...}\n\n)
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || ""; // Mantener el último segmento incompleto

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const jsonStr = line.replace("data: ", "").trim();
              const payload = JSON.parse(jsonStr);

              if (payload.type === "token") {
                onToken(payload.value);
              } else if (payload.type === "done") {
                onDone(payload.result as AIEventProposal);
              } else if (payload.type === "error") {
                onError(payload.message);
              }
            } catch (e) {
              console.warn("Fallo al parsear fragmento SSE:", line);
            }
          }
        }
      }
    } catch (err: any) {
      onError(err.message || "Error desconocido en el asistente");
    }
  },
  
  /**
   * Propone cambios a un evento específico usando IA.
   */
  proposeEdit: async (eventId: number, text: string): Promise<Partial<CalendarEvent>> => {
    const response = await api.post(`/ai/propose-edit?event_id=${eventId}`, {
      texto: text
    });
    return response.data;
  },

  /**
   * Obtiene insights proactivos de "Aura"
   */
  getProactiveInsights: async (): Promise<{ insights: any[] }> => {
    const response = await api.get('/ai/proactive-insights');
    return response.data;
  },

  /**
   * Aplica una acción proactiva sugerida por la IA
   */
  applyProactiveAction: async (actionId: string, payload: any): Promise<any> => {
    const response = await api.post(`/ai/apply-action/${actionId}`, payload);
    return response.data;
  },

  /**
   * Usa IA para optimizar el calendario actual.
   */
  optimizeSchedule: async (text: string): Promise<AIOptimizationResponse> => {
    const response = await api.post('/ai/optimizar-calendario', {
      texto: text
    });
    // El backend devuelve { optimizacion: { analisis, sugerencias... }, ... }
    return response.data.optimizacion;
  },

  /**
   * (Legacy/Future) Envía texto para análisis general.
   */
  analyzeSchedule: async (textInput: string): Promise<any> => {
    const response = await api.post('/analyze-schedule', {
      input_text: textInput,
      family_id: getFamilyId()
    });
    return response.data;
  },

  /**
   * Obtiene la información de la familia.
   */
  getCurrentFamily: async (): Promise<Family> => {
    return {
      id: getFamilyId() || 0,
      name: "Familia Pérez",
      invite_code: "PEREZ2024"
    };
  },

  /**
   * Obtiene los miembros de la familia.
   */
  getFamilyMembers: async (familyId: number): Promise<import('../types').User[]> => {
    const response = await api.get(`/families/${familyId}/members`);
    return response.data;
  },

  /**
   * Registra el token de notificaciones del dispositivo.
   */
  registerNotificationToken: async (token: string, userId: string) => {
    try {
      await api.post('/notifications/register-token', {
        token,
        device_info: { // Backend expects device_info, not user_id (user_id is from token)
          user_agent: navigator.userAgent,
          platform: navigator.platform
        }
      });
      console.log("Token de notificación registrado en Backend");
    } catch (error) {
      console.error("Error registrando token:", error);
    }
  }
};