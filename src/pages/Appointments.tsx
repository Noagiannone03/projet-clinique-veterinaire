import { useMemo, useState } from 'react';
import { Header } from '../components/layout';
import {
    ChevronLeft,
    ChevronRight,
    Clock,
    Dog,
    Cat,
    Bird,
    Rabbit,
    Plus,
    CheckCircle,
    AlertCircle,
    Play,
    X,
} from 'lucide-react';
import type { Appointment } from '../types';
import { format, addDays, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { getAppointmentsByDate, useClinicData } from '../context/clinicState';

const speciesIcons = {
    dog: Dog,
    cat: Cat,
    bird: Bird,
    rabbit: Rabbit,
    other: Dog,
};

const statusConfig = {
    scheduled: { label: 'Planifie', color: 'badge-neutral', icon: Clock },
    arrived: { label: 'Arrive', color: 'badge-info', icon: AlertCircle },
    'in-progress': { label: 'En cours', color: 'badge-warning', icon: Play },
    completed: { label: 'Termine', color: 'badge-success', icon: CheckCircle },
    cancelled: { label: 'Annule', color: 'badge-danger', icon: AlertCircle },
};

const typeLabels = {
    consultation: 'Consultation',
    vaccination: 'Vaccination',
    surgery: 'Chirurgie',
    'follow-up': 'Suivi',
    emergency: 'Urgence',
};

interface AppointmentCardProps {
    appointment: Appointment;
    onUpdateStatus: (appointmentId: string, status: Appointment['status']) => void;
}

function AppointmentCard({ appointment, onUpdateStatus }: AppointmentCardProps) {
    const Icon = speciesIcons[appointment.species];
    const status = statusConfig[appointment.status];

    return (
        <div className="card card-hover flex items-center gap-4 animate-fade-in">
            <div className="text-center w-16">
                <p className="text-2xl font-bold text-slate-900">{appointment.time.split(':')[0]}</p>
                <p className="text-sm text-slate-500">:{appointment.time.split(':')[1]}</p>
            </div>

            <div className="w-px h-16 bg-slate-200" />

            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                <Icon className="w-6 h-6 text-slate-600" />
            </div>

            <div className="flex-1">
                <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-900">{appointment.patientName}</h3>
                    <span className={status.color}>{status.label}</span>
                </div>
                <p className="text-sm text-slate-500">
                    {typeLabels[appointment.type]} - {appointment.duration} min
                </p>
                <p className="text-xs text-slate-400 mt-1">
                    {appointment.ownerName} | {appointment.veterinarian}
                </p>
            </div>

            {appointment.notes && (
                <div className="max-w-[220px]">
                    <p className="text-xs text-slate-500 italic truncate">{appointment.notes}</p>
                </div>
            )}

            <div className="flex gap-2">
                {appointment.status === 'scheduled' && (
                    <button
                        className="btn-outline text-sm py-1.5"
                        onClick={() => onUpdateStatus(appointment.id, 'arrived')}
                    >
                        Arrive
                    </button>
                )}
                {appointment.status === 'arrived' && (
                    <button
                        className="btn-primary text-sm py-1.5"
                        onClick={() => onUpdateStatus(appointment.id, 'in-progress')}
                    >
                        Demarrer
                    </button>
                )}
                {appointment.status === 'in-progress' && (
                    <button
                        className="btn-primary text-sm py-1.5"
                        onClick={() => onUpdateStatus(appointment.id, 'completed')}
                    >
                        Terminer
                    </button>
                )}
            </div>
        </div>
    );
}

export function Appointments() {
    const { appointments, addAppointment, updateAppointmentStatus } = useClinicData();
    const [selectedDate, setSelectedDate] = useState(new Date('2026-01-20'));
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [newAppointment, setNewAppointment] = useState({
        patientName: '',
        ownerName: '',
        species: 'dog' as Appointment['species'],
        date: '2026-01-20',
        time: '15:00',
        duration: 30,
        type: 'consultation' as Appointment['type'],
        veterinarian: 'Dr. Martin',
        notes: '',
    });

    const dateString = format(selectedDate, 'yyyy-MM-dd');
    const dayAppointments = useMemo(
        () => getAppointmentsByDate(appointments, dateString),
        [appointments, dateString]
    );

    const goToPreviousDay = () => setSelectedDate((d) => subDays(d, 1));
    const goToNextDay = () => setSelectedDate((d) => addDays(d, 1));

    const stats = {
        total: dayAppointments.length,
        completed: dayAppointments.filter((a) => a.status === 'completed').length,
        inProgress: dayAppointments.filter((a) => a.status === 'in-progress').length,
        pending: dayAppointments.filter((a) => a.status === 'scheduled' || a.status === 'arrived').length,
    };

    const handleCreateAppointment = () => {
        if (!newAppointment.patientName || !newAppointment.ownerName) {
            setErrorMessage('Le nom du patient et du proprietaire sont obligatoires.');
            return;
        }

        const result = addAppointment(newAppointment);
        if (!result.ok) {
            setErrorMessage(result.message);
            return;
        }

        setErrorMessage('');
        setShowCreateForm(false);
        setNewAppointment({
            patientName: '',
            ownerName: '',
            species: 'dog',
            date: dateString,
            time: '15:00',
            duration: 30,
            type: 'consultation',
            veterinarian: 'Dr. Martin',
            notes: '',
        });
    };

    return (
        <div>
            <Header title="Rendez-vous" subtitle="Gestion du planning" />

            <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={goToPreviousDay}
                            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5 text-slate-600" />
                        </button>

                        <div className="text-center">
                            <h2 className="text-xl font-bold text-slate-900 capitalize">
                                {format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })}
                            </h2>
                        </div>

                        <button
                            onClick={goToNextDay}
                            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                            <ChevronRight className="w-5 h-5 text-slate-600" />
                        </button>
                    </div>

                    <button className="btn-primary" onClick={() => setShowCreateForm((current) => !current)}>
                        <Plus className="w-4 h-4" />
                        Nouveau RDV
                    </button>
                </div>

                {showCreateForm && (
                    <div className="card mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-slate-900">Nouveau rendez-vous</h3>
                            <button
                                className="p-2 rounded-lg hover:bg-slate-100"
                                onClick={() => {
                                    setShowCreateForm(false);
                                    setErrorMessage('');
                                }}
                                aria-label="Fermer le formulaire"
                            >
                                <X className="w-4 h-4 text-slate-500" />
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <input
                                className="input"
                                placeholder="Nom du patient"
                                value={newAppointment.patientName}
                                onChange={(e) => setNewAppointment((current) => ({ ...current, patientName: e.target.value }))}
                            />
                            <input
                                className="input"
                                placeholder="Nom du proprietaire"
                                value={newAppointment.ownerName}
                                onChange={(e) => setNewAppointment((current) => ({ ...current, ownerName: e.target.value }))}
                            />
                            <select
                                className="input"
                                value={newAppointment.species}
                                onChange={(e) =>
                                    setNewAppointment((current) => ({
                                        ...current,
                                        species: e.target.value as Appointment['species'],
                                    }))
                                }
                            >
                                <option value="dog">Chien</option>
                                <option value="cat">Chat</option>
                                <option value="bird">Oiseau</option>
                                <option value="rabbit">Lapin</option>
                                <option value="other">Autre</option>
                            </select>
                            <input
                                type="date"
                                className="input"
                                value={newAppointment.date}
                                onChange={(e) => setNewAppointment((current) => ({ ...current, date: e.target.value }))}
                            />
                            <input
                                type="time"
                                className="input"
                                value={newAppointment.time}
                                onChange={(e) => setNewAppointment((current) => ({ ...current, time: e.target.value }))}
                            />
                            <input
                                type="number"
                                min={15}
                                step={15}
                                className="input"
                                value={newAppointment.duration}
                                onChange={(e) =>
                                    setNewAppointment((current) => ({
                                        ...current,
                                        duration: Number(e.target.value),
                                    }))
                                }
                            />
                            <select
                                className="input"
                                value={newAppointment.type}
                                onChange={(e) =>
                                    setNewAppointment((current) => ({
                                        ...current,
                                        type: e.target.value as Appointment['type'],
                                    }))
                                }
                            >
                                <option value="consultation">Consultation</option>
                                <option value="vaccination">Vaccination</option>
                                <option value="surgery">Chirurgie</option>
                                <option value="follow-up">Suivi</option>
                                <option value="emergency">Urgence</option>
                            </select>
                            <select
                                className="input"
                                value={newAppointment.veterinarian}
                                onChange={(e) => setNewAppointment((current) => ({ ...current, veterinarian: e.target.value }))}
                            >
                                <option value="Dr. Martin">Dr. Martin</option>
                                <option value="Dr. Leroy">Dr. Leroy</option>
                            </select>
                            <input
                                className="input lg:col-span-3"
                                placeholder="Notes (optionnel)"
                                value={newAppointment.notes}
                                onChange={(e) => setNewAppointment((current) => ({ ...current, notes: e.target.value }))}
                            />
                        </div>
                        {errorMessage && <p className="text-sm text-rose-600 mt-3">{errorMessage}</p>}
                        <div className="mt-4">
                            <button className="btn-primary" onClick={handleCreateAppointment}>
                                <Plus className="w-4 h-4" />
                                Ajouter au planning
                            </button>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="card text-center">
                        <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
                        <p className="text-sm text-slate-500">Total</p>
                    </div>
                    <div className="card text-center">
                        <p className="text-3xl font-bold text-emerald-600">{stats.completed}</p>
                        <p className="text-sm text-slate-500">Termines</p>
                    </div>
                    <div className="card text-center">
                        <p className="text-3xl font-bold text-amber-600">{stats.inProgress}</p>
                        <p className="text-sm text-slate-500">En cours</p>
                    </div>
                    <div className="card text-center">
                        <p className="text-3xl font-bold text-sky-600">{stats.pending}</p>
                        <p className="text-sm text-slate-500">A venir</p>
                    </div>
                </div>

                <div className="space-y-4">
                    {dayAppointments.length === 0 ? (
                        <div className="card text-center py-12">
                            <p className="text-slate-500">Aucun rendez-vous pour cette date</p>
                        </div>
                    ) : (
                        dayAppointments.map((apt) => (
                            <AppointmentCard
                                key={apt.id}
                                appointment={apt}
                                onUpdateStatus={updateAppointmentStatus}
                            />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
