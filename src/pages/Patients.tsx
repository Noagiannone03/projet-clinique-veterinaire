import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/layout';
import { SearchInput, Button, Badge, EmptyState } from '../components/ui';
import {
    Dog,
    Cat,
    Bird,
    Rabbit,
    AlertTriangle,
    ChevronRight,
    Syringe,
    Plus,
    PawPrint,
    ArrowRight,
    CalendarClock,
    ShieldAlert,
    Users,
    Calendar,
} from 'lucide-react';
import { useClinicData } from '../context/clinicState';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { AppointmentForm, PatientForm } from '../components/forms';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Appointment, Patient } from '../types';
import type { AppointmentFormData, PatientFormData } from '../schemas';

const speciesIcons = { dog: Dog, cat: Cat, bird: Bird, rabbit: Rabbit, other: Dog };
const speciesLabel: Record<string, string> = {
    dog: 'Chien',
    cat: 'Chat',
    bird: 'Oiseau',
    rabbit: 'Lapin',
    other: 'Autre',
};
const speciesColors: Record<string, { bg: string; text: string; ring: string }> = {
    dog: { bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-200' },
    cat: { bg: 'bg-fuchsia-50', text: 'text-fuchsia-700', ring: 'ring-fuchsia-200' },
    bird: { bg: 'bg-sky-50', text: 'text-sky-700', ring: 'ring-sky-200' },
    rabbit: { bg: 'bg-pink-50', text: 'text-pink-700', ring: 'ring-pink-200' },
    other: { bg: 'bg-slate-50', text: 'text-slate-700', ring: 'ring-slate-200' },
};

type WorkflowFilter = 'all' | 'today' | 'alerts' | 'vaccines' | 'no-upcoming';

function hasUpcomingVaccination(patient: Patient, days: number): boolean {
    const now = new Date();
    const target = new Date();
    target.setDate(target.getDate() + days);
    return patient.vaccinations.some((v) => {
        const due = new Date(v.nextDueDate);
        return due >= now && due <= target;
    });
}

function toAppointmentDateTime(appointment: Appointment): Date {
    return new Date(`${appointment.date}T${appointment.time}:00`);
}

export function Patients() {
    const { patients, appointments, addPatient, addAppointment } = useClinicData();
    const { role } = useAuth();
    const toast = useToast();
    const [searchQuery, setSearchQuery] = useState('');
    const [speciesFilter, setSpeciesFilter] = useState('all');
    const [workflowFilter, setWorkflowFilter] = useState<WorkflowFilter>(role === 'assistant' ? 'today' : 'all');
    const [showNewPatient, setShowNewPatient] = useState(false);
    const [showQuickAppointment, setShowQuickAppointment] = useState(false);
    const [quickAppointmentPatientId, setQuickAppointmentPatientId] = useState<string | null>(null);
    const [page, setPage] = useState(1);

    const pageSize = 15;
    const todayKey = format(new Date(), 'yyyy-MM-dd');

    const activeAppointments = useMemo(
        () => appointments.filter((a) => a.status !== 'cancelled'),
        [appointments]
    );

    const appointmentsByPatient = useMemo(() => {
        const map = new Map<string, Appointment[]>();
        activeAppointments.forEach((appointment) => {
            const existing = map.get(appointment.patientId) ?? [];
            existing.push(appointment);
            map.set(appointment.patientId, existing);
        });
        map.forEach((items, key) => {
            map.set(
                key,
                [...items].sort((a, b) => toAppointmentDateTime(a).getTime() - toAppointmentDateTime(b).getTime())
            );
        });
        return map;
    }, [activeAppointments]);

    const upcomingByPatient = useMemo(() => {
        const now = new Date();
        const map = new Map<string, Appointment | null>();
        patients.forEach((patient) => {
            const next =
                (appointmentsByPatient.get(patient.id) ?? []).find(
                    (a) => toAppointmentDateTime(a).getTime() >= now.getTime()
                ) ?? null;
            map.set(patient.id, next);
        });
        return map;
    }, [appointmentsByPatient, patients]);

    const hasTodayAppointment = useMemo(() => {
        const map = new Map<string, boolean>();
        patients.forEach((patient) => {
            map.set(
                patient.id,
                (appointmentsByPatient.get(patient.id) ?? []).some((a) => a.date === todayKey)
            );
        });
        return map;
    }, [appointmentsByPatient, patients, todayKey]);

    const filtered = useMemo(() => {
        const q = searchQuery.toLowerCase().trim();
        return patients
            .filter((patient) => {
                const matchesSearch =
                    !q ||
                    patient.name.toLowerCase().includes(q) ||
                    patient.owner.firstName.toLowerCase().includes(q) ||
                    patient.owner.lastName.toLowerCase().includes(q) ||
                    patient.breed.toLowerCase().includes(q) ||
                    patient.microchip?.toLowerCase().includes(q);
                const matchesSpecies = speciesFilter === 'all' || patient.species === speciesFilter;
                const highAlert = patient.alerts.some((a) => a.severity === 'high');
                const vaccineDue = hasUpcomingVaccination(patient, 60);
                const hasToday = hasTodayAppointment.get(patient.id) ?? false;
                const hasUpcoming = !!upcomingByPatient.get(patient.id);
                const matchesWorkflow =
                    workflowFilter === 'all' ||
                    (workflowFilter === 'today' && hasToday) ||
                    (workflowFilter === 'alerts' && highAlert) ||
                    (workflowFilter === 'vaccines' && vaccineDue) ||
                    (workflowFilter === 'no-upcoming' && !hasUpcoming);
                return matchesSearch && matchesSpecies && matchesWorkflow;
            })
            .sort((a, b) => {
                const aAlert = a.alerts.some((al) => al.severity === 'high') ? 1 : 0;
                const bAlert = b.alerts.some((al) => al.severity === 'high') ? 1 : 0;
                if (aAlert !== bAlert) return bAlert - aAlert;
                const aToday = hasTodayAppointment.get(a.id) ? 1 : 0;
                const bToday = hasTodayAppointment.get(b.id) ? 1 : 0;
                if (aToday !== bToday) return bToday - aToday;
                const aUpcoming = upcomingByPatient.get(a.id);
                const bUpcoming = upcomingByPatient.get(b.id);
                const aTime = aUpcoming ? toAppointmentDateTime(aUpcoming).getTime() : Number.POSITIVE_INFINITY;
                const bTime = bUpcoming ? toAppointmentDateTime(bUpcoming).getTime() : Number.POSITIVE_INFINITY;
                return aTime - bTime;
            });
    }, [hasTodayAppointment, patients, searchQuery, speciesFilter, upcomingByPatient, workflowFilter]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);
    const quickAppointmentPatient = patients.find((p) => p.id === quickAppointmentPatientId) ?? null;

    const patientsWithAlerts = patients.filter((p) => p.alerts.some((a) => a.severity === 'high')).length;
    const patientsWithTodayAppointments = Array.from(hasTodayAppointment.values()).filter(Boolean).length;
    const patientsWithoutUpcoming = patients.length - Array.from(upcomingByPatient.values()).filter(Boolean).length;
    const patientsWithVaccines = patients.filter((p) => hasUpcomingVaccination(p, 60)).length;

    const handleCreatePatient = (data: PatientFormData) => {
        addPatient({
            name: data.name,
            species: data.species,
            breed: data.breed,
            birthDate: data.birthDate,
            weight: data.weight,
            color: data.color,
            microchip: data.microchip,
            owner: { id: `own-${Date.now()}`, ...data.owner },
        });
        toast.success('Patient créé avec succès');
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
        toast.success('Rendez-vous planifié');
        setShowQuickAppointment(false);
    };

    return (
        <div>
            <Header title="Patients" subtitle={`${patients.length} patients enregistrés`} />

            <div className="space-y-5 p-4 sm:p-6">

                {/* ── Stat strip ── */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                        {
                            key: 'all',
                            label: 'Total patients',
                            value: patients.length,
                            Icon: Users,
                            color: 'text-slate-700',
                            bg: 'bg-slate-100',
                            iconColor: 'text-slate-500',
                        },
                        {
                            key: 'today',
                            label: "Aujourd'hui",
                            value: patientsWithTodayAppointments,
                            Icon: Calendar,
                            color: 'text-blue-700',
                            bg: 'bg-blue-100',
                            iconColor: 'text-blue-500',
                        },
                        {
                            key: 'alerts',
                            label: 'Alertes critiques',
                            value: patientsWithAlerts,
                            Icon: ShieldAlert,
                            color: 'text-rose-700',
                            bg: 'bg-rose-100',
                            iconColor: 'text-rose-500',
                        },
                        {
                            key: 'vaccines',
                            label: 'Vaccins à relancer',
                            value: patientsWithVaccines,
                            Icon: Syringe,
                            color: 'text-amber-700',
                            bg: 'bg-amber-100',
                            iconColor: 'text-amber-500',
                        },
                    ].map(({ key, label, value, Icon, color, bg, iconColor }) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => {
                                setWorkflowFilter(key as WorkflowFilter);
                                setPage(1);
                            }}
                            className={`flex items-center gap-3 rounded-2xl border bg-white p-4 text-left transition hover:shadow-sm ${
                                workflowFilter === key
                                    ? 'border-slate-300 shadow-sm ring-2 ring-slate-200'
                                    : 'border-slate-200 hover:border-slate-300'
                            }`}
                        >
                            <div className={`rounded-xl p-2.5 flex-shrink-0 ${bg}`}>
                                <Icon className={`h-4 w-4 ${iconColor}`} />
                            </div>
                            <div>
                                <p className={`text-2xl font-bold leading-none ${color}`}>{value}</p>
                                <p className="text-xs text-slate-500 mt-0.5 leading-tight">{label}</p>
                            </div>
                        </button>
                    ))}
                </div>

                {/* ── Filters + Table ── */}
                <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">

                    {/* Toolbar */}
                    <div className="border-b border-slate-100 p-4">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

                            {/* Search + species */}
                            <div className="flex flex-wrap items-center gap-2">
                                <SearchInput
                                    value={searchQuery}
                                    onChange={(value) => {
                                        setSearchQuery(value);
                                        setPage(1);
                                    }}
                                    placeholder="Nom, propriétaire, race, micropuce..."
                                    className="w-full sm:w-72"
                                />
                                <div className="flex flex-wrap gap-1">
                                    {[
                                        { value: 'all', label: 'Toutes espèces' },
                                        { value: 'dog', label: '🐕 Chiens' },
                                        { value: 'cat', label: '🐈 Chats' },
                                        { value: 'bird', label: '🐦 Oiseaux' },
                                        { value: 'rabbit', label: '🐇 Lapins' },
                                    ].map((item) => (
                                        <button
                                            key={item.value}
                                            type="button"
                                            onClick={() => {
                                                setSpeciesFilter(item.value);
                                                setPage(1);
                                            }}
                                            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                                                speciesFilter === item.value
                                                    ? 'border-slate-800 bg-slate-900 text-white'
                                                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                                            }`}
                                        >
                                            {item.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Workflow tabs */}
                            <div className="flex flex-wrap items-center gap-2">
                                {[
                                    { key: 'all', label: 'Tous', count: patients.length },
                                    { key: 'today', label: "Aujourd'hui", count: patientsWithTodayAppointments },
                                    { key: 'alerts', label: 'Alertes', count: patientsWithAlerts },
                                    { key: 'vaccines', label: 'Vaccins', count: patientsWithVaccines },
                                    { key: 'no-upcoming', label: 'Sans RDV', count: patientsWithoutUpcoming },
                                ].map((item) => (
                                    <button
                                        key={item.key}
                                        type="button"
                                        onClick={() => {
                                            setWorkflowFilter(item.key as WorkflowFilter);
                                            setPage(1);
                                        }}
                                        className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                                            workflowFilter === item.key
                                                ? 'border-teal-300 bg-teal-50 text-teal-700'
                                                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                                        }`}
                                    >
                                        {item.label}
                                        <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                                            workflowFilter === item.key ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-500'
                                        }`}>
                                            {item.count}
                                        </span>
                                    </button>
                                ))}
                                {(role === 'assistant' || role === 'veterinarian') && (
                                    <Button icon={<Plus className="h-4 w-4" />} onClick={() => setShowNewPatient(true)}>
                                        Nouveau patient
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    {paginated.length === 0 ? (
                        <div className="py-12">
                            <EmptyState
                                icon={<PawPrint className="h-8 w-8" />}
                                title="Aucun patient trouvé"
                                description="Modifiez vos filtres ou créez un nouveau patient"
                                actionLabel={role !== 'director' ? 'Nouveau patient' : undefined}
                                onAction={() => setShowNewPatient(true)}
                            />
                        </div>
                    ) : (
                        <>
                            {/* Desktop table */}
                            <div className="hidden lg:block">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-100 bg-slate-50/80">
                                            <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Patient</th>
                                            <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Propriétaire</th>
                                            <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Prochain RDV</th>
                                            <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Signaux</th>
                                            <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-400">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {paginated.map((patient) => {
                                            const Icon = speciesIcons[patient.species];
                                            const colors = speciesColors[patient.species];
                                            const next = upcomingByPatient.get(patient.id);
                                            const highAlert = patient.alerts.some((a) => a.severity === 'high');
                                            const vaccineDue = hasUpcomingVaccination(patient, 60);
                                            const hasToday = hasTodayAppointment.get(patient.id) ?? false;
                                            return (
                                                <tr key={patient.id} className="hover:bg-slate-50/70 transition-colors">
                                                    <td className="px-5 py-3.5">
                                                        <Link to={`/patients/${patient.id}`} className="flex items-center gap-3 group">
                                                            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ring-1 ${colors.bg} ${colors.ring} flex-shrink-0`}>
                                                                <Icon className={`h-5 w-5 ${colors.text}`} />
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-slate-900 group-hover:text-teal-700 transition-colors">{patient.name}</p>
                                                                <p className="text-xs text-slate-400">{patient.breed} · {speciesLabel[patient.species]}</p>
                                                            </div>
                                                        </Link>
                                                    </td>
                                                    <td className="px-5 py-3.5">
                                                        <p className="font-medium text-slate-800">{patient.owner.firstName} {patient.owner.lastName}</p>
                                                        {patient.owner.phone && (
                                                            <p className="text-xs text-slate-400">{patient.owner.phone}</p>
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-3.5">
                                                        {next ? (
                                                            <div>
                                                                <p className="font-bold text-slate-800">
                                                                    {format(toAppointmentDateTime(next), 'dd MMM', { locale: fr })} à {format(toAppointmentDateTime(next), 'HH:mm')}
                                                                </p>
                                                                <p className="text-xs text-slate-400">{next.veterinarian}</p>
                                                            </div>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 text-xs text-slate-400 bg-slate-100 rounded-lg px-2 py-1">
                                                                Aucun RDV futur
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-3.5">
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {highAlert && (
                                                                <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-600 ring-1 ring-rose-200">
                                                                    <AlertTriangle className="h-3 w-3" /> Critique
                                                                </span>
                                                            )}
                                                            {vaccineDue && (
                                                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-600 ring-1 ring-amber-200">
                                                                    <Syringe className="h-3 w-3" /> Vaccin
                                                                </span>
                                                            )}
                                                            {hasToday && (
                                                                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600 ring-1 ring-blue-200">
                                                                    Aujourd'hui
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-3.5">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <Link
                                                                to={`/patients/${patient.id}`}
                                                                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                                                            >
                                                                Fiche <ChevronRight className="h-3.5 w-3.5" />
                                                            </Link>
                                                            {(role === 'assistant' || role === 'veterinarian') && (
                                                                <Button
                                                                    size="sm"
                                                                    icon={<CalendarClock className="h-3.5 w-3.5" />}
                                                                    onClick={() => openQuickAppointment(patient.id)}
                                                                >
                                                                    RDV rapide
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile cards */}
                            <div className="grid grid-cols-1 gap-3 p-4 lg:hidden">
                                {paginated.map((patient) => {
                                    const Icon = speciesIcons[patient.species];
                                    const colors = speciesColors[patient.species];
                                    const next = upcomingByPatient.get(patient.id);
                                    const highAlert = patient.alerts.some((a) => a.severity === 'high');
                                    const vaccineDue = hasUpcomingVaccination(patient, 60);
                                    return (
                                        <div key={patient.id} className="rounded-xl border border-slate-200 bg-white p-4">
                                            <div className="flex items-start gap-3">
                                                <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ring-1 ${colors.bg} ${colors.ring}`}>
                                                    <Icon className={`h-5 w-5 ${colors.text}`} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <p className="font-bold text-slate-900">{patient.name}</p>
                                                        {highAlert && <AlertTriangle className="h-4 w-4 text-rose-500 flex-shrink-0" />}
                                                    </div>
                                                    <p className="text-xs text-slate-500">{patient.breed}</p>
                                                    <p className="text-xs text-slate-400 mt-0.5">
                                                        {patient.owner.firstName} {patient.owner.lastName}
                                                    </p>
                                                    {next && (
                                                        <p className="mt-1.5 text-xs font-semibold text-teal-700">
                                                            Prochain : {format(toAppointmentDateTime(next), 'dd MMM', { locale: fr })} à {format(toAppointmentDateTime(next), 'HH:mm')}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                                    {highAlert && <Badge variant="danger">Critique</Badge>}
                                                    {vaccineDue && <Badge variant="warning"><Syringe className="h-3 w-3 mr-0.5" />Vaccin</Badge>}
                                                </div>
                                            </div>
                                            <div className="mt-3 flex items-center justify-between pt-3 border-t border-slate-100">
                                                <Link
                                                    to={`/patients/${patient.id}`}
                                                    className="inline-flex items-center gap-1 text-xs font-bold text-teal-700"
                                                >
                                                    Voir la fiche <ArrowRight className="h-3.5 w-3.5" />
                                                </Link>
                                                {(role === 'assistant' || role === 'veterinarian') && (
                                                    <Button
                                                        size="sm"
                                                        icon={<CalendarClock className="h-3.5 w-3.5" />}
                                                        onClick={() => openQuickAppointment(patient.id)}
                                                    >
                                                        RDV rapide
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between border-t border-slate-100 p-4">
                            <p className="text-sm text-slate-500">
                                {filtered.length} patient{filtered.length !== 1 ? 's' : ''} · page {page}/{totalPages}
                            </p>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                                    Précédent
                                </Button>
                                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                                    Suivant
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <PatientForm isOpen={showNewPatient} onClose={() => setShowNewPatient(false)} onSubmit={handleCreatePatient} />
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
