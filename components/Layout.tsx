import React, { ReactNode, useState } from 'react';
import { Calendar, Users, MessageSquare, Menu, X, Bell } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const menuItems = [
    { id: 'calendar', label: 'Calendario', icon: Calendar },
    { id: 'analysis', label: 'Asistente IA', icon: MessageSquare },
    { id: 'family', label: 'Mi Familia', icon: Users },
  ];

  return (
    <div className="flex h-screen bg-background overflow-hidden text-slate-300">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30 w-64 glass-panel border-r border-white/10 transform transition-transform duration-300 ease-in-out m-0 rounded-none
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-white/10">
            <h1 className="text-xl font-display font-bold bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent flex items-center gap-2">
              <Calendar className="w-6 h-6 text-primary-400" />
              FamilIAgenda
            </h1>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsSidebarOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300
                    ${isActive
                      ? 'bg-primary-500/20 text-primary-300 border-r-2 border-primary-500 shadow-neon-blue'
                      : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}
                  `}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-primary-400' : 'text-slate-500'}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="p-4 border-t border-white/10">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-secondary-500 to-primary-500 flex items-center justify-center text-white font-bold shadow-lg">
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Top Header */}
        <header className="glass-panel border-b border-white/10 px-4 py-3 flex items-center justify-between lg:hidden m-0 rounded-none">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 rounded-md text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          <span className="font-display font-semibold text-slate-200">
            {menuItems.find(m => m.id === activeTab)?.label}
          </span>
          <button className="p-2 rounded-md text-slate-400 hover:bg-white/10 hover:text-white transition-colors">
            <Bell className="w-6 h-6" />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-2 md:p-4 lg:p-6 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          <div className="h-full max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};