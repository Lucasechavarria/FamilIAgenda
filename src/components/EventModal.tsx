import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Tag, FileText, Sparkles, Wand2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { api } from '../services/auth';
import { calendarService } from '../services/api';
import { FamilyMemberSelector } from './FamilyMemberSelector';
import { RecurrenceSelector } from './RecurrenceSelector';
import { cn } from '../lib/cn';
import { UXFeedback } from '../lib/UXInteractions';
import type { EventCategory, RecurrencePattern, CalendarEvent } from '../types';

// ------------------------------------------------------------------
// Tipos
// ------------------------------------------------------------------
interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventCreated: () => void;
  initialDate?: Date;
  initialEvent?: CalendarEvent;
}

interface CategoryOption {
  value: EventCategory;
  label: string;
  colorClass: string;
}

// ------------------------------------------------------------------
// Constantes
// ------------------------------------------------------------------
const CATEGORIES: CategoryOption[] = [
  { value: 'work',     label: 'Trabajo',  colorClass: 'bg-blue-500'   },
  { value: 'personal', label: 'Personal', colorClass: 'bg-green-500'  },
  { value: 'family',   label: 'Familia',  colorClass: 'bg-purple-500' },
  { value: 'health',   label: 'Salud',    colorClass: 'bg-red-500'    },
  { value: 'leisure',  label: 'Ocio',     colorClass: 'bg-yellow-500' },
  { value: 'school',   label: 'Escuela',  colorClass: 'bg-indigo-500' },
];

const now = () => new Date().toISOString().slice(0, 16);
const inAnHour = () => new Date(Date.now() + 3_600_000).toISOString().slice(0, 16);

// ------------------------------------------------------------------
// Componente
// ------------------------------------------------------------------
export const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  onClose,
  onEventCreated,
  initialDate,
  initialEvent,
}) => {
  const [title, setTitle]             = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate]     = useState(
    initialDate ? initialDate.toISOString().slice(0, 16) : now()
  );
  const [endDate, setEndDate]         = useState(
    initialDate ? new Date(initialDate.getTime() + 3_600_000).toISOString().slice(0, 16) : inAnHour()
  );
  const [category, setCategory]       = useState<EventCategory>('personal');
  const [assignedTo, setAssignedTo]   = useState<number | null>(null);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrencePattern, setRecurrencePattern] = useState<RecurrencePattern>({
    frequency: 'weekly',
    interval: 1,
    daysOfWeek: [],
  });
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');

  // Estados para Edición Asistida
  const [aiPrompt, setAiPrompt]       = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiSuccess, setAiSuccess]     = useState(false);
  const [conflict, setConflict]       = useState<string | null>(null);
  const [isCheckingConflict, setIsCheckingConflict] = useState(false);

  // Efecto para cargar datos del evento inicial (Edición)
  useEffect(() => {
    if (initialEvent) {
      setTitle(initialEvent.title);
      setDescription(initialEvent.description || '');
      setStartDate(new Date(initialEvent.start_time).toISOString().slice(0, 16));
      setEndDate(new Date(initialEvent.end_time).toISOString().slice(0, 16));
      setCategory(initialEvent.category as EventCategory);
      setAssignedTo(initialEvent.assigned_to_id || null);
      setIsRecurring(initialEvent.is_recurring);
      if (initialEvent.recurrence_pattern) {
        try {
          const pattern = typeof initialEvent.recurrence_pattern === 'string' 
            ? JSON.parse(initialEvent.recurrence_pattern) 
            : initialEvent.recurrence_pattern;
          setRecurrencePattern(pattern);
        } catch (e) {
          console.error("Error parseando recurrencia:", e);
        }
      }
    } else if (isOpen) {
      resetForm();
    }
  }, [initialEvent, isOpen, initialDate]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setStartDate(initialDate ? initialDate.toISOString().slice(0, 16) : now());
    setEndDate(initialDate ? new Date(initialDate.getTime() + 3_600_000).toISOString().slice(0, 16) : inAnHour());
    setCategory('personal');
    setAssignedTo(null);
    setIsRecurring(false);
    setRecurrencePattern({ frequency: 'weekly', interval: 1, daysOfWeek: [] });
    setAiPrompt('');
    setError('');
  };

  // --- Detección de Conflictos (Proactiva) ---
  useEffect(() => {
    if (!startDate || !endDate || !isOpen) return;

    const check = async () => {
      setIsCheckingConflict(true);
      setConflict(null);
      try {
        // Obtenemos eventos del día seleccionado para comparar
        const events = await calendarService.getEvents();
        const curStart = new Date(startDate).getTime();
        const curEnd   = new Date(endDate).getTime();

        const collision = events.find(e => {
            // Ignorar el mismo evento si estamos editando
            if (initialEvent && e.id === initialEvent.id) return false;
            
            const eStart = new Date(e.start_time).getTime();
            const eEnd   = new Date(e.end_time).getTime();
            
            // Lógica de solapamiento
            return (curStart < eEnd && curEnd > eStart);
        });

        if (collision) {
            setConflict(`Aura: Ojo, este horario choca con "${collision.title}"`);
            UXFeedback.vibrate('light');
        }
      } catch (err) {
        console.error("Error check conflict:", err);
      } finally {
        setIsCheckingConflict(false);
      }
    };

    const timer = setTimeout(check, 600);
    return () => clearTimeout(timer);
  }, [startDate, endDate, isOpen, initialEvent]);

  const handleAiAssist = async () => {
    if (!aiPrompt.trim() || !initialEvent?.id) return;
    
    setIsAiLoading(true);
    setAiSuccess(false);
    UXFeedback.vibrate('light');
    
    try {
      const suggestion = await calendarService.proposeEdit(initialEvent.id, aiPrompt);
      
      if (suggestion.title) setTitle(suggestion.title);
      if (suggestion.description !== undefined) setDescription(suggestion.description || '');
      if (suggestion.start_time) setStartDate(new Date(suggestion.start_time).toISOString().slice(0, 16));
      if (suggestion.end_time) setEndDate(new Date(suggestion.end_time).toISOString().slice(0, 16));
      if (suggestion.category) setCategory(suggestion.category as EventCategory);
      
      setAiSuccess(true);
      setAiPrompt('');
      UXFeedback.playSound('success');
      UXFeedback.vibrate('medium');
      
      setTimeout(() => setAiSuccess(false), 3000);
    } catch (err) {
      setError('La IA no pudo procesar el cambio');
      UXFeedback.playSound('error');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const eventData = {
        title,
        description,
        start_time: new Date(startDate).toISOString(),
        end_time: new Date(endDate).toISOString(),
        category,
        is_recurring: isRecurring,
        recurrence_pattern: isRecurring ? JSON.stringify(recurrencePattern) : null,
        assigned_to_id: assignedTo,
      };

      if (initialEvent?.id) {
        await calendarService.updateEvent(initialEvent.id, eventData);
      } else {
        await api.post('/api/events/', eventData);
      }

      UXFeedback.playSound('click');
      onEventCreated();
      handleClose();
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.detail) {
        setError(err.response.data.detail as string);
      } else {
        setError(initialEvent ? 'Error al actualizar el evento' : 'Error al crear el evento');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = (): void => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="event-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="glass-panel w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-10 duration-300">

        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-primary-600 to-secondary-600 p-4 flex justify-between items-center rounded-t-2xl z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <h2 id="event-modal-title" className="text-xl font-display font-bold text-white">
              {initialEvent ? 'Editar Evento' : 'Nuevo Evento'}
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6">
           {/* Asistente IA (Solo en edición) */}
           {initialEvent && (
            <div className={cn(
                "p-4 rounded-2xl bg-gradient-to-br from-primary-600/10 to-secondary-600/10 border border-primary-500/30 mb-6 relative overflow-hidden group/ia transition-all",
                aiSuccess && "ring-2 ring-emerald-500/50 bg-emerald-500/5 border-emerald-500/30"
            )}>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className={cn("w-4 h-4 text-primary-500", isAiLoading && "animate-spin")} />
                <span className="text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">Asistente Mágico IA</span>
                {aiSuccess && (
                    <motion.span 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full"
                    >
                        ¡Campos actualizados!
                    </motion.span>
                )}
              </div>
              <div className="flex gap-2">
                <input 
                   type="text"
                   value={aiPrompt}
                   onChange={(e) => setAiPrompt(e.target.value)}
                   onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAiAssist())}
                   placeholder="Ej: Muévelo a mañana o cambia el título..."
                   className="flex-1 bg-white/50 dark:bg-slate-900/50 border-none text-sm placeholder:text-slate-400 focus:ring-2 focus:ring-primary-500/20 rounded-xl px-4 py-2 transition-all"
                />
                <button 
                  type="button"
                  onClick={handleAiAssist}
                  disabled={isAiLoading || !aiPrompt.trim()}
                  className="p-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white rounded-xl transition-all shadow-sm"
                >
                  <Wand2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {error && (
              <div role="alert" className="p-3 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400 text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="event-title" className="block text-sm font-medium text-slate-300 mb-2">
                <FileText className="w-4 h-4 inline mr-2 text-slate-500" />
                Título *
              </label>
              <input
                id="event-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-field"
                placeholder="Ej: Reunión con el equipo"
                required
              />
            </div>

            <div>
              <label htmlFor="event-description" className="block text-sm font-medium text-slate-300 mb-2">
                Descripción
              </label>
              <textarea
                id="event-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input-field min-h-[80px] resize-none"
                placeholder="Detalles adicionales..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="event-start-date" className="block text-sm font-medium text-slate-300 mb-2">
                  <Clock className="w-4 h-4 inline mr-2 text-slate-500" />
                  Inicio *
                </label>
                <input
                  id="event-start-date"
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label htmlFor="event-end-date" className="block text-sm font-medium text-slate-300 mb-2">
                  <Clock className="w-4 h-4 inline mr-2 text-slate-500" />
                  Fin *
                </label>
                <input
                  id="event-end-date"
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="input-field"
                  required
                />
              </div>
            </div>

            <fieldset>
              <legend className="block text-sm font-medium text-slate-300 mb-2">
                <Tag className="w-4 h-4 inline mr-2 text-slate-500" />
                Categoría
              </legend>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {CATEGORIES.map((cat) => {
                  const isSelected = category === cat.value;
                  return (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setCategory(cat.value)}
                      className={cn(
                        'p-2 rounded-xl border transition-all duration-200 flex items-center gap-2',
                        isSelected
                          ? 'border-primary-500 bg-primary-500/20 shadow-inner'
                          : 'border-white/10 bg-white/5 hover:border-white/20'
                      )}
                    >
                      <div className={cn('w-2 h-2 rounded-full', cat.colorClass)} />
                      <span className="text-xs font-medium text-slate-200">{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <FamilyMemberSelector
              selectedMemberId={assignedTo}
              onSelectMember={setAssignedTo}
            />

            <RecurrenceSelector
              isRecurring={isRecurring}
              onToggleRecurring={setIsRecurring}
              pattern={recurrencePattern}
              onPatternChange={setRecurrencePattern}
            />

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="btn-secondary flex-1"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex-1"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  </span>
                ) : (
                  initialEvent ? 'Actualizar Evento' : 'Crear Evento'
                )}
              </button>
            </div>
          </form>

          {/* Advertencia de Conflicto de Aura */}
          <AnimatePresence>
            {conflict && (
                <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                >
                    <div className="mx-6 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-3 text-amber-200 text-xs">
                        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                        <p>{conflict}</p>
                    </div>
                </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
