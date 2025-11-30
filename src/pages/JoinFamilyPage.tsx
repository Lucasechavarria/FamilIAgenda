import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, ArrowRight, Loader2, KeyRound } from 'lucide-react';
import { authService } from '../services/auth';

export default function JoinFamilyPage() {
    const navigate = useNavigate();
    const [inviteCode, setInviteCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteCode.trim()) return;

        setLoading(true);
        setError('');

        try {
            const response = await authService.api.post('/families/join', { invite_code: inviteCode });

            // Force reload or update context
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                user.family_id = response.data.id;
                localStorage.setItem('user', JSON.stringify(user));
            }

            navigate('/');
        } catch (err) {
            console.error(err);
            setError('Código inválido o error al unirse.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors duration-300">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    <div className="w-16 h-16 bg-secondary-600 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-3">
                        <Users className="w-8 h-8 text-white" />
                    </div>
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 dark:text-white">
                    Únete a tu Familia
                </h2>
                <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
                    Ingresa el código de invitación para conectar.
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white dark:bg-slate-800 py-8 px-4 shadow-xl sm:rounded-xl sm:px-10 border border-gray-100 dark:border-slate-700">
                    <form className="space-y-6" onSubmit={handleJoin}>
                        <div>
                            <label htmlFor="inviteCode" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                Código de Invitación
                            </label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <KeyRound className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="inviteCode"
                                    name="inviteCode"
                                    type="text"
                                    required
                                    className="focus:ring-secondary-500 focus:border-secondary-500 block w-full pl-10 sm:text-sm border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white py-2 transition-colors uppercase tracking-widest"
                                    placeholder="ABC-123"
                                    value={inviteCode}
                                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="text-red-500 text-sm text-center bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">
                                {error}
                            </div>
                        )}

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-secondary-600 hover:bg-secondary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02]"
                            >
                                {loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        Unirse
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="mt-6">
                        <button
                            onClick={() => navigate('/create-family')}
                            className="w-full flex justify-center py-2 text-sm font-medium text-secondary-600 hover:text-secondary-500 dark:text-secondary-400"
                        >
                            ¿No tienes una familia? Crea una nueva
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
