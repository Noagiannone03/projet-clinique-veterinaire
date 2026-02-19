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
    CheckCircle2,
    ShieldCheck,
} from 'lucide-react';
import type { Role } from '../types';
import clinicLogo from '../assets/logoclinique copie.png';

const roleIcons: Record<Role, React.ReactNode> = {
    director: <Briefcase className="h-5 w-5" />,
    veterinarian: <Stethoscope className="h-5 w-5" />,
    assistant: <Headset className="h-5 w-5" />,
};

const roleColors: Record<Role, { icon: string; ring: string; chip: string }> = {
    director: {
        icon: 'bg-primary-100 text-primary-700',
        ring: 'ring-primary-200',
        chip: 'bg-primary-600 text-white',
    },
    veterinarian: {
        icon: 'bg-secondary-100 text-secondary-700',
        ring: 'ring-secondary-200',
        chip: 'bg-secondary-600 text-white',
    },
    assistant: {
        icon: 'bg-primary-100 text-primary-700',
        ring: 'ring-primary-200',
        chip: 'bg-primary-600 text-white',
    },
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
        <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-primary-100 via-white to-secondary-100 p-4 sm:p-8">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-primary-300/35 blur-3xl" />
                <div className="absolute -right-32 top-20 h-80 w-80 rounded-full bg-secondary-300/40 blur-3xl" />
                <div className="absolute bottom-0 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-primary-200/35 blur-3xl" />
            </div>

            <div className="relative mx-auto flex w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white/90 shadow-2xl shadow-primary-900/10 backdrop-blur-xl lg:grid lg:grid-cols-2">
                <section className="relative overflow-hidden bg-gradient-to-br from-primary-700 via-primary-600 to-secondary-600 px-6 py-10 text-white sm:px-10 lg:p-12">
                    <div className="absolute right-0 top-0 h-44 w-44 translate-x-10 -translate-y-10 rounded-full bg-white/10 blur-2xl" />
                    <div className="absolute bottom-0 left-0 h-52 w-52 -translate-x-10 translate-y-12 rounded-full bg-white/10 blur-2xl" />

                    <div className="relative z-10">
                        <div className="mb-6 inline-flex rounded-2xl border border-white/20 bg-white/10 p-2">
                            <div className="h-16 w-44 overflow-hidden rounded-xl bg-white p-1">
                                <img
                                    src={clinicLogo}
                                    alt="Clinique des Etangs"
                                    className="h-full w-full object-cover object-center scale-125"
                                />
                            </div>
                        </div>

                        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/80">Espace clinique</p>
                        <h1 className="mt-3 text-3xl font-extrabold leading-tight sm:text-4xl">
                            Gestion veterinaire
                            <br />
                            simple et fiable
                        </h1>
                        <p className="mt-4 max-w-md text-sm text-primary-100 sm:text-base">
                            Interface de demonstration MVP inspiree des codes Doctolib: propre, lisible, et orientee operationnel.
                        </p>

                        <div className="mt-8 space-y-3">
                            <div className="flex items-start gap-3 rounded-xl border border-white/20 bg-white/10 p-3">
                                <CheckCircle2 className="mt-0.5 h-4 w-4 text-white" />
                                <p className="text-sm text-white/90">Flux clair: accueil, consultation, inventaire, facturation.</p>
                            </div>
                            <div className="flex items-start gap-3 rounded-xl border border-white/20 bg-white/10 p-3">
                                <CheckCircle2 className="mt-0.5 h-4 w-4 text-white" />
                                <p className="text-sm text-white/90">Acces role-based: direction, veto, assistante.</p>
                            </div>
                            <div className="flex items-start gap-3 rounded-xl border border-white/20 bg-white/10 p-3">
                                <CheckCircle2 className="mt-0.5 h-4 w-4 text-white" />
                                <p className="text-sm text-white/90">Connexion demo instantanee, sans backend.</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="bg-white p-6 sm:p-10">
                    <div className="mx-auto w-full max-w-md">
                        <div className="mb-6">
                            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary-600">Connexion</p>
                            <h2 className="mt-2 text-2xl font-extrabold text-slate-900">Bienvenue</h2>
                            <p className="mt-1 text-sm text-slate-500">Saisissez vos identifiants demo pour acceder a la plateforme.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 shadow-sm sm:p-6">
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
                                            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-100"
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
                                            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-100"
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
                                                    ? 'border-primary-300 bg-primary-50 text-primary-700 shadow-sm'
                                                    : 'border-slate-200 bg-white text-slate-600 hover:border-primary-200 hover:text-primary-700'
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
                                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-600 to-secondary-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-primary-500/25 transition hover:from-primary-700 hover:to-secondary-700"
                            >
                                <ShieldCheck className="h-4 w-4" />
                                Se connecter (demo)
                            </button>

                            <p className="mt-3 text-center text-xs text-slate-500">
                                Authentification fictive pour MVP de test.
                            </p>
                        </form>

                        <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Acces demo rapide</p>
                            <div className="mt-3 space-y-2">
                                {demoUsers.map((user) => {
                                    const colors = roleColors[user.role];
                                    return (
                                        <button
                                            key={`quick-${user.id}`}
                                            type="button"
                                            onClick={() => {
                                                selectDemoRole(user.role);
                                                runLogin(user.role);
                                            }}
                                            className={`flex w-full items-center justify-between rounded-xl border border-slate-200 px-3 py-2.5 text-left transition-all hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-md ${selectedRole === user.role ? `ring-2 ${colors.ring}` : ''}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${colors.icon}`}>
                                                    {roleIcons[user.role]}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                                                    <p className="text-xs text-slate-500">{user.description}</p>
                                                </div>
                                            </div>
                                            <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${colors.chip}`}>
                                                {roleTitles[user.role]}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
