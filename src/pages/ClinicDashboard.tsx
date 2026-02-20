import { useState, useMemo } from 'react';
import { Header } from '../components/layout';
import { Badge, Button, Tabs } from '../components/ui';
import {
    Plus,
    Receipt,
    UserCheck,
    Stethoscope,
    CheckCircle,
    Clock,
    ArrowRight,
    PawPrint,
    ShoppingCart,
    AlertTriangle,
    Package,
    CreditCard,
    Calendar,
    Play,
    ChevronRight,
    Home,
    Filter,
    Users,
} from 'lucide-react';
import { useClinicData } from '../context/clinicState';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { AppointmentForm, InvoiceForm } from '../components/forms';
import { ConsultationPanel } from '../components/consultation/ConsultationPanel';
import { AppointmentBookingPanel } from '../components/appointment/AppointmentBookingPanel';
import { useToast } from '../components/ui/Toast';
import type { Appointment } from '../types';
import type { AppointmentFormData, InvoiceFormData, MedicalRecordFormData } from '../schemas';

// ─── Shared helpers ──────────────────────────────────────────
type PipelineStatus = 'scheduled' | 'arrived' | 'in-progress' | 'completed';

const speciesIcon: Record<string, string> = {
    dog: '🐕', cat: '🐈', bird: '🐦', rabbit: '🐇', other: '🐾',
};
const typeLabel: Record<Appointment['type'], string> = {
    consultation: 'Consultation', vaccination: 'Vaccination', surgery: 'Chirurgie', 'follow-up': 'Suivi', emergency: 'Urgence',
};
const typeColor: Record<Appointment['type'], string> = {
    consultation: 'bg-primary-100 text-primary-700',
    vaccination: 'bg-secondary-100 text-secondary-700',
    surgery: 'bg-rose-100 text-rose-700',
    'follow-up': 'bg-slate-100 text-slate-600',
    emergency: 'bg-red-100 text-red-700',
};

const appointmentBillingLabel: Record<Appointment['type'], string> = {
    consultation: 'Consultation clinique',
    vaccination: 'Acte de vaccination',
    surgery: 'Intervention chirurgicale',
    'follow-up': 'Consultation de suivi',
    emergency: 'Prise en charge urgence',
};

const appointmentDefaultPrice: Record<Appointment['type'], number> = {
    consultation: 45,
    vaccination: 75,
    surgery: 180,
    'follow-up': 35,
    emergency: 95,
};

const stepConfig: { key: PipelineStatus; label: string; icon: typeof Clock; color: string; bg: string }[] = [
    { key: 'scheduled', label: 'Planifié', icon: Clock, color: 'text-primary-600', bg: 'bg-primary-500' },
    { key: 'arrived', label: 'Arrivé', icon: UserCheck, color: 'text-secondary-600', bg: 'bg-secondary-500' },
    { key: 'in-progress', label: 'En cours', icon: Stethoscope, color: 'text-amber-600', bg: 'bg-amber-500' },
    { key: 'completed', label: 'Terminé', icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-500' },
];

// ─── Assistant Billing Tab (sub-component) ──────────────────
function AssistantBillingTab({ invoices, navigate }: { invoices: import('../types').Invoice[]; navigate: (path: string) => void }) {
    const [billingFilter, setBillingFilter] = useState<'today' | 'pending' | 'overdue'>('today');

    const todayStr = format(new Date(), 'yyyy-MM-dd');

    const todayInvoices = invoices.filter((inv) => inv.date === todayStr);
    const pendingInvoices = invoices.filter((inv) => inv.status === 'pending' || inv.status === 'partial');
    const overdueInvoices = invoices.filter((inv) => inv.status === 'overdue');

    const totalToCollect = todayInvoices
        .filter((inv) => inv.status !== 'paid')
        .reduce((sum, inv) => sum + inv.total - inv.payments.reduce((s, p) => s + p.amount, 0), 0);

    const filteredInvoices =
        billingFilter === 'today' ? todayInvoices :
        billingFilter === 'pending' ? pendingInvoices :
        overdueInvoices;

    const statusLabel: Record<string, { label: string; color: string }> = {
        paid: { label: 'Payee', color: 'bg-emerald-100 text-emerald-700' },
        pending: { label: 'En attente', color: 'bg-orange-100 text-orange-700' },
        overdue: { label: 'En retard', color: 'bg-red-100 text-red-700' },
        partial: { label: 'Partiel', color: 'bg-amber-100 text-amber-700' },
    };

    return (
        <div className="space-y-5">
            {/* Counters */}
            <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-primary-50 border border-primary-100">
                    <p className="text-xs text-primary-600 font-medium">A encaisser aujourd'hui</p>
                    <p className="text-2xl font-bold text-primary-700">{totalToCollect.toFixed(2)} EUR</p>
                </div>
                <div className="p-4 rounded-xl bg-red-50 border border-red-100">
                    <p className="text-xs text-red-600 font-medium">Factures en retard</p>
                    <p className="text-2xl font-bold text-red-700">{overdueInvoices.length}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                {([
                    { key: 'today' as const, label: 'Aujourd\'hui', count: todayInvoices.length },
                    { key: 'pending' as const, label: 'En attente', count: pendingInvoices.length },
                    { key: 'overdue' as const, label: 'En retard', count: overdueInvoices.length },
                ]).map((f) => (
                    <button
                        key={f.key}
                        onClick={() => setBillingFilter(f.key)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            billingFilter === f.key
                                ? 'bg-primary-100 text-primary-700'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                        {f.label} ({f.count})
                    </button>
                ))}
            </div>

            {/* Invoice list */}
            {filteredInvoices.length === 0 ? (
                <div className="text-center py-10">
                    <Receipt className="w-7 h-7 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-400">Aucune facture dans cette categorie</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {filteredInvoices.map((inv) => (
                        <div key={inv.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:shadow-sm transition-shadow">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-semibold text-slate-900">{inv.invoiceNumber}</p>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusLabel[inv.status]?.color || 'bg-slate-100 text-slate-600'}`}>
                                            {statusLabel[inv.status]?.label || inv.status}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500">{inv.patientName} · {inv.ownerName}</p>
                                </div>
                            </div>
                            <p className="text-sm font-bold text-slate-900 shrink-0">{inv.total.toFixed(2)} EUR</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Link to full billing page */}
            <div className="pt-2 text-center">
                <button onClick={() => navigate('/billing')} className="text-sm text-primary-600 hover:text-primary-700 font-medium inline-flex items-center gap-1">
                    Page facturation complete <ArrowRight className="w-3 h-3" />
                </button>
            </div>
        </div>
    );
}

// ─── Main Dashboard ──────────────────────────────────────────
export function ClinicDashboard() {
    const { user, role } = useAuth();
    const { patients, appointments, products, addAppointment, updateAppointmentStatus, addMedicalRecord, adjustProductStock, invoices, addInvoice } = useClinicData();
    const navigate = useNavigate();
    const toast = useToast();
    const [showNewAppointment, setShowNewAppointment] = useState(false);
    const [showInvoiceForm, setShowInvoiceForm] = useState(false);
    const [consultingAppointment, setConsultingAppointment] = useState<Appointment | null>(null);
    const [showCounterSale, setShowCounterSale] = useState(false);

    const today = format(new Date(), 'yyyy-MM-dd');

    const todayAppointments = useMemo(() =>
        appointments.filter((a) => a.date === today && a.status !== 'cancelled').sort((a, b) => a.time.localeCompare(b.time)),
        [appointments, today]
    );

    const invoicedAppointmentSet = useMemo(() =>
        new Set(invoices.map((inv) => inv.sourceAppointmentId).filter((id): id is string => !!id)),
        [invoices]
    );
    const legacyInvoicedSet = useMemo(() =>
        new Set(invoices.map((inv) => `${inv.patientId}-${inv.date}`)),
        [invoices]
    );

    const isUnbilled = (a: Appointment) =>
        a.status === 'completed'
        && !invoicedAppointmentSet.has(a.id)
        && !legacyInvoicedSet.has(`${a.patientId}-${a.date}`);

    const patientAlertsMap = useMemo(() => {
        const map = new Map<string, { description: string; severity: string }[]>();
        patients.forEach((p) => { if (p.alerts.length > 0) map.set(p.id, p.alerts); });
        return map;
    }, [patients]);

    // Stats
    const counts = {
        scheduled: todayAppointments.filter((a) => a.status === 'scheduled').length,
        arrived: todayAppointments.filter((a) => a.status === 'arrived').length,
        inProgress: todayAppointments.filter((a) => a.status === 'in-progress').length,
        completed: todayAppointments.filter((a) => a.status === 'completed').length,
        toBill: todayAppointments.filter(isUnbilled).length,
    };

    const inProgressAppointment = todayAppointments.find((a) => a.status === 'in-progress') ?? null;
    const nextUp = todayAppointments.find((a) => a.status === 'scheduled' || a.status === 'arrived') ?? null;

    const unpaidInvoices = useMemo(() =>
        invoices.filter((inv) => inv.status === 'pending' || inv.status === 'overdue' || inv.status === 'partial'), [invoices]
    );
    const lowStockProducts = useMemo(() => products.filter((p) => p.stock <= p.minStock), [products]);

    // ─── Handlers ───
    const handleSimpleAdvance = (appointment: Appointment) => {
        updateAppointmentStatus(appointment.id, 'arrived');
        toast.success(`${appointment.patientName} est arrivé`);
    };

    const handleStartConsultation = (appointment: Appointment) => {
        updateAppointmentStatus(appointment.id, 'in-progress');
        setConsultingAppointment(appointment);
    };

    const handleContinueConsultation = (appointment: Appointment) => {
        setConsultingAppointment(appointment);
    };

    const createAutoInvoiceFromAppointment = (appointment: Appointment, lines?: InvoiceFormData['lines']) => {
        const patient = patients.find((p) => p.id === appointment.patientId);
        if (!patient) return null;
        return addInvoice({
            patientId: appointment.patientId,
            patientName: patient.name,
            ownerName: `${patient.owner.firstName} ${patient.owner.lastName}`,
            source: 'consultation',
            sourceAppointmentId: appointment.id,
            date: appointment.date,
            dueDate: appointment.date,
            lines: lines && lines.length > 0 ? lines : buildDefaultServiceLine(appointment),
        });
    };

    const handleCompleteConsultation = (
        record: MedicalRecordFormData,
        prescribedProducts: { productId: string; productName: string; quantity: number; posology: string }[],
        billingLines: InvoiceFormData['lines']
    ) => {
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
        const invoice = createAutoInvoiceFromAppointment(consultingAppointment, billingLines);
        toast.success(`Consultation terminee pour ${consultingAppointment.patientName}`);
        if (invoice) {
            toast.success(`Facture ${invoice.invoiceNumber} generee automatiquement`);
        }
    };

    const buildDefaultServiceLine = (apt: Appointment): InvoiceFormData['lines'] => ([
        {
            lineType: 'service',
            description: appointmentBillingLabel[apt.type],
            quantity: 1,
            unitPrice: appointmentDefaultPrice[apt.type],
        },
    ]);

    const handleCounterSale = () => {
        setShowCounterSale(true);
        setShowInvoiceForm(true);
    };

    const handleNewAppointment = (data: AppointmentFormData, force = false) => {
        const patient = patients.find((p) => p.id === data.patientId);
        if (!patient) return;
        const result = addAppointment({
            patientId: data.patientId, patientName: patient.name,
            ownerName: `${patient.owner.firstName} ${patient.owner.lastName}`,
            species: patient.species, date: data.date, time: data.time,
            duration: Number(data.duration), type: data.type,
            veterinarian: data.veterinarian, notes: data.notes,
        }, force);
        if (result.ok) toast.success('RDV cree');
        else toast.error(result.message);
        return result;
    };

    const handleNewInvoice = (data: InvoiceFormData) => {
        const patient = patients.find((p) => p.id === data.patientId);
        const invoice = addInvoice({
            patientId: data.patientId,
            patientName: patient?.name ?? '',
            ownerName: patient ? `${patient.owner.firstName} ${patient.owner.lastName}` : '',
            source: showCounterSale ? 'counter_sale' : 'manual',
            date: new Date().toISOString().split('T')[0],
            dueDate: data.dueDate, lines: data.lines,
        });
        if (showCounterSale) {
            data.lines.forEach((line) => {
                const product = products.find((p) =>
                    p.id === line.productId || (line.lineType === 'product' && p.name === line.description)
                );
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

    // ─── Shared: Appointment Timeline Card ───
    // viewMode: 'vet' = vet actions only (start/resume consultation), 'assistant' = assistant actions (patient arrivé, facturation)
    const renderTimelineCard = (apt: Appointment, viewMode: 'vet' | 'assistant') => {
        const alerts = patientAlertsMap.get(apt.patientId);
        const highAlerts = alerts?.filter((a) => a.severity === 'high') || [];
        const unbilled = isUnbilled(apt);
        const isActive = apt.status === 'in-progress';

        // Determine single contextual action based on role
        let actionLabel = '';
        let actionColor = '';
        let actionIcon: React.ReactNode = null;
        let onAction = () => { };
        let statusBadge: React.ReactNode = null;

        if (viewMode === 'vet') {
            // Vet: only consultation actions (start/resume). No "Patient arrivé", no billing.
            if (apt.status === 'arrived') {
                actionLabel = 'Demarrer la consultation';
                actionIcon = <Play className="w-4 h-4" />;
                actionColor = 'bg-amber-500 hover:bg-amber-600 text-white';
                onAction = () => handleStartConsultation(apt);
            } else if (apt.status === 'in-progress') {
                actionLabel = 'Reprendre';
                actionIcon = <Stethoscope className="w-4 h-4" />;
                actionColor = 'bg-amber-500 hover:bg-amber-600 text-white';
                onAction = () => handleContinueConsultation(apt);
            } else if (apt.status === 'completed') {
                statusBadge = <span className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold">Termine</span>;
            }
            // scheduled → no action for vet (just displays the appointment)
        } else {
            // Assistant: patient arrivé, billing, badges for in-progress
            if (apt.status === 'scheduled') {
                actionLabel = 'Patient arrive';
                actionIcon = <UserCheck className="w-4 h-4" />;
                actionColor = 'bg-secondary-600 hover:bg-secondary-700 text-white';
                onAction = () => handleSimpleAdvance(apt);
            } else if (apt.status === 'arrived') {
                statusBadge = <span className="px-3 py-1.5 rounded-lg bg-secondary-50 text-secondary-700 text-xs font-semibold">En salle d'attente</span>;
            } else if (apt.status === 'in-progress') {
                statusBadge = <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 text-xs font-semibold"><span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />En consultation</span>;
            } else if (apt.status === 'completed' && unbilled) {
                actionLabel = 'Generer facture';
                actionIcon = <Receipt className="w-4 h-4" />;
                actionColor = 'bg-emerald-600 hover:bg-emerald-700 text-white';
                onAction = () => {
                    const invoice = createAutoInvoiceFromAppointment(apt);
                    if (invoice) toast.success(`Facture ${invoice.invoiceNumber} generee`);
                };
            } else if (apt.status === 'completed') {
                statusBadge = <span className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold">Facture</span>;
            }
        }

        // Status dot color
        const dotColor = apt.status === 'completed' ? 'bg-emerald-400' :
            apt.status === 'in-progress' ? 'bg-amber-400 animate-pulse' :
                apt.status === 'arrived' ? 'bg-secondary-400' :
                    'bg-slate-300';

        return (
            <div
                key={apt.id}
                className={`group relative flex gap-4 ${isActive ? '' : ''}`}
            >
                {/* Timeline dot & line */}
                <div className="flex flex-col items-center pt-1">
                    <div className={`w-3 h-3 rounded-full ${dotColor} ring-4 ring-white z-10 shrink-0`} />
                    <div className="w-0.5 flex-1 bg-slate-100 -mt-0.5" />
                </div>

                {/* Card */}
                <div className={`flex-1 mb-4 rounded-2xl border p-4 transition-all ${isActive
                    ? 'border-amber-300 bg-amber-50/50 shadow-md shadow-amber-100/50'
                    : apt.status === 'completed'
                        ? 'border-slate-100 bg-white/60 opacity-75'
                        : highAlerts.length > 0
                            ? 'border-rose-200 bg-white shadow-sm'
                            : 'border-slate-200 bg-white shadow-sm hover:shadow-md'
                    }`}
                >
                    {/* Alerts banner */}
                    {highAlerts.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                            {highAlerts.map((a, i) => (
                                <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold bg-rose-100 text-rose-700">
                                    <AlertTriangle className="w-3 h-3" />{a.description}
                                </span>
                            ))}
                        </div>
                    )}

                    <div className="flex items-start justify-between gap-3">
                        {/* Left: time + patient info */}
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                            {/* Time block */}
                            <div className="text-center shrink-0 pt-0.5">
                                <p className="text-lg font-bold text-slate-900 leading-none">{apt.time}</p>
                                <p className="text-[10px] text-slate-400 mt-0.5">{apt.duration} min</p>
                            </div>

                            {/* Patient info */}
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-base">{speciesIcon[apt.species]}</span>
                                    <button
                                        onClick={() => navigate(`/patients/${apt.patientId}`)}
                                        className="font-semibold text-slate-900 hover:text-primary-600 transition-colors truncate"
                                    >
                                        {apt.patientName}
                                    </button>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${typeColor[apt.type]}`}>
                                        {typeLabel[apt.type]}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 mt-0.5">{apt.ownerName} · {apt.veterinarian}</p>
                                {apt.notes && <p className="text-xs text-slate-400 italic mt-1">{apt.notes}</p>}
                            </div>
                        </div>

                        {/* Right: single action or status badge */}
                        {actionLabel ? (
                            <button
                                onClick={onAction}
                                className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${actionColor}`}
                            >
                                {actionIcon}
                                <span className="hidden sm:inline">{actionLabel}</span>
                            </button>
                        ) : statusBadge ? (
                            <div className="shrink-0">{statusBadge}</div>
                        ) : null}
                    </div>
                </div>
            </div>
        );
    };

    // ─── Progress Stepper ───
    const renderProgressStepper = () => {
        const total = todayAppointments.length;
        if (total === 0) return null;

        return (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                    {stepConfig.map((step, i) => {
                        const count = todayAppointments.filter((a) => a.status === step.key).length;
                        const isLast = i === stepConfig.length - 1;
                        const Icon = step.icon;
                        return (
                            <div key={step.key} className="flex items-center flex-1">
                                <div className="flex items-center gap-2">
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${count > 0 ? `${step.bg} text-white` : 'bg-slate-100 text-slate-400'}`}>
                                        <Icon className="w-4 h-4" />
                                    </div>
                                    <div className="hidden sm:block">
                                        <p className="text-xs text-slate-500">{step.label}</p>
                                        <p className={`text-lg font-bold leading-none ${count > 0 ? step.color : 'text-slate-300'}`}>{count}</p>
                                    </div>
                                    <div className="sm:hidden">
                                        <p className={`text-lg font-bold leading-none ${count > 0 ? step.color : 'text-slate-300'}`}>{count}</p>
                                    </div>
                                </div>
                                {!isLast && (
                                    <ChevronRight className="w-4 h-4 text-slate-200 mx-2 shrink-0" />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    // ─── "In Progress" Prominent Card ───
    const renderInProgressCard = () => {
        if (!inProgressAppointment) return null;
        const apt = inProgressAppointment;
        const alerts = patientAlertsMap.get(apt.patientId);
        const highAlerts = alerts?.filter((a) => a.severity === 'high') || [];

        return (
            <div className="relative overflow-hidden rounded-2xl border-2 border-amber-300 bg-gradient-to-r from-amber-50 via-amber-50/50 to-white p-5 shadow-lg shadow-amber-100/30">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-100/40 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="relative">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse" />
                        <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Consultation en cours</span>
                    </div>

                    {highAlerts.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                            {highAlerts.map((a, i) => (
                                <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold bg-rose-100 text-rose-700">
                                    <AlertTriangle className="w-3 h-3" />{a.description}
                                </span>
                            ))}
                        </div>
                    )}

                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">{speciesIcon[apt.species]}</span>
                            <div>
                                <p className="text-lg font-bold text-slate-900">{apt.patientName}</p>
                                <p className="text-sm text-slate-500">{apt.ownerName} · {typeLabel[apt.type]} · {apt.time}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => handleContinueConsultation(apt)}
                            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold transition-all shadow-md shadow-amber-200/50"
                        >
                            <Stethoscope className="w-5 h-5" />
                            Reprendre
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // ─── Next Up indicator ───
    const renderNextUp = () => {
        if (!nextUp || inProgressAppointment) return null;
        return (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary-50 border border-primary-100">
                <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center">
                    <ArrowRight className="w-4 h-4 text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-primary-800">
                        Prochain : <span className="font-bold">{nextUp.patientName}</span> a {nextUp.time}
                    </p>
                    <p className="text-xs text-primary-600">{typeLabel[nextUp.type]} · {nextUp.ownerName}</p>
                </div>
            </div>
        );
    };

    return (
        <div>
            <Header
                title={`${greeting}, ${user?.name?.split(' ').pop()}`}
                subtitle={format(new Date(), "EEEE d MMMM yyyy", { locale: fr })}
            />

            <div className="p-4 sm:p-6 space-y-5">
                {/* ══════════════════════════════════════════════════════════
                    VETERINARIAN VIEW — "Ma Journee"
                   ══════════════════════════════════════════════════════════ */}
                {role === 'veterinarian' && (
                    <>
                        {/* Stepper only — no "Nouveau RDV" */}
                        <div className="w-full">{renderProgressStepper()}</div>

                        {/* In-progress prominent card */}
                        {renderInProgressCard()}

                        {/* Next up indicator */}
                        {renderNextUp()}

                        {/* Timeline — read-only, no calendar link */}
                        {todayAppointments.length > 0 ? (
                            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                                <div className="flex items-center gap-2 mb-5">
                                    <Calendar className="w-5 h-5 text-primary-600" />
                                    <h2 className="font-semibold text-slate-900">Ma journee</h2>
                                    <Badge variant="neutral">{todayAppointments.length} RDV</Badge>
                                </div>
                                <div>
                                    {todayAppointments.map((apt) => renderTimelineCard(apt, 'vet'))}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
                                <PawPrint className="w-10 h-10 text-slate-300 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-slate-700 mb-1">Aucun rendez-vous aujourd'hui</h3>
                                <p className="text-sm text-slate-400">Profitez-en !</p>
                            </div>
                        )}
                    </>
                )}

                {/* ══════════════════════════════════════════════════════════
                    ASSISTANT VIEW — "Poste d'accueil" with 3 tabs
                   ══════════════════════════════════════════════════════════ */}
                {role === 'assistant' && (
                    <>
                        {/* Quick actions */}
                        <div className="flex items-center gap-2 justify-end">
                            <Button variant="outline" icon={<ShoppingCart className="w-4 h-4" />} onClick={handleCounterSale}>
                                Vente comptoir
                            </Button>
                            <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowNewAppointment(true)}>
                                Nouveau RDV
                            </Button>
                        </div>

                        {/* Alerts banner */}
                        {(unpaidInvoices.length > 0 || lowStockProducts.length > 0) && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {unpaidInvoices.length > 0 && (
                                    <button onClick={() => navigate('/billing')} className="flex items-center gap-3 p-4 rounded-xl bg-orange-50 border border-orange-200 hover:bg-orange-100 transition-colors text-left">
                                        <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center shrink-0"><CreditCard className="w-5 h-5 text-orange-600" /></div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-orange-800">{unpaidInvoices.length} facture(s) en attente</p>
                                            <p className="text-xs text-orange-600">
                                                {unpaidInvoices.filter((i) => i.status === 'overdue').length > 0
                                                    ? `dont ${unpaidInvoices.filter((i) => i.status === 'overdue').length} en retard`
                                                    : 'A suivre'}
                                            </p>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-orange-400 shrink-0" />
                                    </button>
                                )}
                                {lowStockProducts.length > 0 && (
                                    <button onClick={() => navigate('/inventory')} className="flex items-center gap-3 p-4 rounded-xl bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors text-left">
                                        <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0"><Package className="w-5 h-5 text-rose-600" /></div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-rose-800">{lowStockProducts.length} produit(s) stock bas</p>
                                            <p className="text-xs text-rose-600 truncate">{lowStockProducts.slice(0, 3).map((p) => p.name).join(', ')}</p>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-rose-400 shrink-0" />
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Tabs */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <Tabs
                                tabs={[
                                    { key: 'accueil', label: 'Accueil', icon: <Home className="w-4 h-4" /> },
                                    { key: 'planning', label: 'Planning du jour', icon: <Calendar className="w-4 h-4" />, count: todayAppointments.length },
                                    { key: 'facturation', label: 'Facturation', icon: <Receipt className="w-4 h-4" />, count: unpaidInvoices.length || undefined },
                                ]}
                            >
                                {(activeTab) => (
                                    <div className="p-5">
                                        {/* ─── TAB: Accueil ─── */}
                                        {activeTab === 'accueil' && (
                                            <div className="space-y-6">
                                                {/* Salle d'attente */}
                                                <div>
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <Users className="w-5 h-5 text-secondary-600" />
                                                        <h3 className="font-semibold text-slate-900">Salle d'attente</h3>
                                                        <Badge variant="neutral">{counts.arrived}</Badge>
                                                    </div>
                                                    {counts.arrived === 0 ? (
                                                        <div className="text-center py-8 rounded-xl bg-slate-50 border border-slate-100">
                                                            <UserCheck className="w-7 h-7 text-slate-300 mx-auto mb-2" />
                                                            <p className="text-sm text-slate-400">Aucun patient en attente</p>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            {todayAppointments.filter((a) => a.status === 'arrived').map((apt) => (
                                                                <div key={apt.id} className="flex items-center justify-between p-3 rounded-xl border border-secondary-100 bg-secondary-50/50">
                                                                    <div className="flex items-center gap-3 min-w-0">
                                                                        <span className="text-sm font-bold text-slate-900">{apt.time}</span>
                                                                        <span className="text-base">{speciesIcon[apt.species]}</span>
                                                                        <div className="min-w-0">
                                                                            <button onClick={() => navigate(`/patients/${apt.patientId}`)} className="text-sm font-semibold text-slate-900 hover:text-primary-600 transition-colors truncate">{apt.patientName}</button>
                                                                            <p className="text-xs text-slate-500">{typeLabel[apt.type]} · {apt.veterinarian}</p>
                                                                        </div>
                                                                    </div>
                                                                    <span className="px-3 py-1.5 rounded-lg bg-secondary-100 text-secondary-700 text-xs font-semibold shrink-0">En attente</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Consultations en cours */}
                                                <div>
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <Stethoscope className="w-5 h-5 text-amber-600" />
                                                        <h3 className="font-semibold text-slate-900">Consultations en cours</h3>
                                                        <Badge variant="neutral">{counts.inProgress}</Badge>
                                                    </div>
                                                    {counts.inProgress === 0 ? (
                                                        <div className="text-center py-8 rounded-xl bg-slate-50 border border-slate-100">
                                                            <Stethoscope className="w-7 h-7 text-slate-300 mx-auto mb-2" />
                                                            <p className="text-sm text-slate-400">Aucune consultation en cours</p>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            {todayAppointments.filter((a) => a.status === 'in-progress').map((apt) => (
                                                                <div key={apt.id} className="flex items-center justify-between p-3 rounded-xl border border-amber-200 bg-amber-50/50">
                                                                    <div className="flex items-center gap-3 min-w-0">
                                                                        <span className="text-sm font-bold text-slate-900">{apt.time}</span>
                                                                        <span className="text-base">{speciesIcon[apt.species]}</span>
                                                                        <div className="min-w-0">
                                                                            <button onClick={() => navigate(`/patients/${apt.patientId}`)} className="text-sm font-semibold text-slate-900 hover:text-primary-600 transition-colors truncate">{apt.patientName}</button>
                                                                            <p className="text-xs text-slate-500">{typeLabel[apt.type]} · {apt.veterinarian}</p>
                                                                        </div>
                                                                    </div>
                                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-100 text-amber-700 text-xs font-semibold shrink-0">
                                                                        <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                                                                        En consultation
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* A facturer */}
                                                <div>
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <Receipt className="w-5 h-5 text-emerald-600" />
                                                        <h3 className="font-semibold text-slate-900">A facturer</h3>
                                                        {counts.toBill > 0 && <Badge variant="neutral">{counts.toBill}</Badge>}
                                                    </div>
                                                    {counts.toBill === 0 ? (
                                                        <div className="text-center py-8 rounded-xl bg-emerald-50/50 border border-emerald-100">
                                                            <CheckCircle className="w-7 h-7 text-emerald-300 mx-auto mb-2" />
                                                            <p className="text-sm text-emerald-600 font-medium">Tout est a jour</p>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            {todayAppointments.filter(isUnbilled).map((apt) => (
                                                                <div key={apt.id} className="flex items-center justify-between p-3 rounded-xl border border-emerald-100 bg-white">
                                                                    <div className="flex items-center gap-3 min-w-0">
                                                                        <span className="text-sm font-bold text-slate-900">{apt.time}</span>
                                                                        <span className="text-base">{speciesIcon[apt.species]}</span>
                                                                        <div className="min-w-0">
                                                                            <p className="text-sm font-semibold text-slate-900 truncate">{apt.patientName}</p>
                                                                            <p className="text-xs text-slate-500">{typeLabel[apt.type]} · {apt.veterinarian} · ~{appointmentDefaultPrice[apt.type]} EUR</p>
                                                                        </div>
                                                                    </div>
                                                                    <button onClick={() => {
                                                                        const invoice = createAutoInvoiceFromAppointment(apt);
                                                                        if (invoice) toast.success(`Facture ${invoice.invoiceNumber} generee`);
                                                                    }} className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors">
                                                                        <Receipt className="w-4 h-4" /> Generer facture
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* ─── TAB: Planning du jour ─── */}
                                        {activeTab === 'planning' && (
                                            <div className="space-y-5">
                                                {renderProgressStepper()}

                                                {todayAppointments.length === 0 ? (
                                                    <div className="text-center py-12">
                                                        <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                                                        <p className="text-sm text-slate-400">Aucun rendez-vous aujourd'hui</p>
                                                    </div>
                                                ) : (
                                                    <>
                                                        {/* Group by veterinarian */}
                                                        {(() => {
                                                            const byVet = new Map<string, Appointment[]>();
                                                            todayAppointments.forEach((apt) => {
                                                                const list = byVet.get(apt.veterinarian) || [];
                                                                list.push(apt);
                                                                byVet.set(apt.veterinarian, list);
                                                            });
                                                            return Array.from(byVet.entries()).map(([vet, apts]) => (
                                                                <div key={vet}>
                                                                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
                                                                        <Stethoscope className="w-4 h-4 text-primary-500" />
                                                                        <h3 className="text-sm font-semibold text-slate-700">{vet}</h3>
                                                                        <Badge variant="neutral">{apts.length}</Badge>
                                                                    </div>
                                                                    <div>
                                                                        {apts.map((apt) => renderTimelineCard(apt, 'assistant'))}
                                                                    </div>
                                                                </div>
                                                            ));
                                                        })()}

                                                        <div className="pt-2 text-center">
                                                            <button onClick={() => navigate('/appointments')} className="text-sm text-primary-600 hover:text-primary-700 font-medium inline-flex items-center gap-1">
                                                                Voir le calendrier complet <ArrowRight className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        )}

                                        {/* ─── TAB: Facturation ─── */}
                                        {activeTab === 'facturation' && (
                                            <AssistantBillingTab invoices={invoices} navigate={navigate} />
                                        )}
                                    </div>
                                )}
                            </Tabs>
                        </div>
                    </>
                )}
            </div>

            {/* Modals */}
            <AppointmentBookingPanel
                isOpen={showNewAppointment}
                onClose={() => setShowNewAppointment(false)}
                onBooked={() => toast.success('RDV cree')}
                defaultDate={today}
            />
            <InvoiceForm
                isOpen={showInvoiceForm}
                onClose={() => {
                    setShowInvoiceForm(false);
                    setShowCounterSale(false);
                }}
                onSubmit={handleNewInvoice}
            />

            {/* Consultation Panel — vet only */}
            {role === 'veterinarian' && consultingAppointment && consultingPatient && (
                <ConsultationPanel
                    isOpen={true}
                    appointment={consultingAppointment}
                    patient={consultingPatient}
                    products={products}
                    onComplete={handleCompleteConsultation}
                    onClose={() => setConsultingAppointment(null)}
                />
            )}
        </div>
    );
}
