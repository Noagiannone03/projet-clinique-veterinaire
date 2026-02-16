import { useMemo, useState } from 'react';
import { Header } from '../components/layout';
import { Search, Plus, FileText, CreditCard, Clock, CheckCircle, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import type { Invoice } from '../types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useClinicData } from '../context/clinicState';

const statusConfig = {
    paid: { label: 'Paye', color: 'badge-success', icon: CheckCircle },
    pending: { label: 'En attente', color: 'badge-warning', icon: Clock },
    overdue: { label: 'En retard', color: 'badge-danger', icon: AlertTriangle },
    partial: { label: 'Partiel', color: 'badge-info', icon: CreditCard },
};

interface InvoiceRowProps {
    invoice: Invoice;
    onRecordPayment: (invoiceId: string) => void;
}

function InvoiceRow({ invoice, onRecordPayment }: InvoiceRowProps) {
    const [expanded, setExpanded] = useState(false);
    const status = statusConfig[invoice.status];

    const amountPaid = useMemo(() => {
        if (!invoice.paymentPlan) {
            return invoice.status === 'paid' ? invoice.total : 0;
        }

        return Math.min(invoice.paymentPlan.paidInstallments * invoice.paymentPlan.installmentAmount, invoice.total);
    }, [invoice]);

    const amountRemaining = Math.max(invoice.total - amountPaid, 0);

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
                    <span className={status.color}>{status.label}</span>
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
                                    className="h-2 bg-primary-500 rounded-full"
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
                        {invoice.status !== 'paid' && (
                            <button
                                className="btn-primary text-sm py-1.5"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onRecordPayment(invoice.id);
                                }}
                            >
                                Encaisser
                            </button>
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
                                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                                    <p className="text-xs text-slate-500">Montant encaisse</p>
                                    <p className="font-semibold text-emerald-700">{amountPaid.toFixed(2)} EUR</p>
                                </div>
                                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                                    <p className="text-xs text-slate-500">Reste a encaisser</p>
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
                                <div className="mt-4 p-3 bg-sky-50 rounded-lg">
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
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
}

export function Billing() {
    const { invoices, recordInvoicePayment } = useClinicData();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    const filteredInvoices = invoices.filter((inv) => {
        const matchesSearch =
            searchQuery === '' ||
            inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            inv.ownerName.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const stats = {
        total: invoices.reduce((sum, inv) => sum + inv.total, 0),
        paid: invoices.filter((i) => i.status === 'paid').reduce((sum, inv) => sum + inv.total, 0),
        pending: invoices.filter((i) => i.status === 'pending' || i.status === 'partial').length,
        overdue: invoices.filter((i) => i.status === 'overdue').length,
    };

    return (
        <div>
            <Header title="Facturation" subtitle={`${invoices.length} factures`} />

            <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="card">
                        <p className="text-sm text-slate-500">Total facture</p>
                        <p className="text-2xl font-bold text-slate-900">{stats.total.toFixed(2)} EUR</p>
                    </div>
                    <div className="card">
                        <p className="text-sm text-slate-500">Encaisse</p>
                        <p className="text-2xl font-bold text-emerald-600">{stats.paid.toFixed(2)} EUR</p>
                    </div>
                    <div className="card">
                        <p className="text-sm text-slate-500">En attente</p>
                        <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
                    </div>
                    <div className="card">
                        <p className="text-sm text-slate-500">En retard</p>
                        <p className="text-2xl font-bold text-rose-600">{stats.overdue}</p>
                    </div>
                </div>

                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Rechercher une facture..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="input pl-10 w-80"
                            />
                        </div>

                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="input w-40"
                        >
                            <option value="all">Tous statuts</option>
                            <option value="paid">Payees</option>
                            <option value="pending">En attente</option>
                            <option value="partial">Partielles</option>
                            <option value="overdue">En retard</option>
                        </select>
                    </div>

                    <button className="btn-primary">
                        <Plus className="w-4 h-4" />
                        Nouvelle facture
                    </button>
                </div>

                <div className="card overflow-hidden p-0">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Facture</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Client</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Statut</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Montant</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Echeancier</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredInvoices.map((invoice) => (
                                <InvoiceRow key={invoice.id} invoice={invoice} onRecordPayment={recordInvoicePayment} />
                            ))}
                        </tbody>
                    </table>
                    {filteredInvoices.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-slate-500">Aucune facture trouvee</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
