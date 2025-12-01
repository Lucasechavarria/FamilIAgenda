import React, { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Clock, AlertTriangle, Plus, Trash2, Calendar as CalendarIcon, Sparkles, X } from 'lucide-react';
import { api } from '../services/auth';
import { TaskModal } from './TaskModal';

interface Task {
    id: number;
    title: string;
    description?: string;
    due_date: string;
    status: 'pending' | 'completed' | 'verified';
    is_recurring: boolean;
    notification_config: string;
}

interface RoutineAnalysis {
    alerts: string[];
    suggestions: string[];
    score: number;
}

export const TasksView: React.FC = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<'pending' | 'completed'>('pending');
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Estado para análisis IA
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState<RoutineAnalysis | null>(null);

    useEffect(() => {
        loadTasks();
    }, [filter]);

    const loadTasks = async () => {
        setIsLoading(true);
        try {
            const response = await api.get(`/api/tasks/?status=${filter}`);
            setTasks(response.data);
        } catch (error) {
            console.error("Error cargando tareas:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCompleteTask = async (taskId: number) => {
        try {
            await api.post(`/api/tasks/${taskId}/complete`);
            loadTasks();
        } catch (error) {
            console.error("Error completando tarea:", error);
        }
    };

    const handleDeleteTask = async (taskId: number) => {
        if (!confirm("¿Estás seguro de eliminar esta tarea?")) return;
        try {
            await api.delete(`/api/tasks/${taskId}`);
            loadTasks();
        } catch (error) {
            console.error("Error eliminando tarea:", error);
        }
    };

    const handleAnalyzeRoutine = async () => {
        setIsAnalyzing(true);
        setAnalysis(null);
        try {
            const response = await api.post('/api/ai/analyze-routine');
            setAnalysis(response.data);
        } catch (error) {
            console.error("Error analizando rutina:", error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="h-full bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 flex flex-col overflow-hidden transition-colors duration-300 relative">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50">
                <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary-500" />
                    Tareas y Rutinas
                </h2>
                <div className="flex gap-2">
                    {/* Botón Analizar con IA */}
                    <button
                        onClick={handleAnalyzeRoutine}
                        disabled={isAnalyzing}
                        className="mr-2 px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg shadow-sm flex items-center gap-1 transition-all disabled:opacity-70"
                    >
                        {isAnalyzing ? (
                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <Sparkles size={12} />
                        )}
                        Optimizar Rutina
                    </button>

                    <button
                        onClick={() => setFilter('pending')}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${filter === 'pending' ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300' : 'text-slate-500 hover:bg-gray-100 dark:hover:bg-slate-700'}`}
                    >
                        Pendientes
                    </button>
                    <button
                        onClick={() => setFilter('completed')}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${filter === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'text-slate-500 hover:bg-gray-100 dark:hover:bg-slate-700'}`}
                    >
                        Completadas
                    </button>
                </div>
            </div>

            {/* Panel de Análisis IA (si existe) */}
            {analysis && (
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-b border-purple-100 dark:border-purple-900/30 p-4 animate-in slide-in-from-top-4">
                    <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                            <Sparkles className="text-purple-600 dark:text-purple-400 w-5 h-5" />
                            <h3 className="font-bold text-purple-900 dark:text-purple-100">Análisis de Rutina</h3>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${analysis.score > 80 ? 'bg-green-100 text-green-700' : analysis.score > 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                Salud: {analysis.score}/100
                            </span>
                        </div>
                        <button onClick={() => setAnalysis(null)} className="text-purple-400 hover:text-purple-600">
                            <X size={16} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        {analysis.alerts.length > 0 && (
                            <div className="bg-white/50 dark:bg-black/20 p-3 rounded-xl">
                                <h4 className="font-bold text-red-600 dark:text-red-400 mb-2 flex items-center gap-1">
                                    <AlertTriangle size={14} /> Alertas
                                </h4>
                                <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300">
                                    {analysis.alerts.map((alert, idx) => (
                                        <li key={idx}>{alert}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {analysis.suggestions.length > 0 && (
                            <div className="bg-white/50 dark:bg-black/20 p-3 rounded-xl">
                                <h4 className="font-bold text-purple-600 dark:text-purple-400 mb-2 flex items-center gap-1">
                                    <Sparkles size={14} /> Sugerencias
                                </h4>
                                <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300">
                                    {analysis.suggestions.map((sug, idx) => (
                                        <li key={idx}>{sug}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Lista de Tareas */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {isLoading ? (
                    <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
                    </div>
                ) : tasks.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 dark:text-slate-500">
                        <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>No hay tareas {filter === 'pending' ? 'pendientes' : 'completadas'}</p>
                    </div>
                ) : (
                    tasks.map(task => (
                        <div key={task.id} className="group flex items-start gap-3 p-3 rounded-xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 hover:border-primary-200 dark:hover:border-primary-700 hover:shadow-md transition-all duration-200">
                            <button
                                onClick={() => handleCompleteTask(task.id)}
                                disabled={task.status === 'completed'}
                                className={`mt-1 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${task.status === 'completed' ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300 dark:border-slate-500 hover:border-primary-500 text-transparent hover:text-primary-500'}`}
                            >
                                <CheckCircle2 size={14} strokeWidth={3} />
                            </button>

                            <div className="flex-1 min-w-0">
                                <h3 className={`font-medium text-slate-800 dark:text-slate-200 ${task.status === 'completed' ? 'line-through text-slate-400' : ''}`}>
                                    {task.title}
                                </h3>
                                {task.description && (
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                                        {task.description}
                                    </p>
                                )}
                                <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                                    <span className={`flex items-center gap-1 ${new Date(task.due_date) < new Date() && task.status !== 'completed' ? 'text-red-500 font-medium' : ''}`}>
                                        <Clock size={12} />
                                        {new Date(task.due_date).toLocaleString('es-ES', { weekday: 'short', hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    {task.is_recurring && (
                                        <span className="flex items-center gap-1 text-primary-500 bg-primary-50 dark:bg-primary-900/20 px-1.5 py-0.5 rounded">
                                            <CalendarIcon size={12} />
                                            Recurrente
                                        </span>
                                    )}
                                </div>
                            </div>

                            <button
                                onClick={() => handleDeleteTask(task.id)}
                                className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))
                )}
            </div>

            {/* Botón Flotante para Crear (Solo en vista pendientes) */}
            {filter === 'pending' && (
                <div className="absolute bottom-6 right-6">
                    <button
                        className="w-12 h-12 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
                        onClick={() => setIsModalOpen(true)}
                    >
                        <Plus size={24} />
                    </button>
                </div>
            )}

            <TaskModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onTaskCreated={loadTasks}
            />
        </div>
    );
};
