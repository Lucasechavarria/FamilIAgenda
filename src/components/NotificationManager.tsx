import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Loader2, Check } from 'lucide-react';
import { calendarService } from '../services/api';

// VAPID Public Key (Generado por Firebase o web-push)
// Este es un placeholder, en producción se usaría una variable de entorno.
const VAPID_PUBLIC_KEY = 'BMq7iL9R3YVfXk9... (Aquí va la clave Real)';

/**
 * Convierte una clave VAPID Base64 a Uint8Array (requerido por el navegador)
 */
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const NotificationManager: React.FC = () => {
  const [permissionState, setPermissionState] = useState<NotificationPermission>('default');
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    if ('Notification' in window) {
      setPermissionState(Notification.permission);
      
      // Verificar si ya tenemos un token registrado
      const hasToken = localStorage.getItem('push_token_registered');
      if (hasToken && Notification.permission === 'granted') {
          setRegistered(true);
      }
    }
  }, []);

  const handleRequestPermission = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert("Tu navegador no soporta notificaciones push reales.");
      return;
    }

    setLoading(true);
    try {
      // 1. Solicitar permiso
      const permission = await Notification.requestPermission();
      setPermissionState(permission);

      if (permission === 'granted') {
        // 2. Obtener o registrar el Service Worker
        const registration = await navigator.serviceWorker.ready;
        
        // 3. Suscribirse al Push Manager
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        });

        // 4. Enviar suscripción al backend (usamos el endpoint como token único)
        const subscriptionJson = JSON.stringify(subscription);
        await calendarService.registerNotificationToken(subscriptionJson, "browser_web_push");
        
        localStorage.setItem('push_token_registered', 'true');
        setRegistered(true);
      }
    } catch (error) {
      console.error("Error activando notificaciones reales:", error);
      alert("No se pudo activar las notificaciones. Verifica tu conexión o configuración.");
    } finally {
      setLoading(false);
    }
  };

  if (permissionState === 'denied') {
    return (
      <div className="group relative">
        <button 
          disabled 
          className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-slate-500 cursor-not-allowed transition-colors"
        >
          <BellOff size={16} />
        </button>
        <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-max px-2 py-1 bg-gray-800 dark:bg-black text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
          Notificaciones Bloqueadas
        </span>
      </div>
    );
  }

  if (registered || (permissionState === 'granted' && localStorage.getItem('push_token_registered'))) {
    return (
      <div className="relative group cursor-help">
        <button className="w-8 h-8 flex items-center justify-center rounded-full bg-secondary-50 dark:bg-secondary-900/30 text-secondary-600 dark:text-secondary-400 hover:bg-secondary-100 dark:hover:bg-secondary-900/50 transition-all duration-300">
          <Bell size={16} className="fill-secondary-500/20" />
        </button>
        <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-secondary-500 rounded-full border-2 border-white dark:border-slate-800 shadow-sm animate-pulse"></span>
        
        <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-max px-2 py-1 bg-gray-900 dark:bg-black text-white text-[10px] font-medium rounded shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50 flex items-center gap-1">
          <Check size={10} className="text-secondary-400" />
          Alertas Activas
        </span>
      </div>
    );
  }

  return (
    <div className="relative group">
      <button 
        onClick={handleRequestPermission}
        disabled={loading}
        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-primary-50 dark:hover:bg-primary-900/30 text-gray-400 dark:text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 transition-all duration-300"
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
        Activar Alertas PWA
      </span>
    </div>
  );
};