import React, { useState } from 'react';
import { Repeat, Calendar, Clock } from 'lucide-react';

interface RecurrencePattern {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
    interval: number;
    daysOfWeek?: number[]; // 0=Domingo, 1=Lunes, ..., 6=Sábado
    endDate?: string;
    occurrences?: number;
}

interface RecurrenceSelectorProps {
    isRecurring: boolean;
    onToggleRecurring: (value: boolean) => void;
    pattern: RecurrencePattern;
    onPatternChange: (pattern: RecurrencePattern) => void;
}

const DAYS_OF_WEEK = [
    { value: 1, label: 'L', fullName: 'Lunes' },
    { value: 2, label: 'M', fullName: 'Martes' },
    { value: 3, label: 'X', fullName: 'Miércoles' },
    { value: 4, label: 'J', fullName: 'Jueves' },
    { value: 5, label: 'V', fullName: 'Viernes' },
    { value: 6, label: 'S', fullName: 'Sábado' },
    { value: 0, label: 'D', fullName: 'Domingo' },
];

export const RecurrenceSelector: React.FC<RecurrenceSelectorProps> = ({
    isRecurring,
    onToggleRecurring,
    pattern,
    onPatternChange,
}) => {
    const toggleDayOfWeek = (day: number) => {
        const currentDays = pattern.daysOfWeek || [];
        const newDays = currentDays.includes(day)
            ? currentDays.filter(d => d !== day)
            : [...currentDays, day].sort();

        onPatternChange({ ...pattern, daysOfWeek: newDays });
    };

    return (
        <div className="space-y-4">
            {/* Toggle Recurrencia */}
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-center gap-3">
                    <Repeat className="w-5 h-5 text-primary-400" />
                    <div>
                        <p className="text-sm font-medium text-slate-200">Evento Recurrente</p>
                        <p className="text-xs text-slate-400">Repetir este evento automáticamente</p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => onToggleRecurring(!isRecurring)}
                    className={`relative w-14 h-7 rounded-full transition-colors ${isRecurring ? 'bg-primary-500' : 'bg-slate-600'
                        }`}
                >
                    <div
                        className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-lg transition-transform ${isRecurring ? 'translate-x-8' : 'translate-x-1'
                            }`}
                    />
                </button>
            </div>

            {/* Opciones de Recurrencia */}
            {isRecurring && (
                <div className="space-y-4 p-4 bg-white/5 rounded-xl border border-white/10">
                    {/* Frecuencia */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Frecuencia
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { value: 'daily', label: 'Diario' },
                                { value: 'weekly', label: 'Semanal' },
                                { value: 'monthly', label: 'Mensual' },
                                { value: 'yearly', label: 'Anual' },
                            ].map((freq) => (
                                <button
                                    key={freq.value}
                                    type="button"
                                    onClick={() => onPatternChange({ ...pattern, frequency: freq.value as any })}
                                    className={`p-3 rounded-lg border-2 transition-all text-sm font-medium ${pattern.frequency === freq.value
                                            ? 'border-primary-500 bg-primary-500/20 text-primary-300'
                                            : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20'
                                        }`}
                                >
                                    {freq.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Días de la Semana (solo para semanal) */}
                    {pattern.frequency === 'weekly' && (
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Días de la Semana
                            </label>
                            <div className="flex gap-2">
                                {DAYS_OF_WEEK.map((day) => (
                                    <button
                                        key={day.value}
                                        type="button"
                                        onClick={() => toggleDayOfWeek(day.value)}
                                        className={`flex-1 h-12 rounded-lg border-2 transition-all font-medium ${pattern.daysOfWeek?.includes(day.value)
                                                ? 'border-primary-500 bg-primary-500/20 text-primary-300'
                                                : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20'
                                            }`}
                                        title={day.fullName}
                                    >
                                        {day.label}
                                    </button>
                                ))}
                            </div>
                            {pattern.daysOfWeek && pattern.daysOfWeek.length > 0 && (
                                <p className="text-xs text-slate-400 mt-2">
                                    Seleccionados: {pattern.daysOfWeek.map(d =>
                                        DAYS_OF_WEEK.find(day => day.value === d)?.fullName
                                    ).join(', ')}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Intervalo */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Cada cuánto se repite
                        </label>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                min="1"
                                max="365"
                                value={pattern.interval}
                                onChange={(e) => onPatternChange({
                                    ...pattern,
                                    interval: parseInt(e.target.value) || 1
                                })}
                                className="input-field w-20 text-center"
                            />
                            <span className="text-sm text-slate-300">
                                {pattern.frequency === 'daily' ? 'día(s)' :
                                    pattern.frequency === 'weekly' ? 'semana(s)' :
                                        pattern.frequency === 'monthly' ? 'mes(es)' :
                                            'año(s)'}
                            </span>
                        </div>
                    </div>

                    {/* Finalización */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            <Calendar className="w-4 h-4 inline mr-2" />
                            Finaliza
                        </label>
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                                <input
                                    type="radio"
                                    name="endType"
                                    checked={!pattern.endDate && !pattern.occurrences}
                                    onChange={() => onPatternChange({
                                        ...pattern,
                                        endDate: undefined,
                                        occurrences: undefined
                                    })}
                                    className="text-primary-500"
                                />
                                <span className="text-sm text-slate-300">Nunca</span>
                            </label>

                            <label className="flex items-center gap-2 p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                                <input
                                    type="radio"
                                    name="endType"
                                    checked={!!pattern.endDate}
                                    onChange={() => onPatternChange({
                                        ...pattern,
                                        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
                                        occurrences: undefined
                                    })}
                                    className="text-primary-500"
                                />
                                <span className="text-sm text-slate-300">En fecha</span>
                                {pattern.endDate && (
                                    <input
                                        type="date"
                                        value={pattern.endDate}
                                        onChange={(e) => onPatternChange({
                                            ...pattern,
                                            endDate: e.target.value
                                        })}
                                        className="input-field ml-auto"
                                    />
                                )}
                            </label>

                            <label className="flex items-center gap-2 p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                                <input
                                    type="radio"
                                    name="endType"
                                    checked={!!pattern.occurrences}
                                    onChange={() => onPatternChange({
                                        ...pattern,
                                        occurrences: 10,
                                        endDate: undefined
                                    })}
                                    className="text-primary-500"
                                />
                                <span className="text-sm text-slate-300">Después de</span>
                                {pattern.occurrences && (
                                    <div className="flex items-center gap-2 ml-auto">
                                        <input
                                            type="number"
                                            min="1"
                                            max="365"
                                            value={pattern.occurrences}
                                            onChange={(e) => onPatternChange({
                                                ...pattern,
                                                occurrences: parseInt(e.target.value) || 1
                                            })}
                                            className="input-field w-20 text-center"
                                        />
                                        <span className="text-sm text-slate-300">veces</span>
                                    </div>
                                )}
                            </label>
                        </div>
                    </div>

                    {/* Resumen */}
                    <div className="p-3 bg-primary-500/10 border border-primary-500/30 rounded-lg">
                        <p className="text-xs font-medium text-primary-300 mb-1">Resumen:</p>
                        <p className="text-sm text-slate-200">
                            {getRecurrenceSummary(pattern)}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

function getRecurrenceSummary(pattern: RecurrencePattern): string {
    const { frequency, interval, daysOfWeek, endDate, occurrences } = pattern;

    let summary = 'Se repite ';

    if (frequency === 'daily') {
        summary += interval === 1 ? 'todos los días' : `cada ${interval} días`;
    } else if (frequency === 'weekly') {
        if (daysOfWeek && daysOfWeek.length > 0) {
            const dayNames = daysOfWeek.map(d =>
                DAYS_OF_WEEK.find(day => day.value === d)?.fullName
            ).join(', ');
            summary += `los ${dayNames}`;
        } else {
            summary += interval === 1 ? 'cada semana' : `cada ${interval} semanas`;
        }
    } else if (frequency === 'monthly') {
        summary += interval === 1 ? 'cada mes' : `cada ${interval} meses`;
    } else if (frequency === 'yearly') {
        summary += interval === 1 ? 'cada año' : `cada ${interval} años`;
    }

    if (endDate) {
        summary += ` hasta el ${new Date(endDate).toLocaleDateString('es-ES')}`;
    } else if (occurrences) {
        summary += ` por ${occurrences} veces`;
    } else {
        summary += ' indefinidamente';
    }

    return summary;
}
