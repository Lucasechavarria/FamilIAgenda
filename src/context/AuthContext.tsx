import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, LoginData, RegisterData, User } from '../services/auth';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (data: LoginData) => Promise<void>;
    register: (data: RegisterData) => Promise<void>;
    logout: () => void;
    refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const currentUser = authService.getCurrentUser();
        setUser(currentUser);
        setIsLoading(false);
    }, []);

    const login = async (data: LoginData) => {
        await authService.login(data);
        setUser(authService.getCurrentUser());
    };

    const register = async (data: RegisterData) => {
        await authService.register(data);
        setUser(authService.getCurrentUser());
    };

    const logout = () => {
        authService.logout();
        setUser(null);
    };

    const refreshUser = () => {
        const currentUser = authService.getCurrentUser();
        setUser(currentUser);
    };

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated: !!user,
            isLoading,
            login,
            register,
            logout,
            refreshUser
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
