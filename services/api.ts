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

// ID de familia hardcodeado por ahora para simplificar el MVP
const CURRENT_FAMILY_ID = 1;

export const calendarService = {
  /**
   * Obtiene todos los eventos de la familia actual.
   */
  getEvents: async (): Promise<CalendarEvent[]> => {
    try {
      const response = await api.get(`/events/?family_id=${CURRENT_FAMILY_ID}`);
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
      family_id: CURRENT_FAMILY_ID
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
      family_id: CURRENT_FAMILY_ID
    });
    return response.data;
  },

  /**
   * Obtiene la información de la familia.
   */
  getCurrentFamily: async (): Promise<Family> => {
    return {
      id: CURRENT_FAMILY_ID,
      name: "Familia Pérez",
      invite_code: "PEREZ2024"
    };
  },

  /**
   * Registra el token de notificaciones del dispositivo.
   */
  registerNotificationToken: async (token: string, userId: string) => {
    try {
      await api.post('/notifications/register', {
        token,
        user_id: userId,
        device_type: 'web'
      });
      console.log("Token de notificación registrado en Backend");
    } catch (error) {
      console.error("Error registrando token:", error);
    }
  }
};