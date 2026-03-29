import React from 'react';
import { Check, Palette } from 'lucide-react';
import { cn } from '../lib/cn';

// ------------------------------------------------------------------
// Tipos
// ------------------------------------------------------------------
interface ColorOption {
  name: string;
  value: string;
  twClass: string;
}

interface ColorPickerProps {
  /** Valor hex del color actualmente seleccionado */
  selectedColor: string;
  /** Callback invocado al seleccionar un nuevo color */
  onSelectColor: (color: string) => void;
  /** ID base para asociar el label al grupo (A11y) */
  id?: string;
}

// ------------------------------------------------------------------
// Constantes
// ------------------------------------------------------------------
const AVAILABLE_COLORS: ColorOption[] = [
  { name: 'Azul',      value: '#3B82F6', twClass: 'bg-blue-500'    },
  { name: 'Verde',     value: '#10B981', twClass: 'bg-green-500'   },
  { name: 'Morado',    value: '#8B5CF6', twClass: 'bg-purple-500'  },
  { name: 'Rojo',      value: '#EF4444', twClass: 'bg-red-500'     },
  { name: 'Amarillo',  value: '#F59E0B', twClass: 'bg-yellow-500'  },
  { name: 'Naranja',   value: '#F97316', twClass: 'bg-orange-500'  },
  { name: 'Rosa',      value: '#EC4899', twClass: 'bg-pink-500'    },
  { name: 'Cyan',      value: '#06B6D4', twClass: 'bg-cyan-500'    },
  { name: 'Índigo',    value: '#6366F1', twClass: 'bg-indigo-500'  },
  { name: 'Esmeralda', value: '#059669', twClass: 'bg-emerald-600' },
  { name: 'Fucsia',    value: '#D946EF', twClass: 'bg-fuchsia-500' },
  { name: 'Lima',      value: '#84CC16', twClass: 'bg-lime-500'    },
];

// ------------------------------------------------------------------
// Componente
// ------------------------------------------------------------------
export const ColorPicker: React.FC<ColorPickerProps> = ({
  selectedColor,
  onSelectColor,
  id = 'color-picker',
}) => {
  const labelId = `${id}-label`;
  const descId  = `${id}-desc`;

  return (
    <div id={id}>
      {/* Label del grupo */}
      <p
        id={labelId}
        className="block text-sm font-medium text-slate-300 mb-1"
      >
        <Palette className="w-4 h-4 inline mr-2" aria-hidden="true" />
        Tu Color Personal
      </p>
      <p id={descId} className="text-xs text-slate-400 mb-3">
        Este color se usará para identificar tus tareas en el calendario
      </p>

      {/* Grid de colores — radiogroup semántico */}
      <div
        role="radiogroup"
        aria-labelledby={labelId}
        aria-describedby={descId}
        className="grid grid-cols-4 gap-2"
      >
        {AVAILABLE_COLORS.map((color) => {
          const isSelected = selectedColor === color.value;
          return (
            <button
              key={color.value}
              id={`${id}-option-${color.name.toLowerCase()}`}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={`Color ${color.name}`}
              onClick={() => onSelectColor(color.value)}
              className={cn(
                'relative h-12 rounded-xl border-2 transition-all duration-200',
                color.twClass,
                isSelected
                  ? 'border-white scale-110 shadow-lg'
                  : 'border-white/20 hover:border-white/40 hover:scale-105'
              )}
            >
              {isSelected && (
                <span
                  aria-hidden="true"
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <Check className="w-6 h-6 text-white drop-shadow-lg" strokeWidth={3} />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Vista previa del color seleccionado */}
      {selectedColor && (() => {
        const found = AVAILABLE_COLORS.find((c) => c.value === selectedColor);
        return (
          <div
            aria-live="polite"
            aria-atomic="true"
            className="mt-3 p-3 bg-white/5 rounded-xl border border-white/10 flex items-center gap-3"
          >
            {/*
              Única excepción justificada de CSS variable dinámica:
              Tailwind no puede generar clases para valores hex arbitrarios
              en tiempo de compilación. CSS custom property es la solución
              estándar de la industria para este caso.
            */}
            <div
              className="w-8 h-8 rounded-lg shadow-lg"
              style={{ '--preview-color': selectedColor } as React.CSSProperties}
              // eslint-disable-next-line react/forbid-dom-props
              {...({ style: { backgroundColor: selectedColor } } as React.HTMLAttributes<HTMLDivElement>)}
              aria-hidden="true"
            />
            <div>
              <p className="text-sm font-medium text-slate-200">
                {found?.name ?? 'Color seleccionado'}
              </p>
              <p className="text-xs text-slate-400">{selectedColor}</p>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
