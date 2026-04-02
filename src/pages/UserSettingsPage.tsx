import React, { useState, useEffect } from 'react';
import { User, Palette, Save, ArrowLeft, Calendar as CalendarIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ColorPicker } from '../components/ColorPicker';
import { api } from '../services/auth';

export const UserSettingsPage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [userColor, setUserColor] = useState('#3B82F6'); 
    const [kanbanLayout, setKanbanLayout] = useState<'sidebar' | 'top'>('sidebar');
    const [appTheme, setAppTheme] = useState('space');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        loadUserSettings();
    }, []);

    const loadUserSettings = async () => {
        try {
            const response = await api.get('/api/auth/me');
            if (response.data.color) {
                setUserColor(response.data.color);
            }
            if (response.data.kanban_layout) {
                setKanbanLayout(response.data.kanban_layout);
            }
            if (response.data.theme) {
                setAppTheme(response.data.theme);
            }
        } catch (error) {
            console.error('Error cargando configuración:', error);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        setSuccess(false);

        try {
            await api.patch('/api/auth/me', {
                color: userColor,
                kanban_layout: kanbanLayout,
                theme: appTheme
            });
            
            // Forzar actualización suave en el contexto si es necesario, 
            // aunque el useEffect en AuthContext ya debería detectarlo si refrescamos usuario
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (error) {
            console.error('Error guardando configuración:', error);
        } finally {
            setLoading(false);
        }
    };

    const themes = [
        { id: 'space', name: 'Espacio (Original)', colors: ['#06b6d4', '#8b5cf6'], desc: 'Profundo y tecnológico' },
        { id: 'ocean', name: 'Océano', colors: ['#0a9396', '#94d2bd'], desc: 'Calma y frescura' },
        { id: 'sunset', name: 'Atardecer', colors: ['#f43f5e', '#fbbf24'], desc: 'Cálido y vibrante' },
    ];

    return (
        <div className="min-h-screen bg-background p-4 md:p-8 transition-colors duration-500">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => navigate('/')}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6 text-slate-300" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-display font-bold text-slate-200">
                            Configuración de Usuario
                        </h1>
                        <p className="text-slate-400 mt-1">
                            Personaliza tu experiencia en FamilIAgenda
                        </p>
                    </div>
                </div>

                {/* Información del Usuario y Gamificación */}
                <div className="glass-panel p-6 mb-6">
                    <div className="flex items-center gap-4 mb-4">
                        <div
                            className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg border-4 border-white/10"
                            style={{ backgroundColor: userColor }}
                        >
                            {user?.name?.substring(0, 2).toUpperCase() || 'US'}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-200">{user?.name || 'Usuario'}</h2>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="px-3 py-0.5 bg-primary-500/20 text-primary-400 rounded-full text-xs font-bold border border-primary-500/30">
                                    Nivel {user?.level || 1}
                                </span>
                                <span className="text-xs font-medium text-slate-400 italic">
                                    "{user?.level_name || 'Aprendiz del Orden'}"
                                </span>
                            </div>
                            <div className="w-48 h-1.5 bg-white/10 rounded-full mt-3 overflow-hidden">
                                <div 
                                    className="h-full bg-primary-500 transition-all duration-1000" 
                                    style={{ width: `${(user?.points || 0) % 100}%` }}
                                />
                            </div>
                            <p className="text-[10px] text-slate-500 mt-1 font-mono">
                                {(user?.points || 0) % 100} / 100 XP para el próximo nivel
                            </p>
                        </div>
                    </div>
                </div>

                {/* Tema Visual */}
                <div className="glass-panel p-6 mb-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-accent-500/20 rounded-xl">
                            <Palette className="w-6 h-6 text-accent-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-200">Tema Visual</h3>
                            <p className="text-sm text-slate-400">
                                Cambia la atmósfera completa de tu aplicación
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {themes.map((t) => (
                            <button
                                key={t.id}
                                onClick={() => setAppTheme(t.id)}
                                className={`p-4 rounded-2xl border-2 transition-all text-left relative overflow-hidden group ${appTheme === t.id ? 'border-primary-500 bg-primary-500/10' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
                            >
                                <div className="flex gap-1 mb-3">
                                    {t.colors.map(c => (
                                        <div key={c} className="w-4 h-4 rounded-full" style={{ backgroundColor: c }} />
                                    ))}
                                </div>
                                <span className="block text-sm font-bold text-slate-200">{t.name}</span>
                                <span className="block text-[10px] text-slate-500">{t.desc}</span>
                                
                                {appTheme === t.id && (
                                    <div className="absolute top-2 right-2 w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Color Personal */}
                <div className="glass-panel p-6 mb-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-primary-500/20 rounded-xl">
                            <Palette className="w-6 h-6 text-primary-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-200">Color Personal</h3>
                            <p className="text-sm text-slate-400">
                                Este color identificará tus tareas en el calendario familiar
                            </p>
                        </div>
                    </div>

                    <ColorPicker
                        selectedColor={userColor}
                        onSelectColor={setUserColor}
                    />

                    {/* Vista Previa */}
                    <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10">
                        <p className="text-sm font-medium text-slate-300 mb-3">Vista Previa:</p>
                        <div className="space-y-2">
                            <div
                                className="p-3 rounded-lg text-white font-medium shadow-lg"
                                style={{ backgroundColor: userColor }}
                            >
                                Evento de ejemplo
                            </div>
                            <div
                                className="p-3 rounded-lg border-l-4 bg-white/5"
                                style={{ borderLeftColor: userColor }}
                            >
                                <p className="text-sm text-slate-200">Tarea asignada a ti</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Preferencias de Layout */}
                <div className="glass-panel p-6 mb-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-secondary-500/20 rounded-xl">
                            <CalendarIcon className="w-6 h-6 text-secondary-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-200">Diseño del Kanban</h3>
                            <p className="text-sm text-slate-400">
                                Elige dónde quieres visualizar tu lista de tareas diaria
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => setKanbanLayout('sidebar')}
                            className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${kanbanLayout === 'sidebar' ? 'border-primary-500 bg-primary-500/10' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
                        >
                            <div className="w-full aspect-video bg-slate-700 rounded-lg flex gap-1 p-1">
                                <div className="flex-[3] bg-slate-600 rounded" />
                                <div className="flex-1 bg-primary-500/50 rounded" />
                            </div>
                            <span className="text-sm font-bold text-slate-200">Barra Lateral</span>
                        </button>

                        <button
                            onClick={() => setKanbanLayout('top')}
                            className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${kanbanLayout === 'top' ? 'border-primary-500 bg-primary-500/10' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
                        >
                            <div className="w-full aspect-video bg-slate-700 rounded-lg flex flex-col gap-1 p-1">
                                <div className="flex-1 bg-primary-500/50 rounded" />
                                <div className="flex-[3] bg-slate-600 rounded" />
                            </div>
                            <span className="text-sm font-bold text-slate-200">Sección Superior</span>
                        </button>
                    </div>
                </div>

                {/* Botones de Acción */}
                <div className="flex gap-4">
                    <button
                        onClick={() => navigate('/')}
                        className="btn-secondary flex-1"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="btn-primary flex-1 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                Guardar Cambios
                            </>
                        )}
                    </button>
                </div>

                {/* Mensaje de Éxito */}
                {success && (
                    <div className="mt-4 p-4 bg-green-500/20 border border-green-500/50 rounded-xl text-green-400 text-center animate-in fade-in slide-in-from-bottom-4">
                        ✓ Configuración guardada exitosamente
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserSettingsPage;
