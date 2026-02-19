import { useMemo, useState } from 'react';
import { Header } from '../components/layout';
import { Button, Badge, SearchInput } from '../components/ui';
import { useToast } from '../components/ui/Toast';
import { InvoiceForm, PaymentForm } from '../components/forms';
import { Search, Plus, FileText, CreditCard, Clock, CheckCircle, AlertTriangle, ChevronDown, ChevronUp, Receipt } from 'lucide-react';
import type { Invoice } from '../types';
import type { InvoiceFormData, PaymentFormData } from '../schemas';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useClinicData } from '../context/clinicState';
import { useAuth } from '../context/AuthContext';

const statusConfig: Record<Invoice['status'], { label: string; variant: 'success' | 'warning' | 'danger' | 'info' }> = {
    paid: { label: 'Paye', variant: 'success' },
    pending: { label: 'En attente', variant: 'warning' },
    overdue: { label: 'En retard', variant: 'danger' },
    partial: { label: 'Partiel', variant: 'info' },
};

const statusIcon: Record<Invoice['status'], typeof CheckCircle> = {
    paid: CheckCircle,
    pending: Clock,
    overdue: AlertTriangle,
    partial: CreditCard,
};

interface InvoiceRowProps {
    invoice: Invoice;
    onRecordPayment: (invoice: Invoice) => void;
    canManage: boolean;
}

function InvoiceRow({ invoice, onRecordPayment, canManage }: InvoiceRowProps) {
    const [expanded, setExpanded] = useState(false);
    const config = statusConfig[invoice.status];

    const amountPaid = useMemo(() => {
        if (!invoice.paymentPlan) {
            return invoice.status === 'paid' ? invoice.total : invoice.payments.reduce((sum, p) => sum + p.amount, 0);
        }
        return Math.min(invoice.paymentPlan.paidInstallments * invoice.paymentPlan.installmentAmount, invoice.total);
    }, [invoice]);

    const amountRemaining = Math.max(invoice.total - amountPaid, 0);
    const StatusIcon = statusIcon[invoice.status];

    return (
        <>
            <tr
                className="border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer"
                onClick={() => setExpanded(!expanded)}
            >
                <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                            <FileText className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                            <p className="font-medium text-slate-900 font-mono">{invoice.invoiceNumber}</p>
                            <p className="text-xs text-slate-500">
                                {format(new Date(invoice.date), 'dd MMM yyyy', { locale: fr })}
                            </p>
                        </div>
                    </div>
                </td>
                <td className="py-4 px-4">
                    <p className="font-medium text-slate-900">{invoice.ownerName}</p>
                    <p className="text-sm text-slate-500">{invoice.patientName}</p>
                </td>
                <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                        <StatusIcon className={`w-4 h-4 ${config.variant === 'success' ? 'text-emerald-500' : config.variant === 'danger' ? 'text-rose-500' : config.variant === 'warning' ? 'text-amber-500' : 'text-sky-500'}`} />
                        <Badge variant={config.variant}>{config.label}</Badge>
                    </div>
                </td>
                <td className="py-4 px-4">
                    <span className="font-bold text-slate-900">{invoice.total.toFixed(2)} EUR</span>
                </td>
                <td className="py-4 px-4">
                    {invoice.paymentPlan ? (
                        <div className="text-sm">
                            <p className="text-slate-900">
                                {invoice.paymentPlan.paidInstallments}/{invoice.paymentPlan.totalInstallments} echeances
                            </p>
                            <div className="w-24 h-2 bg-slate-200 rounded-full mt-1">
                                <div
                                    className="h-2 bg-primary-500 rounded-full transition-all"
                                    style={{
                                        width: `${(invoice.paymentPlan.paidInstallments / invoice.paymentPlan.totalInstallments) * 100}%`,
                                    }}
                                />
                            </div>
                        </div>
                    ) : (
                        <span className="text-slate-400">-</span>
                    )}
                </td>
                <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                        {invoice.status !== 'paid' && canManage && (
                            <Button
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onRecordPayment(invoice);
                                }}
                            >
                                Encaisser
                            </Button>
                        )}
                        {expanded ? (
                            <ChevronUp className="w-5 h-5 text-slate-400" />
                        ) : (
                            <ChevronDown className="w-5 h-5 text-slate-400" />
                        )}
                    </div>
                </td>
            </tr>
            {expanded && (
                <tr className="bg-slate-50">
                    <td colSpan={6} className="p-4">
                        <div className="bg-white rounded-lg p-4 border border-slate-200">
                            <h4 className="font-semibold text-slate-900 mb-3">Detail de la facture</h4>
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left text-sm text-slate-500">
                                        <th className="pb-2">Description</th>
                                        <th className="pb-2">Qte</th>
                                        <th className="pb-2">Prix unit.</th>
                                        <th className="pb-2 text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoice.lines.map((line) => (
                                        <tr key={line.id} className="border-t border-slate-100">
                                            <td className="py-2 text-slate-900">{line.description}</td>
                                            <td className="py-2 text-slate-600">{line.quantity}</td>
                                            <td className="py-2 text-slate-600">{line.unitPrice.toFixed(2)} EUR</td>
                                            <td className="py-2 text-right font-medium text-slate-900">
                                                {line.total.toFixed(2)} EUR
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                                    <p className="text-xs text-emerald-600">Montant encaisse</p>
                                    <p className="font-semibold text-emerald-700">{amountPaid.toFixed(2)} EUR</p>
                                </div>
                                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                                    <p className="text-xs text-amber-600">Reste a encaisser</p>
                                    <p className="font-semibold text-amber-700">{amountRemaining.toFixed(2)} EUR</p>
                                </div>
                                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                                    <p className="text-xs text-slate-500">Date d'echeance</p>
                                    <p className="font-semibold text-slate-900">
                                        {format(new Date(invoice.dueDate), 'dd MMM yyyy', { locale: fr })}
                                    </p>
                                </div>
                            </div>

                            {invoice.paymentPlan && (
                                <div className="mt-4 p-3 bg-sky-50 rounded-lg border border-sky-200">
                                    <p className="text-sm font-medium text-sky-900 mb-2">Plan de paiement</p>
                                    <div className="grid grid-cols-3 gap-4 text-sm">
                                        <div>
                                            <p className="text-sky-600">Echeances</p>
                                            <p className="font-medium text-sky-900">
                                                {invoice.paymentPlan.paidInstallments} / {invoice.paymentPlan.totalInstallments}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sky-600">Montant/echeance</p>
                                            <p className="font-medium text-sky-900">
                                                {invoice.paymentPlan.installmentAmount.toFixed(2)} EUR
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sky-600">Prochain paiement</p>
                                            <p className="font-medium text-sky-900">
                                                {format(new Date(invoice.paymentPlan.nextPaymentDate), 'dd MMM yyyy', { locale: fr })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {invoice.payments.length > 0 && (
                                <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                                    <p className="text-sm font-medium text-slate-700 mb-2">Historique paiements</p>
                                    <div className="space-y-2">
                                        {invoice.payments.map((p) => (
                                            <div key={p.id} className="flex items-center justify-between text-sm">
                                                <div className="flex items-center gap-2">
                                                    <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                                                    <span className="text-slate-600">
                                                        {format(new Date(p.date), 'dd/MM/yyyy')} - {p.method === 'card' ? 'Carte' : p.method === 'cash' ? 'Especes' : p.method === 'check' ? 'Cheque' : 'Virement'}
                                                    </span>
                                                </div>
                                                <span className="font-medium text-emerald-700">{p.amount.toFixed(2)} EUR</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
}

export function Billing() {
    const { invoices, addInvoice, recordPayment } = useClinicData();
    const { role } = useAuth();
    const toast = useToast();

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [showNewInvoice, setShowNewInvoice] = useState(false);
    const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);

    const canManage = role === 'assistant' || role === 'veterinarian';

    const filteredInvoices = useMemo(() => invoices.filter((inv) => {
        const q = searchQuery.toLowerCase();
        const matchesSearch = !q ||
            inv.invoiceNumber.toLowerCase().includes(q) ||
            inv.ownerName.toLowerCase().includes(q) ||
            inv.patientName.toLowerCase().includes(q);
        const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
        return matchesSearch && matchesStatus;
    }), [invoices, searchQuery, statusFilter]);

    const stats = useMemo(() => {
        const total = invoices.reduce((sum, inv) => sum + inv.total, 0);
        const paid = invoices.filter((i) => i.status === 'paid').reduce((sum, inv) => sum + inv.total, 0);
        const pending = invoices.filter((i) => i.status === 'pending' || i.status === 'partial').length;
        const overdue = invoices.filter((i) => i.status === 'overdue').length;
        return { total, paid, pending, overdue };
    }, [invoices]);

    const handleNewInvoice = (data: InvoiceFormData) => {
        const patient = invoices.length > 0 ? undefined : undefined; // just for type safety
        void patient;
        addInvoice({
            patientId: data.patientId,
            patientName: '',
            ownerName: '',
            date: new Date().toISOString().split('T')[0],
            dueDate: data.dueDate,
            lines: data.lines,
        });
        toast.success('Facture creee avec succes');
    };

    const handlePayment = (data: PaymentFormData) => {
        if (!payingInvoice) return;
        recordPayment(payingInvoice.id, {
            amount: data.amount,
            method: data.method,
            date: data.date,
        });
        toast.success('Paiement enregistre');
        setPayingInvoice(null);
    };

    const payingRemainingAmount = useMemo(() => {
        if (!payingInvoice) return 0;
        const paid = payingInvoice.payments.reduce((sum, p) => sum + p.amount, 0);
        return Math.max(payingInvoice.total - paid, 0);
    }, [payingInvoice]);

    return (
        <div>
            <Header title="Facturation" subtitle={`${invoices.length} factures`} />

            <div className="p-4 sm:p-8 space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                        <div className="flex items-center gap-2 text-slate-500 mb-1">
                            <Receipt className="w-4 h-4" />
                            <span className="text-xs font-medium">Total facture</span>
                        </div>
                        <p className="text-2xl font-bold text-slate-900">{stats.total.toFixed(2)} EUR</p>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                        <div className="flex items-center gap-2 text-emerald-600 mb-1">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-xs font-medium">Encaisse</span>
                        </div>
                        <p className="text-2xl font-bold text-emerald-700">{stats.paid.toFixed(2)} EUR</p>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                        <div className="flex items-center gap-2 text-amber-600 mb-1">
                            <Clock className="w-4 h-4" />
                            <span className="text-xs font-medium">En attente</span>
                        </div>
                        <p className="text-2xl font-bold text-amber-700">{stats.pending}</p>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                        <div className="flex items-center gap-2 text-rose-600 mb-1">
                            <AlertTriangle className="w-4 h-4" />
                            <span className="text-xs font-medium">En retard</span>
                        </div>
                        <p className="text-2xl font-bold text-rose-700">{stats.overdue}</p>
                    </div>
                </div>

                {/* Alert banner */}
                {stats.overdue > 0 && (
                    <div className="p-4 rounded-xl bg-gradient-to-r from-amber-50 to-rose-50 border border-amber-200">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="w-5 h-5 text-amber-600" />
                            <div className="flex items-center gap-2">
                                <Badge variant="danger">{stats.overdue}</Badge>
                                <span className="text-sm text-rose-700 font-medium">facture(s) en retard de paiement</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Filters + Actions */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-3">
                        <SearchInput
                            value={searchQuery}
                            onChange={setSearchQuery}
                            placeholder="Rechercher une facture..."
                            className="w-full sm:w-80"
                        />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-700"
                        >
                            <option value="all">Tous statuts</option>
                            <option value="paid">Payees</option>
                            <option value="pending">En attente</option>
                            <option value="partial">Partielles</option>
                            <option value="overdue">En retard</option>
                        </select>
                    </div>
                    {canManage && (
                        <Button
                            icon={<Plus className="w-4 h-4" />}
                            onClick={() => setShowNewInvoice(true)}
                        >
                            Nouvelle facture
                        </Button>
                    )}
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="text-left py-3 px-4 font-medium text-slate-600">Facture</th>
                                    <th className="text-left py-3 px-4 font-medium text-slate-600">Client</th>
                                    <th className="text-left py-3 px-4 font-medium text-slate-600">Statut</th>
                                    <th className="text-left py-3 px-4 font-medium text-slate-600">Montant</th>
                                    <th className="text-left py-3 px-4 font-medium text-slate-600">Echeancier</th>
                                    <th className="text-left py-3 px-4 font-medium text-slate-600">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredInvoices.map((invoice) => (
                                    <InvoiceRow
                                        key={invoice.id}
                                        invoice={invoice}
                                        onRecordPayment={setPayingInvoice}
                                        canManage={canManage}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {filteredInvoices.length === 0 && (
                        <div className="text-center py-12">
                            <FileText className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500">Aucune facture trouvee</p>
                            <p className="text-sm text-slate-400 mt-1">Modifiez vos filtres ou creez une nouvelle facture</p>
                        </div>
                    )}
                </div>
            </div>

            <InvoiceForm
                isOpen={showNewInvoice}
                onClose={() => setShowNewInvoice(false)}
                onSubmit={handleNewInvoice}
            />

            {payingInvoice && (
                <PaymentForm
                    isOpen={!!payingInvoice}
                    onClose={() => setPayingInvoice(null)}
                    onSubmit={handlePayment}
                    invoiceNumber={payingInvoice.invoiceNumber}
                    remainingAmount={payingRemainingAmount}
                />
            )}
        </div>
    );
}
