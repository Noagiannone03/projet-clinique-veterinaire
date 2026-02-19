import { useMemo, useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin, { type EventResizeDoneArg } from '@fullcalendar/interaction';
import frLocale from '@fullcalendar/core/locales/fr';
import type { DateSelectArg, EventApi, EventClickArg, EventContentArg, EventDropArg } from '@fullcalendar/core';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
    Plus, X, Receipt, UserCheck, Stethoscope, CheckCircle,
    ChevronLeft, ChevronRight, Lock, Unlock, ArrowRight,
    Calendar as CalendarIcon,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AppointmentForm, InvoiceForm } from '../components/forms';
import { Button, SearchInput } from '../components/ui';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useToast } from '../components/ui/Toast';
import { useClinicData } from '../context/clinicState';
import { useAuth } from '../context/AuthContext';
import type { Appointment } from '../types';

type CalendarView = 'timeGridDay' | 'timeGridWeek' | 'dayGridMonth';

type ActionVariant = 'primary' | 'success';
interface AppointmentAction {
    label: string;
    icon: LucideIcon;
    onClick: () => void;
    variant: ActionVariant;
}

const statusColors: Record<Appointment['status'], {
    bg: string; text: string; border: string; dot: string; ring: string; hex: string;
}> = {
    scheduled:    { bg: 'bg-sky-50',     text: 'text-sky-700',     border: 'border-l-sky-400',     dot: 'bg-sky-400',     ring: 'ring-sky-200',     hex: '#38BDF8' },
    arrived:      { bg: 'bg-violet-50',  text: 'text-violet-700',  border: 'border-l-violet-400',  dot: 'bg-violet-500',  ring: 'ring-violet-200',  hex: '#7C3AED' },
    'in-progress':{ bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-l-amber-400',   dot: 'bg-amber-500',   ring: 'ring-amber-200',   hex: '#F59E0B' },
    completed:    { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-l-emerald-400', dot: 'bg-emerald-500', ring: 'ring-emerald-200', hex: '#10B981' },
    cancelled:    { bg: 'bg-rose-50',    text: 'text-rose-700',    border: 'border-l-rose-400',    dot: 'bg-rose-400',    ring: 'ring-rose-200',    hex: '#F43F5E' },
};

const statusLabel: Record<Appointment['status'], string> = {
    scheduled: 'Planifié', arrived: 'Arrivé', 'in-progress': 'En cours',
    completed: 'Terminé', cancelled: 'Annulé',
};

const typeInfo: Record<Appointment['type'], { icon: string; label: string }> = {
    consultation: { icon: '🩺', label: 'Consultation' },
    vaccination:  { icon: '💉', label: 'Vaccination' },
    surgery:      { icon: '🔪', label: 'Chirurgie' },
    'follow-up':  { icon: '👀', label: 'Suivi' },
    emergency:    { icon: '🚨', label: 'Urgence' },
};

const speciesEmoji: Record<Appointment['species'], string> = {
    dog: '🐕', cat: '🐈', bird: '🐦', rabbit: '🐇', other: '🐾',
};

const vetPalette = [
    { bg: 'bg-teal-100', text: 'text-teal-800', active: 'bg-teal-600 text-white' },
    { bg: 'bg-violet-100', text: 'text-violet-800', active: 'bg-violet-600 text-white' },
    { bg: 'bg-amber-100', text: 'text-amber-800', active: 'bg-amber-500 text-white' },
    { bg: 'bg-rose-100', text: 'text-rose-800', active: 'bg-rose-600 text-white' },
    { bg: 'bg-sky-100', text: 'text-sky-800', active: 'bg-sky-600 text-white' },
];

const pipelineSteps: Array<{ status: Appointment['status']; label: string; dot: string; ring: string; textColor: string }> = [
    { status: 'scheduled',    label: 'Planifié', dot: 'bg-sky-500',     ring: 'ring-sky-200',     textColor: 'text-sky-600' },
    { status: 'arrived',      label: 'Arrivé',   dot: 'bg-violet-500',  ring: 'ring-violet-200',  textColor: 'text-violet-600' },
    { status: 'in-progress',  label: 'En cours', dot: 'bg-amber-500',   ring: 'ring-amber-200',   textColor: 'text-amber-600' },
    { status: 'completed',    label: 'Terminé',  dot: 'bg-emerald-500', ring: 'ring-emerald-200', textColor: 'text-emerald-600' },
];

function getInitials(name: string): string {
    return name.split(' ').filter(Boolean).slice(-2).map((c) => c[0]).join('').toUpperCase();
}

function toAppointmentDateTime(a: Appointment): Date {
    return new Date(`${a.date}T${a.time}:00`);
}

function getPreferredVetName(userName: string | undefined, vets: string[]): string | null {
    if (!vets.length) return null;
    if (!userName) return vets[0];
    const low = userName.toLowerCase();
    const last = userName.split(' ').pop()?.toLowerCase() ?? '';
    return (
        vets.find((v) => low.includes(v.toLowerCase().replace('dr. ', '').trim())) ??
        vets.find((v) => last && v.toLowerCase().includes(last)) ??
        vets[0]
    );
}

export function Appointments() {
    const {
        patients, appointments,
        addAppointment, updateAppointmentStatus, updateAppointmentSchedule,
        updateAppointment, cancelAppointment, addInvoice,
    } = useClinicData();
    const { role, user } = useAuth();
    const toast = useToast();
    const calendarRef = useRef<FullCalendar>(null);

    /* ── Data ── */
    const activeAppointments = useMemo(
        () => appointments.filter((a) => a.status !== 'cancelled'),
        [appointments]
    );
    const availableVets = useMemo(
        () => Array.from(new Set(activeAppointments.map((a) => a.veterinarian))).sort(),
        [activeAppointments]
    );
    const preferredVetName = useMemo(
        () => (role === 'veterinarian' ? getPreferredVetName(user?.name, availableVets) : null),
        [role, user, availableVets]
    );

    /* ── State ── */
    const [view, setView] = useState<CalendarView>(role === 'veterinarian' ? 'timeGridDay' : 'timeGridWeek');
    const [date, setDate] = useState(new Date());
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [vetFilter, setVetFilter] = useState<string>(() =>
        role === 'veterinarian' ? preferredVetName ?? 'all' : 'all'
    );
    const [searchQuery, setSearchQuery] = useState('');
    const [focusMode, setFocusMode] = useState(role === 'veterinarian');
    const [showNewAppointment, setShowNewAppointment] = useState(false);
    const [showEditAppointment, setShowEditAppointment] = useState(false);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [pendingMove, setPendingMove] = useState<{
        id: string; date: string; time: string; duration: number;
        revert: () => void; description: string;
    } | null>(null);
    const [showInvoiceForm, setShowInvoiceForm] = useState(false);
    const [invoicePatientId, setInvoicePatientId] = useState<string | undefined>(undefined);

    /* ── Derived ── */
    const normalizedSearch = searchQuery.trim().toLowerCase();
    const filteredAppointments = useMemo(() =>
        activeAppointments.filter((a) => {
            const matchVet = vetFilter === 'all' || a.veterinarian === vetFilter;
            const matchSearch = !normalizedSearch
                || a.patientName.toLowerCase().includes(normalizedSearch)
                || a.ownerName.toLowerCase().includes(normalizedSearch)
                || a.veterinarian.toLowerCase().includes(normalizedSearch);
            return matchVet && matchSearch;
        }),
        [activeAppointments, normalizedSearch, vetFilter]
    );

    const calendarSource = focusMode && role === 'veterinarian' ? activeAppointments : filteredAppointments;

    const events = useMemo(() => calendarSource.map((a) => {
        const start = `${a.date}T${a.time}:00`;
        const endDate = new Date(`${a.date}T${a.time}:00`);
        endDate.setMinutes(endDate.getMinutes() + a.duration);
        const isDimmed = focusMode && role === 'veterinarian' && !!preferredVetName && a.veterinarian !== preferredVetName;
        return {
            id: a.id, title: a.patientName, start,
            end: format(endDate, "yyyy-MM-dd'T'HH:mm:ss"),
            extendedProps: { ...a, isDimmed },
            classNames: isDimmed ? ['opacity-20', 'grayscale'] : [],
        };
    }), [calendarSource, focusMode, preferredVetName, role]);

    const todayKey = format(new Date(), 'yyyy-MM-dd');
    const selectedDateKey = format(date, 'yyyy-MM-dd');

    const metricToday = useMemo(() => {
        const base = activeAppointments.filter((a) => a.date === todayKey);
        return role === 'veterinarian' && preferredVetName
            ? base.filter((a) => a.veterinarian === preferredVetName)
            : base;
    }, [activeAppointments, preferredVetName, role, todayKey]);

    const waitingRoom = useMemo(() =>
        activeAppointments
            .filter((a) => a.date === todayKey && a.status === 'arrived')
            .sort((a, b) => a.time.localeCompare(b.time)),
        [activeAppointments, todayKey]
    );

    const timelineAppts = useMemo(() =>
        filteredAppointments
            .filter((a) => a.date === selectedDateKey)
            .sort((a, b) => a.time.localeCompare(b.time)),
        [filteredAppointments, selectedDateKey]
    );

    const nextVetAppt = useMemo(() => {
        if (role !== 'veterinarian' || !preferredVetName) return null;
        const now = new Date();
        return activeAppointments
            .filter((a) => a.veterinarian === preferredVetName)
            .sort((a, b) => toAppointmentDateTime(a).getTime() - toAppointmentDateTime(b).getTime())
            .find((a) => toAppointmentDateTime(a).getTime() >= now.getTime()) ?? null;
    }, [activeAppointments, preferredVetName, role]);

    const selectedAppt = useMemo(
        () => appointments.find((a) => a.id === selectedId) ?? null,
        [appointments, selectedId]
    );
    const selectedPatient = useMemo(
        () => patients.find((p) => p.id === selectedAppt?.patientId) ?? null,
        [patients, selectedAppt]
    );

    /* ── Actions ── */
    const getActions = (apt: Appointment): AppointmentAction[] => {
        const a: AppointmentAction[] = [];
        if (apt.status === 'scheduled')
            a.push({ label: 'Marquer arrivé', icon: UserCheck, variant: 'primary', onClick: () => { updateAppointmentStatus(apt.id, 'arrived'); toast.success('Patient arrivé'); } });
        if (apt.status === 'arrived')
            a.push({ label: 'Démarrer la consultation', icon: Stethoscope, variant: 'primary', onClick: () => { updateAppointmentStatus(apt.id, 'in-progress'); toast.success('Consultation démarrée'); } });
        if (apt.status === 'in-progress')
            a.push({ label: 'Terminer', icon: CheckCircle, variant: 'success', onClick: () => { updateAppointmentStatus(apt.id, 'completed'); toast.success('Consultation terminée'); } });
        if (apt.status === 'completed')
            a.push({ label: 'Créer la facture', icon: Receipt, variant: 'primary', onClick: () => { setInvoicePatientId(apt.patientId); setShowInvoiceForm(true); } });
        return a;
    };

    const actionBtnClass = (apt: Appointment): string => {
        if (apt.status === 'scheduled') return 'bg-violet-600 hover:bg-violet-700 text-white';
        if (apt.status === 'arrived') return 'bg-amber-500 hover:bg-amber-600 text-white';
        if (apt.status === 'in-progress') return 'bg-emerald-600 hover:bg-emerald-700 text-white';
        return 'bg-indigo-600 hover:bg-indigo-700 text-white';
    };

    /* ── Calendar helpers ── */
    const syncDate = () => { const d = calendarRef.current?.getApi().getDate(); if (d) setDate(d); };
    const handlePrev   = () => { calendarRef.current?.getApi().prev();  syncDate(); };
    const handleNext   = () => { calendarRef.current?.getApi().next();  syncDate(); };
    const handleToday  = () => { calendarRef.current?.getApi().today(); setDate(new Date()); };
    const changeView   = (v: CalendarView) => { calendarRef.current?.getApi().changeView(v); setView(v); syncDate(); };

    const queueMove = (event: EventApi, revert: () => void) => {
        const apt = appointments.find((e) => e.id === event.id);
        if (!apt || !event.start) { revert(); return; }
        const dur = event.end && event.start
            ? Math.max(15, Math.round((event.end.getTime() - event.start.getTime()) / 60000))
            : apt.duration;
        setPendingMove({
            id: apt.id,
            date: format(event.start, 'yyyy-MM-dd'),
            time: format(event.start, 'HH:mm'),
            duration: dur, revert,
            description: `Déplacer ${apt.patientName} au ${format(event.start, 'dd/MM')} à ${format(event.start, 'HH:mm')} ?`,
        });
    };

    const renderEventContent = (arg: EventContentArg) => {
        const apt = arg.event.extendedProps as Appointment;
        const s = statusColors[apt.status];
        const mins = arg.event.end && arg.event.start
            ? (arg.event.end.getTime() - arg.event.start.getTime()) / 60000
            : apt.duration;
        return (
            <div className={`w-full h-full flex flex-col px-1.5 py-1 overflow-hidden border-l-[3px] rounded-r-md cursor-pointer ${s.bg} ${s.border} ${s.text}`}>
                <span className="text-[10px] font-bold opacity-60 leading-none">{format(arg.event.start ?? new Date(), 'HH:mm')}</span>
                <span className="font-bold text-[11px] mt-0.5 truncate">{speciesEmoji[apt.species]} {apt.patientName}</span>
                {mins > 30 && <span className="text-[10px] opacity-55 truncate">{typeInfo[apt.type].icon} {apt.veterinarian.split(' ').pop()}</span>}
            </div>
        );
    };

    /* ══════════════════════════════════════════════════════════
       RENDER — layout pleine hauteur, zero scroll de page
    ══════════════════════════════════════════════════════════ */
    return (
        <div className="flex flex-col overflow-hidden bg-slate-100" style={{ height: '100vh' }}>

            {/* ── Barre de contrôles ─────────────────────────────── */}
            <div className="flex-shrink-0 h-14 flex items-center gap-2 px-4 bg-white border-b border-slate-200 z-20">

                {/* Titre + date */}
                <div className="flex items-center gap-2.5 flex-shrink-0">
                    <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${role === 'veterinarian' ? 'bg-teal-50' : 'bg-indigo-50'}`}>
                        <CalendarIcon className={`h-4 w-4 ${role === 'veterinarian' ? 'text-teal-600' : 'text-indigo-600'}`} />
                    </div>
                    <div className="leading-tight hidden sm:block">
                        <p className="text-sm font-bold text-slate-900">{role === 'veterinarian' ? 'Mon planning' : 'Agenda'}</p>
                        <p className="text-[10px] text-slate-400 capitalize">
                            {format(date, 'EEEE dd MMM', { locale: fr })} · {metricToday.length} RDV
                        </p>
                    </div>
                </div>

                <div className="h-5 w-px bg-slate-200 flex-shrink-0 mx-1" />

                {/* Nav date */}
                <div className="flex items-center rounded-xl border border-slate-200 divide-x divide-slate-100 overflow-hidden flex-shrink-0">
                    <button type="button" onClick={handlePrev} className="p-2 hover:bg-slate-50 transition">
                        <ChevronLeft className="h-4 w-4 text-slate-500" />
                    </button>
                    <button type="button" onClick={handleToday} className="px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition">
                        Auj.
                    </button>
                    <button type="button" onClick={handleNext} className="p-2 hover:bg-slate-50 transition">
                        <ChevronRight className="h-4 w-4 text-slate-500" />
                    </button>
                </div>

                {/* Vue */}
                <div className="flex rounded-xl bg-slate-100 p-0.5 flex-shrink-0">
                    {([['timeGridDay', 'Jour'], ['timeGridWeek', 'Sem.'], ['dayGridMonth', 'Mois']] as [CalendarView, string][]).map(([v, label]) => (
                        <button key={v} type="button" onClick={() => changeView(v)}
                            className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition ${view === v ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                            {label}
                        </button>
                    ))}
                </div>

                {/* Filtres vétérinaires */}
                {availableVets.length > 0 && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                        {role !== 'veterinarian' && (
                            <button type="button" onClick={() => setVetFilter('all')}
                                className={`rounded-xl px-2.5 py-1.5 text-xs font-bold transition ${vetFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                                Tous
                            </button>
                        )}
                        {availableVets.map((vet, idx) => {
                            const p = vetPalette[idx % vetPalette.length];
                            const active = vetFilter === vet;
                            return (
                                <button key={vet} type="button" title={vet} onClick={() => setVetFilter(vet)}
                                    className={`h-8 w-8 rounded-xl flex items-center justify-center text-xs font-bold transition ${active ? p.active : `${p.bg} ${p.text} hover:brightness-95`}`}>
                                    {getInitials(vet)}
                                </button>
                            );
                        })}
                        {role === 'veterinarian' && (
                            <button type="button" title={focusMode ? 'Désactiver le focus' : 'Activer le focus'}
                                onClick={() => setFocusMode((s) => !s)}
                                className={`h-8 w-8 rounded-xl flex items-center justify-center transition ${focusMode ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>
                                {focusMode ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                            </button>
                        )}
                    </div>
                )}

                {/* Recherche */}
                <div className="flex-1 min-w-0 max-w-xs">
                    <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Rechercher…" className="w-full" />
                </div>

                {/* Nouveau RDV */}
                {role !== 'director' && (
                    <Button icon={<Plus className="h-4 w-4" />} onClick={() => setShowNewAppointment(true)} className="flex-shrink-0">
                        <span className="hidden sm:inline">Nouveau RDV</span>
                    </Button>
                )}
            </div>

            {/* ── Corps pleine hauteur ─────────────────────────────── */}
            <div className="flex-1 min-h-0 flex overflow-hidden">

                {/* ══ PANNEAU GAUCHE ══ */}
                <aside className="w-[272px] flex-shrink-0 flex flex-col bg-white border-r border-slate-200 overflow-hidden">

                    {/* Section rôle : salle d'attente ou prochain patient */}
                    {role === 'assistant' && (
                        <div className="flex-shrink-0 border-b border-slate-100">
                            <div className="flex items-center justify-between px-4 pt-3 pb-2">
                                <div className="flex items-center gap-1.5">
                                    <span className="h-2 w-2 rounded-full bg-violet-500 animate-pulse" />
                                    <span className="text-xs font-bold text-violet-900">Salle d'attente</span>
                                </div>
                                <span className="text-[10px] font-bold bg-violet-100 text-violet-700 rounded-full px-2 py-0.5">
                                    {waitingRoom.length}
                                </span>
                            </div>
                            <div className="px-3 pb-3 space-y-1 max-h-36 overflow-y-auto">
                                {waitingRoom.length === 0 ? (
                                    <p className="text-xs text-slate-400 text-center py-2 italic">Aucun patient en attente</p>
                                ) : waitingRoom.map((apt) => (
                                    <button key={apt.id} type="button" onClick={() => setSelectedId(apt.id)}
                                        className={`w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-left transition ${selectedId === apt.id ? 'bg-violet-50 ring-1 ring-violet-300' : 'hover:bg-slate-50'}`}>
                                        <span className="text-base">{speciesEmoji[apt.species]}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-slate-900 truncate">{apt.patientName}</p>
                                            <p className="text-[11px] text-slate-400">{apt.ownerName}</p>
                                        </div>
                                        <span className="text-xs font-bold text-violet-700 flex-shrink-0">{apt.time}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {role === 'veterinarian' && nextVetAppt && (
                        <div className="flex-shrink-0 border-b border-slate-100 px-3 pt-3 pb-3">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-teal-500 mb-2">Prochain patient</p>
                            <button type="button" onClick={() => setSelectedId(nextVetAppt.id)}
                                className="w-full flex items-center gap-3 rounded-xl bg-teal-50 border border-teal-200 px-3 py-2.5 text-left hover:bg-teal-100 transition">
                                <span className="text-2xl">{speciesEmoji[nextVetAppt.species]}</span>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-teal-900 text-sm">{nextVetAppt.patientName}</p>
                                    <p className="text-[11px] text-teal-600">{format(toAppointmentDateTime(nextVetAppt), 'HH:mm')} · {typeInfo[nextVetAppt.type].label}</p>
                                </div>
                                <ArrowRight className="h-4 w-4 text-teal-400 flex-shrink-0" />
                            </button>
                        </div>
                    )}

                    {/* Timeline */}
                    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                        <div className="flex-shrink-0 flex items-center justify-between px-4 pt-3 pb-2">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                Planning · {format(date, 'dd MMM', { locale: fr })}
                            </span>
                            <span className="text-[10px] font-bold bg-slate-100 text-slate-500 rounded-full px-2 py-0.5">
                                {timelineAppts.length}
                            </span>
                        </div>
                        <div className="flex-1 overflow-y-auto px-3 pb-2 space-y-1">
                            {timelineAppts.length === 0 ? (
                                <p className="text-xs text-slate-400 text-center py-6">Aucun rendez-vous ce jour</p>
                            ) : timelineAppts.map((apt) => {
                                const s = statusColors[apt.status];
                                return (
                                    <button key={apt.id} type="button" onClick={() => setSelectedId(apt.id)}
                                        className={`w-full flex items-center gap-2 rounded-xl px-3 py-2 text-left transition border-l-[3px] ${s.border} ${selectedId === apt.id ? `${s.bg} ring-1 ${s.ring}` : 'hover:bg-slate-50'}`}>
                                        <div className={`h-2 w-2 rounded-full flex-shrink-0 ${s.dot}`} />
                                        <span className="text-xs font-bold text-slate-500 w-9 flex-shrink-0">{apt.time}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-slate-900 truncate">{speciesEmoji[apt.species]} {apt.patientName}</p>
                                            <p className="text-[10px] text-slate-400 truncate">{typeInfo[apt.type].icon} {apt.veterinarian.split(' ').pop()}</p>
                                        </div>
                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${s.bg} ${s.text}`}>
                                            {statusLabel[apt.status]}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* ── Fiche du RDV sélectionné — TOUJOURS EN BAS, TOUJOURS VISIBLE ── */}
                    <div
                        className="flex-shrink-0 overflow-hidden transition-all"
                        style={{
                            borderTop: selectedAppt
                                ? `2px solid ${statusColors[selectedAppt.status].hex}`
                                : '1px solid #E2E8F0',
                        }}
                    >
                        {!selectedAppt ? (
                            <div className="py-3 px-4 flex items-center gap-2">
                                <CalendarIcon className="h-4 w-4 text-slate-300 flex-shrink-0" />
                                <p className="text-xs text-slate-400">Sélectionnez un rendez-vous</p>
                            </div>
                        ) : (
                            <div className="max-h-[260px] overflow-y-auto p-3 space-y-2.5">
                                {/* Patient */}
                                <div className="flex items-start gap-2.5">
                                    <span className="text-2xl leading-none flex-shrink-0">{speciesEmoji[selectedAppt.species]}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-slate-900 leading-tight">{selectedAppt.patientName}</p>
                                        <p className="text-[11px] text-slate-500">{selectedAppt.ownerName}</p>
                                        {selectedPatient && (
                                            <Link to={`/patients/${selectedPatient.id}`}
                                                className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-700 hover:text-teal-800 mt-0.5">
                                                Fiche <ArrowRight className="h-2.5 w-2.5" />
                                            </Link>
                                        )}
                                    </div>
                                    <button type="button" onClick={() => setSelectedId(null)} className="rounded-lg p-1 hover:bg-slate-100 flex-shrink-0">
                                        <X className="h-3.5 w-3.5 text-slate-400" />
                                    </button>
                                </div>

                                {/* Stepper */}
                                {selectedAppt.status !== 'cancelled' && (
                                    <div className="rounded-xl bg-slate-50 px-3 py-2.5">
                                        <div className="flex items-center">
                                            {pipelineSteps.map((step, idx) => {
                                                const stepIdx = pipelineSteps.findIndex((s) => s.status === selectedAppt.status);
                                                const isPast = idx < stepIdx;
                                                const isCurrent = step.status === selectedAppt.status;
                                                const isLast = idx === pipelineSteps.length - 1;
                                                return (
                                                    <div key={step.status} className={`flex items-center ${!isLast ? 'flex-1' : ''}`}>
                                                        <div className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${isCurrent ? `${step.dot} ring-2 ring-offset-1 ${step.ring}` : isPast ? 'bg-slate-400' : 'bg-slate-200'}`} />
                                                        {!isLast && <div className={`flex-1 h-0.5 ${isPast ? 'bg-slate-400' : 'bg-slate-200'}`} />}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <div className="flex justify-between mt-1">
                                            {pipelineSteps.map((step) => (
                                                <span key={step.status} className={`text-[8px] font-bold ${step.status === selectedAppt.status ? step.textColor : 'text-slate-400'}`}>
                                                    {step.label}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Meta */}
                                <div className="flex flex-wrap gap-1.5 text-[10px]">
                                    <span className="bg-slate-100 text-slate-700 rounded-lg px-2 py-1 font-semibold">
                                        {selectedAppt.time} · {selectedAppt.duration}min
                                    </span>
                                    <span className="bg-slate-100 text-slate-700 rounded-lg px-2 py-1 font-semibold">
                                        {typeInfo[selectedAppt.type].icon} {typeInfo[selectedAppt.type].label}
                                    </span>
                                    <span className="bg-slate-100 text-slate-700 rounded-lg px-2 py-1 font-semibold truncate max-w-full">
                                        {selectedAppt.veterinarian.replace('Dr. ', 'Dr ')}
                                    </span>
                                </div>

                                {/* Note */}
                                {selectedAppt.notes && (
                                    <p className="text-[11px] text-amber-800 bg-amber-50 rounded-xl p-2 border border-amber-100">
                                        {selectedAppt.notes}
                                    </p>
                                )}

                                {/* Action principale */}
                                {getActions(selectedAppt).map((action) => (
                                    <button key={action.label} type="button" onClick={action.onClick}
                                        className={`flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold transition ${actionBtnClass(selectedAppt)}`}>
                                        <action.icon className="h-4 w-4" />
                                        {action.label}
                                    </button>
                                ))}

                                {/* Modifier / Annuler */}
                                {role !== 'director' && selectedAppt.status !== 'completed' && selectedAppt.status !== 'cancelled' && (
                                    <div className="flex gap-1.5">
                                        <button type="button" onClick={() => setShowEditAppointment(true)}
                                            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-2 py-2 text-[11px] font-bold text-slate-600 hover:bg-slate-100 transition">
                                            Modifier
                                        </button>
                                        <button type="button" onClick={() => setShowCancelDialog(true)}
                                            className="flex-1 rounded-xl border border-rose-200 bg-rose-50 px-2 py-2 text-[11px] font-bold text-rose-600 hover:bg-rose-100 transition">
                                            Annuler RDV
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </aside>

                {/* ══ CALENDRIER ══ */}
                <div className="flex-1 min-w-0 overflow-hidden p-3">
                    <div className="h-full rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                        <FullCalendar
                            ref={calendarRef}
                            plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
                            locale={frLocale}
                            initialView={view}
                            headerToolbar={false}
                            height="100%"
                            editable={role !== 'director'}
                            selectable={role !== 'director'}
                            selectMirror
                            dayMaxEvents
                            weekends={false}
                            slotMinTime="08:00:00"
                            slotMaxTime="20:00:00"
                            allDaySlot={false}
                            nowIndicator
                            events={events}
                            select={(info: DateSelectArg) => { setDate(info.start); setShowNewAppointment(true); }}
                            eventClick={(info: EventClickArg) => setSelectedId(info.event.id)}
                            eventContent={renderEventContent}
                            eventDrop={(info: EventDropArg) => queueMove(info.event, info.revert)}
                            eventResize={(info: EventResizeDoneArg) => queueMove(info.event, info.revert)}
                            datesSet={(arg) => {
                                const current = calendarRef.current?.getApi().getDate();
                                setDate(current ?? arg.start);
                                setView(arg.view.type as CalendarView);
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* ── Modals ────────────────────────────────────────────── */}
            <AppointmentForm
                isOpen={showNewAppointment}
                onClose={() => setShowNewAppointment(false)}
                onSubmit={(data) => {
                    const p = patients.find((pt) => pt.id === data.patientId);
                    if (!p) { toast.error('Patient introuvable'); return; }
                    const r = addAppointment({ ...data, patientName: p.name, ownerName: `${p.owner.firstName} ${p.owner.lastName}`, species: p.species, duration: Number(data.duration) });
                    if (!r.ok) { toast.error(r.message); return; }
                    toast.success('Rendez-vous créé');
                    setShowNewAppointment(false);
                }}
                defaultDate={format(date, 'yyyy-MM-dd')}
            />

            {selectedAppt && (
                <AppointmentForm
                    isOpen={showEditAppointment}
                    onClose={() => setShowEditAppointment(false)}
                    onSubmit={(data) => {
                        const p = patients.find((pt) => pt.id === data.patientId);
                        if (!p) { toast.error('Patient introuvable'); return; }
                        updateAppointment(selectedAppt.id, { ...data, patientName: p.name, ownerName: `${p.owner.firstName} ${p.owner.lastName}`, species: p.species, duration: Number(data.duration) });
                        toast.success('Rendez-vous modifié');
                        setShowEditAppointment(false);
                    }}
                    appointment={selectedAppt}
                />
            )}

            {selectedAppt && showCancelDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowCancelDialog(false)}>
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
                    <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-slate-900">Annuler le rendez-vous</h3>
                            <button type="button" onClick={() => setShowCancelDialog(false)} className="rounded-lg p-1 hover:bg-slate-100"><X className="h-5 w-5 text-slate-400" /></button>
                        </div>
                        <p className="mb-3 text-sm font-semibold text-slate-700">Motif d'annulation</p>
                        <textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)}
                            className="mb-4 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200"
                            rows={3} placeholder="Entrez le motif…" />
                        <div className="flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>Retour</Button>
                            <Button variant="danger" disabled={!cancelReason.trim()} onClick={() => {
                                cancelAppointment(selectedAppt.id, cancelReason);
                                toast.success('Rendez-vous annulé');
                                setShowCancelDialog(false); setCancelReason(''); setSelectedId(null);
                            }}>Confirmer</Button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmDialog
                isOpen={!!pendingMove}
                onClose={() => { pendingMove?.revert(); setPendingMove(null); }}
                onConfirm={() => {
                    if (!pendingMove) return;
                    const r = updateAppointmentSchedule(pendingMove.id, { date: pendingMove.date, time: pendingMove.time, duration: pendingMove.duration });
                    if (!r.ok) { toast.error(r.message); pendingMove.revert(); setPendingMove(null); return; }
                    toast.success('Rendez-vous déplacé'); setPendingMove(null);
                }}
                title="Déplacer le rendez-vous"
                message={pendingMove?.description || ''}
                confirmLabel="Déplacer"
                variant="warning"
            />

            <InvoiceForm
                isOpen={showInvoiceForm}
                onClose={() => setShowInvoiceForm(false)}
                onSubmit={(data) => {
                    const p = patients.find((pt) => pt.id === data.patientId);
                    addInvoice({ patientId: data.patientId, date: new Date().toISOString().split('T')[0], dueDate: data.dueDate, lines: data.lines, patientName: p?.name ?? '', ownerName: p ? `${p.owner.firstName} ${p.owner.lastName}` : '' });
                    toast.success('Facture créée'); setShowInvoiceForm(false);
                }}
                defaultPatientId={invoicePatientId}
            />
        </div>
    );
}
