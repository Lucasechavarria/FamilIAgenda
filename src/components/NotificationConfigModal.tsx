import React, { useState } from 'react';
import { X } from 'lucide-react';

interface NotificationStage {
    value: number;
    unit: 'minutes' | 'hours' | 'days';
}

interface NotificationConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (config: string) => void;
    currentConfig?: string;
    eventType?: 'short' | 'long'; // short: minutos/horas, long: días
}

export const NotificationConfigModal: React.FC<NotificationConfigModalProps> = ({
    isOpen,
    onClose,
    onSave,
    currentConfig,
    eventType = 'short'
}) => {
    const [isMultiStage, setIsMultiStage] = useState(false);
    const [stages, setStages] = useState<number[]>([15]);
    const [unit, setUnit] = useState<'minutes' | 'hours' | 'days'>('minutes');
    const [notificationTime, setNotificationTime] = useState('09:00');

    React.useEffect(() => {
        if (currentConfig) {
            try {
                const config = JSON.parse(currentConfig);
                if (config.stages) {
                    setIsMultiStage(true);
                    setStages(config.stages);
                    setUnit(config.unit || 'days');
                    setNotificationTime(config.time || '09:00');
                } else if (config.pre) {
                    setIsMultiStage(false);
                    setStages(config.pre);
                    setUnit(config.unit || 'minutes');
                }
            } catch (e) {
                console.error('Error parsing notification config:', e);
            }
        }
    }, [currentConfig]);

    const handleSave = () => {
        let config: any;

        if (isMultiStage) {
            config = {
                stages: stages,
                unit: unit,
                time: notificationTime
            };
        } else {
            config = {
                pre: stages,
                unit: unit
            };
        }

        onSave(JSON.stringify(config));
        onClose();
    };

    const addStage = () => {
        setStages([...stages, 0]);
    };

    const removeStage = (index: number) => {
        setStages(stages.filter((_, i) => i !== index));
    };

    const updateStage = (index: number, value: number) => {
        const newStages = [...stages];
        newStages[index] = value;
        setStages(newStages);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        Configurar Notificaciones
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="space-y-4">
                    {/* Tipo de notificación */}
                    <div>
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={isMultiStage}
                                onChange={(e) => setIsMultiStage(e.target.checked)}
                                className="rounded"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                                Notificaciones multi-etapa (para eventos a largo plazo)
                            </span>
                        </label>
                    </div>

                    {/* Unidad de tiempo */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Unidad de tiempo
                        </label>
                        <select
                            value={unit}
                            onChange={(e) => setUnit(e.target.value as any)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                            <option value="minutes">Minutos</option>
                            <option value="hours">Horas</option>
                            <option value="days">Días</option>
                        </select>
                    </div>

                    {/* Etapas de notificación */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {isMultiStage ? 'Etapas (días/horas antes)' : 'Tiempo antes del evento'}
                        </label>
                        <div className="space-y-2">
                            {stages.map((stage, index) => (
                                <div key={index} className="flex items-center space-x-2">
                                    <input
                                        type="number"
                                        value={stage}
                                        onChange={(e) => updateStage(index, parseInt(e.target.value) || 0)}
                                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        placeholder={`${unit === 'minutes' ? 'Minutos' : unit === 'hours' ? 'Horas' : 'Días'} antes`}
                                    />
                                    {stages.length > 1 && (
                                        <button
                                            onClick={() => removeStage(index)}
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            <X size={20} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={addStage}
                            className="mt-2 text-sm text-purple-600 dark:text-purple-400 hover:underline"
                        >
                            + Agregar etapa
                        </button>
                    </div>

                    {/* Hora de notificación (solo para multi-etapa con días) */}
                    {isMultiStage && unit === 'days' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Hora de notificación
                            </label>
                            <input
                                type="time"
                                value={notificationTime}
                                onChange={(e) => setNotificationTime(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                        </div>
                    )}

                    {/* Ejemplos */}
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                        <p className="text-xs text-purple-800 dark:text-purple-300">
                            <strong>Ejemplo:</strong> {isMultiStage
                                ? `Recibirás notificaciones ${stages.join(', ')} ${unit} antes del evento`
                                : `Recibirás una notificación ${stages[0]} ${unit} antes del evento`}
                        </p>
                    </div>
                </div>

                {/* Botones */}
                <div className="flex justify-end space-x-3 mt-6">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                    >
                        Guardar
                    </button>
                </div>
            </div>
        </div>
    );
};
