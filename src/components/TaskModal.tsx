import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Bell, Repeat, User as UserIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { taskService, calendarService } from '../services/api';
import { cn } from '../lib/cn';
import type { FamilyMember, TaskFormData, RecurrencePatternKey } from '../types';

// ------------------------------------------------------------------
// Tipos
// ------------------------------------------------------------------
interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated: () => void;
}

// ------------------------------------------------------------------
// Componente
// ------------------------------------------------------------------
export const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, onTaskCreated }) => {
  const { register, handleSubmit, reset } = useForm<TaskFormData>({
    defaultValues: {
      recurrence_pattern: 'WEEKLY' as RecurrencePatternKey,
    },
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [members, setMembers]           = useState<FamilyMember[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadMembers();
    }
  }, [isOpen]);

  const loadMembers = async (): Promise<void> => {
    try {
      const data = await calendarService.getFamilyMembers();
      setMembers(data);
    } catch (error) {
      console.error('Error cargando miembros:', error);
    }
  };

  if (!isOpen) return null;

  const onSubmit = async (data: TaskFormData): Promise<void> => {
    setIsSubmitting(true);
    try {
      const dueDateTime = new Date(`${data.due_date}T${data.due_time}`);

      const preNotifications: number[] = [];
      if (data.notify_pre_30) preNotifications.push(30);
      if (data.notify_pre_15) preNotifications.push(15);

      const notificationConfig = JSON.stringify({
        pre: preNotifications,
        post: data.notify_post,
      });

      await taskService.createTask({
        title:               data.title,
        description:         data.description,
        due_date:            dueDateTime.toISOString(),
        assigned_to_id:      data.assigned_to_id ? parseInt(data.assigned_to_id, 10) : null,
        is_recurring:        data.is_recurring,
        recurrence_pattern:  data.is_recurring ? data.recurrence_pattern : null,
        notification_config: notificationConfig,
      });

      reset();
      onTaskCreated();
      onClose();
    } catch (error) {
      console.error('Error creando tarea:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Clases compartidas para inputs del formulario
  const inputCls = cn(
    'w-full px-3 py-2 rounded-lg border',
    'border-gray-300 dark:border-slate-600',
    'bg-white dark:bg-slate-700',
    'text-slate-900 dark:text-white',
    'focus:ring-2 focus:ring-primary-500 outline-none'
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200"
    >
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 dark:border-slate-700">

        {/* Header */}
        <div className="p-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-800">
          <h3 id="task-modal-title" className="text-lg font-bold text-slate-800 dark:text-white">
            Nueva Tarea
          </h3>
          <button
            id="task-modal-close"
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal de tarea"
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="p-6 space-y-4">

          {/* Título */}
          <div>
            <label
              htmlFor="task-title"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
              Título
            </label>
            <input
              id="task-title"
              {...register('title', { required: true })}
              type="text"
              placeholder="Ej: Sacar la basura"
              aria-required="true"
              className={inputCls}
            />
          </div>

          {/* Descripción */}
          <div>
            <label
              htmlFor="task-description"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
              Descripción <span className="text-slate-400 font-normal">(Opcional)</span>
            </label>
            <textarea
              id="task-description"
              {...register('description')}
              rows={2}
              className={cn(inputCls, 'resize-none')}
            />
          </div>

          {/* Asignar a */}
          <div>
            <label
              htmlFor="task-assigned-to"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
              Asignar a
            </label>
            <div className="relative">
              <UserIcon
                className="absolute left-3 top-2.5 text-slate-400 w-4 h-4"
                aria-hidden="true"
              />
              <select
                id="task-assigned-to"
                {...register('assigned_to_id')}
                className={cn(inputCls, 'pl-9 appearance-none')}
              >
                <option value="">Sin asignar (Cualquiera)</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.full_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Fecha y Hora */}
          <div className="grid grid-cols-2 gap-4">
            {/* Fecha */}
            <div>
              <label
                htmlFor="task-due-date"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                Fecha
              </label>
              <div className="relative">
                <Calendar
                  className="absolute left-3 top-2.5 text-slate-400 w-4 h-4"
                  aria-hidden="true"
                />
                <input
                  id="task-due-date"
                  {...register('due_date', { required: true })}
                  type="date"
                  aria-required="true"
                  className={cn(inputCls, 'pl-9')}
                />
              </div>
            </div>

            {/* Hora */}
            <div>
              <label
                htmlFor="task-due-time"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                Hora
              </label>
              <div className="relative">
                <Clock
                  className="absolute left-3 top-2.5 text-slate-400 w-4 h-4"
                  aria-hidden="true"
                />
                <input
                  id="task-due-time"
                  {...register('due_time', { required: true })}
                  type="time"
                  aria-required="true"
                  className={cn(inputCls, 'pl-9')}
                />
              </div>
            </div>
          </div>

          {/* Recurrencia */}
          <fieldset className="p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg border border-gray-100 dark:border-slate-600">
            <legend className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              <Repeat className="w-4 h-4 text-primary-500" aria-hidden="true" />
              Recurrencia
            </legend>
            <div className="flex items-center gap-4">
              <label
                htmlFor="task-is-recurring"
                className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer"
              >
                <input
                  id="task-is-recurring"
                  type="checkbox"
                  {...register('is_recurring')}
                  className="rounded text-primary-600 focus:ring-primary-500"
                />
                Repetir tarea
              </label>
              <label htmlFor="task-recurrence-pattern" className="sr-only">
                Patrón de recurrencia
              </label>
              <select
                id="task-recurrence-pattern"
                {...register('recurrence_pattern')}
                className="text-sm rounded-md border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 py-1 px-2"
              >
                <option value="DAILY">Diariamente</option>
                <option value="WEEKLY">Semanalmente</option>
                <option value="MONTHLY">Mensualmente</option>
              </select>
            </div>
          </fieldset>

          {/* Notificaciones */}
          <fieldset className="p-3 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg border border-yellow-100 dark:border-yellow-900/30">
            <legend className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              <Bell className="w-4 h-4 text-yellow-600 dark:text-yellow-500" aria-hidden="true" />
              Notificaciones Inteligentes
            </legend>
            <div className="space-y-2">
              <label
                htmlFor="task-notify-pre-30"
                className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer"
              >
                <input
                  id="task-notify-pre-30"
                  type="checkbox"
                  {...register('notify_pre_30')}
                  className="rounded text-yellow-600 focus:ring-yellow-500"
                />
                Avisar 30 min antes (Preparación)
              </label>
              <label
                htmlFor="task-notify-pre-15"
                className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer"
              >
                <input
                  id="task-notify-pre-15"
                  type="checkbox"
                  {...register('notify_pre_15')}
                  className="rounded text-yellow-600 focus:ring-yellow-500"
                />
                Avisar 15 min antes (Salida inminente)
              </label>
              <div className="h-px bg-yellow-200 dark:bg-yellow-900/30 my-2" aria-hidden="true" />
              <label
                htmlFor="task-notify-post"
                className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer font-medium"
              >
                <input
                  id="task-notify-post"
                  type="checkbox"
                  {...register('notify_post')}
                  className="rounded text-yellow-600 focus:ring-yellow-500"
                />
                Verificación posterior («¿Lo hiciste?»)
              </label>
            </div>
          </fieldset>

          {/* Botones de acción */}
          <div className="pt-4 flex justify-end gap-3">
            <button
              id="task-modal-cancel"
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              id="task-modal-submit"
              type="submit"
              disabled={isSubmitting}
              aria-disabled={isSubmitting}
              aria-busy={isSubmitting}
              className={cn(
                'px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg shadow-sm transition-colors',
                isSubmitting
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-primary-700'
              )}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span
                    role="status"
                    aria-label="Guardando tarea..."
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
                  />
                  <span className="sr-only">Guardando...</span>
                  Guardando...
                </span>
              ) : (
                'Crear Tarea'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
