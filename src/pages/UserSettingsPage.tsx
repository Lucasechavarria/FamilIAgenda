import React, { useState, useEffect } from 'react';
import { User, Palette, Save, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ColorPicker } from '../components/ColorPicker';
import { api } from '../services/auth';

export const UserSettingsPage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [userColor, setUserColor] = useState('#3B82F6'); // Azul por defecto
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
        } catch (error) {
            console.error('Error cargando configuración:', error);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        setSuccess(false);

        try {
            await api.patch('/api/auth/me', {
                color: userColor
            });
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (error) {
            console.error('Error guardando configuración:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background p-4 md:p-8">
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

                {/* Información del Usuario */}
                <div className="glass-panel p-6 mb-6">
                    <div className="flex items-center gap-4 mb-4">
                        <div
                            className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg"
                            style={{ backgroundColor: userColor }}
                        >
                            {user?.family_name?.substring(0, 2).toUpperCase() || 'US'}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-200">{user?.family_name || 'Usuario'}</h2>
                            <p className="text-sm text-slate-400">{user?.email || 'email@ejemplo.com'}</p>
                        </div>
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
