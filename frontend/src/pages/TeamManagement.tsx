import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Briefcase, Headset, Mail, Plus, Power, PowerOff, RefreshCw, Stethoscope, UserRound, Users } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Badge, Button, Card, Input, Modal, Select, Textarea, useToast } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import type { Role, TeamMember } from '../types';

type TeamForm = {
    firstName: string;
    lastName: string;
    email: string;
    role: Role;
    password: string;
    description: string;
    active: boolean;
};

const emptyForm: TeamForm = {
    firstName: '',
    lastName: '',
    email: '',
    role: 'assistant',
    password: 'admin',
    description: '',
    active: true,
};

const roleLabels: Record<Role, string> = {
    director: 'Directeur',
    veterinarian: 'Veterinaire',
    assistant: 'Assistante',
};

const roleIcons: Record<Role, typeof Briefcase> = {
    director: Briefcase,
    veterinarian: Stethoscope,
    assistant: Headset,
};

export function TeamManagement() {
    const toast = useToast();
    const { user } = useAuth();
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [form, setForm] = useState<TeamForm>(emptyForm);

    const stats = useMemo(() => {
        return {
            total: members.length,
            active: members.filter((member) => member.active).length,
            veterinarians: members.filter((member) => member.role === 'veterinarian').length,
            assistants: members.filter((member) => member.role === 'assistant').length,
            disabled: members.filter((member) => !member.active).length,
        };
    }, [members]);

    const sortedMembers = useMemo(() => {
        const order: Record<Role, number> = { director: 0, veterinarian: 1, assistant: 2 };
        return [...members].sort((a, b) => order[a.role] - order[b.role] || a.lastName.localeCompare(b.lastName));
    }, [members]);

    useEffect(() => {
        void loadTeam();
    }, []);

    const loadTeam = async () => {
        try {
            setLoading(true);
            const data = await apiService.getTeamMembers();
            setMembers(data);
        } catch {
            toast.error("Impossible de charger l'equipe.");
        } finally {
            setLoading(false);
        }
    };

    const updateForm = <K extends keyof TeamForm>(key: K, value: TeamForm[K]) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const createMember = async (event: FormEvent) => {
        event.preventDefault();
        if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim() || !form.password.trim()) {
            toast.warning('Prenom, nom, email et mot de passe sont obligatoires.');
            return;
        }

        try {
            setSaving(true);
            const created = await apiService.createTeamMember({
                ...form,
                firstName: form.firstName.trim(),
                lastName: form.lastName.trim(),
                email: form.email.trim().toLowerCase(),
                description: form.description.trim(),
            });
            setMembers((prev) => [...prev, created]);
            setForm(emptyForm);
            setShowCreateModal(false);
            toast.success('Compte ajoute.');
        } catch (error: unknown) {
            const message = getApiErrorMessage(error) || 'Impossible de creer ce compte.';
            toast.error(message);
        } finally {
            setSaving(false);
        }
    };

    const toggleMember = async (member: TeamMember) => {
        try {
            const updated = await apiService.updateTeamMember(member.id, { active: !member.active });
            setMembers((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
            toast.success(updated.active ? 'Compte reactive.' : 'Compte coupe.');
        } catch {
            toast.error('Impossible de modifier ce compte.');
        }
    };

    return (
        <div>
            <Header title="Equipe" subtitle="Gestion des comptes internes de la clinique" />

            <main className="space-y-6 p-4 sm:p-6 lg:p-8">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">Comptes utilisateurs</h2>
                        <p className="text-sm text-slate-500">Les comptes coupes ne peuvent plus se connecter.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={loadTeam} loading={loading} icon={<RefreshCw className="h-4 w-4" />}>
                            Actualiser
                        </Button>
                        <Button onClick={() => setShowCreateModal(true)} icon={<Plus className="h-4 w-4" />}>
                            Ajouter
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                    <StatCard label="Comptes" value={stats.total} icon={Users} />
                    <StatCard label="Actifs" value={stats.active} icon={Power} tone="emerald" />
                    <StatCard label="Veterinaires" value={stats.veterinarians} icon={Stethoscope} tone="sky" />
                    <StatCard label="Assistantes" value={stats.assistants} icon={Headset} tone="violet" />
                    <StatCard label="Coupes" value={stats.disabled} icon={PowerOff} tone="rose" />
                </div>

                <Card padding="none" className="overflow-hidden rounded-xl">
                    <div className="hidden grid-cols-[1.6fr_1.2fr_0.8fr_0.8fr_auto] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase text-slate-500 md:grid">
                        <span>Membre</span>
                        <span>Email</span>
                        <span>Role</span>
                        <span>Statut</span>
                        <span className="text-right">Action</span>
                    </div>

                    {loading ? (
                        <div className="p-8 text-center text-sm text-slate-500">Chargement de l'equipe...</div>
                    ) : sortedMembers.length === 0 ? (
                        <div className="p-8 text-center text-sm text-slate-500">Aucun compte trouve.</div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {sortedMembers.map((member) => (
                                <TeamRow
                                    key={member.id}
                                    member={member}
                                    isCurrentUser={member.id === user?.id}
                                    onToggle={() => toggleMember(member)}
                                />
                            ))}
                        </div>
                    )}
                </Card>
            </main>

            <Modal
                isOpen={showCreateModal}
                onClose={() => {
                    if (!saving) {
                        setShowCreateModal(false);
                        setForm(emptyForm);
                    }
                }}
                title="Ajouter un compte"
                size="lg"
            >
                <form onSubmit={createMember} className="space-y-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Input label="Prenom" value={form.firstName} onChange={(event) => updateForm('firstName', event.target.value)} />
                        <Input label="Nom" value={form.lastName} onChange={(event) => updateForm('lastName', event.target.value)} />
                    </div>
                    <Input
                        label="Email"
                        type="email"
                        value={form.email}
                        onChange={(event) => updateForm('email', event.target.value)}
                        icon={<Mail className="h-4 w-4" />}
                    />
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Select
                            label="Role"
                            value={form.role}
                            onChange={(event) => updateForm('role', event.target.value as Role)}
                            options={[
                                { value: 'assistant', label: 'Assistante' },
                                { value: 'veterinarian', label: 'Veterinaire' },
                                { value: 'director', label: 'Directeur' },
                            ]}
                        />
                        <Input
                            label="Mot de passe initial"
                            value={form.password}
                            onChange={(event) => updateForm('password', event.target.value)}
                        />
                    </div>
                    <Textarea
                        label="Description"
                        value={form.description}
                        onChange={(event) => updateForm('description', event.target.value)}
                        placeholder="Ex: Accueil, chirurgie, consultations..."
                    />
                    <label className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-sm text-slate-700">
                        <input
                            type="checkbox"
                            checked={form.active}
                            onChange={(event) => updateForm('active', event.target.checked)}
                            className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                        />
                        Compte actif des la creation
                    </label>
                    <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setShowCreateModal(false);
                                setForm(emptyForm);
                            }}
                            disabled={saving}
                        >
                            Annuler
                        </Button>
                        <Button type="submit" loading={saving} icon={<Plus className="h-4 w-4" />}>
                            Creer le compte
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

function TeamRow({ member, isCurrentUser, onToggle }: { member: TeamMember; isCurrentUser: boolean; onToggle: () => void }) {
    const RoleIcon = roleIcons[member.role];

    return (
        <div className="grid gap-4 px-5 py-4 md:grid-cols-[1.6fr_1.2fr_0.8fr_0.8fr_auto] md:items-center">
            <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                    <RoleIcon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">{member.name}</p>
                    {member.description && <p className="truncate text-sm text-slate-500">{member.description}</p>}
                </div>
            </div>
            <div className="flex min-w-0 items-center gap-2 text-sm text-slate-600">
                <Mail className="h-4 w-4 shrink-0 text-slate-400" />
                <span className="truncate">{member.email}</span>
            </div>
            <div>
                <Badge variant="info">{roleLabels[member.role]}</Badge>
            </div>
            <div>
                <Badge variant={member.active ? 'success' : 'danger'}>{member.active ? 'Actif' : 'Coupe'}</Badge>
            </div>
            <div className="flex justify-start md:justify-end">
                <Button
                    variant={member.active ? 'danger' : 'outline'}
                    size="sm"
                    onClick={onToggle}
                    disabled={isCurrentUser}
                    icon={member.active ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                >
                    {isCurrentUser ? 'Vous' : member.active ? 'Couper' : 'Reactiver'}
                </Button>
            </div>
        </div>
    );
}

function StatCard({
    label,
    value,
    icon: Icon,
    tone = 'slate',
}: {
    label: string;
    value: number;
    icon: typeof UserRound;
    tone?: 'slate' | 'emerald' | 'sky' | 'violet' | 'rose';
}) {
    const tones = {
        slate: 'bg-slate-100 text-slate-700',
        emerald: 'bg-emerald-100 text-emerald-700',
        sky: 'bg-sky-100 text-sky-700',
        violet: 'bg-violet-100 text-violet-700',
        rose: 'bg-rose-100 text-rose-700',
    };

    return (
        <Card className="rounded-xl" padding="sm">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <p className="text-sm text-slate-500">{label}</p>
                    <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
                </div>
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tones[tone]}`}>
                    <Icon className="h-5 w-5" />
                </div>
            </div>
        </Card>
    );
}

function getApiErrorMessage(error: unknown): string | null {
    if (typeof error === 'object' && error !== null && 'response' in error) {
        const response = (error as { response?: { data?: { message?: string } } }).response;
        return response?.data?.message ?? null;
    }

    return null;
}
