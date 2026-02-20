import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { Role, User } from '../types';

const DEMO_USERS: User[] = [
    {
        id: 'user-1',
        name: 'M. Lannes',
        role: 'director',
        description: 'Vision globale, KPIs, rentabilite, paiements',
        icon: 'briefcase',
    },
    {
        id: 'user-2',
        name: 'Dr. Sophie Martin',
        role: 'veterinarian',
        description: 'Dossiers patients, consultations, ordonnances',
        icon: 'stethoscope',
    },
    {
        id: 'user-3',
        name: 'Julie Renard',
        role: 'assistant',
        description: 'Accueil, RDV, facturation, inventaire',
        icon: 'headset',
    },
];

interface AuthContextValue {
    user: User | null;
    role: Role | null;
    isAuthenticated: boolean;
    login: (role: Role) => void;
    logout: () => void;
    demoUsers: User[];
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(() => {
        const savedRole = localStorage.getItem('vetcare_role');
        if (savedRole) {
            const savedUser = DEMO_USERS.find((u) => u.role === savedRole) || null;
            if (savedUser) {
                localStorage.setItem('vetcare_user_name', savedUser.name);
            }
            return savedUser;
        }
        return null;
    });

    const login = useCallback((role: Role) => {
        const selectedUser = DEMO_USERS.find((u) => u.role === role);
        if (selectedUser) {
            setUser(selectedUser);
            localStorage.setItem('vetcare_role', role);
            localStorage.setItem('vetcare_user_name', selectedUser.name);
        }
    }, []);

    const logout = useCallback(() => {
        setUser(null);
        localStorage.removeItem('vetcare_role');
        localStorage.removeItem('vetcare_user_name');
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                role: user?.role || null,
                isAuthenticated: !!user,
                login,
                logout,
                demoUsers: DEMO_USERS,
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
