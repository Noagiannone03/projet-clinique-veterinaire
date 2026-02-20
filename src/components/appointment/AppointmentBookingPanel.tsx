import { useState, useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    X, Search, Plus, ChevronRight, ChevronLeft, Check,
    Calendar, Clock, Stethoscope, User, AlertTriangle,
    CheckCircle, ArrowRight, PawPrint, UserPlus,
    Syringe, Scissors, RotateCcw, Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useClinicData } from '../../context/clinicState';
import { patientSchema, type PatientFormData } from '../../schemas';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import type { Patient, Appointment } from '../../types';

interface AppointmentBookingPanelProps {
    isOpen: boolean;
    onClose: () => void;
    onBooked: () => void;
    defaultDate?: string;
}

type Step = 1 | 2 | 3;

const speciesEmoji: Record<string, string> = {
    dog: '\uD83D\uDC15', cat: '\uD83D\uDC08', bird: '\uD83D\uDC26', rabbit: '\uD83D\uDC07', other: '\uD83D\uDC3E',
};
const speciesLabel: Record<string, string> = {
    dog: 'Chien', cat: 'Chat', bird: 'Oiseau', rabbit: 'Lapin', other: 'Autre',
};
const speciesOptions = [
    { value: 'dog', label: 'Chien' },
    { value: 'cat', label: 'Chat' },
    { value: 'bird', label: 'Oiseau' },
    { value: 'rabbit', label: 'Lapin' },
    { value: 'other', label: 'Autre' },
];

interface TypeOption {
    value: string;
    label: string;
    Icon: LucideIcon;
    duration: number;
    color: string;
    bg: string;
    activeBg: string;
    activeText: string;
    activeBorder: string;
}

const typeOptions: TypeOption[] = [
    { value: 'consultation', label: 'Consultation', Icon: Stethoscope, duration: 30, color: 'text-primary-500', bg: 'bg-primary-50', activeBg: 'bg-primary-50', activeText: 'text-primary-700', activeBorder: 'border-primary-400' },
    { value: 'vaccination', label: 'Vaccination', Icon: Syringe, duration: 15, color: 'text-secondary-600', bg: 'bg-secondary-50', activeBg: 'bg-secondary-50', activeText: 'text-secondary-700', activeBorder: 'border-secondary-400' },
    { value: 'surgery', label: 'Chirurgie', Icon: Scissors, duration: 90, color: 'text-rose-500', bg: 'bg-rose-50', activeBg: 'bg-rose-50', activeText: 'text-rose-700', activeBorder: 'border-rose-400' },
    { value: 'follow-up', label: 'Suivi', Icon: RotateCcw, duration: 15, color: 'text-slate-500', bg: 'bg-slate-50', activeBg: 'bg-slate-100', activeText: 'text-slate-700', activeBorder: 'border-slate-400' },
    { value: 'emergency', label: 'Urgence', Icon: Zap, duration: 30, color: 'text-amber-500', bg: 'bg-amber-50', activeBg: 'bg-amber-50', activeText: 'text-amber-700', activeBorder: 'border-amber-400' },
];

const vetOptions = [
    { value: 'Dr. Martin', label: 'Dr. Martin' },
    { value: 'Dr. Leroy', label: 'Dr. Leroy' },
];

const durationOptions = [
    { value: '15', label: '15 min' },
    { value: '30', label: '30 min' },
    { value: '45', label: '45 min' },
    { value: '60', label: '1h' },
    { value: '90', label: '1h30' },
    { value: '120', label: '2h' },
];

const stepLabels = ['Patient', 'Rendez-vous', 'Confirmation'] as const;

export function AppointmentBookingPanel({ isOpen, onClose, onBooked, defaultDate }: AppointmentBookingPanelProps) {
    const { patients, appointments, addPatient, addAppointment } = useClinicData();

    // ── Step state ──
    const [step, setStep] = useState<Step>(1);

    // ── Step 1: Patient ──
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [showNewPatient, setShowNewPatient] = useState(false);

    // ── Step 2: Appointment details ──
    const [aptDate, setAptDate] = useState(defaultDate || new Date().toISOString().split('T')[0]);
    const [aptTime, setAptTime] = useState('');
    const [aptDuration, setAptDuration] = useState('30');
    const [aptType, setAptType] = useState<Appointment['type']>('consultation');
    const [aptVet, setAptVet] = useState('');
    const [aptNotes, setAptNotes] = useState('');

    // ── Completion ──
    const [completed, setCompleted] = useState(false);
    const [conflictWarning, setConflictWarning] = useState<{ message: string; conflict: Appointment } | null>(null);

    // ── Patient form ──
    const patientForm = useForm<PatientFormData>({
        resolver: zodResolver(patientSchema),
    });

    // ── Helpers ──
    const currentType = typeOptions.find((t) => t.value === aptType);

    // ── Search patients ──
    const filteredPatients = useMemo(() => {
        if (!searchQuery.trim()) return patients.slice(0, 20);
        const q = searchQuery.toLowerCase();
        return patients.filter((p) =>
            p.name.toLowerCase().includes(q)
            || p.owner.lastName.toLowerCase().includes(q)
            || p.owner.firstName.toLowerCase().includes(q)
            || p.owner.phone.includes(q)
        );
    }, [patients, searchQuery]);

    // ── Conflict detection ──
    const conflict = useMemo(() => {
        if (!aptDate || !aptTime || !aptVet) return null;
        const duration = Number(aptDuration);
        const newStart = new Date(`${aptDate}T${aptTime}:00`);
        const newEnd = new Date(newStart.getTime() + duration * 60000);

        return appointments.find((a) => {
            if (a.status === 'cancelled') return false;
            if (a.veterinarian !== aptVet || a.date !== aptDate) return false;
            const existStart = new Date(`${a.date}T${a.time}:00`);
            const existEnd = new Date(existStart.getTime() + a.duration * 60000);
            return newStart < existEnd && newEnd > existStart;
        }) ?? null;
    }, [appointments, aptDate, aptTime, aptVet, aptDuration]);

    const suggestNextSlot = useCallback(() => {
        if (!conflict) return;
        const conflictEnd = new Date(`${conflict.date}T${conflict.time}:00`);
        conflictEnd.setMinutes(conflictEnd.getMinutes() + conflict.duration);
        setAptTime(`${String(conflictEnd.getHours()).padStart(2, '0')}:${String(conflictEnd.getMinutes()).padStart(2, '0')}`);
    }, [conflict]);

    // ── Patient age helper ──
    const getAge = (birthDate: string) => {
        const birth = new Date(birthDate);
        const now = new Date();
        const years = Math.floor((now.getTime() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
        if (years > 0) return `${years} an${years > 1 ? 's' : ''}`;
        return `${Math.floor((now.getTime() - birth.getTime()) / (30.4 * 24 * 60 * 60 * 1000))} mois`;
    };

    // ── Validation ──
    const canGoToStep2 = !!selectedPatient;
    const canGoToStep3 = !!aptDate && !!aptTime && !!aptVet && !!aptType;

    // ── Submit ──
    const handleBook = (force = false) => {
        if (!selectedPatient) return;
        const result = addAppointment({
            patientId: selectedPatient.id,
            patientName: selectedPatient.name,
            ownerName: `${selectedPatient.owner.firstName} ${selectedPatient.owner.lastName}`,
            species: selectedPatient.species,
            date: aptDate,
            time: aptTime,
            duration: Number(aptDuration),
            type: aptType,
            veterinarian: aptVet,
            notes: aptNotes || undefined,
        }, force);

        if (!result.ok) {
            if (result.conflict) {
                setConflictWarning({ message: result.message, conflict: result.conflict });
            }
            return;
        }
        setConflictWarning(null);
        setCompleted(true);
    };

    // ── New patient submit ──
    const handleCreatePatient = (data: PatientFormData) => {
        const newPatient = addPatient({
            name: data.name,
            species: data.species,
            breed: data.breed,
            birthDate: data.birthDate,
            weight: data.weight,
            color: data.color,
            microchip: data.microchip || undefined,
            owner: {
                id: '',
                ...data.owner,
            },
        });
        setSelectedPatient(newPatient);
        setShowNewPatient(false);
        patientForm.reset();
    };

    // ── Reset and close ──
    const handleClose = () => {
        setStep(1);
        setSearchQuery('');
        setSelectedPatient(null);
        setShowNewPatient(false);
        setAptDate(defaultDate || new Date().toISOString().split('T')[0]);
        setAptTime('');
        setAptDuration('30');
        setAptType('consultation');
        setAptVet('');
        setAptNotes('');
        setCompleted(false);
        setConflictWarning(null);
        patientForm.reset();
        onClose();
    };

    const handleBookAnother = () => {
        setStep(1);
        setSearchQuery('');
        setSelectedPatient(null);
        setShowNewPatient(false);
        setAptDate(defaultDate || new Date().toISOString().split('T')[0]);
        setAptTime('');
        setAptDuration('30');
        setAptType('consultation');
        setAptVet('');
        setAptNotes('');
        setCompleted(false);
        setConflictWarning(null);
        patientForm.reset();
    };

    if (!isOpen) return null;

    // ── Success screen ──
    if (completed) {
        const TypeIcon = currentType?.Icon ?? Stethoscope;
        return (
            <div className="fixed inset-0 z-50 bg-white flex items-center justify-center">
                <div className="text-center max-w-sm px-6">
                    <div className="w-16 h-16 rounded-full bg-secondary-100 flex items-center justify-center mx-auto mb-5">
                        <CheckCircle className="w-8 h-8 text-secondary-600" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-1">Rendez-vous confirme</h2>
                    <p className="text-slate-500 text-sm mb-6">
                        {selectedPatient?.name} — {currentType?.label} le {new Date(aptDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} a {aptTime}
                    </p>

                    <div className="rounded-xl border border-secondary-200 bg-secondary-50 p-4 mb-6 text-left space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-lg">{speciesEmoji[selectedPatient?.species || 'other']}</span>
                            <span className="font-bold text-slate-900">{selectedPatient?.name}</span>
                            <span className="text-slate-400">·</span>
                            <span className="text-slate-500">{selectedPatient?.owner.lastName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Calendar className="w-4 h-4 text-secondary-600" />
                            <span>{aptDate} a {aptTime}</span>
                            <span className="text-slate-300">·</span>
                            <span>{aptDuration} min</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                            <TypeIcon className="w-4 h-4 text-secondary-600" />
                            <span>{currentType?.label}</span>
                            <span className="text-slate-300">·</span>
                            <span>{aptVet}</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <button
                            onClick={handleBookAnother}
                            className="w-full py-3 rounded-xl bg-primary-600 text-white font-semibold text-sm hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Prendre un autre rendez-vous
                        </button>
                        <button
                            onClick={() => { handleClose(); onBooked(); }}
                            className="w-full py-3 rounded-xl text-slate-500 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 text-sm"
                        >
                            Retour <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 bg-white flex flex-col">
            {/* ── Top bar ── */}
            <div className="border-b border-slate-100 px-5 py-3 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-primary-100 flex items-center justify-center">
                            <Calendar className="w-4 h-4 text-primary-600" />
                        </div>
                        <h1 className="text-sm font-bold text-slate-900">Prise de rendez-vous</h1>
                    </div>

                    {/* Step indicator */}
                    <div className="flex items-center gap-1">
                        {([1, 2, 3] as Step[]).map((s, i) => (
                            <div key={s} className="flex items-center">
                                <button
                                    onClick={() => { if (s < step) setStep(s); }}
                                    disabled={s > step}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                        s === step
                                            ? 'bg-primary-100 text-primary-700'
                                            : s < step
                                                ? 'bg-secondary-50 text-secondary-700 hover:bg-secondary-100 cursor-pointer'
                                                : 'bg-slate-50 text-slate-300'
                                    }`}
                                >
                                    {s < step ? (
                                        <Check className="w-3.5 h-3.5" />
                                    ) : (
                                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                            s === step ? 'bg-primary-600 text-white' : 'bg-slate-200 text-slate-400'
                                        }`}>{s}</span>
                                    )}
                                    {stepLabels[i]}
                                </button>
                                {i < 2 && <ChevronRight className="w-3.5 h-3.5 text-slate-200 mx-1" />}
                            </div>
                        ))}
                    </div>
                </div>

                <button onClick={handleClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400">
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* ── Body ── */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-2xl mx-auto px-5 py-8">

                    {/* ═══════════ STEP 1: Patient ═══════════ */}
                    {step === 1 && (
                        <div className="space-y-6">
                            {/* Selected patient banner */}
                            {selectedPatient && !showNewPatient && (
                                <div className="rounded-2xl border-2 border-secondary-300 bg-secondary-50 p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{speciesEmoji[selectedPatient.species]}</span>
                                            <div>
                                                <p className="font-bold text-slate-900">{selectedPatient.name}</p>
                                                <p className="text-xs text-slate-500">
                                                    {selectedPatient.breed} · {getAge(selectedPatient.birthDate)} · {selectedPatient.weight} kg
                                                </p>
                                                <p className="text-xs text-slate-400">
                                                    {selectedPatient.owner.firstName} {selectedPatient.owner.lastName} · {selectedPatient.owner.phone}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="px-2 py-1 rounded-full text-xs font-bold bg-secondary-200 text-secondary-800">
                                                Selectionne
                                            </span>
                                            <button
                                                onClick={() => setSelectedPatient(null)}
                                                className="p-1.5 rounded-lg hover:bg-secondary-200 text-secondary-500"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    {selectedPatient.alerts.filter((a) => a.severity === 'high').length > 0 && (
                                        <div className="mt-3 flex flex-wrap gap-1.5">
                                            {selectedPatient.alerts.filter((a) => a.severity === 'high').map((a) => (
                                                <span key={a.id} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold bg-rose-100 text-rose-700">
                                                    <AlertTriangle className="w-3 h-3" />{a.description}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Search / Create toggle */}
                            {!showNewPatient ? (
                                <>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-900 mb-2">
                                            Rechercher un patient
                                        </label>
                                        <div className="relative">
                                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input
                                                type="text"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                placeholder="Nom de l'animal, du proprietaire ou telephone..."
                                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500 placeholder:text-slate-300"
                                                autoFocus
                                            />
                                        </div>
                                    </div>

                                    {/* Patient list */}
                                    <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
                                        {filteredPatients.length === 0 ? (
                                            <div className="text-center py-8">
                                                <PawPrint className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                                <p className="text-sm text-slate-400 mb-3">Aucun patient trouve</p>
                                                <button
                                                    onClick={() => setShowNewPatient(true)}
                                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition"
                                                >
                                                    <UserPlus className="w-4 h-4" /> Creer un nouveau patient
                                                </button>
                                            </div>
                                        ) : (
                                            filteredPatients.map((p) => {
                                                const isSelected = selectedPatient?.id === p.id;
                                                const lastVisit = p.medicalHistory.length > 0
                                                    ? [...p.medicalHistory].sort((a, b) => b.date.localeCompare(a.date))[0]
                                                    : null;
                                                return (
                                                    <button
                                                        key={p.id}
                                                        onClick={() => setSelectedPatient(p)}
                                                        className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                                                            isSelected
                                                                ? 'bg-secondary-50 border-2 border-secondary-300 shadow-sm'
                                                                : 'border border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                                                        }`}
                                                    >
                                                        <span className="text-xl shrink-0">{speciesEmoji[p.species]}</span>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-bold text-sm text-slate-900">{p.name}</span>
                                                                <span className="text-xs text-slate-400">{p.breed}</span>
                                                                {p.alerts.filter((a) => a.severity === 'high').length > 0 && (
                                                                    <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                                                                )}
                                                            </div>
                                                            <p className="text-xs text-slate-500">
                                                                {p.owner.firstName} {p.owner.lastName}
                                                                {lastVisit && (
                                                                    <span className="text-slate-300"> · Dernier: {lastVisit.date}</span>
                                                                )}
                                                            </p>
                                                        </div>
                                                        {isSelected && (
                                                            <div className="w-6 h-6 rounded-full bg-secondary-600 flex items-center justify-center shrink-0">
                                                                <Check className="w-3.5 h-3.5 text-white" />
                                                            </div>
                                                        )}
                                                    </button>
                                                );
                                            })
                                        )}
                                    </div>

                                    {/* Nouveau patient button */}
                                    {filteredPatients.length > 0 && (
                                        <button
                                            onClick={() => setShowNewPatient(true)}
                                            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-slate-200 text-sm font-semibold text-slate-500 hover:border-primary-300 hover:text-primary-600 hover:bg-primary-50 transition-all"
                                        >
                                            <UserPlus className="w-4 h-4" />
                                            Nouveau patient
                                        </button>
                                    )}
                                </>
                            ) : (
                                /* ── Inline patient creation form ── */
                                <div className="rounded-2xl border border-primary-200 bg-primary-50/50 p-5">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <UserPlus className="w-5 h-5 text-primary-600" />
                                            <h3 className="text-sm font-bold text-slate-900">Nouveau patient</h3>
                                        </div>
                                        <button
                                            onClick={() => { setShowNewPatient(false); patientForm.reset(); }}
                                            className="text-xs font-medium text-slate-500 hover:text-slate-700 flex items-center gap-1"
                                        >
                                            <ChevronLeft className="w-3.5 h-3.5" /> Retour a la recherche
                                        </button>
                                    </div>

                                    <form onSubmit={patientForm.handleSubmit(handleCreatePatient)} className="space-y-5">
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Animal</p>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <Input label="Nom" error={patientForm.formState.errors.name?.message} {...patientForm.register('name')} />
                                                <Select label="Espece" options={speciesOptions} error={patientForm.formState.errors.species?.message} {...patientForm.register('species')} />
                                                <Input label="Race" error={patientForm.formState.errors.breed?.message} {...patientForm.register('breed')} />
                                                <Input label="Date de naissance" type="date" error={patientForm.formState.errors.birthDate?.message} {...patientForm.register('birthDate')} />
                                                <Input label="Poids (kg)" type="number" step="0.1" error={patientForm.formState.errors.weight?.message} {...patientForm.register('weight')} />
                                                <Input label="Couleur" error={patientForm.formState.errors.color?.message} {...patientForm.register('color')} />
                                            </div>
                                        </div>

                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Proprietaire</p>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <Input label="Prenom" error={patientForm.formState.errors.owner?.firstName?.message} {...patientForm.register('owner.firstName')} />
                                                <Input label="Nom" error={patientForm.formState.errors.owner?.lastName?.message} {...patientForm.register('owner.lastName')} />
                                                <Input label="Email" type="email" error={patientForm.formState.errors.owner?.email?.message} {...patientForm.register('owner.email')} />
                                                <Input label="Telephone" error={patientForm.formState.errors.owner?.phone?.message} {...patientForm.register('owner.phone')} />
                                                <div className="sm:col-span-2">
                                                    <Input label="Adresse" error={patientForm.formState.errors.owner?.address?.message} {...patientForm.register('owner.address')} />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex justify-end gap-3 pt-2">
                                            <button
                                                type="button"
                                                onClick={() => { setShowNewPatient(false); patientForm.reset(); }}
                                                className="px-4 py-2.5 rounded-xl text-sm text-slate-500 hover:bg-slate-100"
                                            >
                                                Annuler
                                            </button>
                                            <button
                                                type="submit"
                                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition"
                                            >
                                                <Plus className="w-4 h-4" />
                                                Creer et selectionner
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ═══════════ STEP 2: Appointment Details ═══════════ */}
                    {step === 2 && (
                        <div className="space-y-6">
                            {/* Patient summary mini card */}
                            {selectedPatient && (
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                                    <span className="text-xl">{speciesEmoji[selectedPatient.species]}</span>
                                    <div className="flex-1 min-w-0">
                                        <span className="font-bold text-sm text-slate-900">{selectedPatient.name}</span>
                                        <span className="text-slate-300 mx-1.5">·</span>
                                        <span className="text-xs text-slate-500">{selectedPatient.owner.firstName} {selectedPatient.owner.lastName}</span>
                                    </div>
                                    <button onClick={() => setStep(1)} className="text-xs font-medium text-primary-600 hover:text-primary-700">
                                        Changer
                                    </button>
                                </div>
                            )}

                            {/* Type selection */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-900 mb-3">
                                    Type de rendez-vous
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                                    {typeOptions.map((t) => {
                                        const active = aptType === t.value;
                                        return (
                                            <button
                                                key={t.value}
                                                onClick={() => {
                                                    setAptType(t.value as Appointment['type']);
                                                    setAptDuration(String(t.duration));
                                                }}
                                                className={`flex flex-col items-center gap-2 p-3.5 rounded-xl border-2 transition-all ${
                                                    active
                                                        ? `${t.activeBorder} ${t.activeBg} shadow-sm`
                                                        : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                                                }`}
                                            >
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${active ? t.activeBg : t.bg}`}>
                                                    <t.Icon className={`w-5 h-5 ${active ? t.activeText : t.color}`} />
                                                </div>
                                                <span className={`text-xs font-bold ${active ? t.activeText : 'text-slate-600'}`}>
                                                    {t.label}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Date + Time + Duration */}
                            <section className="rounded-2xl border border-slate-200 bg-white p-4">
                                <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-primary-500" />
                                    Date et heure
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Date <span className="text-rose-500">*</span></label>
                                        <input
                                            type="date"
                                            value={aptDate}
                                            onChange={(e) => setAptDate(e.target.value)}
                                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Heure <span className="text-rose-500">*</span></label>
                                        <input
                                            type="time"
                                            value={aptTime}
                                            onChange={(e) => setAptTime(e.target.value)}
                                            min="08:00"
                                            max="19:30"
                                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Duree</label>
                                        <select
                                            value={aptDuration}
                                            onChange={(e) => setAptDuration(e.target.value)}
                                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500"
                                        >
                                            {durationOptions.map((d) => (
                                                <option key={d.value} value={d.value}>{d.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Conflict warning */}
                                {conflict && (
                                    <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3">
                                        <div className="flex items-center gap-2 mb-2">
                                            <AlertTriangle className="w-4 h-4 text-rose-600" />
                                            <span className="text-xs font-bold text-rose-700">Conflit de planning</span>
                                        </div>
                                        <p className="text-xs text-rose-600 mb-2">
                                            {conflict.patientName} ({conflict.ownerName}) — {conflict.time}, {conflict.duration} min avec {conflict.veterinarian}
                                        </p>
                                        <button
                                            onClick={suggestNextSlot}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-600 text-white text-xs font-bold hover:bg-primary-700 transition"
                                        >
                                            <Clock className="w-3.5 h-3.5" />
                                            Prochain creneau disponible
                                        </button>
                                    </div>
                                )}
                            </section>

                            {/* Veterinarian */}
                            <section className="rounded-2xl border border-slate-200 bg-white p-4">
                                <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                                    <Stethoscope className="w-4 h-4 text-primary-500" />
                                    Veterinaire <span className="text-rose-400">*</span>
                                </h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {vetOptions.map((v) => (
                                        <button
                                            key={v.value}
                                            onClick={() => setAptVet(v.value)}
                                            className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                                                aptVet === v.value
                                                    ? 'border-primary-400 bg-primary-50'
                                                    : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                                            }`}
                                        >
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${
                                                aptVet === v.value ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600'
                                            }`}>
                                                {v.label.split(' ').pop()?.[0]}
                                            </div>
                                            <span className={`text-sm font-bold ${aptVet === v.value ? 'text-primary-700' : 'text-slate-700'}`}>
                                                {v.label}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </section>

                            {/* Notes */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-900 mb-2">
                                    Notes <span className="text-slate-300 text-xs font-normal">(optionnel)</span>
                                </label>
                                <textarea
                                    value={aptNotes}
                                    onChange={(e) => setAptNotes(e.target.value)}
                                    placeholder="Motif du rendez-vous, informations importantes..."
                                    rows={2}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-400 placeholder:text-slate-300"
                                />
                            </div>
                        </div>
                    )}

                    {/* ═══════════ STEP 3: Confirmation ═══════════ */}
                    {step === 3 && selectedPatient && (
                        <div className="space-y-6">
                            <div className="text-center mb-2">
                                <h2 className="text-lg font-bold text-slate-900">Confirmer le rendez-vous</h2>
                                <p className="text-sm text-slate-400">Verifiez les informations avant de confirmer</p>
                            </div>

                            {/* Patient card */}
                            <section className="rounded-2xl border border-slate-200 p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400">Patient</h3>
                                    <button onClick={() => setStep(1)} className="text-xs font-medium text-primary-600 hover:text-primary-700">
                                        Modifier
                                    </button>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">{speciesEmoji[selectedPatient.species]}</span>
                                    <div>
                                        <p className="font-bold text-slate-900">{selectedPatient.name}</p>
                                        <p className="text-xs text-slate-500">
                                            {speciesLabel[selectedPatient.species]} · {selectedPatient.breed} · {getAge(selectedPatient.birthDate)} · {selectedPatient.weight} kg
                                        </p>
                                        <p className="text-xs text-slate-400 mt-0.5">
                                            <User className="w-3 h-3 inline mr-1" />
                                            {selectedPatient.owner.firstName} {selectedPatient.owner.lastName} · {selectedPatient.owner.phone}
                                        </p>
                                    </div>
                                </div>
                            </section>

                            {/* Appointment details card */}
                            <section className="rounded-2xl border border-slate-200 p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400">Rendez-vous</h3>
                                    <button onClick={() => setStep(2)} className="text-xs font-medium text-primary-600 hover:text-primary-700">
                                        Modifier
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="rounded-xl bg-slate-50 p-3">
                                        <p className="text-xs text-slate-400 mb-1">Type</p>
                                        <div className="flex items-center gap-2">
                                            {currentType && <currentType.Icon className={`w-4 h-4 ${currentType.color}`} />}
                                            <p className="text-sm font-bold text-slate-900">{currentType?.label}</p>
                                        </div>
                                    </div>
                                    <div className="rounded-xl bg-slate-50 p-3">
                                        <p className="text-xs text-slate-400 mb-1">Veterinaire</p>
                                        <div className="flex items-center gap-2">
                                            <Stethoscope className="w-4 h-4 text-primary-500" />
                                            <p className="text-sm font-bold text-slate-900">{aptVet}</p>
                                        </div>
                                    </div>
                                    <div className="rounded-xl bg-slate-50 p-3">
                                        <p className="text-xs text-slate-400 mb-1">Date</p>
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-primary-500" />
                                            <p className="text-sm font-bold text-slate-900">
                                                {new Date(aptDate).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long' })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="rounded-xl bg-slate-50 p-3">
                                        <p className="text-xs text-slate-400 mb-1">Heure et duree</p>
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-primary-500" />
                                            <p className="text-sm font-bold text-slate-900">{aptTime} · {aptDuration} min</p>
                                        </div>
                                    </div>
                                </div>
                                {aptNotes && (
                                    <div className="mt-3 rounded-xl bg-amber-50 border border-amber-100 p-3">
                                        <p className="text-xs text-amber-600 font-medium mb-0.5">Notes</p>
                                        <p className="text-sm text-amber-800">{aptNotes}</p>
                                    </div>
                                )}
                            </section>

                            {/* Conflict warning on confirm */}
                            {conflictWarning && (
                                <div className="rounded-xl border-2 border-rose-200 bg-rose-50 p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <AlertTriangle className="w-4 h-4 text-rose-600" />
                                        <span className="text-sm font-bold text-rose-700">{conflictWarning.message}</span>
                                    </div>
                                    <p className="text-xs text-rose-600 mb-3">
                                        Conflit avec: {conflictWarning.conflict.patientName} — {conflictWarning.conflict.time} ({conflictWarning.conflict.duration} min)
                                    </p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => { setConflictWarning(null); setStep(2); }}
                                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-primary-600 text-white text-sm font-bold hover:bg-primary-700"
                                        >
                                            <Calendar className="w-4 h-4" /> Modifier l'horaire
                                        </button>
                                        <button
                                            onClick={() => handleBook(true)}
                                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-primary-200 bg-white text-sm font-bold text-primary-700 hover:bg-primary-50"
                                        >
                                            Maintenir malgre le conflit
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Bottom bar ── */}
            <div className="border-t border-slate-100 px-5 py-4 shrink-0">
                <div className="max-w-2xl mx-auto flex items-center justify-between">
                    <div>
                        {step > 1 && (
                            <button
                                onClick={() => setStep((step - 1) as Step)}
                                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm text-slate-500 hover:bg-slate-50"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Retour
                            </button>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={handleClose} className="px-4 py-2.5 rounded-xl text-sm text-slate-500 hover:bg-slate-50">
                            Annuler
                        </button>

                        {step === 1 && (
                            <button
                                onClick={() => setStep(2)}
                                disabled={!canGoToStep2}
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                                    canGoToStep2
                                        ? 'bg-primary-600 text-white hover:bg-primary-700'
                                        : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                                }`}
                            >
                                Continuer
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        )}

                        {step === 2 && (
                            <button
                                onClick={() => setStep(3)}
                                disabled={!canGoToStep3}
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                                    canGoToStep3
                                        ? 'bg-primary-600 text-white hover:bg-primary-700'
                                        : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                                }`}
                            >
                                Continuer
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        )}

                        {step === 3 && (
                            <button
                                onClick={() => handleBook(false)}
                                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-secondary-600 text-white hover:bg-secondary-700 transition-all"
                            >
                                <CheckCircle className="w-4 h-4" />
                                Confirmer le rendez-vous
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
