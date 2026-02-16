import { useParams, Link } from 'react-router-dom';
import { Header } from '../components/layout';
import {
    ArrowLeft,
    Dog,
    Cat,
    Bird,
    Rabbit,
    AlertTriangle,
    Syringe,
    FileText,
    Calendar,
    User,
    Phone,
    Mail,
    MapPin,
    Weight,
    Palette,
    Cpu,
    Clock,
    Plus,
} from 'lucide-react';
import { getPatientById } from '../data/patients';
import { format, differenceInYears, differenceInMonths } from 'date-fns';
import { fr } from 'date-fns/locale';

const speciesIcons = {
    dog: Dog,
    cat: Cat,
    bird: Bird,
    rabbit: Rabbit,
    other: Dog,
};

const speciesLabels = {
    dog: 'Chien',
    cat: 'Chat',
    bird: 'Oiseau',
    rabbit: 'Lapin',
    other: 'Autre',
};

function calculateAge(birthDate: string): string {
    const birth = new Date(birthDate);
    const now = new Date();
    const years = differenceInYears(now, birth);
    const months = differenceInMonths(now, birth) % 12;

    if (years === 0) {
        return `${months} mois`;
    }
    return years === 1 ? `${years} an` : `${years} ans`;
}

export function PatientDetail() {
    const { id } = useParams<{ id: string }>();
    const patient = getPatientById(id || '');

    if (!patient) {
        return (
            <div>
                <Header title="Patient non trouve" />
                <div className="p-8 text-center">
                    <p className="text-slate-500">Ce patient n'existe pas</p>
                    <Link to="/patients" className="btn-primary mt-4 inline-flex">
                        Retour aux patients
                    </Link>
                </div>
            </div>
        );
    }

    const Icon = speciesIcons[patient.species];
    const hasHighAlert = patient.alerts.some((a) => a.severity === 'high');

    return (
        <div>
            <Header title={patient.name} subtitle={patient.breed} />

            <div className="p-8">
                {/* Back Button */}
                <Link
                    to="/patients"
                    className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Retour aux patients
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Patient Info */}
                    <div className="space-y-6">
                        {/* Patient Card */}
                        <div className="card">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                                    <Icon className="w-8 h-8 text-primary-600" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900">{patient.name}</h2>
                                    <p className="text-slate-500">
                                        {speciesLabels[patient.species]} - {patient.breed}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <Calendar className="w-5 h-5 text-slate-400" />
                                    <div>
                                        <p className="text-sm text-slate-500">Age</p>
                                        <p className="font-medium text-slate-900">{calculateAge(patient.birthDate)}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Weight className="w-5 h-5 text-slate-400" />
                                    <div>
                                        <p className="text-sm text-slate-500">Poids</p>
                                        <p className="font-medium text-slate-900">{patient.weight} kg</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Palette className="w-5 h-5 text-slate-400" />
                                    <div>
                                        <p className="text-sm text-slate-500">Couleur</p>
                                        <p className="font-medium text-slate-900">{patient.color}</p>
                                    </div>
                                </div>
                                {patient.microchip && (
                                    <div className="flex items-center gap-3">
                                        <Cpu className="w-5 h-5 text-slate-400" />
                                        <div>
                                            <p className="text-sm text-slate-500">Puce</p>
                                            <p className="font-medium text-slate-900 font-mono text-sm">
                                                {patient.microchip}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Owner Card */}
                        <div className="card">
                            <h3 className="font-semibold text-slate-900 mb-4">Proprietaire</h3>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <User className="w-5 h-5 text-slate-400" />
                                    <p className="text-slate-900">
                                        {patient.owner.firstName} {patient.owner.lastName}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Phone className="w-5 h-5 text-slate-400" />
                                    <p className="text-slate-900">{patient.owner.phone}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Mail className="w-5 h-5 text-slate-400" />
                                    <p className="text-slate-900">{patient.owner.email}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <MapPin className="w-5 h-5 text-slate-400" />
                                    <p className="text-slate-900 text-sm">{patient.owner.address}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Medical Info */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Alerts */}
                        {patient.alerts.length > 0 && (
                            <div className={`card ${hasHighAlert ? 'border-rose-200 bg-rose-50' : 'border-amber-200 bg-amber-50'}`}>
                                <div className="flex items-center gap-2 mb-4">
                                    <AlertTriangle className={`w-5 h-5 ${hasHighAlert ? 'text-rose-600' : 'text-amber-600'}`} />
                                    <h3 className={`font-semibold ${hasHighAlert ? 'text-rose-900' : 'text-amber-900'}`}>
                                        Alertes
                                    </h3>
                                </div>
                                <div className="space-y-3">
                                    {patient.alerts.map((alert) => (
                                        <div
                                            key={alert.id}
                                            className={`p-3 rounded-lg ${alert.severity === 'high'
                                                ? 'bg-rose-100 text-rose-900'
                                                : alert.severity === 'medium'
                                                    ? 'bg-amber-100 text-amber-900'
                                                    : 'bg-slate-100 text-slate-900'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="font-medium capitalize">{alert.type}</span>
                                                <span
                                                    className={
                                                        alert.severity === 'high'
                                                            ? 'badge-danger'
                                                            : alert.severity === 'medium'
                                                                ? 'badge-warning'
                                                                : 'badge-neutral'
                                                    }
                                                >
                                                    {alert.severity === 'high' ? 'Critique' : alert.severity === 'medium' ? 'Moyen' : 'Faible'}
                                                </span>
                                            </div>
                                            <p className="text-sm mt-1">{alert.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Vaccinations */}
                        <div className="card">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Syringe className="w-5 h-5 text-primary-600" />
                                    <h3 className="font-semibold text-slate-900">Vaccinations</h3>
                                </div>
                                <button className="btn-outline text-sm py-1.5">
                                    <Plus className="w-4 h-4" />
                                    Ajouter
                                </button>
                            </div>
                            {patient.vaccinations.length === 0 ? (
                                <p className="text-slate-500 text-sm">Aucune vaccination enregistree</p>
                            ) : (
                                <div className="space-y-3">
                                    {patient.vaccinations.map((vac) => {
                                        const nextDue = new Date(vac.nextDueDate);
                                        const isOverdue = nextDue < new Date();
                                        const isSoon = !isOverdue && differenceInMonths(nextDue, new Date()) <= 1;

                                        return (
                                            <div key={vac.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                                                <div>
                                                    <p className="font-medium text-slate-900">{vac.name}</p>
                                                    <p className="text-sm text-slate-500">
                                                        Fait le {format(new Date(vac.date), 'dd MMM yyyy', { locale: fr })}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm text-slate-500">Prochain rappel</p>
                                                    <p className={`font-medium ${isOverdue ? 'text-rose-600' : isSoon ? 'text-amber-600' : 'text-slate-900'}`}>
                                                        {format(nextDue, 'dd MMM yyyy', { locale: fr })}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Medical History */}
                        <div className="card">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-primary-600" />
                                    <h3 className="font-semibold text-slate-900">Historique medical</h3>
                                </div>
                                <button className="btn-primary text-sm py-1.5">
                                    <Plus className="w-4 h-4" />
                                    Nouvelle consultation
                                </button>
                            </div>
                            {patient.medicalHistory.length === 0 ? (
                                <p className="text-slate-500 text-sm">Aucun historique</p>
                            ) : (
                                <div className="space-y-4">
                                    {patient.medicalHistory.map((record) => (
                                        <div key={record.id} className="border-l-4 border-primary-500 pl-4 py-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-4 h-4 text-slate-400" />
                                                    <span className="text-sm text-slate-500">
                                                        {format(new Date(record.date), 'dd MMMM yyyy', { locale: fr })}
                                                    </span>
                                                    <span className="badge-info capitalize">{record.type}</span>
                                                </div>
                                                <span className="text-sm text-slate-500">{record.veterinarian}</span>
                                            </div>
                                            <h4 className="font-medium text-slate-900 mt-2">{record.diagnosis}</h4>
                                            <p className="text-sm text-slate-600 mt-1">{record.treatment}</p>
                                            {record.notes && (
                                                <p className="text-sm text-slate-500 mt-1 italic">{record.notes}</p>
                                            )}
                                            {record.prescriptions.length > 0 && (
                                                <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                                                    <p className="text-xs font-medium text-slate-500 uppercase mb-2">Prescriptions</p>
                                                    {record.prescriptions.map((presc) => (
                                                        <div key={presc.id} className="text-sm">
                                                            <span className="font-medium text-slate-900">{presc.medication}</span>
                                                            <span className="text-slate-500"> - {presc.dosage}, {presc.frequency}, {presc.duration}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
