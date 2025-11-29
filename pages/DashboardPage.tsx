import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Menu, X, PlusCircle, Moon, Sun, LogOut, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CalendarView from '../components/CalendarView';
import { AIInput } from '../components/AIInput';
import { NotificationManager } from '../components/NotificationManager';
import { useAuth } from '../context/AuthContext';
import { TasksView } from '../components/TasksView';
import { ChatWidget } from '../components/ChatWidget';

export const DashboardPage: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    // Trigger para recargar el calendario si la IA crea eventos
    const [refreshCalendar, setRefreshCalendar] = useState(0);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'calendar' | 'tasks'>('calendar');

    // Estado del Modo Oscuro
    const [darkMode, setDarkMode] = useState(() => {
        // Verificar preferencia guardada o del sistema
        if (typeof window !== 'undefined') {
            return localStorage.getItem('theme') === 'dark' ||
                (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
        }
        return false;
    });

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [darkMode]);

    const handleEventCreated = () => {
        setRefreshCalendar(prev => prev + 1);
    };

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-slate-900 overflow-hidden font-sans text-slate-800 dark:text-slate-200 selection:bg-primary-200 selection:text-primary-900 transition-colors duration-300">

            {/* Overlay Móvil para el Sidebar con desenfoque */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/60 z-20 lg:hidden backdrop-blur-sm transition-opacity duration-300"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Columna Izquierda: Asistente IA (Sidebar) */}
            <aside className={`
        fixed lg:static inset-y-0 left-0 z-30 w-80 lg:w-96 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 flex flex-col shadow-2xl lg:shadow-none transform transition-transform duration-300 ease-cubic-bezier(0.4, 0, 0.2, 1)
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
                {/* Header del Sidebar con Degradado */}
                <div className="p-6 bg-gradient-to-br from-primary-600 to-primary-800 dark:from-primary-800 dark:to-primary-950 text-white shadow-lg relative overflow-hidden transition-colors duration-300">
                    {/* Decoración de fondo */}
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>

                    <div className="flex justify-between items-center lg:hidden mb-4 relative z-10">
                        <span className="text-xs font-bold text-primary-100 uppercase tracking-widest">Menú</span>
                        <button onClick={() => setIsSidebarOpen(false)} className="text-white hover:text-primary-200 transition-colors p-1 rounded-full hover:bg-white/10">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="flex justify-between items-start">
                        <h1 className="text-2xl font-bold flex items-center gap-3 tracking-tight relative z-10">
                            <img
                                src="/pwa-512x512.png"
                                alt="FamilIAgenda Logo"
                                className="w-10 h-10 drop-shadow-lg"
                            />
                            <div>
                                <span className="block text-lg leading-none">Famil<span className="text-primary-200">IA</span>genda</span>
                                <span className="text-[10px] font-medium text-primary-100 uppercase tracking-widest opacity-80">Organización Inteligente</span>
                            </div>
                        </h1>

                        {/* Botón Toggle Dark Mode (Visible en Desktop aquí, o en móvil) */}
                        <button
                            onClick={() => setDarkMode(!darkMode)}
                            className="relative z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                            title={darkMode ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
                        >
                            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                        </button>
                    </div>
                </div>

                {/* Área de Chat / Input IA con el componente dedicado */}
                <div className="p-5 flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-900/50 custom-scrollbar">
                    <AIInput onEventCreated={handleEventCreated} />

                    {/* Sección de sugerencias estáticas mejorada */}
                    <div className="mt-8">
                        <div className="flex items-center justify-between mb-4 px-1">
                            <h3 className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-secondary-500 rounded-full animate-pulse"></span>
                                Sugerencias Rápidas
                            </h3>
                        </div>

                        <div className="space-y-3">
                            {[
                                { text: "Ir al súper mañana 6pm", cat: "leisure" },
                                { text: "Dentista el martes a las 10:00", cat: "health" },
                                { text: "Reunión escolar viernes 9am", cat: "school" }
                            ].map((sug, idx) => (
                                <div
                                    key={idx}
                                    className="group relative overflow-hidden bg-white dark:bg-slate-800 p-3.5 rounded-xl cursor-pointer border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:border-primary-200 dark:hover:border-primary-700"
                                    onClick={() => { }}
                                >
                                    <div className={`absolute left-0 top-0 bottom-0 w-1 transition-all duration-300 
                    ${sug.cat === 'health' ? 'bg-accent-500 group-hover:w-1.5' :
                                            sug.cat === 'leisure' ? 'bg-secondary-500 group-hover:w-1.5' : 'bg-primary-400 group-hover:w-1.5'}`}
                                    />
                                    <div className="flex justify-between items-center pl-2">
                                        <p className="text-xs font-medium text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">"{sug.text}"</p>
                                        <PlusCircle className="w-4 h-4 text-gray-300 dark:text-slate-600 group-hover:text-primary-500 transition-colors opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer del Sidebar */}
                <div className="p-4 border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 transition-colors duration-300">
                    <div className="flex items-center gap-3 p-2.5 rounded-xl border border-transparent hover:border-gray-100 dark:hover:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 transition-all duration-200 group">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-secondary-400 to-secondary-600 flex items-center justify-center text-white font-bold text-sm shadow-md group-hover:shadow-lg transition-shadow">
                            {user?.family_name?.substring(0, 2).toUpperCase() || 'FA'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate">{user?.family_name || 'Familia'}</p>
                            <div className="flex items-center gap-1.5">
                                <span className="inline-block w-2 h-2 rounded-full bg-secondary-500"></span>
                                <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">En línea</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 border-l border-gray-200 dark:border-slate-600 pl-3 ml-1">
                            <NotificationManager />
                            <button
                                onClick={() => navigate('/settings')}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                                title="Configuración"
                            >
                                <Settings size={18} />
                            </button>
                            <button
                                onClick={logout}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                title="Cerrar Sesión"
                            >
                                <LogOut size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Columna Derecha: Calendario Principal */}
            <main className="flex-1 flex flex-col min-w-0 bg-gray-50 dark:bg-slate-900 relative transition-colors duration-300">
                {/* Header Móvil */}
                <header className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-4 py-3 flex items-center justify-between lg:hidden shadow-sm z-10 sticky top-0 transition-colors duration-300">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-2 -ml-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-slate-700 hover:text-primary-600 active:scale-95 transition-all"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                    <span className="font-bold text-gray-800 dark:text-white text-lg">Calendario</span>
                    <div className="flex items-center">
                        <button
                            onClick={() => setDarkMode(!darkMode)}
                            className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                        >
                            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                    </div>
                </header>

                {/* Header Desktop (Selector de Vista) */}
                <div className="hidden lg:flex items-center justify-between px-8 py-4 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                        {viewMode === 'calendar' ? 'Calendario' : 'Tareas y Rutinas'}
                    </h2>
                    <div className="flex items-center bg-gray-100 dark:bg-slate-700 rounded-lg p-1">
                        <button
                            onClick={() => setViewMode('calendar')}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === 'calendar' ? 'bg-white dark:bg-slate-600 text-primary-600 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
                        >
                            Calendario
                        </button>
                        <button
                            onClick={() => setViewMode('tasks')}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === 'tasks' ? 'bg-white dark:bg-slate-600 text-primary-600 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
                        >
                            Tareas
                        </button>
                    </div>
                </div>

                <div className="flex-1 p-3 md:p-6 lg:p-8 overflow-hidden relative">
                    <div className="h-full flex flex-col">
                        {viewMode === 'calendar' ? (
                            <CalendarView refreshTrigger={refreshCalendar} />
                        ) : (
                            <TasksView />
                        )}
                    </div>
                </div>
            </main>

            {/* Widget de Chat Flotante */}
            <ChatWidget />
        </div>
    );
};
