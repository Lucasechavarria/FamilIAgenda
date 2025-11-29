import React, { useState } from 'react';
import { X, Calendar, Clock, Users, Tag, FileText } from 'lucide-react';
import { api } from '../services/auth';
import { FamilyMemberSelector } from './FamilyMemberSelector';

interface EventModalProps {
    isOpen: boolean;
    onClose: () => void;
    onEventCreated: () => void;
    initialDate?: Date;
}

export const EventModal: React.FC<EventModalProps> = ({ isOpen, onClose, onEventCreated, initialDate }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [startDate, setStartDate] = useState(
        initialDate ? initialDate.toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16)
    );
    const [endDate, setEndDate] = useState(
        initialDate ? new Date(initialDate.getTime() + 3600000).toISOString().slice(0, 16) : new Date(Date.now() + 3600000).toISOString().slice(0, 16)
    );
    const [category, setCategory] = useState('personal');
    const [assignedTo, setAssignedTo] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const categories = [
        { value: 'work', label: 'Trabajo', color: 'bg-blue-500' },
        { value: 'personal', label: 'Personal', color: 'bg-green-500' },
        { value: 'family', label: 'Familia', color: 'bg-purple-500' },
        { value: 'health', label: 'Salud', color: 'bg-red-500' },
        { value: 'leisure', label: 'Ocio', color: 'bg-yellow-500' },
        { value: 'school', label: 'Escuela', color: 'bg-indigo-500' },
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await api.post('/api/events/', {
                title,
                description,
                start_time: new Date(startDate).toISOString(),
                end_time: new Date(endDate).toISOString(),
                category,
                is_recurring: false,
                assigned_to_id: assignedTo,
            });

            onEventCreated();
            handleClose();
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Error al crear el evento');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setTitle('');
        setDescription('');
        setCategory('personal');
        setAssignedTo(null);
        setError('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="glass-panel w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-10 duration-300">
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-primary-600 to-secondary-600 p-4 flex justify-between items-center rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <Calendar className="w-5 h-5 text-white" />
                        </div>
                        <h2 className="text-xl font-display font-bold text-white">Nuevo Evento</h2>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Título */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            <FileText className="w-4 h-4 inline mr-2" />
                            Título *
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="input-field"
                            placeholder="Ej: Reunión con el equipo"
                            required
                        />
                    </div>

                    {/* Descripción */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Descripción
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="input-field min-h-[80px] resize-none"
                            placeholder="Detalles adicionales..."
                        />
                    </div>

                    {/* Fecha y Hora Inicio */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            <Clock className="w-4 h-4 inline mr-2" />
                            Inicio *
                        </label>
                        <input
                            type="datetime-local"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="input-field"
                            required
                        />
                    </div>

                    {/* Fecha y Hora Fin */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            <Clock className="w-4 h-4 inline mr-2" />
                            Fin *
                        </label>
                        <input
                            type="datetime-local"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="input-field"
                            required
                        />
                    </div>

                    {/* Categoría */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            <Tag className="w-4 h-4 inline mr-2" />
                            Categoría
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {categories.map((cat) => (
                                <button
                                    key={cat.value}
                                    type="button"
                                    onClick={() => setCategory(cat.value)}
                                    className={`p-3 rounded-xl border-2 transition-all duration-200 ${category === cat.value
                                        ? 'border-primary-500 bg-primary-500/20 scale-105'
                                        : 'border-white/10 bg-white/5 hover:border-white/20'
                                        }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <div className={`w-3 h-3 rounded-full ${cat.color}`} />
                                        <span className="text-sm font-medium text-slate-200">{cat.label}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Asignar a Miembro */}
                    <div>
                        <FamilyMemberSelector
                            selectedMemberId={assignedTo}
                            onSelectMember={setAssignedTo}
                        />
                    </div>

                    {/* Botones */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="btn-secondary flex-1"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary flex-1"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                            ) : (
                                'Crear Evento'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
