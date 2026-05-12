import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { Role, User } from '../types';
import { apiService } from '../services/api';

interface AuthContextValue {
    user: User | null;
    role: Role | null;
    isAuthenticated: boolean;
    login: (email: string, password?: string) => Promise<{ ok: boolean; message?: string }>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(() => {
        const savedRole = localStorage.getItem('vetcare_role');
        const savedName = localStorage.getItem('vetcare_user_name');
        const savedEmail = localStorage.getItem('vetcare_email');
        if (savedRole && savedName && savedEmail) {
            return {
                id: 'session',
                role: savedRole as Role,
                name: savedName,
                email: savedEmail,
                description: '',
                icon: ''
            } as User;
        }
        return null;
    });

    const login = useCallback(async (email: string, password?: string) => {
        try {
            // If password is provided, it's a real login attempt
            // If not (e.g. from the quick selector), we use 'admin' as default for testing
            const data = await apiService.login(email, password || 'admin');
            const loggedUser = data.user;
            
            setUser(loggedUser);
            localStorage.setItem('vetcare_role', loggedUser.role);
            localStorage.setItem('vetcare_user_name', loggedUser.name);
            localStorage.setItem('vetcare_email', loggedUser.email);
            return { ok: true };
        } catch (error) {
            console.error('Login failed', error);
            return { ok: false, message: 'Identifiants invalides' };
        }
    }, []);

    const logout = useCallback(async () => {
        try {
            await apiService.logout();
        } catch (e) {
            console.error('Logout error', e);
        }
        setUser(null);
        localStorage.removeItem('vetcare_role');
        localStorage.removeItem('vetcare_user_name');
        localStorage.removeItem('vetcare_email');
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                role: user?.role || null,
                isAuthenticated: !!user,
                login,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used inside AuthProvider');
    }
    return context;
}
