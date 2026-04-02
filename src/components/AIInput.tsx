import React, { useState } from 'react';
import { Send, Sparkles, X, Loader2 } from 'lucide-react';
import { calendarService, taskService } from '../services/api';
import { AIEventProposal } from '../types';
import { UXFeedback } from '../lib/UXInteractions';
import { AuraActionCard, AuraAction } from './AuraActionCard';

interface AIInputProps {
  onEventCreated: () => void;
}

export const AIInput: React.FC<AIInputProps> = ({ onEventCreated }) => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState<AuraAction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [streamingText, setStreamingText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  // 1. Enviar el texto a la IA (Streaming)
  const handleInterpret = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    setLoading(true);
    setError(null);
    setAction(null);
    setStreamingText('');
    setIsStreaming(true);

    try {
      UXFeedback.playSound('pop');
      UXFeedback.vibrate('light');

      await calendarService.interpretEventStream(
        text,
        (token) => {
          setStreamingText(prev => prev + token);
        },
        (result: any) => {
          // El resultado ahora viene con la estructura {action: '...', ...}
          setAction(result);
          setIsStreaming(false);
          setLoading(false);
          
          if (result.action === 'QUERY' && result.answer) {
            setStreamingText(result.answer);
          }
        },
        (errMsg) => {
          setError(errMsg);
          setIsStreaming(false);
          setLoading(false);
        }
      );
    } catch (err) {
      console.error(err);
      setError("No pude conectar con el asistente.");
      setLoading(false);
      setIsStreaming(false);
    }
  };

  // 2. Ejecutar la acción confirmada
  const handleConfirmAction = async () => {
    if (!action) return;
    setLoading(true);
    try {
      UXFeedback.vibrate('medium');
      
      switch (action.action) {
        case 'CREATE':
          await calendarService.createEvent({
            title: action.title || 'Nuevo Evento',
            start_time: action.start_time || new Date().toISOString(),
            end_time: action.end_time || new Date(Date.now() + 3600000).toISOString(),
            category: action.category || 'other',
            description: '',
            visibility: 'family',
            visibility_type: 'busy'
          });
          break;
          
        case 'UPDATE':
          if (action.id) {
            await calendarService.updateEvent(action.id, action.changes);
          }
          break;
          
        case 'DELETE':
          if (action.id) {
            await calendarService.deleteEvent(action.id);
          }
          break;
          
        default:
          break;
      }

      setAction(null);
      setText('');
      setStreamingText('');
      UXFeedback.playSound('success');
      onEventCreated();
    } catch (err) {
      setError("No pude completar la acción seleccionada.");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleString('es-ES', {
      weekday: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const getCategoryBadgeStyle = (cat: string) => {
    const map: Record<string, string> = {
      work: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/50 dark:text-purple-200 dark:border-purple-800',
      school: 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/50 dark:text-indigo-200 dark:border-indigo-800',
      health: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/50 dark:text-red-200 dark:border-red-800',
      leisure: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/50 dark:text-green-200 dark:border-green-800',
      other: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-slate-700 dark:text-gray-300 dark:border-slate-600'
    };
    return map[cat] || map.other;
  };

  const categoryLabels: Record<string, string> = {
    work: 'Trabajo', school: 'Escuela', health: 'Salud', leisure: 'Ocio', other: 'Otro'
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header del Asistente */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 mb-5 border border-primary-100 dark:border-slate-700 shadow-sm relative overflow-hidden group transition-colors">
        <div className="absolute top-0 right-0 w-20 h-20 bg-primary-50 dark:bg-slate-700 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
        <div className="flex items-center gap-2 mb-2 text-primary-800 dark:text-primary-200 font-bold relative z-10">
          <Sparkles size={20} className="text-primary-600 dark:text-primary-400 animate-pulse" />
          <span>Asistente Inteligente</span>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed relative z-10">
          Escribe naturalmente: <span className="italic text-primary-600 dark:text-primary-400 font-medium">"Cena romántica mañana a las 9pm"</span>.
        </p>
      </div>

      {/* Área de Input / Confirmación */}
      <div className="flex-1 flex flex-col relative">
        {!action ? (
          <form onSubmit={handleInterpret} className="relative flex-1 flex flex-col group">
            {/* ... textarea y botón existentes ... */}
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="¿Qué planeas hacer? Aura puede crear, mover o borrar eventos..."
              className="w-full h-40 p-5 bg-white dark:bg-slate-800 border-2 border-gray-100 dark:border-slate-700 rounded-2xl focus:border-primary-400 dark:focus:border-primary-500 focus:ring-4 focus:ring-primary-50 dark:focus:ring-primary-900/20 outline-none resize-none text-gray-700 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 shadow-sm transition-all duration-300 ease-out"
              disabled={loading}
            />
            {isStreaming && (
              <div className="absolute inset-0 bg-white/80 dark:bg-slate-800/80 rounded-2xl flex items-center justify-center backdrop-blur-sm z-20">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                  <p className="text-sm font-bold text-primary-600 animate-pulse">Aura está pensando...</p>
                </div>
              </div>
            )}
            <div className="absolute bottom-4 right-4">
              <button 
                type="submit" 
                disabled={loading || !text.trim()}
                className="bg-primary-600 hover:bg-primary-700 text-white p-3 rounded-xl shadow-lg transition-all active:scale-95"
              >
                <Send size={20} />
              </button>
            </div>
          </form>
        ) : (
          <AuraActionCard 
            action={action} 
            onConfirm={handleConfirmAction} 
            onCancel={() => {
              setAction(null);
              setStreamingText('');
            }}
            isProcessing={loading}
          />
        )}

        {error && (
          <div className="mt-4 p-4 bg-accent-50 dark:bg-red-900/20 border-l-4 border-accent-500 text-accent-700 dark:text-red-300 text-sm rounded-r-lg flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 shadow-sm">
            <X className="w-5 h-5 shrink-0 text-accent-500" />
            <span className="font-medium">{error}</span>
          </div>
        )}
      </div>
    </div>
  );
};