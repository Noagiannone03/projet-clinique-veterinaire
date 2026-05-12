import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
    ClipboardList,
    Filter,
    Pill,
    Printer,
    CheckCircle2,
    PackageCheck,
    Ban,
    Truck,
} from 'lucide-react';
import { Header } from '../components/layout';
import { Badge, Button, Card, SearchInput } from '../components/ui';
import { useClinicData } from '../context/clinicState';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import type { PrescriptionOrder, PrescriptionOrderStatus } from '../types';

type StatusFilter = 'all' | PrescriptionOrderStatus;

const statusMeta: Record<PrescriptionOrderStatus, { label: string; badge: 'success' | 'warning' | 'danger' | 'info' | 'neutral'; card: string }> = {
    pending: { label: 'A preparer', badge: 'warning', card: 'border-amber-200 bg-amber-50/40' },
    prepared: { label: 'Preparee', badge: 'info', card: 'border-primary-200 bg-primary-50/40' },
    dispensed: { label: 'Delivree', badge: 'success', card: 'border-emerald-200 bg-emerald-50/40' },
    cancelled: { label: 'Annulee', badge: 'danger', card: 'border-rose-200 bg-rose-50/40' },
};

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function printPrescription(order: PrescriptionOrder): boolean {
    const popup = window.open('', '_blank', 'width=960,height=820');
    if (!popup) return false;

    const renderedLines = order.lines.map((line) => `
        <tr>
            <td>${escapeHtml(line.medication)}</td>
            <td>${escapeHtml(line.dosage)}</td>
            <td>${escapeHtml(line.frequency)}</td>
            <td>${escapeHtml(line.duration || '-')}</td>
            <td>${line.quantity}</td>
        </tr>
    `).join('');

    popup.document.write(`
        <!doctype html>
        <html lang="fr">
        <head>
            <meta charset="utf-8" />
            <title>${escapeHtml(order.prescriptionNumber)}</title>
            <style>
                body { font-family: Arial, sans-serif; color: #0f172a; margin: 30px; }
                .header { border-bottom: 2px solid #0b2c4d; padding-bottom: 10px; margin-bottom: 18px; }
                .meta { margin: 5px 0; font-size: 14px; color: #334155; }
                h1 { margin: 0; font-size: 24px; }
                h2 { margin: 18px 0 8px; font-size: 16px; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                th, td { border: 1px solid #cbd5e1; padding: 8px; font-size: 13px; text-align: left; }
                th { background: #f1f5f9; }
                .footer { margin-top: 24px; font-size: 12px; color: #475569; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Ordonnance ${escapeHtml(order.prescriptionNumber)}</h1>
                <p class="meta">Date: ${escapeHtml(order.issueDate)} | Veterinaire: ${escapeHtml(order.veterinarian)}</p>
                <p class="meta">Patient: ${escapeHtml(order.patientName)} | Proprietaire: ${escapeHtml(order.ownerName)}</p>
            </div>
            ${order.diagnosis ? `<p><strong>Diagnostic:</strong> ${escapeHtml(order.diagnosis)}</p>` : ''}
            <h2>Lignes prescrites</h2>
            <table>
                <thead>
                    <tr>
                        <th>Medicament</th>
                        <th>Dosage</th>
                        <th>Frequence</th>
                        <th>Duree</th>
                        <th>Quantite</th>
                    </tr>
                </thead>
                <tbody>
                    ${renderedLines}
                </tbody>
            </table>
            ${order.notes ? `<h2>Notes</h2><p>${escapeHtml(order.notes)}</p>` : ''}
            <p class="footer">Document genere depuis VetCare.</p>
        </body>
        </html>
    `);
    popup.document.close();
    popup.focus();
    popup.print();
    popup.close();
    return true;
}

export function Prescriptions() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const patientFilterId = searchParams.get('patient');

    const {
        prescriptionOrders,
        markPrescriptionAsPrinted,
        markPrescriptionAsPrepared,
        markPrescriptionAsDispensed,
        cancelPrescriptionOrder,
    } = useClinicData();
    const { role } = useAuth();
    const toast = useToast();

    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [query, setQuery] = useState('');
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const normalizedQuery = query.trim().toLowerCase();

    const filteredOrders = useMemo(() => {
        return prescriptionOrders
            .filter((order) => !patientFilterId || order.patientId === patientFilterId)
            .filter((order) => statusFilter === 'all' || order.status === statusFilter)
            .filter((order) => {
                if (!normalizedQuery) return true;
                return (
                    order.prescriptionNumber.toLowerCase().includes(normalizedQuery)
                    || order.patientName.toLowerCase().includes(normalizedQuery)
                    || order.ownerName.toLowerCase().includes(normalizedQuery)
                    || order.veterinarian.toLowerCase().includes(normalizedQuery)
                );
            })
            .sort((a, b) => `${b.issueDate}${b.id}`.localeCompare(`${a.issueDate}${a.id}`));
    }, [prescriptionOrders, statusFilter, normalizedQuery, patientFilterId]);

    useEffect(() => {
        if (filteredOrders.length === 0) {
            setSelectedId(null);
            return;
        }
        const stillVisible = filteredOrders.some((order) => order.id === selectedId);
        if (!stillVisible) setSelectedId(filteredOrders[0].id);
    }, [filteredOrders, selectedId]);

    const selectedOrder = filteredOrders.find((order) => order.id === selectedId) ?? null;

    const stats = useMemo(() => {
        const pending = prescriptionOrders.filter((order) => order.status === 'pending').length;
        const prepared = prescriptionOrders.filter((order) => order.status === 'prepared').length;
        const dispensed = prescriptionOrders.filter((order) => order.status === 'dispensed').length;
        return { pending, prepared, dispensed };
    }, [prescriptionOrders]);

    const canManageDispense = role === 'assistant';

    const handlePrint = (order: PrescriptionOrder) => {
        const ok = printPrescription(order);
        if (!ok) {
            toast.error('Impossible d\'ouvrir la fenetre d\'impression.');
            return;
        }
        markPrescriptionAsPrinted(order.id);
        toast.success(`Ordonnance ${order.prescriptionNumber} imprimee`);
    };

    const handlePrepare = (order: PrescriptionOrder) => {
        markPrescriptionAsPrepared(order.id);
        toast.success('Ordonnance marquee comme preparee');
    };

    const handleDispense = (order: PrescriptionOrder) => {
        const result = markPrescriptionAsDispensed(order.id);
        if (!result.ok) {
            toast.error(result.message);
            return;
        }
        toast.success('Ordonnance delivree, stock mis a jour');
    };

    const handleCancel = (order: PrescriptionOrder) => {
        const confirmed = window.confirm(`Annuler ${order.prescriptionNumber} ?`);
        if (!confirmed) return;
        cancelPrescriptionOrder(order.id, 'Annulation manuelle');
        toast.warning('Ordonnance annulee');
    };

    return (
        <div>
            <Header
                title="Ordonnances"
                subtitle="Creation veterinaire, preparation accueil et delivrance tracee"
                breadcrumbs={[{ label: 'Ordonnances' }]}
            />

            <div className="p-4 sm:p-8 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card padding="sm" className="border-amber-200 bg-amber-50/70">
                        <p className="text-xs text-amber-700">A preparer</p>
                        <p className="text-2xl font-bold text-amber-800">{stats.pending}</p>
                    </Card>
                    <Card padding="sm" className="border-primary-200 bg-primary-50/70">
                        <p className="text-xs text-primary-700">Pretes a delivrer</p>
                        <p className="text-2xl font-bold text-primary-800">{stats.prepared}</p>
                    </Card>
                    <Card padding="sm" className="border-emerald-200 bg-emerald-50/70">
                        <p className="text-xs text-emerald-700">Delivrees</p>
                        <p className="text-2xl font-bold text-emerald-800">{stats.dispensed}</p>
                    </Card>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-[420px_minmax(0,1fr)] gap-6">
                    <Card className="space-y-4" padding="md">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <ClipboardList className="w-4 h-4 text-slate-500" />
                                <h2 className="font-semibold text-slate-900">File ordonnances</h2>
                            </div>
                            {patientFilterId && (
                                <Button variant="ghost" size="sm" onClick={() => navigate('/prescriptions')}>
                                    Retirer filtre patient
                                </Button>
                            )}
                        </div>

                        <SearchInput
                            value={query}
                            onChange={setQuery}
                            placeholder="Numero, patient, proprietaire, veterinaire..."
                            debounce={180}
                        />

                        <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1 text-xs text-slate-500"><Filter className="w-3.5 h-3.5" /> Statut</span>
                            {([
                                { key: 'all' as const, label: 'Tous' },
                                { key: 'pending' as const, label: 'A preparer' },
                                { key: 'prepared' as const, label: 'Preparees' },
                                { key: 'dispensed' as const, label: 'Delivrees' },
                                { key: 'cancelled' as const, label: 'Annulees' },
                            ]).map((option) => (
                                <button
                                    key={option.key}
                                    onClick={() => setStatusFilter(option.key)}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${statusFilter === option.key
                                        ? 'bg-primary-100 text-primary-700'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>

                        <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
                            {filteredOrders.length === 0 ? (
                                <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center">
                                    <Pill className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                                    <p className="text-sm text-slate-500">Aucune ordonnance pour ces filtres</p>
                                </div>
                            ) : (
                                filteredOrders.map((order) => (
                                    <button
                                        key={order.id}
                                        onClick={() => setSelectedId(order.id)}
                                        className={`w-full text-left rounded-xl border px-3 py-3 transition-colors ${selectedId === order.id
                                            ? 'border-primary-300 bg-primary-50'
                                            : 'border-slate-200 bg-white hover:bg-slate-50'
                                            } ${statusMeta[order.status].card}`}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-slate-900 truncate">{order.prescriptionNumber}</p>
                                                <p className="text-xs text-slate-500 truncate">{order.patientName} · {order.ownerName}</p>
                                            </div>
                                            <Badge variant={statusMeta[order.status].badge}>{statusMeta[order.status].label}</Badge>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1">
                                            {format(new Date(order.issueDate), 'dd MMM yyyy', { locale: fr })} · {order.veterinarian}
                                        </p>
                                    </button>
                                ))
                            )}
                        </div>
                    </Card>

                    <Card padding="md">
                        {!selectedOrder ? (
                            <div className="h-full min-h-[360px] flex items-center justify-center text-center">
                                <div>
                                    <Pill className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                    <p className="text-slate-500">Selectionnez une ordonnance</p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-5">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase tracking-wide">Ordonnance</p>
                                        <h2 className="text-xl font-bold text-slate-900">{selectedOrder.prescriptionNumber}</h2>
                                        <p className="text-sm text-slate-500 mt-1">
                                            {selectedOrder.patientName} · {selectedOrder.ownerName}
                                        </p>
                                        <p className="text-sm text-slate-500">
                                            {format(new Date(selectedOrder.issueDate), 'dd MMMM yyyy', { locale: fr })} · {selectedOrder.veterinarian}
                                        </p>
                                    </div>
                                    <Badge variant={statusMeta[selectedOrder.status].badge}>{statusMeta[selectedOrder.status].label}</Badge>
                                </div>

                                {selectedOrder.diagnosis && (
                                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                        <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">Diagnostic</p>
                                        <p className="text-sm text-slate-800">{selectedOrder.diagnosis}</p>
                                    </div>
                                )}

                                <div className="rounded-xl border border-slate-200 overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-slate-200">
                                                <th className="text-left py-2.5 px-3 font-medium text-slate-600">Medicament</th>
                                                <th className="text-left py-2.5 px-3 font-medium text-slate-600">Posologie</th>
                                                <th className="text-left py-2.5 px-3 font-medium text-slate-600">Duree</th>
                                                <th className="text-left py-2.5 px-3 font-medium text-slate-600">Quantite</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedOrder.lines.map((line) => (
                                                <tr key={line.id} className="border-b border-slate-100 last:border-b-0">
                                                    <td className="px-3 py-2.5">
                                                        <p className="font-medium text-slate-900">{line.medication}</p>
                                                        {line.instructions && <p className="text-xs text-slate-500 mt-0.5">{line.instructions}</p>}
                                                    </td>
                                                    <td className="px-3 py-2.5 text-slate-700">{line.dosage}{line.frequency ? ` · ${line.frequency}` : ''}</td>
                                                    <td className="px-3 py-2.5 text-slate-700">{line.duration || '-'}</td>
                                                    <td className="px-3 py-2.5 text-slate-700 font-medium">{line.quantity}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="flex flex-wrap gap-2 pt-1">
                                    <Button variant="outline" icon={<Printer className="w-4 h-4" />} onClick={() => handlePrint(selectedOrder)}>
                                        Imprimer
                                    </Button>

                                    {canManageDispense && selectedOrder.status === 'pending' && (
                                        <Button variant="outline" icon={<PackageCheck className="w-4 h-4" />} onClick={() => handlePrepare(selectedOrder)}>
                                            Marquer preparee
                                        </Button>
                                    )}

                                    {canManageDispense && (selectedOrder.status === 'pending' || selectedOrder.status === 'prepared') && (
                                        <Button icon={<Truck className="w-4 h-4" />} onClick={() => handleDispense(selectedOrder)}>
                                            Delivrer et debiter le stock
                                        </Button>
                                    )}

                                    {role === 'veterinarian' && selectedOrder.status !== 'dispensed' && selectedOrder.status !== 'cancelled' && (
                                        <Button variant="danger" icon={<Ban className="w-4 h-4" />} onClick={() => handleCancel(selectedOrder)}>
                                            Annuler
                                        </Button>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-500 pt-2">
                                    <div className="rounded-xl border border-slate-200 p-3">
                                        <p className="uppercase tracking-wide">Impressions</p>
                                        <p className="text-sm font-semibold text-slate-800 mt-1">{selectedOrder.printedCount}</p>
                                    </div>
                                    <div className="rounded-xl border border-slate-200 p-3">
                                        <p className="uppercase tracking-wide">Preparee</p>
                                        <p className="text-sm font-semibold text-slate-800 mt-1">{selectedOrder.preparedBy || '-'}</p>
                                    </div>
                                    <div className="rounded-xl border border-slate-200 p-3">
                                        <p className="uppercase tracking-wide">Delivree</p>
                                        <p className="text-sm font-semibold text-slate-800 mt-1">{selectedOrder.dispensedBy || '-'}</p>
                                    </div>
                                </div>

                                {selectedOrder.status === 'dispensed' && (
                                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4" />
                                        Delivrance enregistree. Le stock a ete mis a jour automatiquement.
                                    </div>
                                )}
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
}
