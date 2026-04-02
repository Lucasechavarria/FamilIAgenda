// =============================================================
//  FamilIAgenda – Contratos de Datos (Única Fuente de Verdad)
// =============================================================

// ------------------------------------------------------------------
// Primitivas y Literales
// ------------------------------------------------------------------

/** Categorías válidas para un CalendarEvent */
export type EventCategory =
  | 'work'
  | 'school'
  | 'health'
  | 'leisure'
  | 'personal'
  | 'family'
  | 'other';

/** Frecuencias de recurrencia */
export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

/** Frecuencias de recurrencia (UPPER_CASE para compatibilidad con API) */
export type RecurrencePatternKey = 'DAILY' | 'WEEKLY' | 'MONTHLY';

/** Roles / tipos de perfil de usuario */
export type ProfileType = 'admin' | 'member' | 'child';

/** Estado de una tarea */
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

// ------------------------------------------------------------------
// Entidades de Dominio
// ------------------------------------------------------------------

/** Corresponde al modelo `Family` del backend */
export interface Family {
  id: number;
  name: string;
  invite_code: string;
}

/** Corresponde al modelo `User` del backend */
export interface User {
  id: number;
  full_name: string;
  email: string;
  avatar_url?: string | null;
  profile_type?: ProfileType;
  personal_color?: string | null;
  kanban_layout?: 'sidebar' | 'top';
}

/** Miembro de la familia tal como llega de `/api/auth/familia/miembros` */
export interface FamilyMember {
  id: number;
  full_name: string;
  email: string;
  avatar_url?: string | null;
  personal_color?: string | null;
}

/** Patrón de recurrencia para eventos y tareas */
export interface RecurrencePattern {
  frequency: RecurrenceFrequency;
  interval: number;
  /** Días de la semana (0=Dom … 6=Sáb) aplicables a frecuencia 'weekly' */
  daysOfWeek: number[];
  /** Fecha límite de recurrencia (ISO string) */
  until?: string | null;
  endDate?: string;
  occurrences?: number;
}

/** Configuración de notificaciones para una tarea */
export interface NotificationConfig {
  /** Minutos antes de la tarea para notificar (ej: [30, 15]) */
  pre: number[];
  /** Si se activa una verificación posterior a la tarea */
  post: boolean;
}

/** Corresponde al modelo `CalendarEvent` del backend */
export interface CalendarEvent {
  id?: number;
  title: string;
  description?: string | null;
  /** ISO string */
  start_time: string;
  /** ISO string */
  end_time: string;
  family_id?: number;
  category: EventCategory;
  visibility: 'private' | 'family';
  visibility_type: 'invisible' | 'busy';
  is_recurring?: boolean;
  recurrence_pattern?: string | null;
  parent_id?: number | null;
  assigned_to_id?: number | null;
  assigned_to?: FamilyMember | null;
  has_conflict?: boolean;
  conflict_details?: string | null;
}

/** Corresponde al modelo `Task` del backend */
export interface Task {
  id?: number;
  title: string;
  description?: string | null;
  /** ISO string */
  due_date: string;
  status: TaskStatus;
  family_id?: number;
  assigned_to_id?: number | null;
  assigned_to?: FamilyMember | null;
  category?: string;
  is_recurring?: boolean;
  recurrence_pattern?: string | null;
  parent_id?: number | null;
  notification_config?: string | null;
}

// ------------------------------------------------------------------
// Propuestas de la IA
// ------------------------------------------------------------------

/** Shape del JSON devuelto por Groq/Gemini vía FastAPI */
export interface AIEventProposal {
  titulo: string;
  start_time: string;
  end_time: string;
  category: EventCategory;
  descripcion: string | null;
}

export interface AIAnalysisResponse {
  summary: string;
  suggestions: string[];
  conflicts: string[];
}

export interface AISuggestion {
  event_id: number;
  accion: 'mover' | 'eliminar' | 'combinar';
  razon: string;
  nuevo_horario?: string;
  nuevo_titulo?: string;
}

export interface AIOptimizationResponse {
  analisis: string;
  sugerencias: AISuggestion[];
  tiempo_libre_ganado?: string;
}

// ------------------------------------------------------------------
// Formularios (React Hook Form / estado local)
// ------------------------------------------------------------------

/** Datos del formulario de creación de evento */
export interface EventFormData {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  category: EventCategory;
  visibility: 'private' | 'family';
  visibilityType: 'invisible' | 'busy';
  assignedToId: number | null;
  isRecurring: boolean;
  recurrencePattern: RecurrencePattern;
}

/** Datos del formulario de creación de tarea */
export interface TaskFormData {
  title: string;
  description: string;
  due_date: string;
  due_time: string;
  /** El formulario usa string para el select nativo */
  assigned_to_id: string;
  is_recurring: boolean;
  recurrence_pattern: RecurrencePatternKey;
  notify_pre_30: boolean;
  notify_pre_15: boolean;
  notify_post: boolean;
}

// ------------------------------------------------------------------
// Errores de API
// ------------------------------------------------------------------

/** Estructura estándar de error de la API de FamilIAgenda */
export interface ApiErrorDetail {
  detail: string;
}

/**
 * Guarda de tipo para errores de Axios tipados.
 * Usar en bloques `catch` para evitar `any`.
 */
export interface ApiError {
  response?: {
    data?: ApiErrorDetail;
    status?: number;
  };
  message: string;
}

/** Narrowing helper: verifica si un error desconocido tiene estructura de ApiError */
export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error
  );
}
