import React, { useState, useEffect } from 'react';
import { X, Users, Calendar, Bell, Repeat } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

interface User {
    id: number;
    full_name: string;
    email: string;
}

interface AssignmentSelectorProps {
    familyId: number;
    currentAssignedId?: number;
    onAssign: (userId: number) => void;
}

export const AssignmentSelector: React.FC<AssignmentSelectorProps> = ({
    familyId,
    currentAssignedId,
    onAssign
}) => {
    const [familyMembers, setFamilyMembers] = useState<User[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<number | undefined>(currentAssignedId);
    const [loading, setLoading] = useState(false);
};

return (
    <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            <Users size={16} className="inline mr-2" />
            Asignar a
        </label>

        {loading ? (
            <div className="text-sm text-gray-500">Cargando miembros...</div>
        ) : (
            <>
                <select
                    value={selectedUserId || ''}
                    onChange={(e) => setSelectedUserId(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                    <option value="">Sin asignar</option>
                    {familyMembers.map((member) => (
                        <option key={member.id} value={member.id}>
                            {member.full_name} ({member.email})
                        </option>
                    ))}
                </select>

                {selectedUserId && selectedUserId !== currentAssignedId && (
                    <button
                        onClick={handleAssign}
                        className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                    >
                        Asignar
                    </button>
                )}
            </>
        )}
    </div>
);
};

interface RecurrenceConfigProps {
    value?: string;
    onChange: (pattern: string) => void;
}

export const RecurrenceConfig: React.FC<RecurrenceConfigProps> = ({ value, onChange }) => {
    const [frequency, setFrequency] = useState<'daily' | 'weekly'>('weekly');
    const [selectedDays, setSelectedDays] = useState<string[]>([]);
    const [time, setTime] = useState('22:00');

    const daysOfWeek = [
        { value: 'mon', label: 'Lun' },
        { value: 'tue', label: 'Mar' },
        { value: 'wed', label: 'Mié' },
        { value: 'thu', label: 'Jue' },
        { value: 'fri', label: 'Vie' },
        { value: 'sat', label: 'Sáb' },
        { value: 'sun', label: 'Dom' }
    ];

    useEffect(() => {
        if (value) {
            const parts = value.split(':');
            if (parts[0] === 'weekly' && parts.length >= 3) {
                setFrequency('weekly');
                setSelectedDays(parts[1].split(','));
                setTime(parts[2]);
            } else if (parts[0] === 'daily' && parts.length >= 2) {
                setFrequency('daily');
                setTime(parts[1]);
            }
        }
    }, [value]);

    useEffect(() => {
        if (frequency === 'daily') {
            onChange(`daily:${time}`);
        } else if (frequency === 'weekly' && selectedDays.length > 0) {
            onChange(`weekly:${selectedDays.join(',')}:${time}`);
        }
    }, [frequency, selectedDays, time]);

    const toggleDay = (day: string) => {
        setSelectedDays(prev =>
            prev.includes(day)
                ? prev.filter(d => d !== day)
                : [...prev, day]
        );
    };

    return (
        <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                <Repeat size={16} className="inline mr-2" />
                Recurrencia
            </label>

            {/* Frecuencia */}
            <div className="flex space-x-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                        type="radio"
                        value="daily"
                        checked={frequency === 'daily'}
                        onChange={() => setFrequency('daily')}
                        className="text-purple-600"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Diario</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                        type="radio"
                        value="weekly"
                        checked={frequency === 'weekly'}
                        onChange={() => setFrequency('weekly')}
                        className="text-purple-600"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Semanal</span>
                </label>
            </div>

            {/* Días de la semana (solo para semanal) */}
            {frequency === 'weekly' && (
                <div className="grid grid-cols-7 gap-2">
                    {daysOfWeek.map((day) => (
                        <button
                            key={day.value}
                            onClick={() => toggleDay(day.value)}
                            className={`px-2 py-1 text-xs rounded ${selectedDays.includes(day.value)
                                ? 'bg-purple-600 text-white'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                }`}
                        >
                            {day.label}
                        </button>
                    ))}
                </div>
            )}

            {/* Hora */}
            <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                    Hora
                </label>
                <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
            </div>

            {/* Preview */}
            <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                <p className="text-xs text-purple-800 dark:text-purple-300">
                    <strong>Patrón:</strong> {
                        frequency === 'daily'
                            ? `Todos los días a las ${time}`
                            : selectedDays.length > 0
                                ? `Cada ${selectedDays.map(d => daysOfWeek.find(dw => dw.value === d)?.label).join(', ')} a las ${time}`
                                : 'Selecciona al menos un día'
                    }
                </p>
            </div>
        </div>
    );
};
