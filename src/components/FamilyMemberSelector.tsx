import React, { useEffect, useState } from 'react';
import { Users, Check } from 'lucide-react';
import { api } from '../services/auth';
import { cn } from '../lib/cn';
import type { FamilyMember } from '../types';

// ------------------------------------------------------------------
// Tipos
// ------------------------------------------------------------------
interface FamilyMemberSelectorProps {
  /** ID del miembro actualmente seleccionado, o null si no hay selección */
  selectedMemberId: number | null;
  /** Callback invocado al seleccionar/deseleccionar un miembro */
  onSelectMember: (memberId: number | null) => void;
  /** ID base para asociar labels y describir el grupo (A11y) */
  id?: string;
}

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------
function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// ------------------------------------------------------------------
// Componente
// ------------------------------------------------------------------
export const FamilyMemberSelector: React.FC<FamilyMemberSelectorProps> = ({
  selectedMemberId,
  onSelectMember,
  id = 'member-selector',
}) => {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const labelId = `${id}-label`;

  useEffect(() => {
    loadFamilyMembers();
  }, []);

  const loadFamilyMembers = async (): Promise<void> => {
    try {
      const response = await api.get<FamilyMember[]>('/api/auth/familia/miembros');
      setMembers(response.data);
    } catch (error) {
      console.error('Error cargando miembros:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div
        id={id}
        className="flex items-center justify-center p-4"
        aria-busy="true"
        aria-label="Cargando miembros de la familia"
      >
        <div
          role="status"
          className="w-6 h-6 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin"
          aria-hidden="true"
        />
      </div>
    );
  }

  return (
    <div id={id}>
      {/* Label del grupo */}
      <p
        id={labelId}
        className="block text-sm font-medium text-slate-300 mb-3"
      >
        <Users className="w-4 h-4 inline mr-2" aria-hidden="true" />
        Asignar a
      </p>

      {/* Lista tipo radiogroup */}
      <div
        role="radiogroup"
        aria-labelledby={labelId}
        className="space-y-2"
      >
        {/* Opción: Sin asignar */}
        <button
          id={`${id}-unassigned`}
          type="button"
          role="radio"
          aria-checked={selectedMemberId === null}
          onClick={() => onSelectMember(null)}
          className={cn(
            'w-full p-3 rounded-xl border-2 transition-all duration-200 flex items-center gap-3',
            selectedMemberId === null
              ? 'border-primary-500 bg-primary-500/20'
              : 'border-white/10 bg-white/5 hover:border-white/20'
          )}
        >
          <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center text-slate-300 text-sm font-bold">
            ?
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-medium text-slate-200">Sin asignar</p>
            <p className="text-xs text-slate-400">Evento familiar general</p>
          </div>
          {selectedMemberId === null && (
            <Check className="w-5 h-5 text-primary-400" aria-hidden="true" />
          )}
        </button>

        {/* Lista de miembros */}
        {members.map((member) => {
          const isSelected = selectedMemberId === member.id;
          return (
            <button
              key={member.id}
              id={`${id}-member-${member.id}`}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={`Asignar a ${member.full_name}`}
              onClick={() => onSelectMember(member.id)}
              className={cn(
                'w-full p-3 rounded-xl border-2 transition-all duration-200 flex items-center gap-3',
                isSelected
                  ? 'border-primary-500 bg-primary-500/20 scale-[1.02]'
                  : 'border-white/10 bg-white/5 hover:border-white/20'
              )}
            >
              {member.avatar_url ? (
                <img
                  src={member.avatar_url}
                  alt={`Avatar de ${member.full_name}`}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div
                  aria-hidden="true"
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-secondary-500 to-primary-500 flex items-center justify-center text-white text-sm font-bold shadow-lg"
                >
                  {getInitials(member.full_name)}
                </div>
              )}
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-slate-200">{member.full_name}</p>
                <p className="text-xs text-slate-400">{member.email}</p>
              </div>
              {isSelected && (
                <Check className="w-5 h-5 text-primary-400" aria-hidden="true" />
              )}
            </button>
          );
        })}
      </div>

      {members.length === 0 && (
        <p className="text-center p-4 text-slate-400 text-sm" role="status">
          No hay miembros en la familia aún
        </p>
      )}
    </div>
  );
};
