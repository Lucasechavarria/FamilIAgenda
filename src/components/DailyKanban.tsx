import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  MoreVertical, 
  Plus, 
  User as UserIcon,
  AlertCircle,
  GripVertical
} from 'lucide-react';
import { taskService } from '../services/api';
import { cn } from '../lib/cn';
import { UXFeedback } from '../lib/UXInteractions';
import { TaskModal } from './TaskModal';
import type { Task, TaskStatus } from '../types';

interface DailyKanbanProps {
  date: Date;
  refreshTrigger?: number;
}

const COLUMNS: { id: TaskStatus; label: string; color: string }[] = [
  { id: 'pending',     label: 'Pendiente',   color: 'text-slate-400' },
  { id: 'in_progress', label: 'En Proceso',  color: 'text-amber-400' },
  { id: 'completed',   label: 'Hecho',       color: 'text-emerald-400' },
];

export const DailyKanban: React.FC<DailyKanbanProps> = ({ date, refreshTrigger }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedTaskId, setDraggedTaskId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [localRefresh, setLocalRefresh] = useState(0);

  useEffect(() => {
    loadTasks();
  }, [date, refreshTrigger, localRefresh]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const dateStr = date.toISOString().split('T')[0];
      const data = await taskService.getTasks(undefined, dateStr);
      setTasks(data);
    } catch (err) {
      console.error("Error loading tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (taskId: number, newStatus: TaskStatus) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task || task.status === newStatus) return;

      // Optimistic Update
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
      UXFeedback.vibrate('light');

      await taskService.updateTask(taskId, { status: newStatus });
      
      if (newStatus === 'completed') {
        UXFeedback.playSound('success');
        import('react-hot-toast').then(({ toast }) => {
          toast.success('¡Tarea completada! +10 XP', {
            icon: '✨',
            style: {
              borderRadius: '10px',
              background: '#333',
              color: '#fff',
            },
          });
        });
      }
    } catch (err) {
      console.error("Error updating task status:", err);
      loadTasks(); // Rollback
    }
  };

  const handleDragStart = (id: number) => {
    setDraggedTaskId(id);
    UXFeedback.vibrate('light');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    if (draggedTaskId !== null) {
      updateTaskStatus(draggedTaskId, status);
      setDraggedTaskId(null);
    }
  };

  if (loading && tasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-8 h-8 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-900/40 backdrop-blur-md rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="p-6 flex items-center justify-between border-b border-white/5 bg-white/5">
        <div>
          <h3 className="text-lg font-display font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-primary-400" />
            Lista del Día
          </h3>
          <p className="text-xs text-slate-400">Progreso de hoy</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="p-2 bg-primary-500/20 hover:bg-primary-500/30 text-primary-400 rounded-xl transition-all"
          title="Nueva Tarea"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto p-4 flex gap-4 scrollbar-hide">
        {COLUMNS.map((col) => (
          <div 
            key={col.id}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, col.id)}
            className="flex-1 min-w-[280px] flex flex-col gap-3"
          >
            <div className="flex items-center justify-between px-2">
              <span className={cn("text-xs font-bold uppercase tracking-widest flex items-center gap-2", col.color)}>
                {col.label}
                <span className="bg-white/5 px-2 py-0.5 rounded-full text-[10px] text-slate-500">
                  {tasks.filter(t => t.status === col.id).length}
                </span>
              </span>
            </div>

            <div className={cn(
                "flex-1 flex flex-col gap-3 p-2 rounded-2xl transition-colors duration-200",
                draggedTaskId !== null ? "bg-white/5 ring-2 ring-dashed ring-white/10" : ""
            )}>
              <AnimatePresence mode="popLayout">
                {tasks
                  .filter((t) => t.status === col.id)
                  .map((task) => (
                    <motion.div
                      key={task.id}
                      layout
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      draggable
                      onDragStart={() => task.id && handleDragStart(task.id)}
                      className={cn(
                        "group p-4 bg-slate-800/80 border border-white/5 rounded-2xl hover:border-primary-500/30 hover:bg-slate-800 transition-all cursor-grab active:cursor-grabbing shadow-sm",
                        draggedTaskId === task.id ? "opacity-40" : ""
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <GripVertical className="w-4 h-4 text-slate-600 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="flex-1 min-w-0">
                          <h4 className={cn(
                            "text-sm font-medium text-slate-200 truncate",
                            task.status === 'completed' && "text-slate-500 line-through"
                          )}>
                            {task.title}
                          </h4>
                          {task.description && (
                            <p className="text-xs text-slate-500 truncate mt-1">
                              {task.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            task.priority === 'high' ? "bg-red-500" : task.priority === 'urgent' ? "bg-red-600 animate-pulse" : "bg-slate-500"
                          )} />
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                            {task.priority}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                           {task.assigned_to ? (
                             <div 
                                className="w-6 h-6 rounded-full bg-primary-500/20 border border-primary-500/30 flex items-center justify-center overflow-hidden"
                                title={task.assigned_to.full_name}
                             >
                               {task.assigned_to.avatar_url ? (
                                 <img src={task.assigned_to.avatar_url} alt="" className="w-full h-full object-cover" />
                               ) : (
                                 <UserIcon className="w-3 h-3 text-primary-400" />
                               )}
                             </div>
                           ) : (
                             <div className="w-6 h-6 rounded-full border border-dashed border-white/10 flex items-center justify-center">
                               <UserIcon className="w-3 h-3 text-slate-600" />
                             </div>
                           )}
                           <button className="p-1 hover:bg-white/10 rounded-lg text-slate-600 hover:text-slate-400 transition-colors">
                              <MoreVertical className="w-4 h-4" />
                           </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
              </AnimatePresence>
              
              {tasks.filter(t => t.status === col.id).length === 0 && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex-1 flex flex-col items-center justify-center p-8 bg-white/[0.02] border border-dashed border-white/5 rounded-2xl min-h-[120px] group/empty"
                >
                   <div className="w-10 h-10 rounded-full bg-slate-800/50 flex items-center justify-center mb-3 group-hover/empty:scale-110 transition-transform duration-500">
                     <CheckCircle2 className="w-5 h-5 text-slate-700 font-bold" />
                   </div>
                   <p className="text-[10px] text-slate-500 font-bold text-center uppercase tracking-widest opacity-60">Lista limpia</p>
                   <p className="text-[9px] text-slate-600 text-center mt-1">¡Buen trabajo!</p>
                </motion.div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <TaskModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onTaskCreated={() => {
          setLocalRefresh(prev => prev + 1);
          UXFeedback.playSound('success');
        }}
      />
    </div>
  );
};
