import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Users, Key, UserPlus, Eye, EyeOff } from 'lucide-react';
import { authService } from '../services/auth';
import { useAuth } from '../context/AuthContext';
import SpectacularBackground from '../components/SpectacularBackground';

export default function RegisterPage() {
    const [email, setEmail] = useState('');
    const [fullName, setFullName] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [createFamily, setCreateFamily] = useState(true);
    const [familyName, setFamilyName] = useState('');
    const [invitationCode, setInvitationCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        if (createFamily && !familyName) {
            setError('Debes ingresar un nombre para la familia');
            return;
        }

        if (!createFamily && !invitationCode) {
            setError('Debes ingresar un código de invitación');
            return;
        }

        setLoading(true);

        try {
            const response = await authService.register({
                email,
                full_name: fullName,
                password,
                family_name: createFamily ? familyName : undefined,
                // Si el backend se actualiza para aceptar invitationCode, se añadiría aquí
            });

            login(response.user_name, response.user_email);
            navigate('/');
        } catch (err: any) {
            setError(err.message || 'Error al registrarse');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            <SpectacularBackground />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <div className="glass-panel p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-display font-bold bg-gradient-to-r from-secondary-glow to-accent-glow bg-clip-text text-transparent">
                            Crear Cuenta
                        </h1>
                        <p className="text-slate-400 mt-2">Únete a FamilIAgenda</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400 text-sm"
                            >
                                {error}
                            </motion.div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Nombre Completo
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFullName(e.target.value)}
                                    className="input-field pl-10"
                                    style={{ color: '#f8fafc' }}
                                    placeholder="Juan Pérez"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                                    className="input-field pl-10"
                                    style={{ color: '#f8fafc' }}
                                    placeholder="tu@email.com"
                                    required
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Contraseña
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                                    className="input-field pl-10 pr-12"
                                    style={{ color: '#f8fafc' }}
                                    placeholder="••••••••"
                                    required
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors"
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-5 h-5" />
                                    ) : (
                                        <Eye className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Confirmar Contraseña
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                                    className="input-field pl-10 pr-12"
                                    style={{ color: '#f8fafc' }}
                                    placeholder="••••••••"
                                    required
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors"
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff className="w-5 h-5" />
                                    ) : (
                                        <Eye className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-white/10">
                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setCreateFamily(true)}
                                    className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${createFamily
                                        ? 'bg-primary/20 border-2 border-primary text-primary-glow shadow-neon-blue'
                                        : 'bg-surface/50 border border-white/10 text-slate-400 hover:border-white/20'
                                        }`}
                                >
                                    <Users className="w-5 h-5 mx-auto mb-1" />
                                    Crear Familia
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCreateFamily(false)}
                                    className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${!createFamily
                                        ? 'bg-secondary/20 border-2 border-secondary text-secondary-glow shadow-neon-pink'
                                        : 'bg-surface/50 border border-white/10 text-slate-400 hover:border-white/20'
                                        }`}
                                >
                                    <Key className="w-5 h-5 mx-auto mb-1" />
                                    Unirse
                                </button>
                            </div>

                            {createFamily ? (
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Nombre de la Familia
                                    </label>
                                    <input
                                        type="text"
                                        value={familyName}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFamilyName(e.target.value)}
                                        className="input-field"
                                        style={{ color: '#f8fafc' }}
                                        placeholder="Familia Pérez"
                                        required
                                    />
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Código de Invitación
                                    </label>
                                    <input
                                        type="text"
                                        value={invitationCode}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInvitationCode(e.target.value.toUpperCase())}
                                        className="input-field"
                                        style={{ color: '#f8fafc' }}
                                        placeholder="ABC123"
                                        required
                                        maxLength={6}
                                    />
                                </div>
                            )}
                        </div>

                        <motion.button
                            type="submit"
                            disabled={loading}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="btn-primary w-full flex items-center justify-center gap-2 mt-6"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <UserPlus className="w-5 h-5" />
                                    Crear Cuenta
                                </>
                            )}
                        </motion.button>
                    </form>

                    <div className="mt-6 text-center text-sm text-slate-400">
                        ¿Ya tienes cuenta?{' '}
                        <Link to="/login" className="text-secondary-glow hover:text-secondary transition-colors">
                            Inicia sesión
                        </Link>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
