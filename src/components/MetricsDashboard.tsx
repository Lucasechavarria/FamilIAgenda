import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, CheckCircle, Clock, Users, Calendar, Target } from 'lucide-react';
import { api } from '../services/auth';

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
    }>;
}

export const MetricsDashboard: React.FC = () => {
    const [metrics, setMetrics] = useState<MetricsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('month');

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
                <h3 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary-400" />
                    Rendimiento por Miembro
                </h3>
                <div className="space-y-4">
                    {metrics.memberStats.map((member) => (
                        <div key={member.user_id} className="p-4 bg-white/5 rounded-xl border border-white/10">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-secondary-500 to-primary-500 flex items-center justify-center text-white text-sm font-bold shadow-lg">
                                        {member.user_name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-200">{member.user_name}</p>
                                        <p className="text-xs text-slate-400">
                                            {member.assigned_count} tareas asignadas
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-primary-400">
                                        {member.completion_rate}%
                                    </p>
                                    <p className="text-xs text-slate-400">Completado</p>
                                </div>
                            </div>
                            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 transition-all duration-500"
                                    style={{ width: `${member.completion_rate}%` }}
                                />
                            </div>
                            <div className="flex items-center justify-between mt-2 text-xs text-slate-400">
                                <span>{member.completed_count} completadas</span>
                                <span>{member.assigned_count - member.completed_count} pendientes</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
