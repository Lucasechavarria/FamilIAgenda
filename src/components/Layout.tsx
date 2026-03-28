import React, { ReactNode, useState, useId, useEffect } from 'react';
import { Calendar, Users, MessageSquare, Menu, Bell, Search } from 'lucide-react';
import { GlobalSearch } from './GlobalSearch';
import { cn } from '../lib/cn';

// ------------------------------------------------------------------
// Tipos
// ------------------------------------------------------------------
type TabId = 'calendar' | 'analysis' | 'family';

interface MenuItem {
  id: TabId;
  label: string;
  icon: React.ElementType;
}

interface LayoutProps {
  children: ReactNode;
  activeTab: TabId | string;
  setActiveTab: (tab: TabId) => void;
}

// ------------------------------------------------------------------
// Constantes
// ------------------------------------------------------------------
const MENU_ITEMS: MenuItem[] = [
  { id: 'calendar', label: 'Calendario',  icon: Calendar     },
  { id: 'analysis', label: 'Asistente IA', icon: MessageSquare },
  { id: 'family',   label: 'Mi Familia',  icon: Users        },
];

// ------------------------------------------------------------------
// Componente
// ------------------------------------------------------------------
export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen]   = useState(false);
  const sidebarId = useId();

  const activeLabel = MENU_ITEMS.find((m) => m.id === activeTab)?.label ?? '';

  const closeSidebar = () => setIsSidebarOpen(false);
  const openSidebar  = () => setIsSidebarOpen(true);

  // --- Lógica de Búsqueda (Ctrl+K) ---
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(p => !p);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  return (
    <div className="flex h-screen bg-background overflow-hidden text-slate-300">

      {/* Overlay para móvil */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden backdrop-blur-sm"
          aria-hidden="true"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        id={`sidebar-${sidebarId}`}
        aria-label="Menú de navegación principal"
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-30 w-64',
          'glass-panel border-r border-white/10',
          'transform transition-transform duration-300 ease-in-out m-0 rounded-none',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="h-full flex flex-col">

          {/* Logo */}
          <div className="p-6 border-b border-white/10">
            <h1 className="text-xl font-display font-bold bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent flex items-center gap-2">
              <Calendar className="w-6 h-6 text-primary-400" aria-hidden="true" />
              FamilIAgenda
            </h1>
          </div>

          {/* Navegación principal */}
          <nav
            id="sidebar-nav"
            aria-label="Secciones de la aplicación"
            className="flex-1 p-4 space-y-1"
          >
            {MENU_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-item-${item.id}`}
                  type="button"
                  onClick={() => {
                    setActiveTab(item.id);
                    closeSidebar();
                  }}
                  aria-current={isActive ? 'page' : undefined}
                  aria-label={item.label}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300',
                    isActive
                      ? 'bg-primary-500/20 text-primary-300 border-r-2 border-primary-500 shadow-neon-blue'
                      : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                  )}
                >
                  <Icon
                    className={cn(
                      'w-5 h-5',
                      isActive ? 'text-primary-400' : 'text-slate-500'
                    )}
                    aria-hidden="true"
                  />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Footer del sidebar */}
          <div className="p-4 border-t border-white/10">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
              <div
                aria-hidden="true"
                className="w-8 h-8 rounded-full bg-gradient-to-br from-secondary-500 to-primary-500 flex items-center justify-center text-white font-bold shadow-lg"
              >
                F
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-200 truncate">Familia Pérez</p>
                <p className="text-xs text-slate-500 truncate">Plan Premium</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">

        {/* Header móvil */}
        <header className="glass-panel border-b border-white/10 px-4 py-3 flex items-center justify-between lg:hidden m-0 rounded-none">
          <button
            id="sidebar-toggle"
            type="button"
            onClick={openSidebar}
            aria-label="Abrir menú de navegación"
            aria-expanded={isSidebarOpen}
            aria-controls={`sidebar-${sidebarId}`}
            className="p-2 rounded-md text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <Menu className="w-6 h-6" aria-hidden="true" />
          </button>

          <span className="font-display font-semibold text-slate-200" aria-live="polite">
            {activeLabel}
          </span>

          <div className="flex items-center gap-2">
            <button
              id="search-toggle"
              type="button"
              onClick={() => setIsSearchOpen(true)}
              aria-label="Abrir búsqueda global"
              className="p-2 rounded-md text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
            >
              <Search className="w-6 h-6" aria-hidden="true" />
            </button>
            <button
                id="notifications-toggle"
                type="button"
                aria-label="Ver notificaciones"
                className="p-2 rounded-md text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
            >
                <Bell className="w-6 h-6" aria-hidden="true" />
            </button>
          </div>
        </header>

        {/* Área de contenido */}
        <main
          id="main-content"
          className="flex-1 overflow-y-auto p-2 md:p-4 lg:p-6 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent"
          aria-label={`Sección: ${activeLabel}`}
        >
          <div className="h-full max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Modal de Búsqueda Global */}
      <GlobalSearch 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)}
        onNavigate={(view) => {
           if (view === 'calendar') setActiveTab('calendar');
           else if (view === 'tasks') setActiveTab('calendar'); // Redirigir a la pestaña que manejas en Layout
           else if (view === 'metrics') setActiveTab('analysis'); 
        }}
      />
    </div>
  );
};