import React, { useState } from 'react';
import { Send, Sparkles, Check, X, Loader2, Calendar, Clock, Tag, ArrowRight } from 'lucide-react';
import { calendarService } from '../services/api';
import { AIEventProposal } from '../types';

interface AIInputProps {
  onEventCreated: () => void;
}

export const AIInput: React.FC<AIInputProps> = ({ onEventCreated }) => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [proposal, setProposal] = useState<AIEventProposal | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 1. Enviar el texto a la IA
  const handleInterpret = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    setLoading(true);
    setError(null);
    setProposal(null);

    try {
      const result = await calendarService.interpretEvent(text);
      setProposal(result);
    } catch (err) {
      console.error(err);
      setError("No pude entender ese evento. Intenta ser más específico.");
    } finally {
      setLoading(false);
    }
  };

  // 2. Confirmar y Guardar en la DB Real
  const handleConfirm = async () => {
    if (!proposal) return;
    setLoading(true);
    try {
      await calendarService.createEvent({
        title: proposal.titulo,
        start_date: proposal.start_time,
        end_date: proposal.end_time,
        category: proposal.category,
        description: proposal.descripcion,
        family_id: 1
      });

      setProposal(null);
      setText('');
      onEventCreated();
    } catch (err) {
      setError("Error al guardar el evento.");
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
        {!proposal ? (
          <form onSubmit={handleInterpret} className="relative flex-1 flex flex-col group">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="¿Qué planeas hacer?..."
              className="w-full h-40 p-5 bg-white dark:bg-slate-800 border-2 border-gray-100 dark:border-slate-700 rounded-2xl focus:border-primary-400 dark:focus:border-primary-500 focus:ring-4 focus:ring-primary-50 dark:focus:ring-primary-900/20 outline-none resize-none text-gray-700 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 shadow-sm transition-all duration-300 ease-out"
              disabled={loading}
            />
            
            {/* Botón flotante animado */}
            <div className="absolute bottom-4 right-4">
              <button 
                type="submit" 
                disabled={loading || !text.trim()}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all duration-300 transform ${
                  loading || !text.trim()
                    ? 'bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-gray-500 translate-y-0' 
                    : 'bg-primary-600 hover:bg-primary-700 text-white shadow-lg hover:shadow-primary-500/30 hover:-translate-y-1 hover:scale-105 active:scale-95'
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Pensando...
                  </>
                ) : (
                  <>
                    Generar
                    <Send size={16} />
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* Tarjeta de Confirmación Mejorada */
          <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-xl overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-300 flex flex-col transition-colors">
            {/* Header de la tarjeta */}
            <div className="bg-gradient-to-r from-primary-50 to-white dark:from-slate-700 dark:to-slate-800 px-5 py-3 border-b border-primary-100 dark:border-slate-600 flex justify-between items-center">
              <span className="text-xs font-extrabold text-primary-700 dark:text-primary-300 uppercase tracking-wider flex items-center gap-1.5">
                <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce"></div>
                Vista Previa
              </span>
            </div>
            
            <div className="p-5 space-y-5">
              {/* Título */}
              <div>
                <h4 className="font-bold text-gray-800 dark:text-white text-lg leading-tight mb-1">
                  {proposal.titulo}
                </h4>
                <div className="h-1 w-12 bg-primary-200 dark:bg-primary-700 rounded-full"></div>
              </div>
              
              {/* Detalles */}
              <div className="space-y-3 bg-gray-50/50 dark:bg-slate-900/50 p-4 rounded-xl border border-gray-100 dark:border-slate-700">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 bg-white dark:bg-slate-800 rounded-lg shadow-sm text-gray-400 dark:text-gray-500 mt-0.5">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 uppercase font-bold tracking-wide mb-0.5">Horario</p>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                      {formatTime(proposal.start_time)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-1.5 bg-white dark:bg-slate-800 rounded-lg shadow-sm text-gray-400 dark:text-gray-500 mt-0.5">
                    <Tag className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 uppercase font-bold tracking-wide mb-1">Categoría</p>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${getCategoryBadgeStyle(proposal.category)}`}>
                      {categoryLabels[proposal.category] || proposal.category}
                    </span>
                  </div>
                </div>
              </div>

              {/* Acciones: Rojo vs Verde */}
              <div className="flex gap-3 pt-1">
                <button 
                  onClick={() => setProposal(null)}
                  className="flex-1 py-3 px-4 bg-white dark:bg-slate-700 border-2 border-gray-100 dark:border-slate-600 text-gray-500 dark:text-gray-300 text-sm font-bold rounded-xl hover:border-accent-200 hover:text-accent-600 dark:hover:text-accent-400 hover:bg-accent-50 dark:hover:bg-slate-600 transition-all duration-200 flex justify-center items-center gap-2 group"
                  disabled={loading}
                >
                  <X className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                  Cancelar
                </button>
                
                <button 
                  onClick={handleConfirm}
                  disabled={loading}
                  className="flex-[1.5] py-3 px-4 bg-secondary-500 text-white text-sm font-bold rounded-xl hover:bg-secondary-600 shadow-md shadow-secondary-500/20 hover:shadow-lg hover:shadow-secondary-500/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex justify-center items-center gap-2"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                  Confirmar Evento
                </button>
              </div>
            </div>
          </div>
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