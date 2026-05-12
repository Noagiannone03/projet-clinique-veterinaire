import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Stethoscope, Briefcase, Headset } from 'lucide-react';
import type { Role } from '../types';

const roleIcons: Record<Role, React.ReactNode> = {
    director: <Briefcase className="w-8 h-8" />,
    veterinarian: <Stethoscope className="w-8 h-8" />,
    assistant: <Headset className="w-8 h-8" />,
};

const roleColors: Record<Role, { bg: string; icon: string; border: string; hover: string }> = {
    director: {
        bg: 'bg-amber-50',
        icon: 'bg-amber-100 text-amber-600',
        border: 'border-amber-200 hover:border-amber-400',
        hover: 'hover:shadow-amber-100',
    },
    veterinarian: {
        bg: 'bg-primary-50',
        icon: 'bg-primary-100 text-primary-600',
        border: 'border-primary-200 hover:border-primary-400',
        hover: 'hover:shadow-primary-100',
    },
    assistant: {
        bg: 'bg-sky-50',
        icon: 'bg-sky-100 text-sky-600',
        border: 'border-sky-200 hover:border-sky-400',
        hover: 'hover:shadow-sky-100',
    },
};

const roleTitles: Record<Role, string> = {
    director: 'Directeur',
    veterinarian: 'Veterinaire',
    assistant: 'Assistante d\'accueil',
};

export function Login() {
    const { login, demoUsers } = useAuth();
    const navigate = useNavigate();

    const handleLogin = (selectedRole: Role) => {
        login(selectedRole);
        navigate(selectedRole === 'director' ? '/' : '/clinic');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-sky-50 flex items-center justify-center p-4">
            <div className="w-full max-w-3xl">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl mb-4">
                        <Stethoscope className="w-9 h-9 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">VetCare</h1>
                    <p className="text-lg text-slate-500">Clinique des Etangs - Villars-les-Dombes</p>
                    <p className="text-sm text-slate-400 mt-2">Selectionnez votre profil pour acceder a l'application</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {demoUsers.map((user) => {
                        const colors = roleColors[user.role];
                        return (
                            <button
                                key={user.id}
                                onClick={() => handleLogin(user.role)}
                                className={`group relative p-6 rounded-2xl border-2 bg-white shadow-sm transition-all duration-200 ${colors.border} ${colors.hover} hover:shadow-lg text-left`}
                            >
                                <div className={`w-14 h-14 rounded-xl ${colors.icon} flex items-center justify-center mb-4`}>
                                    {roleIcons[user.role]}
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900 mb-1">
                                    {user.name}
                                </h3>
                                <p className="text-sm font-medium text-primary-600 mb-2">
                                    {roleTitles[user.role]}
                                </p>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    {user.description}
                                </p>
                                <div className={`absolute inset-x-0 bottom-0 h-1 ${colors.bg} rounded-b-2xl opacity-0 group-hover:opacity-100 transition-opacity`} />
                            </button>
                        );
                    })}
                </div>

                <p className="text-center text-xs text-slate-400 mt-8">
                    Application de demonstration - Aucune authentification requise
                </p>
            </div>
        </div>
    );
}
