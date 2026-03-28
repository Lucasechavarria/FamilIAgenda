import React from 'react';
import { Sparkles, X, ArrowRight, Calendar, Trash2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AIOptimizationResponse, AISuggestion } from '../types';
import { cn } from '../lib/cn';
import { UXFeedback } from '../lib/UXInteractions';

interface AICompanionPanelProps {
    data: AIOptimizationResponse;
    onApply: (suggestion: AISuggestion) => void;
    onDismiss: () => void;
    onDismissSuggestion: (id: number) => void;
}

export const AICompanionPanel: React.FC<AICompanionPanelProps> = ({
    data,
    onApply,
    onDismiss,
    onDismissSuggestion
}) => {
    if (data.sugerencias.length === 0) return null;

    return (
        <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mb-6 overflow-hidden"
        >
            <div className="bg-gradient-to-br from-primary-600/10 via-secondary-500/5 to-accent-500/10 dark:from-primary-900/40 dark:via-secondary-900/30 dark:to-accent-900/40 border border-primary-200/50 dark:border-primary-700/50 rounded-2xl p-6 relative group selection:bg-primary-200/30">
                {/* Botón Cerrar Panel */}
                <button
                    onClick={() => {
                        UXFeedback.vibrate('light');
                        UXFeedback.playSound('click');
                        onDismiss();
                    }}
                    className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-white/10 rounded-full transition-all"
                >
                    <X size={16} />
                </button>

                <div className="flex items-start gap-4">
                    <div className="p-3 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl shadow-lg shadow-primary-500/20">
                        <Sparkles className="text-white w-6 h-6 animate-pulse" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                Modo Compañero IA
                                {data.tiempo_libre_ganado && (
                                    <span className="text-xs font-medium px-2 py-0.5 bg-green-500/20 text-green-600 dark:text-green-400 rounded-full border border-green-500/20">
                                        -{data.tiempo_libre_ganado} tiempo libre
                                    </span>
                                )}
                            </h3>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                            {data.analisis}
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <AnimatePresence mode="popLayout">
                                {data.sugerencias.map((sug) => (
                                    <motion.div
                                        key={sug.event_id}
                                        layout
                                        initial={{ scale: 0.9, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0.9, opacity: 0 }}
                                        className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-white dark:border-slate-700 rounded-xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group/card"
                                    >
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className={cn(
                                                    "text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full",
                                                    sug.accion === 'mover' ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" :
                                                    sug.accion === 'eliminar' ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" :
                                                    "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
                                                )}>
                                                    {sug.accion}
                                                </span>
                                                <button 
                                                    onClick={() => onDismissSuggestion(sug.event_id)}
                                                    className="opacity-0 group-hover/card:opacity-100 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-opacity"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 italic">
                                                "{sug.razon}"
                                            </p>
                                            {sug.nuevo_horario && (
                                                <div className="flex items-center gap-1.5 text-xs text-primary-600 dark:text-primary-400 font-semibold mt-2">
                                                    <Calendar size={12} />
                                                    {new Date(sug.nuevo_horario).toLocaleString('es-ES', { 
                                                        weekday: 'short', 
                                                        hour: '2-digit', 
                                                        minute: '2-digit' 
                                                    })}
                                                </div>
                                            )}
                                        </div>

                                        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex gap-2">
                                            <button
                                                onClick={() => {
                                                    UXFeedback.vibrate('medium');
                                                    UXFeedback.playSound('click');
                                                    onApply(sug);
                                                }}
                                                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-primary-500 hover:bg-primary-600 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                                            >
                                                <Check size={14} />
                                                Aplicar
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
