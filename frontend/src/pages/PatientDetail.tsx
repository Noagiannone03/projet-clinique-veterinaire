import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Header } from '../components/layout';
import { Tabs, Badge, Button, Card } from '../components/ui';
import { useToast } from '../components/ui/Toast';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { PatientForm, MedicalRecordForm, VaccinationForm, AppointmentForm } from '../components/forms';
import { useClinicData } from '../context/clinicState';
import { useAuth } from '../context/AuthContext';
import {
    ArrowLeft, Dog, Cat, Bird, Rabbit, AlertTriangle, Syringe, FileText, Calendar,
    User, Phone, Mail, MapPin, Weight, Palette, Cpu, Clock, Plus, Edit, Trash2, Printer, Receipt, Pill,
} from 'lucide-react';
import { format, differenceInYears, differenceInMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { PatientFormData, MedicalRecordFormData, VaccinationFormData, AppointmentFormData } from '../schemas';
import { getFallbackPatientPhotoUrl, getPatientPhotoUrl } from '../utils/patientPhotos';

const speciesIcons = { dog: Dog, cat: Cat, bird: Bird, rabbit: Rabbit, other: Dog };
const speciesLabels = { dog: 'Chien', cat: 'Chat', bird: 'Oiseau', rabbit: 'Lapin', other: 'Autre' };

function calculateAge(birthDate: string): string {
    const birth = new Date(birthDate);
    const now = new Date();
    const years = differenceInYears(now, birth);
    const months = differenceInMonths(now, birth) % 12;
    if (years === 0) return `${months} mois`;
    return years === 1 ? `${years} an` : `${years} ans`;
}

export function PatientDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { role } = useAuth();
    const toast = useToast();
    const {
        patients,
        updatePatient,
        deletePatient,
        addMedicalRecord,
        addVaccination,
        appointments,
        addAppointment,
        invoices,
        products,
        prescriptionOrders,
        createPrescriptionOrder,
    } = useClinicData();

    const patient = patients.find((p) => p.id === id);

    const [activeTab, setActiveTab] = useState('info');
    const [showEditPatient, setShowEditPatient] = useState(false);
    const [showNewRecord, setShowNewRecord] = useState(false);
    const [showNewVaccination, setShowNewVaccination] = useState(false);
    const [showNewAppointment, setShowNewAppointment] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    if (!patient) {
        return (
            <div>
                <Header title="Patient non trouve" />
                <div className="p-8 text-center">
                    <p className="text-slate-500 mb-4">Ce patient n'existe pas</p>
                    <Link to="/patients" className="text-primary-600 hover:underline">Retour aux patients</Link>
                </div>
            </div>
        );
    }

    const Icon = speciesIcons[patient.species];
    const hasHighAlert = patient.alerts.some((a) => a.severity === 'high');
    const patientPhotoUrl = getPatientPhotoUrl(patient.species, patient.id);
    const patientAppointments = appointments.filter((a) => a.patientId === patient.id).sort((a, b) => b.date.localeCompare(a.date));
    const patientInvoices = invoices.filter((i) => i.patientId === patient.id);
    const patientPrescriptionOrders = prescriptionOrders
        .filter((order) => order.patientId === patient.id)
        .sort((a, b) => b.issueDate.localeCompare(a.issueDate));

    const handleUpdatePatient = (data: PatientFormData) => {
        updatePatient(patient.id, {
            name: data.name,
            species: data.species,
            breed: data.breed,
            birthDate: data.birthDate,
            weight: data.weight,
            color: data.color,
            microchip: data.microchip,
            owner: { ...patient.owner, ...data.owner },
        });
        toast.success('Patient modifie');
    };

    const handleAddRecord = (data: MedicalRecordFormData) => {
        const createdRecord = addMedicalRecord(patient.id, {
            date: data.date,
            type: data.type,
            diagnosis: data.diagnosis,
            treatment: data.treatment,
            notes: data.notes || '',
            veterinarian: data.veterinarian,
            prescriptions: (data.prescriptions || []).map((p) => ({
                id: `presc-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                medication: p.medication,
                dosage: p.dosage,
                frequency: p.frequency,
                duration: p.duration,
                instructions: p.instructions || '',
            })),
        });
        if ((data.prescriptions || []).length > 0) {
            createPrescriptionOrder({
                patientId: patient.id,
                patientName: patient.name,
                ownerName: `${patient.owner.firstName} ${patient.owner.lastName}`,
                veterinarian: data.veterinarian,
                issueDate: data.date,
                diagnosis: data.diagnosis,
                notes: data.notes,
                sourceMedicalRecordId: createdRecord.id,
                lines: (data.prescriptions || []).map((p) => {
                    const matchingProduct = products.find((product) =>
                        product.name.toLowerCase() === p.medication.toLowerCase()
                    );
                    const quantityMatch = p.dosage.replace(',', '.').match(/\d+(\.\d+)?/);
                    const quantity = quantityMatch ? Math.max(1, Math.ceil(Number(quantityMatch[0]))) : 1;
                    return {
                        medication: p.medication,
                        dosage: p.dosage,
                        frequency: p.frequency,
                        duration: p.duration,
                        instructions: p.instructions || '',
                        quantity,
                        productId: matchingProduct?.id,
                    };
                }),
            });
        }
        toast.success('Consultation ajoutee');
    };

    const handleAddVaccination = (data: VaccinationFormData) => {
        addVaccination(patient.id, data);
        toast.success('Vaccination ajoutee');
    };

    const handleAddAppointment = (data: AppointmentFormData, force = false) => {
        const result = addAppointment({
            patientId: patient.id,
            patientName: patient.name,
            ownerName: `${patient.owner.firstName} ${patient.owner.lastName}`,
            species: patient.species,
            date: data.date,
            time: data.time,
            duration: Number(data.duration),
            type: data.type,
            veterinarian: data.veterinarian,
            notes: data.notes,
        }, force);
        if (result.ok) toast.success('RDV cree');
        else toast.error(result.message);
        return result;
    };

    const handleDelete = () => {
        deletePatient(patient.id);
        toast.success('Patient supprime');
        navigate('/patients');
    };

    const tabs = [
        { key: 'info', label: 'Informations', icon: <User className="w-4 h-4" /> },
        { key: 'medical', label: 'Historique', icon: <FileText className="w-4 h-4" />, count: patient.medicalHistory.length },
        { key: 'prescriptions', label: 'Ordonnances', icon: <Pill className="w-4 h-4" />, count: patientPrescriptionOrders.length },
        { key: 'vaccinations', label: 'Vaccinations', icon: <Syringe className="w-4 h-4" />, count: patient.vaccinations.length },
        { key: 'appointments', label: 'Rendez-vous', icon: <Calendar className="w-4 h-4" />, count: patientAppointments.length },
        { key: 'billing', label: 'Facturation', icon: <Receipt className="w-4 h-4" />, count: patientInvoices.length },
    ];

    return (
        <div>
            <Header
                title={patient.name}
                subtitle={`${speciesLabels[patient.species]} - ${patient.breed}`}
                breadcrumbs={[{ label: 'Patients', to: '/patients' }, { label: patient.name }]}
            />

            <div className="p-4 sm:p-8">
                <Link to="/patients" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4 text-sm">
                    <ArrowLeft className="w-4 h-4" /> Retour
                </Link>

                {/* Alert Banner */}
                {hasHighAlert && (
                    <div className="mb-4 p-4 rounded-xl bg-rose-100 border-2 border-rose-300">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="w-6 h-6 text-rose-600" />
                            <h3 className="font-bold text-rose-900 text-lg">ATTENTION</h3>
                        </div>
                        {patient.alerts.filter((a) => a.severity === 'high').map((a) => (
                            <p key={a.id} className="text-rose-800 font-medium mt-1">{a.description}</p>
                        ))}
                    </div>
                )}

                {/* Patient header */}
                <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        <div className="relative h-24 w-36 flex-shrink-0 overflow-hidden rounded-xl bg-slate-100">
                            <img
                                src={patientPhotoUrl}
                                alt={`Photo de ${patient.name}`}
                                className="h-full w-full object-cover"
                                loading="lazy"
                                onError={(event) => {
                                    event.currentTarget.onerror = null;
                                    event.currentTarget.src = getFallbackPatientPhotoUrl(patient.species);
                                }}
                            />
                            <div className="absolute left-2 top-2 inline-flex items-center gap-1 rounded bg-white/90 px-2 py-1 text-[11px] font-semibold text-slate-700">
                                <Icon className="h-3.5 w-3.5" />
                                {speciesLabels[patient.species]}
                            </div>
                        </div>
                        <div className="min-w-0 flex-1">
                            <h2 className="text-2xl font-bold text-slate-900">{patient.name}</h2>
                            <p className="text-slate-500">{speciesLabels[patient.species]} - {patient.breed} - {calculateAge(patient.birthDate)}</p>
                        </div>
                        <div className="flex flex-wrap gap-2 sm:justify-end">
                            <Button variant="outline" size="sm" icon={<Printer className="w-4 h-4" />} onClick={() => window.print()}>Imprimer</Button>
                            {(role === 'veterinarian' || role === 'assistant') && (
                                <Button variant="outline" size="sm" icon={<Edit className="w-4 h-4" />} onClick={() => setShowEditPatient(true)}>Modifier</Button>
                            )}
                            {role === 'veterinarian' && (
                                <Button variant="danger" size="sm" icon={<Trash2 className="w-4 h-4" />} onClick={() => setShowDeleteConfirm(true)}>Supprimer</Button>
                            )}
                        </div>
                    </div>
                </div>

                <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab}>
                    {(tab) => {
                        if (tab === 'info') return (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <Card>
                                    <h3 className="font-semibold text-slate-900 mb-4">Fiche patient</h3>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3"><Calendar className="w-4 h-4 text-slate-400" /><div><p className="text-xs text-slate-500">Age</p><p className="text-sm font-medium">{calculateAge(patient.birthDate)}</p></div></div>
                                        <div className="flex items-center gap-3"><Weight className="w-4 h-4 text-slate-400" /><div><p className="text-xs text-slate-500">Poids</p><p className="text-sm font-medium">{patient.weight} kg</p></div></div>
                                        <div className="flex items-center gap-3"><Palette className="w-4 h-4 text-slate-400" /><div><p className="text-xs text-slate-500">Couleur</p><p className="text-sm font-medium">{patient.color}</p></div></div>
                                        {patient.microchip && <div className="flex items-center gap-3"><Cpu className="w-4 h-4 text-slate-400" /><div><p className="text-xs text-slate-500">Micropuce</p><p className="text-sm font-medium font-mono">{patient.microchip}</p></div></div>}
                                    </div>
                                    {patient.alerts.length > 0 && (
                                        <div className="mt-4 pt-4 border-t border-slate-200">
                                            <h4 className="text-sm font-medium text-slate-700 mb-2">Alertes</h4>
                                            {patient.alerts.map((a) => (
                                                <div key={a.id} className={`p-2 rounded-lg mb-2 ${a.severity === 'high' ? 'bg-rose-100 text-rose-900' : a.severity === 'medium' ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-700'}`}>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-medium capitalize">{a.type}</span>
                                                        <Badge variant={a.severity === 'high' ? 'danger' : a.severity === 'medium' ? 'warning' : 'neutral'}>{a.severity === 'high' ? 'Critique' : a.severity === 'medium' ? 'Moyen' : 'Faible'}</Badge>
                                                    </div>
                                                    <p className="text-sm mt-1">{a.description}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </Card>
                                <Card>
                                    <h3 className="font-semibold text-slate-900 mb-4">Proprietaire</h3>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3"><User className="w-4 h-4 text-slate-400" /><p className="text-sm">{patient.owner.firstName} {patient.owner.lastName}</p></div>
                                        <div className="flex items-center gap-3"><Phone className="w-4 h-4 text-slate-400" /><p className="text-sm">{patient.owner.phone}</p></div>
                                        <div className="flex items-center gap-3"><Mail className="w-4 h-4 text-slate-400" /><p className="text-sm">{patient.owner.email}</p></div>
                                        <div className="flex items-center gap-3"><MapPin className="w-4 h-4 text-slate-400" /><p className="text-sm">{patient.owner.address}</p></div>
                                    </div>
                                </Card>
                            </div>
                        );

                        if (tab === 'medical') return (
                            <div>
                                <div className="flex justify-end mb-4">
                                    {role === 'veterinarian' && (
                                        <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowNewRecord(true)}>Nouvelle consultation</Button>
                                    )}
                                    {role === 'assistant' && (
                                        <p className="text-sm text-slate-400 italic">Seul le veterinaire peut ajouter des consultations</p>
                                    )}
                                </div>
                                {patient.medicalHistory.length === 0 ? (
                                    <p className="text-slate-500 text-sm text-center py-8">Aucun historique medical</p>
                                ) : (
                                    <div className="space-y-4">
                                        {patient.medicalHistory.map((record) => (
                                            <div key={record.id} className="bg-white rounded-xl border border-slate-200 p-4 border-l-4 border-l-primary-500">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="w-4 h-4 text-slate-400" />
                                                        <span className="text-sm text-slate-500">{format(new Date(record.date), 'dd MMMM yyyy', { locale: fr })}</span>
                                                        <Badge variant="info">{record.type}</Badge>
                                                    </div>
                                                    <span className="text-sm text-slate-500">{record.veterinarian}</span>
                                                </div>
                                                <h4 className="font-medium text-slate-900">{record.diagnosis}</h4>
                                                <p className="text-sm text-slate-600 mt-1">{record.treatment}</p>
                                                {record.notes && <p className="text-sm text-slate-500 mt-1 italic">{record.notes}</p>}
                                                {record.prescriptions.length > 0 && (
                                                    <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <p className="text-xs font-medium text-slate-500 uppercase">Prescriptions</p>
                                                            <button
                                                                onClick={() => window.print()}
                                                                className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                                                            >
                                                                <Printer className="w-3.5 h-3.5" />
                                                                Imprimer l'ordonnance
                                                            </button>
                                                        </div>
                                                        {record.prescriptions.map((p) => (
                                                            <div key={p.id} className="text-sm"><span className="font-medium text-slate-900">{p.medication}</span><span className="text-slate-500"> - {p.dosage}, {p.frequency}, {p.duration}</span></div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );

                        if (tab === 'prescriptions') return (
                            <div>
                                <div className="flex justify-end mb-4">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        icon={<Pill className="w-4 h-4" />}
                                        onClick={() => navigate(`/prescriptions?patient=${patient.id}`)}
                                    >
                                        Ouvrir le module ordonnances
                                    </Button>
                                </div>
                                {patientPrescriptionOrders.length === 0 ? (
                                    <p className="text-slate-500 text-sm text-center py-8">Aucune ordonnance generee</p>
                                ) : (
                                    <div className="space-y-3">
                                        {patientPrescriptionOrders.map((order) => {
                                            const statusVariant =
                                                order.status === 'dispensed'
                                                    ? 'success'
                                                    : order.status === 'cancelled'
                                                        ? 'danger'
                                                        : order.status === 'prepared'
                                                            ? 'info'
                                                            : 'warning';
                                            const statusLabel =
                                                order.status === 'dispensed'
                                                    ? 'Delivree'
                                                    : order.status === 'cancelled'
                                                        ? 'Annulee'
                                                        : order.status === 'prepared'
                                                            ? 'Preparee'
                                                            : 'A preparer';
                                            return (
                                                <div key={order.id} className="bg-white rounded-xl border border-slate-200 p-4">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div>
                                                            <p className="font-medium text-slate-900">{order.prescriptionNumber}</p>
                                                            <p className="text-sm text-slate-500">
                                                                {format(new Date(order.issueDate), 'dd/MM/yyyy')} · {order.veterinarian}
                                                            </p>
                                                        </div>
                                                        <Badge variant={statusVariant}>{statusLabel}</Badge>
                                                    </div>
                                                    <div className="mt-3 space-y-1">
                                                        {order.lines.map((line) => (
                                                            <p key={line.id} className="text-sm text-slate-700">
                                                                <span className="font-medium text-slate-900">{line.medication}</span>
                                                                {' · '}
                                                                {line.dosage}, {line.frequency}
                                                                {line.duration ? `, ${line.duration}` : ''}
                                                            </p>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );

                        if (tab === 'vaccinations') return (
                            <div>
                                <div className="flex justify-end mb-4">
                                    {(role === 'veterinarian' || role === 'assistant') && (
                                        <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowNewVaccination(true)}>Ajouter vaccination</Button>
                                    )}
                                </div>
                                {patient.vaccinations.length === 0 ? (
                                    <p className="text-slate-500 text-sm text-center py-8">Aucune vaccination</p>
                                ) : (
                                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                                        <table className="w-full text-sm">
                                            <thead><tr className="border-b border-slate-200 bg-slate-50">
                                                <th className="text-left py-3 px-4 font-medium text-slate-600">Vaccin</th>
                                                <th className="text-left py-3 px-4 font-medium text-slate-600">Date</th>
                                                <th className="text-left py-3 px-4 font-medium text-slate-600">Prochain rappel</th>
                                                <th className="text-left py-3 px-4 font-medium text-slate-600">Statut</th>
                                                <th className="text-left py-3 px-4 font-medium text-slate-600">Veterinaire</th>
                                            </tr></thead>
                                            <tbody>
                                                {patient.vaccinations.map((vac) => {
                                                    const nextDue = new Date(vac.nextDueDate);
                                                    const isOverdue = nextDue < new Date();
                                                    const daysDiff = Math.round((nextDue.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                                                    const isSoon = !isOverdue && daysDiff <= 30;
                                                    return (
                                                        <tr key={vac.id} className="border-b border-slate-100">
                                                            <td className="py-3 px-4 font-medium text-slate-900">{vac.name}</td>
                                                            <td className="py-3 px-4 text-slate-600">{format(new Date(vac.date), 'dd/MM/yyyy')}</td>
                                                            <td className={`py-3 px-4 font-medium ${isOverdue ? 'text-rose-600' : isSoon ? 'text-amber-600' : 'text-slate-900'}`}>{format(nextDue, 'dd/MM/yyyy')}</td>
                                                            <td className="py-3 px-4"><Badge variant={isOverdue ? 'danger' : isSoon ? 'warning' : 'success'}>{isOverdue ? 'En retard' : isSoon ? 'Bientot' : 'A jour'}</Badge></td>
                                                            <td className="py-3 px-4 text-slate-600">{vac.veterinarian}</td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        );

                        if (tab === 'appointments') return (
                            <div>
                                {role !== 'director' && (
                                    <div className="flex justify-end mb-4">
                                        <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowNewAppointment(true)}>Nouveau RDV</Button>
                                    </div>
                                )}
                                {patientAppointments.length === 0 ? (
                                    <p className="text-slate-500 text-sm text-center py-8">Aucun rendez-vous</p>
                                ) : (
                                    <div className="space-y-2">
                                        {patientAppointments.map((apt) => (
                                            <div key={apt.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between">
                                                <div>
                                                    <p className="font-medium text-slate-900">{format(new Date(apt.date), 'dd MMMM yyyy', { locale: fr })} a {apt.time}</p>
                                                    <p className="text-sm text-slate-500">{apt.type} - {apt.veterinarian} - {apt.duration} min</p>
                                                </div>
                                                <Badge variant={apt.status === 'completed' ? 'success' : apt.status === 'cancelled' ? 'danger' : apt.status === 'in-progress' ? 'warning' : 'neutral'}>
                                                    {apt.status === 'completed' ? 'Termine' : apt.status === 'cancelled' ? 'Annule' : apt.status === 'in-progress' ? 'En cours' : 'Planifie'}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );

                        if (tab === 'billing') return (
                            <div>
                                {patientInvoices.length === 0 ? (
                                    <p className="text-slate-500 text-sm text-center py-8">Aucune facture</p>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <Card padding="sm">
                                                <p className="text-xs text-slate-500">Total depense</p>
                                                <p className="text-xl font-bold text-slate-900">{patientInvoices.reduce((s, i) => s + i.total, 0).toFixed(2)} EUR</p>
                                            </Card>
                                            <Card padding="sm">
                                                <p className="text-xs text-slate-500">Impayees</p>
                                                <p className="text-xl font-bold text-rose-600">{patientInvoices.filter((i) => i.status !== 'paid').length}</p>
                                            </Card>
                                        </div>
                                        {patientInvoices.map((inv) => (
                                            <div key={inv.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between">
                                                <div>
                                                    <p className="font-medium text-slate-900 font-mono">{inv.invoiceNumber}</p>
                                                    <p className="text-sm text-slate-500">{format(new Date(inv.date), 'dd/MM/yyyy')}</p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="font-bold text-slate-900">{inv.total.toFixed(2)} EUR</span>
                                                    <Badge variant={inv.status === 'paid' ? 'success' : inv.status === 'overdue' ? 'danger' : 'warning'}>
                                                        {inv.status === 'paid' ? 'Paye' : inv.status === 'overdue' ? 'En retard' : 'En attente'}
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );

                        return null;
                    }}
                </Tabs>
            </div>

            <PatientForm isOpen={showEditPatient} onClose={() => setShowEditPatient(false)} onSubmit={handleUpdatePatient} patient={patient} />
            <MedicalRecordForm isOpen={showNewRecord} onClose={() => setShowNewRecord(false)} onSubmit={handleAddRecord} patientName={patient.name} />
            <VaccinationForm isOpen={showNewVaccination} onClose={() => setShowNewVaccination(false)} onSubmit={handleAddVaccination} patientName={patient.name} />
            <AppointmentForm isOpen={showNewAppointment} onClose={() => setShowNewAppointment(false)} onSubmit={handleAddAppointment} defaultPatientId={patient.id} />
            <ConfirmDialog isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} onConfirm={handleDelete} title="Supprimer le patient" message={`Supprimer definitivement ${patient.name} et tout son historique ?`} confirmLabel="Supprimer" />
        </div>
    );
}
