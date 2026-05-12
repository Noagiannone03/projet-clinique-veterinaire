import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    Mail,
    Lock,
    Eye,
    EyeOff,
    ShieldCheck,
} from 'lucide-react';
// Role import removed
// clinicLogo import removed

// Removed unused role constants

export function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);
        setIsSubmitting(true);
        
        try {
            const result = await login(email, password);
            if (result.ok) {
                // Determine redirect based on role stored in local storage or returned by login
                const role = localStorage.getItem('vetcare_role');
                navigate(role === 'director' ? '/' : '/clinic');
            } else {
                setError(result.message || 'Identifiants invalides');
            }
        } catch (err) {
            setError('Une erreur est survenue lors de la connexion');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f4f7fb] p-4 sm:p-8">
            <div className="mx-auto grid w-full max-w-6xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.08)] lg:grid-cols-[1.05fr_1fr]">
                <section className="border-b border-slate-200 bg-[linear-gradient(180deg,#f9fcff_0%,#edf6ff_100%)] p-6 sm:p-10 lg:border-b-0 lg:border-r">
                    <div className="mb-6 inline-flex rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
                        <div className="h-16 w-44 overflow-hidden rounded-xl bg-white p-1">
                            <img
                                src="/logo.png"
                                alt="Clinique des Etangs"
                                className="h-full w-full object-contain"
                            />
                        </div>
                    </div>

                    <h1 className="text-3xl font-extrabold leading-tight text-slate-900 sm:text-4xl">Clinique des Etangs</h1>
                    <p className="mt-4 text-lg text-slate-600 max-w-md">Système de gestion vétérinaire complet pour le suivi des patients, du stock et de la facturation.</p>
                </section>

                <section className="bg-white p-6 sm:p-10">
                    <div className="mx-auto w-full max-w-md">
                        <div className="mb-6">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-600">Portail Interne</p>
                            <h2 className="mt-2 text-2xl font-bold text-slate-900">Connexion</h2>
                            <p className="mt-1 text-sm text-slate-500">Veuillez entrer vos identifiants pour accéder à votre espace.</p>
                        </div>

                        {error && (
                            <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-600 border border-red-100">
                                {error}
                            </div>
                        )}

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
                                            required
                                            value={email}
                                            onChange={(event) => setEmail(event.target.value)}
                                            placeholder="votre.email@clinique-etangs.fr"
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
                                            required
                                            value={password}
                                            onChange={(event) => setPassword(event.target.value)}
                                            placeholder="••••••••"
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

                            <div className="mt-4 flex items-center justify-between">
                                <label className="flex items-center gap-2 text-xs text-slate-500 cursor-pointer">
                                    <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500" />
                                    Se souvenir de moi
                                </label>
                                <button type="button" className="text-xs font-medium text-primary-600 hover:underline">Mot de passe oublié ?</button>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-primary-600/25 transition hover:bg-primary-700 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                <ShieldCheck className="h-4 w-4" />
                                {isSubmitting ? 'Connexion...' : 'Se connecter'}
                            </button>
                        </form>

                        <p className="mt-6 text-center text-xs text-slate-500">
                            Accès réservé au personnel de la Clinique des Étangs.
                        </p>
                    </div>
                </section>
            </div>
        </div>
    );
}
