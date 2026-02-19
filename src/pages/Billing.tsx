import { useMemo, useState } from 'react';
import { Header } from '../components/layout';
import { Button, SearchInput } from '../components/ui';
import { useToast } from '../components/ui/Toast';
import { InvoiceForm, PaymentForm } from '../components/forms';
import {
    Plus,
    FileText,
    CreditCard,
    Clock,
    CheckCircle,
    AlertTriangle,
    ChevronDown,
    ChevronUp,
    Receipt,
    TrendingUp,
    X,
} from 'lucide-react';
import type { Invoice } from '../types';
import type { InvoiceFormData, PaymentFormData } from '../schemas';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useClinicData } from '../context/clinicState';
import { useAuth } from '../context/AuthContext';

type StatusFilter = 'all' | 'pending' | 'overdue' | 'partial' | 'paid';

const statusConfig: Record<Invoice['status'], {
    label: string;
    bg: string;
    text: string;
    ring: string;
    dot: string;
}> = {
    paid: {
        label: 'Payée',
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        ring: 'ring-emerald-200',
        dot: 'bg-emerald-500',
    },
    pending: {
        label: 'En attente',
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        ring: 'ring-amber-200',
        dot: 'bg-amber-500',
    },
    overdue: {
        label: 'En retard',
        bg: 'bg-rose-50',
        text: 'text-rose-700',
        ring: 'ring-rose-200',
        dot: 'bg-rose-500',
    },
    partial: {
        label: 'Partielle',
        bg: 'bg-primary-50',
        text: 'text-primary-700',
        ring: 'ring-primary-200',
        dot: 'bg-primary-500',
    },
};

const paymentMethodLabel: Record<string, string> = {
    card: 'Carte',
    cash: 'Espèces',
    check: 'Chèque',
    transfer: 'Virement',
};

function resolveLineType(line: Invoice['lines'][number]): 'service' | 'product' {
    return line.lineType === 'product' ? 'product' : 'service';
}

interface InvoiceLinesTableProps {
    title: string;
    lines: Invoice['lines'];
    emptyLabel: string;
}

function InvoiceLinesTable({ title, lines, emptyLabel }: InvoiceLinesTableProps) {
    const subtotal = lines.reduce((sum, line) => sum + line.total, 0);

    return (
        <div className="rounded-xl border border-slate-100 overflow-hidden mb-4">
            <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{title}</p>
            </div>
            {lines.length === 0 ? (
                <p className="px-4 py-3 text-sm text-slate-400">{emptyLabel}</p>
            ) : (
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                            <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Designation</th>
                            <th className="px-4 py-2.5 text-center text-xs font-bold uppercase tracking-wider text-slate-400">Qte</th>
                            <th className="px-4 py-2.5 text-right text-xs font-bold uppercase tracking-wider text-slate-400">P.U.</th>
                            <th className="px-4 py-2.5 text-right text-xs font-bold uppercase tracking-wider text-slate-400">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {lines.map((line) => (
                            <tr key={line.id}>
                                <td className="px-4 py-2.5 font-medium text-slate-800">{line.description}</td>
                                <td className="px-4 py-2.5 text-center text-slate-600">{line.quantity}</td>
                                <td className="px-4 py-2.5 text-right text-slate-600">{line.unitPrice.toFixed(2)} €</td>
                                <td className="px-4 py-2.5 text-right font-bold text-slate-900">{line.total.toFixed(2)} €</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="border-t border-slate-200 bg-slate-50">
                            <td colSpan={3} className="px-4 py-2.5 text-right text-sm font-bold text-slate-700">Sous-total</td>
                            <td className="px-4 py-2.5 text-right font-bold text-slate-900">{subtotal.toFixed(2)} €</td>
                        </tr>
                    </tfoot>
                </table>
            )}
        </div>
    );
}

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
            return invoice.status === 'paid'
                ? invoice.total
                : invoice.payments.reduce((sum, p) => sum + p.amount, 0);
        }
        return Math.min(
            invoice.paymentPlan.paidInstallments * invoice.paymentPlan.installmentAmount,
            invoice.total
        );
    }, [invoice]);

    const amountRemaining = Math.max(invoice.total - amountPaid, 0);
    const progressPct = invoice.total > 0 ? Math.round((amountPaid / invoice.total) * 100) : 0;
    const serviceLines = invoice.lines.filter((line) => resolveLineType(line) === 'service');
    const productLines = invoice.lines.filter((line) => resolveLineType(line) === 'product');
    const servicesSubtotal = serviceLines.reduce((sum, line) => sum + line.total, 0);
    const productsSubtotal = productLines.reduce((sum, line) => sum + line.total, 0);

    return (
        <>
            <tr
                className={`border-b border-slate-100 hover:bg-slate-50/60 transition-colors cursor-pointer ${expanded ? 'bg-slate-50/40' : ''}`}
                onClick={() => setExpanded(!expanded)}
            >
                {/* N° facture */}
                <td className="py-4 px-5">
                    <div className="flex items-center gap-3">
                        <div className={`h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 ${config.bg} ring-1 ${config.ring}`}>
                            <FileText className={`h-4 w-4 ${config.text}`} />
                        </div>
                        <div>
                            <p className="font-bold text-slate-900 font-mono text-sm">{invoice.invoiceNumber}</p>
                            <p className="text-[11px] text-slate-400">
                                {format(new Date(invoice.date), 'dd MMM yyyy', { locale: fr })}
                            </p>
                        </div>
                    </div>
                </td>

                {/* Client */}
                <td className="py-4 px-5">
                    <p className="font-semibold text-slate-900">{invoice.ownerName}</p>
                    <p className="text-xs text-slate-400">{invoice.patientName}</p>
                </td>

                {/* Montant */}
                <td className="py-4 px-5">
                    <p className="font-bold text-slate-900 text-base">{invoice.total.toFixed(2)} €</p>
                    {invoice.status !== 'paid' && amountRemaining > 0 && (
                        <p className="text-[11px] text-rose-500 font-medium">
                            {amountRemaining.toFixed(2)} € restant
                        </p>
                    )}
                </td>

                {/* Statut */}
                <td className="py-4 px-5">
                    <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full flex-shrink-0 ${config.dot}`} />
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${config.bg} ${config.text} ring-1 ${config.ring}`}>
                            {config.label}
                        </span>
                    </div>
                    {/* Progress bar */}
                    {invoice.status !== 'paid' && invoice.total > 0 && (
                        <div className="mt-1.5 h-1.5 w-24 rounded-full bg-slate-200 overflow-hidden">
                            <div
                                className="h-full rounded-full bg-primary-500 transition-all"
                                style={{ width: `${progressPct}%` }}
                            />
                        </div>
                    )}
                </td>

                {/* Échéancier */}
                <td className="py-4 px-5">
                    {invoice.paymentPlan ? (
                        <div>
                            <p className="text-sm font-semibold text-slate-800">
                                {invoice.paymentPlan.paidInstallments}/{invoice.paymentPlan.totalInstallments}
                                <span className="font-normal text-slate-500"> échéances</span>
                            </p>
                            <p className="text-[11px] text-slate-400">
                                {invoice.paymentPlan.installmentAmount.toFixed(2)} €/éch.
                            </p>
                        </div>
                    ) : (
                        <span className="text-xs text-slate-300">—</span>
                    )}
                </td>

                {/* Actions */}
                <td className="py-4 px-5">
                    <div className="flex items-center justify-end gap-2">
                        {invoice.status !== 'paid' && canManage && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onRecordPayment(invoice);
                                }}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-primary-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-primary-700"
                            >
                                <CreditCard className="h-3.5 w-3.5" />
                                Encaisser
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setExpanded(!expanded);
                            }}
                            className="rounded-xl p-1.5 hover:bg-slate-100 transition"
                        >
                            {expanded
                                ? <ChevronUp className="h-4 w-4 text-slate-400" />
                                : <ChevronDown className="h-4 w-4 text-slate-400" />}
                        </button>
                    </div>
                </td>
            </tr>

            {/* Expanded detail */}
            {expanded && (
                <tr>
                    <td colSpan={6} className="bg-slate-50 px-5 pb-5 pt-0">
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 mt-2">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="font-bold text-slate-900">
                                    Détail — {invoice.invoiceNumber}
                                </h4>
                                <button
                                    type="button"
                                    onClick={() => setExpanded(false)}
                                    className="rounded-lg p-1 hover:bg-slate-100 transition"
                                >
                                    <X className="h-4 w-4 text-slate-400" />
                                </button>
                            </div>

                            {/* Lines */}
                            <div className="mb-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                                    <div className="rounded-xl border border-primary-200 bg-primary-50 p-3">
                                        <p className="text-[11px] font-bold uppercase tracking-wide text-primary-700">Prestations</p>
                                        <p className="text-xl font-bold text-primary-900">{servicesSubtotal.toFixed(2)} €</p>
                                    </div>
                                    <div className="rounded-xl border border-secondary-200 bg-secondary-50 p-3">
                                        <p className="text-[11px] font-bold uppercase tracking-wide text-secondary-700">Produits</p>
                                        <p className="text-xl font-bold text-secondary-900">{productsSubtotal.toFixed(2)} €</p>
                                    </div>
                                </div>
                                <InvoiceLinesTable
                                    title="Prestations"
                                    lines={serviceLines}
                                    emptyLabel="Aucune prestation sur cette facture"
                                />
                                <InvoiceLinesTable
                                    title="Produits"
                                    lines={productLines}
                                    emptyLabel="Aucun produit sur cette facture"
                                />
                                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 flex items-center justify-between">
                                    <p className="text-sm font-bold text-slate-700">Total TTC</p>
                                    <p className="text-lg font-bold text-slate-900">{invoice.total.toFixed(2)} €</p>
                                </div>
                            </div>

                            {/* Payment summary */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5">
                                    <div className="flex items-center gap-2 mb-1">
                                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                                        <p className="text-xs font-bold text-emerald-700 uppercase tracking-wide">Encaissé</p>
                                    </div>
                                    <p className="text-xl font-bold text-emerald-800">{amountPaid.toFixed(2)} €</p>
                                </div>
                                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Clock className="h-4 w-4 text-amber-600" />
                                        <p className="text-xs font-bold text-amber-700 uppercase tracking-wide">Restant</p>
                                    </div>
                                    <p className="text-xl font-bold text-amber-800">{amountRemaining.toFixed(2)} €</p>
                                </div>
                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                                    <div className="flex items-center gap-2 mb-1">
                                        <FileText className="h-4 w-4 text-slate-500" />
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Échéance</p>
                                    </div>
                                    <p className="text-base font-bold text-slate-800">
                                        {format(new Date(invoice.dueDate), 'dd MMM yyyy', { locale: fr })}
                                    </p>
                                </div>
                            </div>

                            {/* Payment plan */}
                            {invoice.paymentPlan && (
                                <div className="rounded-xl border border-primary-200 bg-primary-50 p-4 mb-4">
                                    <p className="text-sm font-bold text-primary-900 mb-3 flex items-center gap-2">
                                        <TrendingUp className="h-4 w-4" /> Plan de paiement
                                    </p>
                                    <div className="grid grid-cols-3 gap-4 text-sm">
                                        <div>
                                            <p className="text-[11px] font-semibold text-primary-600 uppercase mb-1">Échéances</p>
                                            <p className="font-bold text-primary-900">
                                                {invoice.paymentPlan.paidInstallments} / {invoice.paymentPlan.totalInstallments}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-semibold text-primary-600 uppercase mb-1">Montant/éch.</p>
                                            <p className="font-bold text-primary-900">{invoice.paymentPlan.installmentAmount.toFixed(2)} €</p>
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-semibold text-primary-600 uppercase mb-1">Prochain</p>
                                            <p className="font-bold text-primary-900">
                                                {format(new Date(invoice.paymentPlan.nextPaymentDate), 'dd MMM', { locale: fr })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="mt-3 h-2 rounded-full bg-primary-200 overflow-hidden">
                                        <div
                                            className="h-full rounded-full bg-primary-500 transition-all"
                                            style={{
                                                width: `${(invoice.paymentPlan.paidInstallments / invoice.paymentPlan.totalInstallments) * 100}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Payment history */}
                            {invoice.payments.length > 0 && (
                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                    <p className="text-sm font-bold text-slate-700 mb-3">Historique des paiements</p>
                                    <div className="space-y-2">
                                        {invoice.payments.map((p) => (
                                            <div key={p.id} className="flex items-center justify-between rounded-lg bg-white border border-slate-100 px-3 py-2">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="h-7 w-7 rounded-lg bg-emerald-100 flex items-center justify-center">
                                                        <CreditCard className="h-3.5 w-3.5 text-emerald-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-semibold text-slate-800">
                                                            {paymentMethodLabel[p.method] ?? p.method}
                                                        </p>
                                                        <p className="text-[11px] text-slate-400">
                                                            {format(new Date(p.date), 'dd/MM/yyyy')}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className="font-bold text-emerald-700">+{p.amount.toFixed(2)} €</span>
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
    const { invoices, patients, addInvoice, recordPayment } = useClinicData();
    const { role } = useAuth();
    const toast = useToast();

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [showNewInvoice, setShowNewInvoice] = useState(false);
    const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);

    const canManage = role === 'assistant' || role === 'veterinarian';

    const filteredInvoices = useMemo(
        () =>
            invoices.filter((inv) => {
                const q = searchQuery.toLowerCase();
                const matchesSearch =
                    !q ||
                    inv.invoiceNumber.toLowerCase().includes(q) ||
                    inv.ownerName.toLowerCase().includes(q) ||
                    inv.patientName.toLowerCase().includes(q);
                const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
                return matchesSearch && matchesStatus;
            }),
        [invoices, searchQuery, statusFilter]
    );

    const stats = useMemo(() => {
        const total = invoices.reduce((sum, inv) => sum + inv.total, 0);
        const paid = invoices.filter((i) => i.status === 'paid').reduce((sum, inv) => sum + inv.total, 0);
        const pending = invoices.filter((i) => i.status === 'pending' || i.status === 'partial').length;
        const overdue = invoices.filter((i) => i.status === 'overdue').length;
        const encaissementRate = total > 0 ? Math.round((paid / total) * 100) : 0;
        const services = invoices.reduce(
            (sum, inv) => sum + inv.lines
                .filter((line) => resolveLineType(line) === 'service')
                .reduce((lineSum, line) => lineSum + line.total, 0),
            0
        );
        const products = invoices.reduce(
            (sum, inv) => sum + inv.lines
                .filter((line) => resolveLineType(line) === 'product')
                .reduce((lineSum, line) => lineSum + line.total, 0),
            0
        );
        return { total, paid, pending, overdue, encaissementRate, services, products };
    }, [invoices]);

    const countByStatus = useMemo(() => ({
        all: invoices.length,
        paid: invoices.filter((i) => i.status === 'paid').length,
        pending: invoices.filter((i) => i.status === 'pending').length,
        overdue: invoices.filter((i) => i.status === 'overdue').length,
        partial: invoices.filter((i) => i.status === 'partial').length,
    }), [invoices]);

    const handleNewInvoice = (data: InvoiceFormData) => {
        const patient = patients.find((p) => p.id === data.patientId);
        addInvoice({
            patientId: data.patientId,
            patientName: patient?.name ?? '',
            ownerName: patient ? `${patient.owner.firstName} ${patient.owner.lastName}` : '',
            date: new Date().toISOString().split('T')[0],
            dueDate: data.dueDate,
            lines: data.lines,
        });
        toast.success('Facture créée avec succès');
    };

    const handlePayment = (data: PaymentFormData) => {
        if (!payingInvoice) return;
        recordPayment(payingInvoice.id, {
            amount: data.amount,
            method: data.method,
            date: data.date,
        });
        toast.success('Paiement enregistré');
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

            <div className="p-4 sm:p-6 space-y-5">

                {/* ── Stats ── */}
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    {/* CA Total */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 col-span-2 lg:col-span-1">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="rounded-xl bg-slate-100 p-2">
                                <Receipt className="h-4 w-4 text-slate-600" />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-wide text-slate-400">CA Facturé</span>
                        </div>
                        <p className="text-2xl font-bold text-slate-900">{stats.total.toFixed(0)} €</p>
                        <div className="mt-2 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div
                                className="h-full rounded-full bg-primary-500"
                                style={{ width: `${stats.encaissementRate}%` }}
                            />
                        </div>
                        <p className="mt-1 text-[11px] text-slate-400">
                            {stats.encaissementRate}% encaissé
                        </p>
                        <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] space-y-0.5">
                            <p className="text-slate-500">Prestations: <span className="font-semibold text-slate-700">{stats.services.toFixed(0)} €</span></p>
                            <p className="text-slate-500">Produits: <span className="font-semibold text-slate-700">{stats.products.toFixed(0)} €</span></p>
                        </div>
                    </div>

                    {/* CA Encaissé */}
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="rounded-xl bg-emerald-100 p-2">
                                <CheckCircle className="h-4 w-4 text-emerald-600" />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-wide text-emerald-600">Encaissé</span>
                        </div>
                        <p className="text-2xl font-bold text-emerald-800">{stats.paid.toFixed(0)} €</p>
                        <p className="mt-1 text-[11px] text-emerald-600">
                            {countByStatus.paid} facture{countByStatus.paid !== 1 ? 's' : ''} payée{countByStatus.paid !== 1 ? 's' : ''}
                        </p>
                    </div>

                    {/* En attente */}
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="rounded-xl bg-amber-100 p-2">
                                <Clock className="h-4 w-4 text-amber-600" />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-wide text-amber-600">En attente</span>
                        </div>
                        <p className="text-2xl font-bold text-amber-800">{stats.pending}</p>
                        <p className="mt-1 text-[11px] text-amber-600">
                            facture{stats.pending !== 1 ? 's' : ''} à encaisser
                        </p>
                    </div>

                    {/* En retard */}
                    <div className={`rounded-2xl border p-4 ${stats.overdue > 0 ? 'border-rose-200 bg-rose-50' : 'border-slate-200 bg-white'}`}>
                        <div className="flex items-center gap-2 mb-2">
                            <div className={`rounded-xl p-2 ${stats.overdue > 0 ? 'bg-rose-100' : 'bg-slate-100'}`}>
                                <AlertTriangle className={`h-4 w-4 ${stats.overdue > 0 ? 'text-rose-600' : 'text-slate-400'}`} />
                            </div>
                            <span className={`text-xs font-bold uppercase tracking-wide ${stats.overdue > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                                En retard
                            </span>
                        </div>
                        <p className={`text-2xl font-bold ${stats.overdue > 0 ? 'text-rose-800' : 'text-slate-700'}`}>
                            {stats.overdue}
                        </p>
                        <p className={`mt-1 text-[11px] ${stats.overdue > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                            {stats.overdue > 0 ? 'à relancer en priorité' : 'aucun retard'}
                        </p>
                    </div>
                </div>

                {/* ── Alerte retards ── */}
                {stats.overdue > 0 && (
                    <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-gradient-to-r from-rose-50 to-amber-50 p-4">
                        <div className="h-9 w-9 rounded-xl bg-rose-100 flex items-center justify-center flex-shrink-0">
                            <AlertTriangle className="h-5 w-5 text-rose-600" />
                        </div>
                        <div>
                            <p className="font-bold text-rose-800 text-sm">
                                {stats.overdue} facture{stats.overdue !== 1 ? 's' : ''} en retard de paiement
                            </p>
                            <p className="text-xs text-rose-600 mt-0.5">
                                Utilisez le filtre «&nbsp;En retard&nbsp;» ci-dessous pour les retrouver rapidement.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setStatusFilter('overdue')}
                            className="ml-auto flex-shrink-0 rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-700 transition"
                        >
                            Voir les retards
                        </button>
                    </div>
                )}

                {/* ── Toolbar : tabs + search + new ── */}
                <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                    <div className="border-b border-slate-100 p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                            {/* Status tabs */}
                            <div className="flex flex-wrap gap-1.5">
                                {(
                                    [
                                        { key: 'all', label: 'Toutes' },
                                        { key: 'pending', label: 'En attente' },
                                        { key: 'overdue', label: 'En retard' },
                                        { key: 'partial', label: 'Partielles' },
                                        { key: 'paid', label: 'Payées' },
                                    ] as { key: StatusFilter; label: string }[]
                                ).map(({ key, label }) => {
                                    const count = countByStatus[key];
                                    const isSelected = statusFilter === key;
                                    const isRed = key === 'overdue' && count > 0;
                                    return (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => setStatusFilter(key)}
                                            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                                                isSelected
                                                    ? isRed
                                                        ? 'border-rose-300 bg-rose-50 text-rose-700'
                                                        : 'border-primary-300 bg-primary-50 text-primary-700'
                                                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                                            }`}
                                        >
                                            {label}
                                            <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                                                isSelected
                                                    ? isRed ? 'bg-rose-100 text-rose-700' : 'bg-primary-100 text-primary-700'
                                                    : 'bg-slate-100 text-slate-500'
                                            }`}>
                                                {count}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Search + CTA */}
                            <div className="flex items-center gap-2">
                                <SearchInput
                                    value={searchQuery}
                                    onChange={setSearchQuery}
                                    placeholder="Rechercher une facture..."
                                    className="w-full sm:w-64"
                                />
                                {canManage && (
                                    <Button icon={<Plus className="h-4 w-4" />} onClick={() => setShowNewInvoice(true)}>
                                        <span className="hidden sm:inline">Nouvelle facture</span>
                                        <span className="sm:hidden">Créer</span>
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    {filteredInvoices.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                                <FileText className="h-7 w-7 text-slate-300" />
                            </div>
                            <p className="font-semibold text-slate-600">Aucune facture trouvée</p>
                            <p className="text-sm text-slate-400 mt-1">Modifiez vos filtres ou créez une nouvelle facture</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50/60">
                                        <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Facture</th>
                                        <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Client / Patient</th>
                                        <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Montant</th>
                                        <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Statut</th>
                                        <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Échéancier</th>
                                        <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-400">Actions</th>
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
