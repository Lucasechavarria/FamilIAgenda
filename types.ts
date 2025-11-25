
// Matches the 'Family' model from the backend requirements
export interface Family {
  id: number;
  name: string;
  invite_code: string;
}

// Matches the 'Event' model from the backend requirements
export interface CalendarEvent {
  id?: number; // Optional for creation
  title: string;
  start_date: string; // ISO string for datetime
  end_date: string;   // ISO string for datetime
  family_id: number;
  category: 'work' | 'school' | 'health' | 'leisure' | 'other';
  description?: string | null;
}

// The shape of the JSON returned by the Gemini API via FastAPI
export interface AIEventProposal {
  titulo: string;
  start_time: string;
  end_time: string;
  category: CalendarEvent['category'];
  descripcion: string | null;
}

export interface AIAnalysisResponse {
  summary: string;
  suggestions: string[];
  conflicts: string[];
}
