import React, { useEffect, useState } from 'react';
import { Users, Check } from 'lucide-react';
import { api } from '../services/auth';

interface FamilyMemberSelectorProps {
    selectedMemberId: number | null;
    onSelectMember: (memberId: number | null) => void;
}

interface FamilyMemberData {
    id: number;
    full_name: string;
    email: string;
    avatar_url?: string;
}

export const FamilyMemberSelector: React.FC<FamilyMemberSelectorProps> = ({
    selectedMemberId,
    onSelectMember
}) => {
    const [members, setMembers] = useState<FamilyMemberData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadFamilyMembers();
    }, []);

    const loadFamilyMembers = async () => {
        try {
            const response = await api.get('/api/auth/familia/miembros');
            setMembers(response.data);
        } catch (error) {
            console.error('Error cargando miembros:', error);
        } finally {
            setLoading(false);
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-4">
                <div className="w-6 h-6 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">
                <Users className="w-4 h-4 inline mr-2" />
                Asignar a
            </label>

            <div className="space-y-2">
                {/* Opción: Sin asignar */}
                <button
                    type="button"
                    onClick={() => onSelectMember(null)}
                    className={`w-full p-3 rounded-xl border-2 transition-all duration-200 flex items-center gap-3 ${selectedMemberId === null
                            ? 'border-primary-500 bg-primary-500/20'
                            : 'border-white/10 bg-white/5 hover:border-white/20'
                        }`}
                >
                    <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center text-slate-300 text-sm font-bold">
                        ?
                    </div>
                    <div className="flex-1 text-left">
                        <p className="text-sm font-medium text-slate-200">Sin asignar</p>
                        <p className="text-xs text-slate-400">Evento familiar general</p>
                    </div>
                    {selectedMemberId === null && (
                        <Check className="w-5 h-5 text-primary-400" />
                    )}
                </button>

                {/* Lista de miembros */}
                {members.map((member) => (
                    <button
                        key={member.id}
                        type="button"
                        onClick={() => onSelectMember(member.id)}
                        className={`w-full p-3 rounded-xl border-2 transition-all duration-200 flex items-center gap-3 ${selectedMemberId === member.id
                                ? 'border-primary-500 bg-primary-500/20 scale-[1.02]'
                                : 'border-white/10 bg-white/5 hover:border-white/20'
                            }`}
                    >
                        {member.avatar_url ? (
                            <img
                                src={member.avatar_url}
                                alt={member.full_name}
                                className="w-10 h-10 rounded-full object-cover"
                            />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-secondary-500 to-primary-500 flex items-center justify-center text-white text-sm font-bold shadow-lg">
                                {getInitials(member.full_name)}
                            </div>
                        )}
                        <div className="flex-1 text-left">
                            <p className="text-sm font-medium text-slate-200">{member.full_name}</p>
                            <p className="text-xs text-slate-400">{member.email}</p>
                        </div>
                        {selectedMemberId === member.id && (
                            <Check className="w-5 h-5 text-primary-400" />
                        )}
                    </button>
                ))}
            </div>

            {members.length === 0 && (
                <div className="text-center p-4 text-slate-400 text-sm">
                    No hay miembros en la familia aún
                </div>
            )}
        </div>
    );
};
