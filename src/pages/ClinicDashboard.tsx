import { useState, useMemo } from 'react';
import { Header } from '../components/layout';
import { Badge, Button } from '../components/ui';
import {
    Plus,
    Receipt,
    UserCheck,
    Stethoscope,
    CheckCircle,
    Clock,
    ArrowRight,
    PawPrint,
    Phone,
    ShoppingCart,
    AlertTriangle,
    Package,
    CreditCard,
    Calendar,
    User,
} from 'lucide-react';
import { useClinicData } from '../context/clinicState';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { AppointmentForm, InvoiceForm } from '../components/forms';
import { ConsultationPanel } from '../components/consultation/ConsultationPanel';
import { useToast } from '../components/ui/Toast';
import type { Appointment } from '../types';
import type { AppointmentFormData, InvoiceFormData, MedicalRecordFormData } from '../schemas';

// ─── Shared types ────────────────────────────────────────────
type PipelineStatus = 'scheduled' | 'arrived' | 'in-progress' | 'completed';

const pipelineColumns: { key: PipelineStatus; label: string; icon: typeof Clock; color: string; bgColor: string; borderColor: string }[] = [
    { key: 'scheduled', label: 'Planifie', icon: Clock, color: 'text-sky-600', bgColor: 'bg-sky-50', borderColor: 'border-sky-200' },
    { key: 'arrived', label: 'Arrive', icon: UserCheck, color: 'text-violet-600', bgColor: 'bg-violet-50', borderColor: 'border-violet-200' },
    { key: 'in-progress', label: 'En consultation', icon: Stethoscope, color: 'text-amber-600', bgColor: 'bg-amber-50', borderColor: 'border-amber-200' },
    { key: 'completed', label: 'Termine', icon: CheckCircle, color: 'text-emerald-600', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200' },
];

const typeEmoji: Record<Appointment['type'], string> = {
    consultation: '🩺', vaccination: '💉', surgery: '🔪', 'follow-up': '🔄', emergency: '🚨',
};
const typeLabel: Record<Appointment['type'], string> = {
    consultation: 'Consultation', vaccination: 'Vaccination', surgery: 'Chirurgie', 'follow-up': 'Suivi', emergency: 'Urgence',
};

const statusLabel: Record<PipelineStatus, string> = {
    scheduled: 'Planifie', arrived: 'Arrive', 'in-progress': 'En consultation', completed: 'Termine',
};
const statusColor: Record<PipelineStatus, string> = {
    scheduled: 'bg-sky-100 text-sky-700',
    arrived: 'bg-violet-100 text-violet-700',
    'in-progress': 'bg-amber-100 text-amber-700',
    completed: 'bg-emerald-100 text-emerald-700',
};

// ─── Main Dashboard ──────────────────────────────────────────
export function ClinicDashboard() {
    const { user, role } = useAuth();
    const { patients, appointments, products, addAppointment, updateAppointmentStatus, addMedicalRecord, adjustProductStock, invoices, addInvoice } = useClinicData();
    const navigate = useNavigate();
    const toast = useToast();
    const [showNewAppointment, setShowNewAppointment] = useState(false);
    const [showInvoiceForm, setShowInvoiceForm] = useState(false);
    const [invoicePatientId, setInvoicePatientId] = useState<string | undefined>(undefined);
    const [consultingAppointment, setConsultingAppointment] = useState<Appointment | null>(null);
    const [showCounterSale, setShowCounterSale] = useState(false);

    const today = format(new Date(), 'yyyy-MM-dd');

    const todayAppointments = useMemo(() =>
        appointments.filter((a) => a.date === today && a.status !== 'cancelled').sort((a, b) => a.time.localeCompare(b.time)),
        [appointments, today]
    );

    const invoicedSet = useMemo(() =>
        new Set(invoices.map((inv) => `${inv.patientId}-${inv.date}`)),
        [invoices]
    );

    const isUnbilled = (a: Appointment) =>
        a.status === 'completed' && !invoicedSet.has(`${a.patientId}-${a.date}`);

    const patientAlertsMap = useMemo(() => {
        const map = new Map<string, { description: string; severity: string }[]>();
        patients.forEach((p) => { if (p.alerts.length > 0) map.set(p.id, p.alerts); });
        return map;
    }, [patients]);

    const stats = {
        scheduled: todayAppointments.filter((a) => a.status === 'scheduled').length,
        arrived: todayAppointments.filter((a) => a.status === 'arrived').length,
        inProgress: todayAppointments.filter((a) => a.status === 'in-progress').length,
        completed: todayAppointments.filter((a) => a.status === 'completed').length,
        toBill: todayAppointments.filter(isUnbilled).length,
    };

    const unpaidInvoices = useMemo(() =>
        invoices.filter((inv) => inv.status === 'pending' || inv.status === 'overdue' || inv.status === 'partial'), [invoices]
    );
    const lowStockProducts = useMemo(() => products.filter((p) => p.stock <= p.minStock), [products]);

    // ─── Handlers ───
    const handleSimpleAdvance = (appointment: Appointment) => {
        updateAppointmentStatus(appointment.id, 'arrived');
        toast.success(`${appointment.patientName} est arrive`);
    };

    const handleStartConsultation = (appointment: Appointment) => {
        updateAppointmentStatus(appointment.id, 'in-progress');
        setConsultingAppointment(appointment);
    };

    const handleContinueConsultation = (appointment: Appointment) => {
        setConsultingAppointment(appointment);
    };

    const handleCompleteConsultation = (record: MedicalRecordFormData, prescribedProducts: { productId: string; productName: string; quantity: number; posology: string }[]) => {
        if (!consultingAppointment) return;
        addMedicalRecord(consultingAppointment.patientId, {
            date: record.date, type: record.type, diagnosis: record.diagnosis,
            treatment: record.treatment, notes: record.notes || '', veterinarian: record.veterinarian,
            prescriptions: (record.prescriptions || []).map((p) => ({
                id: '', medication: p.medication, dosage: p.dosage,
                frequency: p.frequency, duration: p.duration, instructions: p.instructions || '',
            })),
        });
        for (const rx of prescribedProducts) {
            adjustProductStock(rx.productId, -rx.quantity, 'prescription', `Prescription pour ${consultingAppointment.patientName}`);
        }
        updateAppointmentStatus(consultingAppointment.id, 'completed');
        toast.success(`Consultation terminee pour ${consultingAppointment.patientName}`);
    };

    const handleInvoice = (apt: Appointment) => {
        setInvoicePatientId(apt.patientId);
        setShowInvoiceForm(true);
        setConsultingAppointment(null);
    };

    const handleCounterSale = () => {
        setInvoicePatientId(undefined);
        setShowCounterSale(true);
        setShowInvoiceForm(true);
    };

    const handleNewAppointment = (data: AppointmentFormData) => {
        const patient = patients.find((p) => p.id === data.patientId);
        if (!patient) return;
        const result = addAppointment({
            patientId: data.patientId, patientName: patient.name,
            ownerName: `${patient.owner.firstName} ${patient.owner.lastName}`,
            species: patient.species, date: data.date, time: data.time,
            duration: Number(data.duration), type: data.type,
            veterinarian: data.veterinarian, notes: data.notes,
        });
        if (result.ok) toast.success('RDV cree');
        else toast.error(result.message);
    };

    const handleNewInvoice = (data: InvoiceFormData) => {
        const invoice = addInvoice({
            patientId: data.patientId, patientName: '', ownerName: '',
            date: new Date().toISOString().split('T')[0],
            dueDate: data.dueDate, lines: data.lines,
        });
        if (showCounterSale) {
            data.lines.forEach((line) => {
                const product = products.find((p) => p.name === line.description);
                if (product) adjustProductStock(product.id, -line.quantity, 'counter_sale', `Vente comptoir - Facture ${invoice.invoiceNumber}`);
            });
        }
        toast.success(showCounterSale ? 'Vente comptoir enregistree' : 'Facture creee');
        setShowInvoiceForm(false);
        setShowCounterSale(false);
    };

    const greeting = (() => {
        const h = new Date().getHours();
        if (h < 12) return 'Bonjour';
        if (h < 18) return 'Bon apres-midi';
        return 'Bonsoir';
    })();

    const consultingPatient = consultingAppointment
        ? patients.find((p) => p.id === consultingAppointment.patientId) : null;

    return (
        <div>
            <Header
                title={`${greeting}, ${user?.name?.split(' ').pop()}`}
                subtitle={format(new Date(), "EEEE d MMMM yyyy", { locale: fr })}
            />

            <div className="p-4 sm:p-6 space-y-6">
                {/* ═══════════════════════════════════════════════════════════════
                    VETERINARIAN VIEW — Pipeline + Consultation
                   ═══════════════════════════════════════════════════════════════ */}
                {role === 'veterinarian' && (
                    <>
                        {/* Stats pills */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex flex-wrap gap-2">
                                {pipelineColumns.map((col) => {
                                    const count = todayAppointments.filter((a) => a.status === col.key).length;
                                    return (
                                        <div key={col.key} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${col.bgColor} ${col.color}`}>
                                            <col.icon className="w-3.5 h-3.5" /> {count} {col.label.toLowerCase()}
                                        </div>
                                    );
                                })}
                            </div>
                            <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowNewAppointment(true)}>
                                Nouveau RDV
                            </Button>
                        </div>

                        {/* Pipeline Kanban */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                            {pipelineColumns.map((col) => {
                                const colApts = todayAppointments.filter((a) => a.status === col.key);
                                const IconComp = col.icon;
                                return (
                                    <div key={col.key} className={`rounded-2xl border ${col.borderColor} ${col.bgColor} p-4 min-h-[200px]`}>
                                        <div className="flex items-center gap-2 mb-4">
                                            <IconComp className={`w-5 h-5 ${col.color}`} />
                                            <h3 className={`font-semibold ${col.color}`}>{col.label}</h3>
                                            <Badge variant="neutral">{colApts.length}</Badge>
                                        </div>
                                        <div className="space-y-3">
                                            {colApts.length === 0 && <p className="text-center text-sm text-slate-400 py-6">Aucun RDV</p>}
                                            {colApts.map((apt) => {
                                                const alerts = patientAlertsMap.get(apt.patientId);
                                                const highAlerts = alerts?.filter((a) => a.severity === 'high') || [];
                                                const unbilled = isUnbilled(apt);

                                                let actionLabel = '', actionColor = '', onAction = () => { };
                                                let actionIcon: React.ReactNode = null;

                                                if (apt.status === 'scheduled') {
                                                    actionLabel = 'Patient arrive'; actionIcon = <UserCheck className="w-4 h-4" />;
                                                    actionColor = 'bg-violet-600 hover:bg-violet-700'; onAction = () => handleSimpleAdvance(apt);
                                                } else if (apt.status === 'arrived') {
                                                    actionLabel = 'Demarrer consultation'; actionIcon = <Stethoscope className="w-4 h-4" />;
                                                    actionColor = 'bg-amber-600 hover:bg-amber-700'; onAction = () => handleStartConsultation(apt);
                                                } else if (apt.status === 'in-progress') {
                                                    actionLabel = 'Reprendre consultation'; actionIcon = <Stethoscope className="w-4 h-4" />;
                                                    actionColor = 'bg-amber-600 hover:bg-amber-700'; onAction = () => handleContinueConsultation(apt);
                                                } else if (apt.status === 'completed') {
                                                    if (unbilled) {
                                                        actionLabel = 'Facturer'; actionIcon = <Receipt className="w-4 h-4" />;
                                                        actionColor = 'bg-emerald-600 hover:bg-emerald-700'; onAction = () => handleInvoice(apt);
                                                    } else {
                                                        actionLabel = 'Voir fiche'; actionIcon = <ArrowRight className="w-4 h-4" />;
                                                        actionColor = 'bg-slate-600 hover:bg-slate-700'; onAction = () => navigate(`/patients/${apt.patientId}`);
                                                    }
                                                }

                                                return (
                                                    <div key={apt.id} className={`rounded-xl border p-3.5 bg-white shadow-sm hover:shadow-md transition-all ${highAlerts.length > 0 ? 'border-rose-300 ring-1 ring-rose-200' : 'border-slate-200'}`}>
                                                        {highAlerts.length > 0 && (
                                                            <div className="flex flex-wrap gap-1 mb-2">
                                                                {highAlerts.map((a, i) => (
                                                                    <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700">
                                                                        <AlertTriangle className="w-3 h-3" />{a.description}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="text-sm font-bold text-slate-900">{apt.time}</span>
                                                            <span className="text-xs">{typeEmoji[apt.type]} {typeLabel[apt.type]}</span>
                                                        </div>
                                                        <button onClick={() => navigate(`/patients/${apt.patientId}`)} className="text-left w-full group">
                                                            <p className="font-semibold text-slate-900 group-hover:text-primary-600 transition-colors">{apt.patientName}</p>
                                                        </button>
                                                        <p className="text-xs text-slate-500">{apt.ownerName}</p>
                                                        <button onClick={onAction} className={`mt-3 w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-white text-sm font-medium transition-colors ${actionColor}`}>
                                                            {actionIcon} {actionLabel}
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {todayAppointments.length === 0 && (
                            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
                                <Stethoscope className="w-10 h-10 text-slate-300 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-slate-700 mb-1">Aucun rendez-vous aujourd'hui</h3>
                                <p className="text-sm text-slate-400">Bonne nouvelle !</p>
                            </div>
                        )}
                    </>
                )}

                {/* ═══════════════════════════════════════════════════════════════
                    ASSISTANT VIEW — Reception, Planning, Billing
                   ═══════════════════════════════════════════════════════════════ */}
                {role === 'assistant' && (
                    <>
                        {/* Quick actions */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex flex-wrap gap-2">
                                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${stats.toBill > 0 ? 'bg-rose-100 text-rose-700 animate-pulse' : 'bg-emerald-100 text-emerald-700'}`}>
                                    <Receipt className="w-3.5 h-3.5" />
                                    {stats.toBill > 0 ? `${stats.toBill} a facturer` : 'Tout facture'}
                                </div>
                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-100 text-sky-700 text-sm font-medium">
                                    <Calendar className="w-3.5 h-3.5" /> {todayAppointments.length} RDV aujourd'hui
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" icon={<ShoppingCart className="w-4 h-4" />} onClick={handleCounterSale}>
                                    Vente comptoir
                                </Button>
                                <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowNewAppointment(true)}>
                                    Nouveau RDV
                                </Button>
                            </div>
                        </div>

                        {/* Alerts: unpaid invoices + low stock */}
                        {(unpaidInvoices.length > 0 || lowStockProducts.length > 0) && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {unpaidInvoices.length > 0 && (
                                    <button onClick={() => navigate('/billing')} className="flex items-center gap-3 p-4 rounded-xl bg-orange-50 border border-orange-200 hover:bg-orange-100 transition-colors text-left">
                                        <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center"><CreditCard className="w-5 h-5 text-orange-600" /></div>
                                        <div>
                                            <p className="text-sm font-semibold text-orange-800">{unpaidInvoices.length} facture(s) en attente</p>
                                            <p className="text-xs text-orange-600">
                                                {unpaidInvoices.filter((i) => i.status === 'overdue').length > 0
                                                    ? `dont ${unpaidInvoices.filter((i) => i.status === 'overdue').length} en retard`
                                                    : 'A suivre'}
                                            </p>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-orange-400 ml-auto" />
                                    </button>
                                )}
                                {lowStockProducts.length > 0 && (
                                    <button onClick={() => navigate('/inventory')} className="flex items-center gap-3 p-4 rounded-xl bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors text-left">
                                        <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center"><Package className="w-5 h-5 text-rose-600" /></div>
                                        <div>
                                            <p className="text-sm font-semibold text-rose-800">{lowStockProducts.length} produit(s) stock bas</p>
                                            <p className="text-xs text-rose-600">{lowStockProducts.slice(0, 3).map((p) => p.name).join(', ')}</p>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-rose-400 ml-auto" />
                                    </button>
                                )}
                            </div>
                        )}

                        {/* ── Planning du jour: Liste timeline ── */}
                        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-primary-600" />
                                    <h2 className="font-semibold text-slate-900">Planning du jour</h2>
                                </div>
                                <button onClick={() => navigate('/appointments')} className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
                                    Voir le calendrier <ArrowRight className="w-3 h-3" />
                                </button>
                            </div>

                            {todayAppointments.length === 0 ? (
                                <div className="text-center py-12">
                                    <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                                    <p className="text-sm text-slate-400">Aucun rendez-vous aujourd'hui</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-50">
                                    {todayAppointments.map((apt) => {
                                        const alerts = patientAlertsMap.get(apt.patientId);
                                        const highAlerts = alerts?.filter((a) => a.severity === 'high') || [];
                                        const unbilled = isUnbilled(apt);

                                        return (
                                            <div key={apt.id} className={`px-5 py-3.5 flex items-center gap-4 hover:bg-slate-50 transition-colors ${highAlerts.length > 0 ? 'bg-rose-50/50' : ''}`}>
                                                {/* Time */}
                                                <div className="w-14 text-center shrink-0">
                                                    <p className="text-sm font-bold text-slate-900">{apt.time}</p>
                                                    <p className="text-xs text-slate-400">{typeEmoji[apt.type]}</p>
                                                </div>

                                                {/* Divider */}
                                                <div className={`w-1 h-12 rounded-full shrink-0 ${apt.status === 'completed' ? 'bg-emerald-400' :
                                                        apt.status === 'in-progress' ? 'bg-amber-400' :
                                                            apt.status === 'arrived' ? 'bg-violet-400' :
                                                                'bg-sky-300'
                                                    }`}></div>

                                                {/* Patient info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <button onClick={() => navigate(`/patients/${apt.patientId}`)} className="font-semibold text-slate-900 hover:text-primary-600 transition-colors text-sm truncate">
                                                            {apt.patientName}
                                                        </button>
                                                        {highAlerts.map((a, i) => (
                                                            <span key={i} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-bold bg-rose-100 text-rose-700">
                                                                <AlertTriangle className="w-3 h-3" />{a.description}
                                                            </span>
                                                        ))}
                                                    </div>
                                                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                                                        <span className="flex items-center gap-1"><PawPrint className="w-3 h-3" />{apt.species}</span>
                                                        <span className="flex items-center gap-1"><User className="w-3 h-3" />{apt.ownerName}</span>
                                                        <span className="text-slate-400">{apt.veterinarian}</span>
                                                    </div>
                                                </div>

                                                {/* Status badge */}
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium shrink-0 ${statusColor[apt.status as PipelineStatus]}`}>
                                                    {statusLabel[apt.status as PipelineStatus]}
                                                </span>

                                                {/* Actions */}
                                                <div className="shrink-0 flex items-center gap-2">
                                                    {apt.status === 'scheduled' && (
                                                        <button onClick={() => handleSimpleAdvance(apt)} className="px-3 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-medium hover:bg-violet-700 transition-colors flex items-center gap-1">
                                                            <UserCheck className="w-3.5 h-3.5" /> Arrive
                                                        </button>
                                                    )}
                                                    {unbilled && (
                                                        <button onClick={() => handleInvoice(apt)} className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 transition-colors flex items-center gap-1">
                                                            <Receipt className="w-3.5 h-3.5" /> Facturer
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* ── A facturer (prominent if any) ── */}
                        {stats.toBill > 0 && (
                            <div className="bg-white rounded-2xl border border-emerald-200 overflow-hidden">
                                <div className="px-5 py-3 bg-emerald-50 border-b border-emerald-100 flex items-center gap-2">
                                    <Receipt className="w-4 h-4 text-emerald-600" />
                                    <h3 className="font-semibold text-emerald-800 text-sm">A facturer</h3>
                                    <Badge variant="neutral">{stats.toBill}</Badge>
                                </div>
                                <div className="divide-y divide-slate-50">
                                    {todayAppointments.filter(isUnbilled).map((apt) => (
                                        <div key={apt.id} className="px-5 py-3 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm font-bold text-slate-900">{apt.time}</span>
                                                <span className="text-sm text-slate-700">{apt.patientName}</span>
                                                <span className="text-xs text-slate-400">{apt.ownerName}</span>
                                            </div>
                                            <button onClick={() => handleInvoice(apt)} className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors flex items-center gap-2">
                                                <Receipt className="w-4 h-4" /> Facturer
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Modals */}
            <AppointmentForm isOpen={showNewAppointment} onClose={() => setShowNewAppointment(false)} onSubmit={handleNewAppointment} defaultDate={today} />
            <InvoiceForm isOpen={showInvoiceForm} onClose={() => { setShowInvoiceForm(false); setShowCounterSale(false); }} onSubmit={handleNewInvoice} defaultPatientId={invoicePatientId} />

            {/* Consultation Panel — vet only */}
            {role === 'veterinarian' && consultingAppointment && consultingPatient && (
                <ConsultationPanel
                    isOpen={true}
                    appointment={consultingAppointment}
                    patient={consultingPatient}
                    products={products}
                    onComplete={handleCompleteConsultation}
                    onInvoice={() => handleInvoice(consultingAppointment)}
                    onClose={() => setConsultingAppointment(null)}
                />
            )}
        </div>
    );
}
