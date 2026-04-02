import React from 'react';
import { Check, X, Calendar, Clock, Trash2, Edit3, PlusCircle } from 'lucide-react';
import { cn } from '../lib/cn';

export interface AuraAction {
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'QUERY';
  id?: number;
  title?: string;
  start_time?: string;
  end_time?: string;
  category?: string;
  changes?: any;
  answer?: string;
}

interface AuraActionCardProps {
  action: AuraAction;
  onConfirm: () => void;
  onCancel: () => void;
  isProcessing?: boolean;
}

export const AuraActionCard: React.FC<AuraActionCardProps> = ({ 
  action, 
  onConfirm, 
  onCancel,
  isProcessing 
}) => {
  if (action.action === 'QUERY') {
    return (
      <div className="bg-primary-500/10 border border-primary-500/20 rounded-2xl p-4 mb-4 animate-in slide-in-from-bottom-2">
        <p className="text-slate-700 dark:text-slate-300 italic">"{action.answer}"</p>
      </div>
    );
  }

  const getIcon = () => {
    switch (action.action) {
      case 'CREATE': return <PlusCircle className="text-emerald-500" />;
      case 'UPDATE': return <Edit3 className="text-blue-500" />;
      case 'DELETE': return <Trash2 className="text-rose-500" />;
      default: return null;
    }
  };

  const getTitle = () => {
    switch (action.action) {
      case 'CREATE': return 'Nuevo Evento';
      case 'UPDATE': return 'Modificar Evento';
      case 'DELETE': return '¿Eliminar Evento?';
      default: return '';
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl shadow-lg p-5 mb-4 animate-in zoom-in-95 duration-200">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-gray-50 dark:bg-slate-700 rounded-xl">
          {getIcon()}
        </div>
        <div>
          <h4 className="font-bold text-slate-800 dark:text-white">{getTitle()}</h4>
          <p className="text-xs text-slate-400">Propuesta de Aura</p>
        </div>
      </div>

      <div className="space-y-3 mb-6">
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <Calendar className="w-4 h-4" />
          <span>{action.title || 'Evento sin título'}</span>
        </div>
        
        {(action.start_time || action.changes?.start_time) && (
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <Clock className="w-4 h-4" />
            <span>
              {new Date(action.start_time || action.changes?.start_time).toLocaleString('es-ES', {
                hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short'
              })}
            </span>
          </div>
        )}

        {action.action === 'UPDATE' && action.changes && (
          <div className="mt-2 p-2 bg-blue-500/5 rounded-lg border border-blue-500/10">
            <p className="text-xs font-semibold text-blue-500 mb-1 uppercase tracking-wider">Cambios:</p>
            {Object.entries(action.changes).map(([key, value]) => (
              <p key={key} className="text-xs text-slate-500">
                <span className="capitalize">{key.replace('_', ' ')}</span>: {String(value)}
              </p>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <button
          onClick={onCancel}
          disabled={isProcessing}
          className="flex-1 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={onConfirm}
          disabled={isProcessing}
          className={cn(
            "flex-1 px-4 py-2 text-sm font-medium text-white rounded-xl transition-all shadow-sm flex items-center justify-center gap-2",
            action.action === 'DELETE' ? "bg-rose-500 hover:bg-rose-600" : "bg-primary-500 hover:bg-primary-600"
          )}
        >
          {isProcessing ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Check className="w-4 h-4" />
              Confirmar
            </>
          )}
        </button>
      </div>
    </div>
  );
};
