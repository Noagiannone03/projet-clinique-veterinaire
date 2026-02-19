import { useState } from 'react';
import { Header } from '../components/layout';
import { Badge, Button } from '../components/ui';
import {
    Calendar,
    Clock,
    CheckCircle,
    AlertTriangle,
    Plus,
    PawPrint,
    Search,
    Receipt,
    Syringe,
    UserCheck,
    Stethoscope,
    AlertCircle,
} from 'lucide-react';
import { useClinicData, getVaccinationDueSoonCount } from '../context/clinicState';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { AppointmentForm } from '../components/forms';
import { useToast } from '../components/ui/Toast';

export function ClinicDashboard() {
    const { user, role } = useAuth();
    const { patients, appointments, addAppointment } = useClinicData();
    const navigate = useNavigate();
    const toast = useToast();
    const [showNewAppointment, setShowNewAppointment] = useState(false);

    const today = format(new Date(), 'yyyy-MM-dd');
    const todayAppointments = appointments
        .filter((a) => a.date === today)
        .sort((a, b) => a.time.localeCompare(b.time));

    const vaccinationsDue = getVaccinationDueSoonCount(patients, 60);

    const completedToday = todayAppointments.filter((a) => a.status === 'completed').length;
    const inProgressToday = todayAppointments.filter((a) => a.status === 'in-progress').length;
    const emergencies = todayAppointments.filter((a) => a.type === 'emergency').length;

    // Patients with high severity alerts
    const dangerousPatients = patients.filter((p) =>
        p.alerts.some((a) => a.severity === 'high' && a.type === 'behavioral')
    );

    // Vaccination reminders
    const vaccinationReminders = patients.filter((p) =>
        p.vaccinations.some((v) => {
            const due = new Date(v.nextDueDate);
            const now = new Date();
            const diff = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
            return diff >= -30 && diff <= 60;
        })
    );

    const statusIcon = (status: string) => {
        switch (status) {
            case 'completed': return <CheckCircle className="w-4 h-4 text-emerald-500" />;
            case 'in-progress': return <Clock className="w-4 h-4 text-amber-500" />;
            case 'arrived': return <UserCheck className="w-4 h-4 text-sky-500" />;
            default: return <Clock className="w-4 h-4 text-slate-400" />;
        }
    };

    const statusLabel = (status: string) => {
        switch (status) {
            case 'completed': return 'Termine';
            case 'in-progress': return 'En cours';
            case 'arrived': return 'Arrive';
            case 'cancelled': return 'Annule';
            default: return 'Planifie';
        }
    };

    return (
        <div>
            <Header
                title="Dashboard Clinique"
                subtitle={`${format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })} - ${user?.name || ''}`}
            />

            <div className="p-4 sm:p-8 space-y-6">
                {/* Stats du jour */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                        <div className="flex items-center gap-2 text-slate-500 mb-1">
                            <Calendar className="w-4 h-4" />
                            <span className="text-xs font-medium">RDV prevus</span>
                        </div>
                        <p className="text-2xl font-bold text-slate-900">{todayAppointments.length}</p>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                        <div className="flex items-center gap-2 text-emerald-600 mb-1">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-xs font-medium">Termines</span>
                        </div>
                        <p className="text-2xl font-bold text-emerald-700">{completedToday}</p>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                        <div className="flex items-center gap-2 text-amber-600 mb-1">
                            <Stethoscope className="w-4 h-4" />
                            <span className="text-xs font-medium">En cours</span>
                        </div>
                        <p className="text-2xl font-bold text-amber-700">{inProgressToday}</p>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                        <div className="flex items-center gap-2 text-rose-600 mb-1">
                            <AlertCircle className="w-4 h-4" />
                            <span className="text-xs font-medium">Urgences</span>
                        </div>
                        <p className="text-2xl font-bold text-rose-700">{emergencies}</p>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                        <div className="flex items-center gap-2 text-sky-600 mb-1">
                            <Syringe className="w-4 h-4" />
                            <span className="text-xs font-medium">Rappels vaccins</span>
                        </div>
                        <p className="text-2xl font-bold text-sky-700">{vaccinationsDue}</p>
                    </div>
                </div>

                {/* Actions rapides */}
                {role !== 'director' && (
                    <div className="flex flex-wrap gap-3">
                        <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowNewAppointment(true)}>
                            Nouveau RDV
                        </Button>
                        {(role === 'veterinarian' || role === 'assistant') && (
                            <Button variant="outline" icon={<PawPrint className="w-4 h-4" />} onClick={() => navigate('/patients')}>
                                Nouveau patient
                            </Button>
                        )}
                        {role === 'assistant' && (
                            <Button variant="outline" icon={<Receipt className="w-4 h-4" />} onClick={() => navigate('/billing')}>
                                Facturation
                            </Button>
                        )}
                        <Button variant="outline" icon={<Search className="w-4 h-4" />} onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}>
                            Rechercher
                        </Button>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Planning du jour */}
                    <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-slate-900">Planning du jour</h3>
                            <Badge variant="info">{todayAppointments.length} RDV</Badge>
                        </div>
                        {todayAppointments.length === 0 ? (
                            <p className="text-sm text-slate-500 text-center py-8">Aucun rendez-vous aujourd'hui</p>
                        ) : (
                            <div className="space-y-2">
                                {todayAppointments.map((apt) => {
                                    const patient = patients.find((p) => p.id === apt.patientId);
                                    const hasAlert = patient?.alerts.some((a) => a.severity === 'high');
                                    return (
                                        <div
                                            key={apt.id}
                                            className={`flex items-center gap-4 p-3 rounded-lg border transition-colors cursor-pointer hover:bg-slate-50 ${hasAlert ? 'border-rose-200 bg-rose-50/50' : 'border-slate-100'
                                                }`}
                                            onClick={() => patient && navigate(`/patients/${patient.id}`)}
                                        >
                                            {statusIcon(apt.status)}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-slate-900 text-sm">{apt.patientName}</span>
                                                    {hasAlert && <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />}
                                                </div>
                                                <p className="text-xs text-slate-500">{apt.ownerName} - {apt.veterinarian}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-medium text-slate-900">{apt.time}</p>
                                                <p className="text-xs text-slate-500">{apt.duration} min</p>
                                            </div>
                                            <Badge variant={apt.status === 'completed' ? 'success' : apt.status === 'in-progress' ? 'warning' : apt.status === 'arrived' ? 'info' : 'neutral'}>
                                                {statusLabel(apt.status)}
                                            </Badge>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Alertes */}
                    <div className="space-y-6">
                        {/* Animaux dangereux */}
                        {dangerousPatients.length > 0 && (
                            <div className="bg-rose-50 rounded-xl border border-rose-200 p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <AlertTriangle className="w-5 h-5 text-rose-600" />
                                    <h3 className="font-semibold text-rose-900">Alertes patients</h3>
                                </div>
                                <div className="space-y-2">
                                    {dangerousPatients.map((p) => (
                                        <div
                                            key={p.id}
                                            className="p-2 bg-white rounded-lg border border-rose-200 cursor-pointer hover:bg-rose-50 transition-colors"
                                            onClick={() => navigate(`/patients/${p.id}`)}
                                        >
                                            <p className="text-sm font-medium text-rose-900">{p.name}</p>
                                            <p className="text-xs text-rose-700">
                                                {p.alerts.find((a) => a.severity === 'high')?.description}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Rappels vaccination */}
                        {vaccinationReminders.length > 0 && (
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <Syringe className="w-5 h-5 text-sky-600" />
                                    <h3 className="font-semibold text-slate-900">Rappels vaccins</h3>
                                </div>
                                <div className="space-y-2">
                                    {vaccinationReminders.slice(0, 5).map((p) => {
                                        const nextVac = p.vaccinations
                                            .filter((v) => {
                                                const diff = (new Date(v.nextDueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
                                                return diff >= -30 && diff <= 60;
                                            })
                                            .sort((a, b) => new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime())[0];

                                        const daysUntil = nextVac ? Math.round((new Date(nextVac.nextDueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;
                                        const variant = daysUntil < 0 ? 'danger' : daysUntil < 30 ? 'warning' : 'info';

                                        return (
                                            <div key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                                                <div>
                                                    <p className="text-sm font-medium text-slate-900">{p.name}</p>
                                                    <p className="text-xs text-slate-500">{nextVac?.name}</p>
                                                </div>
                                                <Badge variant={variant}>
                                                    {daysUntil < 0 ? `${Math.abs(daysUntil)}j retard` : `${daysUntil}j`}
                                                </Badge>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <AppointmentForm
                isOpen={showNewAppointment}
                onClose={() => setShowNewAppointment(false)}
                onSubmit={(data) => {
                    const patient = patients.find((p) => p.id === data.patientId);
                    if (patient) {
                        const result = addAppointment({
                            patientId: data.patientId,
                            patientName: patient.name,
                            ownerName: `${patient.owner.firstName} ${patient.owner.lastName}`,
                            species: patient.species,
                            date: data.date,
                            time: data.time,
                            duration: Number(data.duration),
                            type: data.type,
                            veterinarian: data.veterinarian,
                            notes: data.notes,
                        });
                        if (result.ok) {
                            toast.success('Rendez-vous cree avec succes');
                        } else {
                            toast.error(result.message);
                        }
                    }
                }}
            />
        </div>
    );
}
