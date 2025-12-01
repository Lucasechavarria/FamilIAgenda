import axios from 'axios';
import { CalendarEvent, Family, AIAnalysisResponse, AIEventProposal } from '../types';

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
   * (Legacy/Future) Envía texto para análisis general.
   */
  analyzeSchedule: async (textInput: string): Promise<AIAnalysisResponse> => {
    // Este endpoint era el dummy anterior, lo mantenemos por si se expande la funcionalidad
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