import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, CheckCircle, Clock, Users, Calendar, Target, FileDown } from 'lucide-react';
import { api } from '../services/auth';
import { useAuth } from '../context/AuthContext';
import { generateWeeklyReport } from '../lib/pdfReport';
import { AIOptimizationResponse } from '../types';
import { UXFeedback } from '../lib/UXInteractions';

interface MetricsData {
    totalEvents: number;
    completedEvents: number;
    pendingEvents: number;
    eventsThisWeek: number;
    eventsThisMonth: number;
    categoryBreakdown: { [key: string]: number };
    memberStats: Array<{
        user_id: number;
        user_name: string;
        assigned_count: number;
        completed_count: number;
        completion_rate: number;
        points: number;
        level: number;
        level_name: string;
    }>;
}

interface MetricsDashboardProps {
    aiOptimization?: AIOptimizationResponse | null;
}

export const MetricsDashboard: React.FC<MetricsDashboardProps> = ({ aiOptimization }) => {
    const { user } = useAuth();
    const [metrics, setMetrics] = useState<MetricsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isExporting, setIsExporting] = useState(false);
    const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('month');

    const handleExportPDF = async () => {
        if (!metrics) return;
        setIsExporting(true);
        UXFeedback.playSound('click');
        try {
            await generateWeeklyReport(
                metrics, 
                user?.family_name || 'Mi Familia', 
                timeRange,
                aiOptimization
            );
            UXFeedback.playSound('success');
            UXFeedback.vibrate('success');
        } catch (error) {
            console.error('Error exportando PDF:', error);
        } finally {
            setIsExporting(false);
        }
    };

    useEffect(() => {
        loadMetrics();
    }, [timeRange]);

    const loadMetrics = async () => {
        try {
            const response = await api.get(`/api/events/metrics?range=${timeRange}`);
            setMetrics(response.data);
        } catch (error) {
            console.error('Error cargando métricas:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
            </div>
        );
    }

    if (!metrics) {
        return (
            <div className="text-center p-8 text-slate-400">
                No hay datos disponibles
            </div>
        );
    }

    const completionRate = metrics.totalEvents > 0
        ? Math.round((metrics.completedEvents / metrics.totalEvents) * 100)
        : 0;

    const categories = [
        { key: 'work', label: 'Trabajo', color: 'bg-blue-500' },
        { key: 'personal', label: 'Personal', color: 'bg-green-500' },
        { key: 'family', label: 'Familia', color: 'bg-purple-500' },
        { key: 'health', label: 'Salud', color: 'bg-red-500' },
        { key: 'leisure', label: 'Ocio', color: 'bg-yellow-500' },
        { key: 'school', label: 'Escuela', color: 'bg-indigo-500' },
    ];

    return (
        <div className="space-y-6">
            {/* Header con selector de rango */}
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-display font-bold text-slate-200 flex items-center gap-2">
                    <BarChart3 className="w-6 h-6 text-primary-400" />
                    Métricas y Estadísticas
                </h2>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleExportPDF}
                        disabled={isExporting}
                        className="flex items-center gap-2 px-4 py-2 bg-secondary-500 hover:bg-secondary-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-secondary-500/20 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
                    >
                        {isExporting ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <FileDown className="w-4 h-4" />
                        )}
                        Exportar PDF
                    </button>
                    <div className="flex gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
                        {[
                            { value: 'week', label: 'Semana' },
                            { value: 'month', label: 'Mes' },
                            { value: 'all', label: 'Todo' },
                        ].map((option) => (
                            <button
                                key={option.value}
                                onClick={() => setTimeRange(option.value as any)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${timeRange === option.value
                                        ? 'bg-primary-500 text-white shadow-lg'
                                        : 'text-slate-400 hover:text-slate-200'
                                    }`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Tarjetas de métricas principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="glass-panel p-5">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2 bg-primary-500/20 rounded-lg">
                            <Calendar className="w-5 h-5 text-primary-400" />
                        </div>
                        <span className="text-xs text-slate-400 uppercase tracking-wider">Total</span>
                    </div>
                    <p className="text-3xl font-bold text-slate-200">{metrics.totalEvents}</p>
                    <p className="text-sm text-slate-400 mt-1">Eventos totales</p>
                </div>

                <div className="glass-panel p-5">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2 bg-green-500/20 rounded-lg">
                            <CheckCircle className="w-5 h-5 text-green-400" />
                        </div>
                        <span className="text-xs text-slate-400 uppercase tracking-wider">Completados</span>
                    </div>
                    <p className="text-3xl font-bold text-green-400">{metrics.completedEvents}</p>
                    <p className="text-sm text-slate-400 mt-1">{completionRate}% completado</p>
                </div>

                <div className="glass-panel p-5">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2 bg-yellow-500/20 rounded-lg">
                            <Clock className="w-5 h-5 text-yellow-400" />
                        </div>
                        <span className="text-xs text-slate-400 uppercase tracking-wider">Pendientes</span>
                    </div>
                    <p className="text-3xl font-bold text-yellow-400">{metrics.pendingEvents}</p>
                    <p className="text-sm text-slate-400 mt-1">Por completar</p>
                </div>

                <div className="glass-panel p-5">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2 bg-secondary-500/20 rounded-lg">
                            <TrendingUp className="w-5 h-5 text-secondary-400" />
                        </div>
                        <span className="text-xs text-slate-400 uppercase tracking-wider">Este Mes</span>
                    </div>
                    <p className="text-3xl font-bold text-secondary-400">{metrics.eventsThisMonth}</p>
                    <p className="text-sm text-slate-400 mt-1">Eventos creados</p>
                </div>
            </div>

            {/* Gráfico de categorías */}
            <div className="glass-panel p-6">
                <h3 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary-400" />
                    Distribución por Categoría
                </h3>
                <div className="space-y-3">
                    {categories.map((cat) => {
                        const count = metrics.categoryBreakdown[cat.key] || 0;
                        const percentage = metrics.totalEvents > 0
                            ? Math.round((count / metrics.totalEvents) * 100)
                            : 0;

                        return (
                            <div key={cat.key}>
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-3 h-3 rounded-full ${cat.color}`} />
                                        <span className="text-sm text-slate-300">{cat.label}</span>
                                    </div>
                                    <span className="text-sm font-medium text-slate-400">{count} ({percentage}%)</span>
                                </div>
                                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${cat.color} transition-all duration-500`}
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Estadísticas por miembro */}
            <div className="glass-panel p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary-400" />
                        Ranking Familiar: Salón de la Fama
                    </h3>
                    <div className="px-3 py-1 bg-white/5 rounded-full border border-white/10 text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                        Puntos de Sabiduría
                    </div>
                </div>
                <div className="space-y-4">
                    {metrics.memberStats
                        .sort((a, b) => b.points - a.points)
                        .map((member, index) => {
                            const isTop3 = index < 3;
                            const medals = ['🥇', '🥈', '🥉'];
                            
                            return (
                                <div key={member.user_id} className={`p-4 rounded-xl border transition-all hover:scale-[1.01] ${
                                    isTop3 ? 'bg-primary-500/5 border-primary-500/30' : 'bg-white/5 border-white/10'
                                }`}>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-secondary-500/20 to-primary-500/20 flex items-center justify-center text-white text-sm font-bold shadow-lg border border-white/10">
                                                    {member.user_name.substring(0, 2).toUpperCase()}
                                                </div>
                                                {isTop3 && (
                                                    <span className="absolute -top-1 -right-1 text-base drop-shadow-md">
                                                        {medals[index]}
                                                    </span>
                                                )}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-bold text-slate-200">{member.user_name}</p>
                                                    <span className="px-2 py-0.5 bg-primary-500/20 text-primary-400 rounded-full text-[10px] font-bold border border-primary-500/40">
                                                        Nivel {member.level}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-primary-400/80 font-medium italic">
                                                    "{member.level_name}"
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-bold text-slate-200">
                                                {member.points.toLocaleString()}
                                            </p>
                                            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-tighter">PUNTOS XP</p>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                                            <span>Progreso de Nivel</span>
                                            <span>{member.points % 100}%</span>
                                        </div>
                                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 transition-all duration-1000"
                                                style={{ width: `${member.points % 100}%` }}
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/5 text-[10px] text-slate-500">
                                        <span className="flex items-center gap-1">
                                            <CheckCircle className="w-3 h-3 text-green-500/70" />
                                            {member.completed_count} hechas
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Target className="w-3 h-3 text-primary-500/70" />
                                            {member.completion_rate}% efectividad
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                </div>
            </div>
        </div>
    );
};
