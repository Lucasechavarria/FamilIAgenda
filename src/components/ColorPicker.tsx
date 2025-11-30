import React, { useState } from 'react';
import { Check, Palette } from 'lucide-react';

interface ColorPickerProps {
    selectedColor: string;
    onSelectColor: (color: string) => void;
}

const AVAILABLE_COLORS = [
    { name: 'Azul', value: '#3B82F6', class: 'bg-blue-500' },
    { name: 'Verde', value: '#10B981', class: 'bg-green-500' },
    { name: 'Morado', value: '#8B5CF6', class: 'bg-purple-500' },
    { name: 'Rojo', value: '#EF4444', class: 'bg-red-500' },
    { name: 'Amarillo', value: '#F59E0B', class: 'bg-yellow-500' },
    { name: 'Naranja', value: '#F97316', class: 'bg-orange-500' },
    { name: 'Rosa', value: '#EC4899', class: 'bg-pink-500' },
    { name: 'Cyan', value: '#06B6D4', class: 'bg-cyan-500' },
    { name: 'Índigo', value: '#6366F1', class: 'bg-indigo-500' },
    { name: 'Esmeralda', value: '#059669', class: 'bg-emerald-600' },
    { name: 'Fucsia', value: '#D946EF', class: 'bg-fuchsia-500' },
    { name: 'Lima', value: '#84CC16', class: 'bg-lime-500' },
];

export const ColorPicker: React.FC<ColorPickerProps> = ({ selectedColor, onSelectColor }) => {
    return (
        <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">
                <Palette className="w-4 h-4 inline mr-2" />
                Tu Color Personal
            </label>
            <p className="text-xs text-slate-400 mb-3">
                Este color se usará para identificar tus tareas en el calendario
            </p>
            <div className="grid grid-cols-4 gap-2">
                {AVAILABLE_COLORS.map((color) => (
                    <button
                        key={color.value}
                        type="button"
                        onClick={() => onSelectColor(color.value)}
                        className={`relative h-12 rounded-xl border-2 transition-all duration-200 ${selectedColor === color.value
                                ? 'border-white scale-110 shadow-lg'
                                : 'border-white/20 hover:border-white/40 hover:scale-105'
                            } ${color.class}`}
                        title={color.name}
                    >
                        {selectedColor === color.value && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Check className="w-6 h-6 text-white drop-shadow-lg" strokeWidth={3} />
                            </div>
                        )}
                    </button>
                ))}
            </div>
            {selectedColor && (
                <div className="mt-3 p-3 bg-white/5 rounded-xl border border-white/10 flex items-center gap-3">
                    <div
                        className="w-8 h-8 rounded-lg shadow-lg"
                        style={{ backgroundColor: selectedColor }}
                    />
                    <div>
                        <p className="text-sm font-medium text-slate-200">
                            {AVAILABLE_COLORS.find(c => c.value === selectedColor)?.name || 'Color seleccionado'}
                        </p>
                        <p className="text-xs text-slate-400">{selectedColor}</p>
                    </div>
                </div>
            )}
        </div>
    );
};
