import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Bell, Repeat, User as UserIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { api } from '../services/auth';

interface TaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onTaskCreated: () => void;
}

interface TaskFormData {
    title: string;
    description: string;
    due_date: string;
    due_time: string;
    assigned_to_id: string; // Form uses string for select
    is_recurring: boolean;
    recurrence_pattern: string;
    notify_pre_30: boolean;
    notify_pre_15: boolean;
    notify_post: boolean;
}

interface FamilyMember {
    id: number;
    full_name: string;
    avatar_url?: string;
}

export const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, onTaskCreated }) => {
    const { register, handleSubmit, reset } = useForm<TaskFormData>();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [members, setMembers] = useState<FamilyMember[]>([]);

    useEffect(() => {
        if (isOpen) {
            loadMembers();
        }
    }, [isOpen]);

    const loadMembers = async () => {
        try {
            const response = await api.get('/api/auth/family/members');
            setMembers(response.data);
        } catch (error) {
            console.error("Error cargando miembros:", error);
        }
    };

    if (!isOpen) return null;

    const onSubmit = async (data: TaskFormData) => {
        setIsSubmitting(true);
        try {
            // Construir fecha completa
            const dueDateTime = new Date(`${data.due_date}T${data.due_time}`);

            // Construir config de notificaciones
            const preNotifications = [];
            if (data.notify_pre_30) preNotifications.push(30);
            if (data.notify_pre_15) preNotifications.push(15);

            const notificationConfig = JSON.stringify({
                pre: preNotifications,
                post: data.notify_post
            });

            await api.post('/api/tasks/', {
                title: data.title,
                description: data.description,
                due_date: dueDateTime.toISOString(),
                assigned_to_id: data.assigned_to_id ? parseInt(data.assigned_to_id) : null,
                is_recurring: data.is_recurring,
                recurrence_pattern: data.is_recurring ? data.recurrence_pattern : null,
                notification_config: notificationConfig
            });

            reset();
            onTaskCreated();
            onClose();
        } catch (error) {
            console.error("Error creando tarea:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 dark:border-slate-700">
                <div className="p-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-800">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">Nueva Tarea</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
                    {/* Título */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Título</label>
                        <input
                            {...register('title', { required: true })}
                            type="text"
                            placeholder="Ej: Sacar la basura"
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                        />
                    </div>

                    {/* Descripción */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descripción (Opcional)</label>
                        <textarea
                            {...register('description')}
                            rows={2}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none resize-none"
                        />
                    </div>

                    {/* Asignar a */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Asignar a</label>
                        <div className="relative">
                            <UserIcon className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
                            <select
                                {...register('assigned_to_id')}
                                className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none appearance-none"
                            >
                                <option value="">Sin asignar (Cualquiera)</option>
                                {members.map(member => (
                                    <option key={member.id} value={member.id}>
                                        {member.full_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Fecha y Hora */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Fecha</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
                                <input
                                    {...register('due_date', { required: true })}
                                    type="date"
                                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Hora</label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
                                <input
                                    {...register('due_time', { required: true })}
                                    type="time"
                                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Recurrencia */}
                    <div className="p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg border border-gray-100 dark:border-slate-600">
                        <div className="flex items-center gap-2 mb-2">
                            <Repeat className="w-4 h-4 text-primary-500" />
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Recurrencia</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
                                <input type="checkbox" {...register('is_recurring')} className="rounded text-primary-600 focus:ring-primary-500" />
                                Repetir tarea
                            </label>
                            <select {...register('recurrence_pattern')} className="text-sm rounded-md border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 py-1 px-2">
                                <option value="DAILY">Diariamente</option>
                                <option value="WEEKLY">Semanalmente</option>
                                <option value="MONTHLY">Mensualmente</option>
                            </select>
                        </div>
                    </div>

                    {/* Notificaciones */}
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg border border-yellow-100 dark:border-yellow-900/30">
                        <div className="flex items-center gap-2 mb-2">
                            <Bell className="w-4 h-4 text-yellow-600 dark:text-yellow-500" />
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Notificaciones Inteligentes</span>
                        </div>
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
                                <input type="checkbox" {...register('notify_pre_30')} className="rounded text-yellow-600 focus:ring-yellow-500" />
                                Avisar 30 min antes (Preparación)
                            </label>
                            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
                                <input type="checkbox" {...register('notify_pre_15')} className="rounded text-yellow-600 focus:ring-yellow-500" />
                                Avisar 15 min antes (Salida inminente)
                            </label>
                            <div className="h-px bg-yellow-200 dark:bg-yellow-900/30 my-2"></div>
                            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer font-medium">
                                <input type="checkbox" {...register('notify_post')} className="rounded text-yellow-600 focus:ring-yellow-500" />
                                Verificación posterior ("¿Lo hiciste?")
                            </label>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-sm transition-colors disabled:opacity-50"
                        >
                            {isSubmitting ? 'Guardando...' : 'Crear Tarea'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
