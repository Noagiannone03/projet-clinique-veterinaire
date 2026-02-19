import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
    Dog,
    Cat,
    Bird,
    Rabbit,
    PawPrint,
    Users,
    CalendarDays,
    ShieldAlert,
    Syringe,
    Clock3,
    AlertTriangle,
    CalendarClock,
    Plus,
    ChevronRight,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Header } from '../components/layout';
import { SearchInput, Button, Badge, EmptyState } from '../components/ui';
import { AppointmentForm, PatientForm } from '../components/forms';
import { useClinicData } from '../context/clinicState';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import type { Appointment, Patient } from '../types';
import type { AppointmentFormData, PatientFormData } from '../schemas';

type WorkflowFilter = 'all' | 'today' | 'alerts' | 'vaccines' | 'no-upcoming';
type SpeciesFilter = 'all' | Patient['species'];

const speciesIcons: Record<Patient['species'], LucideIcon> = {
    dog: Dog,
    cat: Cat,
    bird: Bird,
    rabbit: Rabbit,
    other: PawPrint,
};

const speciesLabel: Record<Patient['species'], string> = {
    dog: 'Chien',
    cat: 'Chat',
    bird: 'Oiseau',
    rabbit: 'Lapin',
    other: 'Autre',
};

function hasUpcomingVaccination(patient: Patient, days: number): boolean {
    const now = new Date();
    const target = new Date();
    target.setDate(target.getDate() + days);
    return patient.vaccinations.some((v) => {
        const dueDate = new Date(v.nextDueDate);
        return dueDate >= now && dueDate <= target;
    });
}

function toAppointmentDateTime(appointment: Appointment): Date {
    return new Date(`${appointment.date}T${appointment.time}:00`);
}

function getPriorityLabel(hasHighAlert: boolean, hasToday: boolean, hasVaccineDue: boolean, hasUpcoming: boolean): {
    label: string;
    badge: 'danger' | 'warning' | 'info' | 'neutral';
} {
    if (hasHighAlert) return { label: 'Urgent', badge: 'danger' };
    if (hasToday) return { label: "Aujourd'hui", badge: 'info' };
    if (hasVaccineDue) return { label: 'Vaccin a relancer', badge: 'warning' };
    if (!hasUpcoming) return { label: 'A planifier', badge: 'neutral' };
    return { label: 'Suivi normal', badge: 'neutral' };
}

function getPatientPhotoUrl(patient: Patient): string {
    const keyword = patient.species === 'other' ? 'pet' : patient.species;
    const lock = patient.id.replace(/\D/g, '').slice(-6) || '42';
    return `https://loremflickr.com/640/420/${keyword}?lock=${lock}`;
}

export function Patients() {
    const { patients, appointments, addPatient, addAppointment } = useClinicData();
    const { role } = useAuth();
    const toast = useToast();

    const canManagePatients = role === 'assistant' || role === 'veterinarian';
    const pageSize = 12;
    const todayKey = format(new Date(), 'yyyy-MM-dd');

    const [searchQuery, setSearchQuery] = useState('');
    const [speciesFilter, setSpeciesFilter] = useState<SpeciesFilter>('all');
    const [workflowFilter, setWorkflowFilter] = useState<WorkflowFilter>(role === 'assistant' ? 'today' : 'all');
    const [page, setPage] = useState(1);
    const [showNewPatient, setShowNewPatient] = useState(false);
    const [showQuickAppointment, setShowQuickAppointment] = useState(false);
    const [quickAppointmentPatientId, setQuickAppointmentPatientId] = useState<string | null>(null);

    const activeAppointments = useMemo(
        () => appointments.filter((appointment) => appointment.status !== 'cancelled'),
        [appointments]
    );

    const appointmentsByPatient = useMemo(() => {
        const map = new Map<string, Appointment[]>();
        activeAppointments.forEach((appointment) => {
            const items = map.get(appointment.patientId) ?? [];
            items.push(appointment);
            map.set(appointment.patientId, items);
        });
        map.forEach((items, key) => {
            map.set(key, [...items].sort((a, b) => toAppointmentDateTime(a).getTime() - toAppointmentDateTime(b).getTime()));
        });
        return map;
    }, [activeAppointments]);

    const upcomingByPatient = useMemo(() => {
        const now = new Date();
        const map = new Map<string, Appointment | null>();
        patients.forEach((patient) => {
            const nextAppointment = (appointmentsByPatient.get(patient.id) ?? []).find(
                (appointment) => toAppointmentDateTime(appointment).getTime() >= now.getTime()
            ) ?? null;
            map.set(patient.id, nextAppointment);
        });
        return map;
    }, [appointmentsByPatient, patients]);

    const hasTodayAppointment = useMemo(() => {
        const map = new Map<string, boolean>();
        patients.forEach((patient) => {
            const hasToday = (appointmentsByPatient.get(patient.id) ?? []).some((appointment) => appointment.date === todayKey);
            map.set(patient.id, hasToday);
        });
        return map;
    }, [appointmentsByPatient, patients, todayKey]);

    const filteredPatients = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();
        return patients
            .filter((patient) => {
                const matchesSearch =
                    !query ||
                    patient.name.toLowerCase().includes(query) ||
                    patient.owner.firstName.toLowerCase().includes(query) ||
                    patient.owner.lastName.toLowerCase().includes(query) ||
                    patient.breed.toLowerCase().includes(query) ||
                    patient.microchip?.toLowerCase().includes(query);
                const matchesSpecies = speciesFilter === 'all' || patient.species === speciesFilter;

                const hasHighAlert = patient.alerts.some((alert) => alert.severity === 'high');
                const hasVaccineDue = hasUpcomingVaccination(patient, 60);
                const hasToday = hasTodayAppointment.get(patient.id) ?? false;
                const hasUpcoming = !!upcomingByPatient.get(patient.id);
                const matchesWorkflow =
                    workflowFilter === 'all' ||
                    (workflowFilter === 'today' && hasToday) ||
                    (workflowFilter === 'alerts' && hasHighAlert) ||
                    (workflowFilter === 'vaccines' && hasVaccineDue) ||
                    (workflowFilter === 'no-upcoming' && !hasUpcoming);

                return matchesSearch && matchesSpecies && matchesWorkflow;
            })
            .sort((a, b) => {
                const aCritical = a.alerts.some((alert) => alert.severity === 'high') ? 1 : 0;
                const bCritical = b.alerts.some((alert) => alert.severity === 'high') ? 1 : 0;
                if (aCritical !== bCritical) return bCritical - aCritical;

                const aToday = hasTodayAppointment.get(a.id) ? 1 : 0;
                const bToday = hasTodayAppointment.get(b.id) ? 1 : 0;
                if (aToday !== bToday) return bToday - aToday;

                const nextA = upcomingByPatient.get(a.id);
                const nextB = upcomingByPatient.get(b.id);
                const timeA = nextA ? toAppointmentDateTime(nextA).getTime() : Number.POSITIVE_INFINITY;
                const timeB = nextB ? toAppointmentDateTime(nextB).getTime() : Number.POSITIVE_INFINITY;
                if (timeA !== timeB) return timeA - timeB;

                return a.name.localeCompare(b.name);
            });
    }, [hasTodayAppointment, patients, searchQuery, speciesFilter, upcomingByPatient, workflowFilter]);

    const totalPages = Math.max(1, Math.ceil(filteredPatients.length / pageSize));
    const currentPage = Math.min(page, totalPages);
    const paginatedPatients = filteredPatients.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    const quickAppointmentPatient = patients.find((patient) => patient.id === quickAppointmentPatientId) ?? null;

    const countAlerts = patients.filter((patient) => patient.alerts.some((alert) => alert.severity === 'high')).length;
    const countToday = Array.from(hasTodayAppointment.values()).filter(Boolean).length;
    const countVaccines = patients.filter((patient) => hasUpcomingVaccination(patient, 60)).length;
    const countNoUpcoming = patients.length - Array.from(upcomingByPatient.values()).filter(Boolean).length;

    const handleCreatePatient = (data: PatientFormData) => {
        addPatient({
            name: data.name,
            species: data.species,
            breed: data.breed,
            birthDate: data.birthDate,
            weight: data.weight,
            color: data.color,
            microchip: data.microchip,
            owner: { id: `owner-${Date.now()}`, ...data.owner },
        });
        toast.success('Patient cree avec succes');
    };

    const openQuickAppointment = (patientId: string) => {
        setQuickAppointmentPatientId(patientId);
        setShowQuickAppointment(true);
    };

    const handleQuickAppointment = (data: AppointmentFormData) => {
        const patient = patients.find((entry) => entry.id === data.patientId);
        if (!patient) {
            toast.error('Patient introuvable');
            return;
        }

        const result = addAppointment({
            ...data,
            patientId: patient.id,
            patientName: patient.name,
            ownerName: `${patient.owner.firstName} ${patient.owner.lastName}`,
            species: patient.species,
            duration: Number(data.duration),
        });

        if (!result.ok) {
            toast.error(result.message);
            return;
        }

        toast.success('Rendez-vous planifie');
        setShowQuickAppointment(false);
    };

    return (
        <div>
            <Header title="Base patients" subtitle={`${patients.length} dossiers actifs`} />

            <div className="space-y-6 p-4 sm:p-6">
                <section className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                        <div className="w-full xl:max-w-xl">
                            <SearchInput
                                value={searchQuery}
                                onChange={(value) => {
                                    setSearchQuery(value);
                                    setPage(1);
                                }}
                                placeholder="Chercher un patient, un proprietaire, une micropuce..."
                                className="w-full"
                            />
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                                {filteredPatients.length} resultat{filteredPatients.length > 1 ? 's' : ''}
                            </span>
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchQuery('');
                                    setSpeciesFilter('all');
                                    setWorkflowFilter('all');
                                    setPage(1);
                                }}
                                className="inline-flex items-center rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                            >
                                Reinitialiser
                            </button>
                            {canManagePatients && (
                                <Button icon={<Plus className="h-4 w-4" />} onClick={() => setShowNewPatient(true)}>
                                    Nouveau patient
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                        {[
                            { key: 'all', label: 'Tous', count: patients.length, Icon: Users },
                            { key: 'today', label: "Aujourd'hui", count: countToday, Icon: CalendarDays },
                            { key: 'alerts', label: 'Alertes', count: countAlerts, Icon: ShieldAlert },
                            { key: 'vaccines', label: 'Vaccins', count: countVaccines, Icon: Syringe },
                            { key: 'no-upcoming', label: 'Sans RDV', count: countNoUpcoming, Icon: Clock3 },
                        ].map((item) => (
                            <button
                                key={item.key}
                                type="button"
                                onClick={() => {
                                    setWorkflowFilter(item.key as WorkflowFilter);
                                    setPage(1);
                                }}
                                className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-all ${workflowFilter === item.key
                                    ? 'border-primary-300 bg-primary-50 text-primary-700'
                                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                                    }`}
                            >
                                <item.Icon className="h-3.5 w-3.5" />
                                {item.label}
                                <span className={`rounded-md px-1.5 py-0.5 text-[10px] ${workflowFilter === item.key ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-500'}`}>
                                    {item.count}
                                </span>
                            </button>
                        ))}
                    </div>

                    <div className="mt-2 flex flex-wrap gap-1">
                        {[
                            { key: 'all', label: 'Toutes' },
                            { key: 'dog', label: 'Chiens' },
                            { key: 'cat', label: 'Chats' },
                            { key: 'bird', label: 'Oiseaux' },
                            { key: 'rabbit', label: 'Lapins' },
                            { key: 'other', label: 'Autres' },
                        ].map((item) => (
                            <button
                                key={item.key}
                                type="button"
                                onClick={() => {
                                    setSpeciesFilter(item.key as SpeciesFilter);
                                    setPage(1);
                                }}
                                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${speciesFilter === item.key
                                    ? 'border-slate-800 bg-slate-900 text-white'
                                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                                    }`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                </section>

                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    <div className="border-b border-slate-100 px-4 py-3">
                        <p className="text-base font-semibold text-slate-900">Patients</p>
                    </div>

                    {paginatedPatients.length === 0 ? (
                        <div className="py-12">
                            <EmptyState
                                icon={<PawPrint className="h-8 w-8" />}
                                title="Aucun patient trouve"
                                description="Ajustez vos filtres ou creez un nouveau dossier patient."
                                actionLabel={canManagePatients ? 'Nouveau patient' : undefined}
                                onAction={canManagePatients ? () => setShowNewPatient(true) : undefined}
                            />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                            {paginatedPatients.map((patient) => {
                                const Icon = speciesIcons[patient.species];
                                const nextAppointment = upcomingByPatient.get(patient.id);
                                const hasHighAlert = patient.alerts.some((alert) => alert.severity === 'high');
                                const hasVaccineDue = hasUpcomingVaccination(patient, 60);
                                const hasToday = hasTodayAppointment.get(patient.id) ?? false;
                                const priority = getPriorityLabel(hasHighAlert, hasToday, hasVaccineDue, !!nextAppointment);
                                const photoUrl = getPatientPhotoUrl(patient);

                                    return (
                                        <article
                                            key={patient.id}
                                            className={`rounded-xl border bg-white p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${hasHighAlert ? 'border-rose-200' : 'border-slate-200'}`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="relative h-20 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100">
                                                    <img
                                                        src={photoUrl}
                                                        alt={`Photo de ${patient.name}`}
                                                        loading="lazy"
                                                        className="h-full w-full object-cover"
                                                        onError={(event) => {
                                                            event.currentTarget.src = `https://picsum.photos/seed/${patient.id}-pet/640/420`;
                                                        }}
                                                    />
                                                    <div className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded bg-white/90 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700">
                                                        <Icon className="h-3 w-3" />
                                                        {speciesLabel[patient.species]}
                                                    </div>
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <Link to={`/patients/${patient.id}`} className="text-sm font-bold text-slate-900 transition hover:text-primary-700">
                                                        {patient.name}
                                                    </Link>
                                                    <p className="truncate text-xs text-slate-500">{patient.breed}</p>
                                                    <p className="mt-1 truncate text-xs text-slate-600">{patient.owner.firstName} {patient.owner.lastName}</p>
                                                    <p className="truncate text-xs text-slate-500">{patient.owner.phone || 'Tel non renseigne'}</p>
                                                    {nextAppointment ? (
                                                        <p className="mt-1 truncate text-xs font-semibold text-slate-700">
                                                            RDV: {format(toAppointmentDateTime(nextAppointment), 'dd MMM HH:mm', { locale: fr })}
                                                        </p>
                                                    ) : (
                                                        <p className="mt-1 text-xs font-semibold text-secondary-700">RDV non planifie</p>
                                                    )}
                                                </div>
                                                <div className="ml-1">
                                                    <Badge variant={priority.badge}>{priority.label}</Badge>
                                                </div>
                                            </div>

                                            <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                                {hasHighAlert && (
                                                    <Badge variant="danger">
                                                        <AlertTriangle className="h-3 w-3" />
                                                        Critique
                                                    </Badge>
                                                )}
                                                {hasVaccineDue && (
                                                    <Badge variant="warning">
                                                        <Syringe className="h-3 w-3" />
                                                        Vaccin
                                                    </Badge>
                                                )}
                                                {hasToday && <Badge variant="info">Aujourd&apos;hui</Badge>}
                                                {!hasHighAlert && !hasVaccineDue && !hasToday && (
                                                    <span className="text-xs text-slate-400">RAS</span>
                                                )}
                                            </div>

                                            <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2">
                                                <Link
                                                    to={`/patients/${patient.id}`}
                                                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary-700"
                                                >
                                                    Voir fiche
                                                    <ChevronRight className="h-3.5 w-3.5" />
                                                </Link>
                                                {canManagePatients && (
                                                    <button
                                                        type="button"
                                                        onClick={() => openQuickAppointment(patient.id)}
                                                        className="inline-flex items-center gap-1 rounded-md border border-primary-200 bg-primary-50 px-2 py-1 text-xs font-semibold text-primary-700 transition hover:bg-primary-100"
                                                    >
                                                        <CalendarClock className="h-3.5 w-3.5" />
                                                        Planifier
                                                    </button>
                                                )}
                                            </div>
                                        </article>
                                    );
                                })}
                        </div>
                    )}

                    {totalPages > 1 && (
                        <div className="flex items-center justify-between border-t border-slate-100 p-4">
                            <p className="text-sm text-slate-500">
                                {filteredPatients.length} patient{filteredPatients.length > 1 ? 's' : ''} · page {currentPage}/{totalPages}
                            </p>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={currentPage <= 1}
                                    onClick={() => setPage(Math.max(1, currentPage - 1))}
                                >
                                    Precedent
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={currentPage >= totalPages}
                                    onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
                                >
                                    Suivant
                                </Button>
                            </div>
                        </div>
                    )}
                </section>
            </div>

            <PatientForm
                isOpen={showNewPatient}
                onClose={() => setShowNewPatient(false)}
                onSubmit={handleCreatePatient}
            />

            <AppointmentForm
                isOpen={showQuickAppointment}
                onClose={() => setShowQuickAppointment(false)}
                onSubmit={handleQuickAppointment}
                defaultPatientId={quickAppointmentPatient?.id}
                defaultDate={todayKey}
            />
        </div>
    );
}
