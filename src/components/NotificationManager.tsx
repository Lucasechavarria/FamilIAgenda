import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Loader2, Check } from 'lucide-react';
import { calendarService } from '../services/api';

export const NotificationManager: React.FC = () => {
  const [permissionState, setPermissionState] = useState<NotificationPermission>('default');
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    if ('Notification' in window) {
      setPermissionState(Notification.permission);
    }
  }, []);

  const handleRequestPermission = async () => {
    if (!('Notification' in window)) {
      alert("Tu navegador no soporta notificaciones.");
      return;
    }

    setLoading(true);
    try {
      const permission = await Notification.requestPermission();
      setPermissionState(permission);

      if (permission === 'granted') {
        const mockToken = `mock-device-token-${Math.random().toString(36).substring(7)}`;
        await calendarService.registerNotificationToken(mockToken, "user_clerk_123");
        setRegistered(true);
      }
    } catch (error) {
      console.error("Error solicitando permiso:", error);
    } finally {
      setLoading(false);
    }
  };

  if (permissionState === 'denied') {
    return (
      <div className="group relative">
        <button 
          disabled 
          className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-slate-500 cursor-not-allowed hover:bg-accent-50 dark:hover:bg-red-900/30 hover:text-accent-500 transition-colors"
        >
          <BellOff size={16} />
        </button>
        <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-max px-2 py-1 bg-gray-800 dark:bg-black text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Bloqueadas
        </span>
      </div>
    );
  }

  if (registered || permissionState === 'granted') {
    return (
      <div className="relative group cursor-help">
        <button className="w-8 h-8 flex items-center justify-center rounded-full bg-secondary-50 dark:bg-secondary-900/30 text-secondary-600 dark:text-secondary-400 hover:bg-secondary-100 dark:hover:bg-secondary-900/50 transition-all duration-300">
          <Bell size={16} className="fill-secondary-500/20" />
        </button>
        {/* Indicador de estado activo */}
        <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-secondary-500 rounded-full border-2 border-white dark:border-slate-800 shadow-sm animate-pulse"></span>
        
        <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-max px-2 py-1 bg-gray-900 dark:bg-black text-white text-[10px] font-medium rounded shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50 flex items-center gap-1">
          <Check size={10} className="text-secondary-400" />
          Notificaciones Activas
        </span>
      </div>
    );
  }

  return (
    <div className="relative group">
      <button 
        onClick={handleRequestPermission}
        disabled={loading}
        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-primary-50 dark:hover:bg-primary-900/30 text-gray-400 dark:text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 transition-all duration-300 active:scale-95"
      >
        {loading ? (
          <Loader2 size={16} className="animate-spin text-primary-500" />
        ) : (
          <div className="relative">
            <Bell size={16} />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-accent-500 rounded-full border-2 border-white dark:border-slate-800"></span>
          </div>
        )}
      </button>
      <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-max px-2 py-1 bg-primary-600 text-white text-[10px] font-bold rounded shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50">
        Activar Alertas
      </span>
    </div>
  );
};