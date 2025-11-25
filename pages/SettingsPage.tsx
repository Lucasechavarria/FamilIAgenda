import { useState, useEffect } from 'react';
import { Calendar, Check, AlertCircle, ArrowLeft } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../services/auth';

export default function SettingsPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [googleStatus, setGoogleStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

    useEffect(() => {
        const authStatus = searchParams.get('google_auth');
        if (authStatus === 'success') {
            setGoogleStatus('success');
            // Limpiar URL
            window.history.replaceState({}, '', '/settings');
        }
    }, [searchParams]);

    const handleGoogleConnect = async () => {
        try {
            setGoogleStatus('loading');
            const response = await authService.api.get('/integrations/google/auth');
            // Redirigir a la URL de autorización de Google
            window.location.href = response.data.auth_url;
        } catch (error) {
            console.error('Error iniciando auth Google:', error);
            setGoogleStatus('error');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-6 transition-colors duration-300">
            <div className="max-w-4xl mx-auto">
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 mb-6 transition-colors"
                >
                    <ArrowLeft size={20} />
                    Volver al Calendario
                </button>

                <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-8">Configuración</h1>

                <div className="grid gap-6">
                    {/* Sección Integraciones */}
                    <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-700">
                        <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-primary-500" />
                            Integraciones
                        </h2>

                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl border border-gray-100 dark:border-slate-600">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm p-2">
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg" alt="Google Calendar" className="w-full h-full" />
                                </div>
                                <div>
                                    <h3 className="font-medium text-slate-900 dark:text-white">Google Calendar</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Sincroniza tus eventos automáticamente</p>
                                </div>
                            </div>

                            {googleStatus === 'success' ? (
                                <div className="flex items-center gap-2 text-green-500 font-medium bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-lg">
                                    <Check size={18} />
                                    Conectado
                                </div>
                            ) : (
                                <button
                                    onClick={handleGoogleConnect}
                                    disabled={googleStatus === 'loading'}
                                    className="px-4 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors font-medium disabled:opacity-50"
                                >
                                    {googleStatus === 'loading' ? 'Conectando...' : 'Conectar'}
                                </button>
                            )}
                        </div>

                        {googleStatus === 'error' && (
                            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg flex items-center gap-2 text-sm">
                                <AlertCircle size={16} />
                                Error al conectar. Intenta nuevamente.
                            </div>
                        )}
                    </section>

                    {/* Otras secciones futuras */}
                    <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-700 opacity-50 pointer-events-none">
                        <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">Notificaciones (Próximamente)</h2>
                        <p className="text-slate-500">Configuración de alertas y recordatorios.</p>
                    </section>
                </div>
            </div>
        </div>
    );
}
