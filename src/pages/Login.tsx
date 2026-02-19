import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    Stethoscope,
    Briefcase,
    Headset,
    Mail,
    Lock,
    Eye,
    EyeOff,
    ShieldCheck,
} from 'lucide-react';
import type { Role } from '../types';
import clinicLogo from '../assets/logoclinique copie.png';

const roleIcons: Record<Role, React.ReactNode> = {
    director: <Briefcase className="h-5 w-5" />,
    veterinarian: <Stethoscope className="h-5 w-5" />,
    assistant: <Headset className="h-5 w-5" />,
};

const roleTitles: Record<Role, string> = {
    director: 'Directeur',
    veterinarian: 'Veterinaire',
    assistant: 'Assistante',
};

const demoCredentials: Record<Role, { email: string; password: string }> = {
    director: { email: 'direction@cliniquedesetangs.fr', password: 'demo-directeur' },
    veterinarian: { email: 'vet@cliniquedesetangs.fr', password: 'demo-veto' },
    assistant: { email: 'accueil@cliniquedesetangs.fr', password: 'demo-assistante' },
};

export function Login() {
    const { login, demoUsers } = useAuth();
    const navigate = useNavigate();
    const [selectedRole, setSelectedRole] = useState<Role>('veterinarian');
    const [email, setEmail] = useState(demoCredentials.veterinarian.email);
    const [password, setPassword] = useState(demoCredentials.veterinarian.password);
    const [showPassword, setShowPassword] = useState(false);

    const runLogin = (role: Role) => {
        login(role);
        navigate(role === 'director' ? '/' : '/clinic');
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        runLogin(selectedRole);
    };

    const selectDemoRole = (role: Role) => {
        setSelectedRole(role);
        setEmail(demoCredentials[role].email);
        setPassword(demoCredentials[role].password);
    };

    return (
        <div className="min-h-screen bg-[#f4f7fb] p-4 sm:p-8">
            <div className="mx-auto grid w-full max-w-6xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.08)] lg:grid-cols-[1.05fr_1fr]">
                <section className="border-b border-slate-200 bg-[linear-gradient(180deg,#f9fcff_0%,#edf6ff_100%)] p-6 sm:p-10 lg:border-b-0 lg:border-r">
                    <div className="mb-6 inline-flex rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
                        <div className="h-16 w-44 overflow-hidden rounded-xl bg-white p-1">
                            <img
                                src={clinicLogo}
                                alt="Clinique des Etangs"
                                className="h-full w-full object-cover object-center scale-125"
                            />
                        </div>
                    </div>

                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary-600">Clinique des Etangs</p>
                    <h1 className="mt-3 text-3xl font-extrabold leading-tight text-slate-900 sm:text-4xl">
                        Gestion clinique
                        <br />
                        plus fluide au quotidien
                    </h1>
                    <p className="mt-3 max-w-lg text-sm text-slate-600 sm:text-base">
                        Prototype MVP de test inspire des interfaces de sante: priorite a la lisibilite, a la vitesse et aux actions metier.
                    </p>
                </section>

                <section className="bg-white p-6 sm:p-10">
                    <div className="mx-auto w-full max-w-md">
                        <div className="mb-6">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-600">Connexion</p>
                            <h2 className="mt-2 text-2xl font-bold text-slate-900">Bienvenue</h2>
                            <p className="mt-1 text-sm text-slate-500">Utilisez un compte demo pour entrer dans la plateforme.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-6">
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-slate-700">
                                        Adresse email
                                    </label>
                                    <div className="relative">
                                        <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                        <input
                                            id="email"
                                            type="email"
                                            value={email}
                                            onChange={(event) => setEmail(event.target.value)}
                                            placeholder="prenom.nom@cliniquedesetangs.fr"
                                            className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-100"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-slate-700">
                                        Mot de passe
                                    </label>
                                    <div className="relative">
                                        <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                        <input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(event) => setPassword(event.target.value)}
                                            placeholder="Entrez votre mot de passe"
                                            className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-100"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword((value) => !value)}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-5">
                                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Profil</p>
                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                                    {demoUsers.map((user) => {
                                        const active = selectedRole === user.role;
                                        return (
                                            <button
                                                key={user.id}
                                                type="button"
                                                onClick={() => selectDemoRole(user.role)}
                                                className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-all ${active
                                                    ? 'border-primary-300 bg-primary-50 text-primary-700'
                                                    : 'border-slate-300 bg-white text-slate-600 hover:border-primary-200 hover:text-primary-700'
                                                    }`}
                                            >
                                                {roleIcons[user.role]}
                                                {roleTitles[user.role]}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="mt-4 flex items-center justify-between">
                                <label className="flex items-center gap-2 text-xs text-slate-500">
                                    <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500" defaultChecked />
                                    Se souvenir de moi
                                </label>
                                <span className="text-xs font-medium text-primary-600">Mot de passe oublie ?</span>
                            </div>

                            <button
                                type="submit"
                                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-primary-600/25 transition hover:bg-primary-700"
                            >
                                <ShieldCheck className="h-4 w-4" />
                                Se connecter (demo)
                            </button>

                            <p className="mt-3 text-center text-xs text-slate-500">
                                Connexion fictive pour environnement de test.
                            </p>
                        </form>

                    </div>
                </section>
            </div>
        </div>
    );
}
