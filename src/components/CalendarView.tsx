import React, { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import esLocale from '@fullcalendar/core/locales/es';
import { calendarService } from '../services/api';
import { X, Clock, AlignLeft, Calendar as CalendarIcon, Plus } from 'lucide-react';
import { EventModal } from './EventModal';

interface CalendarViewProps {
  refreshTrigger: number;
}

// Forma mínima del evento tal como FullCalendar lo consume internamente
interface SelectedEventDetail {
  id: string;
  title: string;
  start: Date;
  end: Date | null;
  category: string;
  description?: string | null;
  color: string;
  has_conflict?: boolean;
  conflict_details?: string | null;
}

interface FullCalendarEventInput {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  classNames: string[];
  extendedProps: {
    category: string;
    description?: string | null;
    has_conflict?: boolean;
    conflict_details?: string | null;
  };
}

export const CalendarView: React.FC<CalendarViewProps> = ({ refreshTrigger }) => {
  const [events, setEvents] = useState<FullCalendarEventInput[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<SelectedEventDetail | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadEvents();
  }, [refreshTrigger]);

  const loadEvents = async () => {
    try {
      const data = await calendarService.getEvents();
      const formattedEvents: FullCalendarEventInput[] = data.map((evt) => ({
        id: evt.id?.toString() ?? '',
        title: evt.title,
        start: evt.start_time,
        end: evt.end_time,
        backgroundColor: getCategoryColor(evt.category),
        borderColor: 'transparent',
        textColor: '#ffffff',
        classNames: [
          'custom-event-animation',
          evt.title === 'Ocupado' ? 'event-busy' : '',
          evt.has_conflict ? 'event-conflict' : ''
        ],
        extendedProps: {
          category: evt.category,
          description: evt.description,
          has_conflict: evt.has_conflict,
          conflict_details: evt.conflict_details,
        },
      }));
      setEvents(formattedEvents);
    } catch (error) {
      console.error("Error cargando eventos:", error);
    }
  };

  // EventDropArg de @fullcalendar/interaction — tipado como unknown para evitar any
  const handleEventDrop = async (info: Record<string, unknown>) => {
    const event = info.event as { id: string; start: Date; end: Date | null; };
    try {
      await calendarService.updateEvent(parseInt(event.id, 10), {
        start_time: event.start.toISOString(),
        end_time: (event.end ?? event.start).toISOString(),
      });
      loadEvents();
    } catch (error) {
      (info.revert as () => void)();
      console.error('Error actualizando evento:', error);
    }
  };

  const handleDelete = async () => {
    if (!selectedEvent) return;
    if (!window.confirm('¿Seguro que quieres eliminar este evento?')) return;

    setIsDeleting(true);
    try {
      await calendarService.deleteEvent(parseInt(selectedEvent.id, 10));
      setIsModalOpen(false);
      loadEvents();
    } catch (error) {
      console.error("Error eliminando:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  // EventClickArg de @fullcalendar/interaction
  const handleEventClick = (info: Record<string, unknown>) => {
    const event = info.event as {
      id: string;
      title: string;
      start: Date;
      end: Date | null;
      backgroundColor: string;
      extendedProps: { 
        category: string; 
        description?: string | null;
        has_conflict?: boolean;
        conflict_details?: string | null;
      };
    };
    setSelectedEvent({
      id: event.id,
      title: event.title,
      start: event.start,
      end: event.end,
      category: event.extendedProps.category,
      description: event.extendedProps.description,
      color: event.backgroundColor,
      has_conflict: event.extendedProps.has_conflict,
      conflict_details: event.extendedProps.conflict_details,
    } as any);
    setIsModalOpen(true);
  };

  const getCategoryColor = (cat: string) => {
    const colors: Record<string, string> = {
      work: '#7c3aed',    // Morado Primario
      school: '#8b5cf6',  // Morado Claro
      health: '#ef4444',  // Rojo (Urgente/Salud)
      leisure: '#10b981', // Verde Esmeralda (Ocio)
      other: '#64748b',   // Gris
    };
    return colors[cat] || colors.other;
  };

  return (
    <div className="h-full bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-1 overflow-hidden flex flex-col transition-colors duration-300 relative">
      <style>{`
        /* --- GENERAL TEXT --- */
        .fc { font-family: 'Inter', sans-serif; }
        
        /* Título del Calendario */
        .fc-toolbar-title { 
          font-size: 1.25rem !important; 
          font-weight: 800; 
          color: #1e293b; 
          text-transform: capitalize;
          letter-spacing: -0.025em;
        }
        .dark .fc-toolbar-title {
          color: #f1f5f9; /* Slate-100 en modo oscuro */
        }

        /* --- BOTONES DEL TOOLBAR --- */
        .fc-button {
          border-radius: 10px !important;
          font-weight: 600 !important;
          font-size: 0.85rem !important;
          padding: 8px 16px !important;
          text-transform: capitalize;
          box-shadow: none !important;
          transition: all 0.2s ease !important;
          border: 1px solid transparent !important;
        }
        
        /* Botones "Mes/Semana/Día" inactivos (Ghost) */
        .fc-button-primary {
          background-color: transparent !important;
          color: #64748b !important;
          border-color: transparent !important;
        }
        .dark .fc-button-primary {
          color: #94a3b8 !important; /* Slate-400 */
        }
        
        .fc-button-primary:hover {
          background-color: #f1f5f9 !important;
          color: #0f172a !important;
        }
        .dark .fc-button-primary:hover {
          background-color: #334155 !important; /* Slate-700 */
          color: #f8fafc !important;
        }

        /* Botones Activos */
        .fc-button-primary:not(:disabled).fc-button-active, 
        .fc-button-primary:not(:disabled):active {
          background-color: #f5f3ff !important;
          color: #7c3aed !important;
          border-color: #ddd6fe !important;
        }
        .dark .fc-button-primary:not(:disabled).fc-button-active, 
        .dark .fc-button-primary:not(:disabled):active {
          background-color: #4c1d95 !important; /* Purple-900 */
          color: #c4b5fd !important; /* Purple-300 */
          border-color: #5b21b6 !important;
        }

        /* Botón HOY */
        .fc-today-button {
          background-color: #7c3aed !important;
          color: white !important;
          opacity: 0.9;
        }
        .fc-today-button:hover {
          background-color: #6d28d9 !important;
          opacity: 1;
          transform: translateY(-1px);
          box-shadow: 0 4px 6px -1px rgba(124, 58, 237, 0.2);
        }

        /* Botones Navegación (< >) */
        .fc-prev-button, .fc-next-button {
          background-color: white !important;
          border: 1px solid #e2e8f0 !important;
          color: #64748b !important;
          width: 36px;
          height: 36px;
          padding: 0 !important;
          border-radius: 50% !important;
          display: flex; align-items: center; justify-content: center;
        }
        .dark .fc-prev-button, .dark .fc-next-button {
          background-color: #1e293b !important; /* Slate-800 */
          border-color: #334155 !important; /* Slate-700 */
          color: #cbd5e1 !important;
        }

        .fc-prev-button:hover, .fc-next-button:hover {
          border-color: #7c3aed !important;
          color: #7c3aed !important;
        }
        .dark .fc-prev-button:hover, .dark .fc-next-button:hover {
          border-color: #8b5cf6 !important;
          color: #8b5cf6 !important;
        }

        /* --- TABLA / GRID --- */
        .fc-theme-standard td, .fc-theme-standard th {
          border-color: #f1f5f9;
        }
        .dark .fc-theme-standard td, .dark .fc-theme-standard th {
          border-color: #334155; /* Slate-700 para bordes oscuros */
        }

        /* Cabeceras de días (Lun, Mar...) */
        .fc-col-header-cell-cushion {
          color: #64748b;
          font-weight: 600;
          text-transform: uppercase;
          font-size: 0.75rem;
          padding: 10px 0;
        }
        .dark .fc-col-header-cell-cushion {
          color: #94a3b8; /* Slate-400 */
        }

        /* Números de día */
        .fc-daygrid-day-number {
          color: #475569;
          font-weight: 500;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 4px;
          border-radius: 50%;
        }
        .dark .fc-daygrid-day-number {
          color: #cbd5e1; /* Slate-300 */
        }
        
        .fc-daygrid-day-number:hover {
          background-color: #f1f5f9;
          color: #7c3aed;
        }
        .dark .fc-daygrid-day-number:hover {
          background-color: #334155;
          color: #a78bfa;
        }

        /* Día Actual (Hoy) */
        .fc-day-today .fc-daygrid-day-number {
          background-color: #dc2626; /* ROJO */
          color: white;
          font-weight: bold;
        }
        .fc-day-today {
          background-color: #fef2f2 !important; /* Fondo rojo muy tenue */
        }
        .dark .fc-day-today {
          background-color: rgba(220, 38, 38, 0.1) !important; /* Fondo rojo transparente en modo oscuro */
        }

        /* Textos de horas en vista semanal */
        .fc-timegrid-slot-label-cushion {
           color: #64748b;
        }
        .dark .fc-timegrid-slot-label-cushion {
           color: #94a3b8;
        }

        /* --- EVENTOS --- */
        .fc-event {
          border-radius: 6px;
          border: none;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          transition: transform 0.1s ease, box-shadow 0.1s ease;
          font-size: 0.75rem;
          font-weight: 500;
          padding: 1px 2px;
        }
        .fc-event:hover {
          transform: scale(1.02);
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          z-index: 50;
          cursor: pointer;
        }
        
        /* --- LINEA DE TIEMPO (Ahora) --- */
        .fc-timegrid-now-indicator-line {
          border-color: #ef4444; /* ROJO intenso */
          border-width: 2px;
        }
        .fc-timegrid-now-indicator-arrow {
          border-color: #ef4444;
          border-width: 6px;
        }
        
        /* --- VISTA DE LISTA (AGENDA) --- */
        .fc-list {
          border: none !important;
        }
        .fc-list-event:hover td {
          background-color: #f8fafc !important;
        }
        .dark .fc-list-event:hover td {
          background-color: #1e293b !important;
        }
        .fc-list-day-cushion {
          background-color: #f1f5f9 !important;
        }
        .dark .fc-list-day-cushion {
          background-color: #334155 !important;
          color: #e2e8f0 !important;
        }
        .fc-list-event-title {
          color: #1e293b;
          font-weight: 500;
        }
        .dark .fc-list-event-title {
          color: #f1f5f9;
        }
        .fc-list-event-time {
          color: #64748b;
        }
        .dark .fc-list-event-time {
          color: #94a3b8;
        }

        /* --- CLASE OCUPADO (BUSY) --- */
        .event-busy {
          background-image: repeating-linear-gradient(
            45deg,
            rgba(0, 0, 0, 0.05),
            rgba(0, 0, 0, 0.05) 10px,
            rgba(0, 0, 0, 0) 10px,
            rgba(0, 0, 0, 0) 20px
          ) !important;
          opacity: 0.8;
        }

        /* --- CLASE CONFLICTO (CONFLICTO) --- */
        .event-conflict {
          border: 3px solid #ef4444 !important;
          box-shadow: 0 0 10px rgba(239, 68, 68, 0.4) !important;
          animation: conflict-pulse 2s infinite;
        }

        @keyframes conflict-pulse {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
        .dark .event-busy {
          background-image: repeating-linear-gradient(
            45deg,
            rgba(255, 255, 255, 0.05),
            rgba(255, 255, 255, 0.05) 10px,
            rgba(255, 255, 255, 0) 10px,
            rgba(255, 255, 255, 0) 20px
          ) !important;
        }

      `}</style>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
        initialView="dayGridMonth"
        locale={esLocale}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
        }}
        buttonText={{
          today: 'Hoy',
          month: 'Mes',
          week: 'Semana',
          day: 'Día',
          list: 'Agenda'
        }}
        navLinks={true}
        slotDuration="00:30:00"
        slotLabelInterval="01:00"
        slotMinTime="06:00:00"
        events={events}
        editable={true}
        droppable={true}
        selectable={true}
        selectMirror={true}
        dayMaxEvents={true}
        weekends={true}
        height="100%"
        allDayText="Todo el día"
        eventClick={handleEventClick}
        eventDrop={handleEventDrop}
      />

      {/* Modal de Detalles del Evento */}
      {isModalOpen && selectedEvent && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-slate-700 transform transition-all animate-in fade-in zoom-in duration-200">
            {/* Header con color de categoría */}
            <div className="h-24 relative" style={{ backgroundColor: selectedEvent.color }}>
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/30 text-white rounded-full transition-colors backdrop-blur-md"
              >
                <X size={18} />
              </button>
              <div className="absolute bottom-4 left-6 text-white">
                <span className="inline-block px-2 py-0.5 rounded-md bg-black/20 backdrop-blur-md text-xs font-bold uppercase tracking-wider mb-1">
                  {selectedEvent.category || 'Evento'}
                </span>
                <h3 className="text-xl font-bold leading-tight shadow-sm">{selectedEvent.title}</h3>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3 text-slate-600 dark:text-slate-300">
                <Clock className="w-5 h-5 mt-0.5 text-slate-400" />
                <div>
                  <p className="font-medium">
                    {selectedEvent.start.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {selectedEvent.start.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    {selectedEvent.end && ` - ${selectedEvent.end.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`}
                  </p>
                </div>
              </div>

              {selectedEvent.description && (
                <div className="flex items-start gap-3 text-slate-600 dark:text-slate-300">
                  <AlignLeft className="w-5 h-5 mt-0.5 text-slate-400" />
                  <p className="text-sm leading-relaxed">{selectedEvent.description}</p>
                </div>
              )}

              {(selectedEvent as any).has_conflict && (
                <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl animate-pulse">
                  <span className="text-lg">⚠️</span>
                  <div>
                    <p className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">Conflicto de Horario</p>
                    <p className="text-sm text-red-700 dark:text-red-300">{(selectedEvent as any).conflict_details}</p>
                  </div>
                </div>
              )}

              <div className="pt-6 flex justify-between items-center border-t border-slate-100 dark:border-slate-700 mt-2">
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center gap-1.5 text-sm font-medium"
                >
                  {isDeleting ? 'Eliminando...' : 'Eliminar'}
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    Cerrar
                  </button>
                  {selectedEvent.title !== 'Ocupado' && (
                    <button
                      onClick={() => {
                          setIsModalOpen(false);
                          setIsEditModalOpen(true);
                      }}
                      className="px-4 py-2 text-sm font-bold bg-primary-500 hover:bg-primary-600 dark:bg-primary-600 dark:hover:bg-primary-700 text-white rounded-lg transition-all shadow-sm flex items-center gap-1.5"
                    >
                      ✏️ Editar
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Botón Flotante para Crear Evento */}
      <button
        id="calendar-create-event"
        type="button"
        onClick={() => setIsCreateModalOpen(true)}
        aria-label="Crear nuevo evento"
        className="absolute bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-500 hover:to-secondary-500 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95 z-10 group"
      >
        <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" aria-hidden="true" />
      </button>

      {/* Modal de Crear Evento */}
      <EventModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onEventCreated={() => {
          loadEvents();
          setIsCreateModalOpen(false);
        }}
      />

      {/* Modal de Editar Evento */}
      {selectedEvent && (
        <EventModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            initialEvent={{
                id: parseInt(selectedEvent.id, 10),
                title: selectedEvent.title,
                start_time: selectedEvent.start.toISOString(),
                end_time: (selectedEvent.end || selectedEvent.start).toISOString(),
                category: selectedEvent.category,
                description: selectedEvent.description || undefined,
            } as any}
            onEventCreated={() => {
                loadEvents();
                setIsEditModalOpen(false);
            }}
        />
      )}
    </div>
  );
};

export default CalendarView;