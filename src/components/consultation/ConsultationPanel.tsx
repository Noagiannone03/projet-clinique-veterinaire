import { useState, useMemo } from 'react';
import {
    X,
    AlertTriangle,
    Plus,
    Trash2,
    CheckCircle,
    ArrowRight,
    Search,
    Package,
    Printer,
} from 'lucide-react';
import type { Appointment, Patient, Product } from '../../types';
import type { InvoiceFormData, MedicalRecordFormData } from '../../schemas';

interface PrescriptionItem {
    productId: string;
    productName: string;
    quantity: number;
    posology: string;
}

interface ConsultationPanelProps {
    isOpen: boolean;
    appointment: Appointment;
    patient: Patient;
    products: Product[];
    onComplete: (
        record: MedicalRecordFormData,
        prescribedProducts: PrescriptionItem[],
        billingLines: InvoiceFormData['lines']
    ) => void;
    onClose: () => void;
}

const speciesEmoji: Record<string, string> = {
    dog: '🐕', cat: '🐈', bird: '🐦', rabbit: '🐇', other: '🐾',
};

type PerformedType = MedicalRecordFormData['type'];

const appointmentToPerformedType: Record<Appointment['type'], PerformedType> = {
    consultation: 'consultation',
    vaccination: 'consultation',
    surgery: 'surgery',
    'follow-up': 'follow-up',
    emergency: 'emergency',
};

const performedTypeLabel: Record<PerformedType, string> = {
    consultation: 'Consultation',
    surgery: 'Operation',
    emergency: 'Urgence',
    'follow-up': 'Suivi',
};

const performedBillingLabel: Record<PerformedType, string> = {
    consultation: 'Consultation clinique',
    surgery: 'Intervention chirurgicale',
    emergency: 'Prise en charge urgence',
    'follow-up': 'Consultation de suivi',
};

const performedDefaultPrice: Record<PerformedType, number> = {
    consultation: 45,
    surgery: 180,
    emergency: 95,
    'follow-up': 35,
};

export function ConsultationPanel({ isOpen, appointment, patient, products, onComplete, onClose }: ConsultationPanelProps) {
    const defaultPerformedType = appointmentToPerformedType[appointment.type];
    const [performedType, setPerformedType] = useState<PerformedType>(defaultPerformedType);
    const [performedProcedure, setPerformedProcedure] = useState('');
    const [performedPrice, setPerformedPrice] = useState(performedDefaultPrice[defaultPerformedType]);
    const [diagnosis, setDiagnosis] = useState('');
    const [treatment, setTreatment] = useState('');
    const [notes, setNotes] = useState('');
    const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>([]);
    const [completed, setCompleted] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showProductPicker, setShowProductPicker] = useState(false);

    const age = (() => {
        const birth = new Date(patient.birthDate);
        const referenceDate = new Date(`${appointment.date}T00:00:00`);
        const diff = referenceDate.getTime() - birth.getTime();
        const years = Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
        if (years > 0) return `${years} an${years > 1 ? 's' : ''}`;
        return `${Math.floor(diff / (30.4 * 24 * 60 * 60 * 1000))} mois`;
    })();

    // Filter medications from products
    const medications = useMemo(() =>
        products.filter((p) => p.category === 'medication' || p.category === 'supplement'),
        [products]
    );

    const filteredMedications = useMemo(() => {
        if (!searchQuery.trim()) return medications;
        const q = searchQuery.toLowerCase();
        return medications.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
    }, [medications, searchQuery]);

    const canComplete = diagnosis.trim() && treatment.trim() && performedProcedure.trim() && performedPrice > 0;
    const sortedMedicalHistory = useMemo(
        () => [...patient.medicalHistory].sort((a, b) => b.date.localeCompare(a.date)),
        [patient.medicalHistory]
    );
    const latestMedicalRecord = sortedMedicalHistory[0];
    const sortedVaccinations = useMemo(
        () => [...patient.vaccinations].sort((a, b) => b.date.localeCompare(a.date)),
        [patient.vaccinations]
    );
    const latestVaccination = sortedVaccinations[0];
    const contraindicationAlerts = patient.alerts.filter(
        (alert) => alert.type === 'allergy' || /ne pas|eviter|contre/i.test(alert.description)
    );
    const criticalAlerts = patient.alerts.filter((alert) => alert.severity === 'high');

    function buildInvoiceDefaults(): InvoiceFormData['lines'] {
        const procedure = performedProcedure.trim();
        const serviceDescription = `${performedBillingLabel[performedType]}${procedure ? ` - ${procedure}` : ''}`;
        const serviceLine: InvoiceFormData['lines'][number] = {
            lineType: 'service',
            description: serviceDescription,
            quantity: 1,
            unitPrice: performedPrice,
        };

        const productLines: InvoiceFormData['lines'] = prescriptions.map((rx) => {
            const product = products.find((p) => p.id === rx.productId);
            return {
                lineType: 'product',
                productId: rx.productId,
                description: rx.productName,
                quantity: rx.quantity,
                unitPrice: product?.price ?? 0,
            };
        });

        return [serviceLine, ...productLines];
    }

    const billingPreview = (() => {
        const lines = buildInvoiceDefaults();
        const subtotal = lines.reduce((sum, line) => sum + (line.quantity * line.unitPrice), 0);
        const tax = Math.round(subtotal * 0.2 * 100) / 100;
        const total = Math.round((subtotal + tax) * 100) / 100;
        return { subtotal, tax, total };
    })();

    const addProduct = (product: Product) => {
        const existing = prescriptions.find((p) => p.productId === product.id);
        if (existing) {
            setPrescriptions(prescriptions.map((p) =>
                p.productId === product.id ? { ...p, quantity: p.quantity + 1 } : p
            ));
        } else {
            setPrescriptions([...prescriptions, {
                productId: product.id,
                productName: product.name,
                quantity: 1,
                posology: '',
            }]);
        }
        setShowProductPicker(false);
        setSearchQuery('');
    };

    const updatePrescription = (productId: string, field: 'quantity' | 'posology', value: string | number) => {
        setPrescriptions(prescriptions.map((p) =>
            p.productId === productId ? { ...p, [field]: value } : p
        ));
    };

    const removePrescription = (productId: string) => {
        setPrescriptions(prescriptions.filter((p) => p.productId !== productId));
    };

    const printPrescription = () => {
        if (prescriptions.length === 0) return;
        const escapeHtml = (value: string) => value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
        const popup = window.open('', '_blank', 'width=960,height=820');
        if (!popup) return;

        const renderedLines = prescriptions.map((rx) => `
            <tr>
                <td>${escapeHtml(rx.productName)}</td>
                <td>${rx.quantity}</td>
                <td>${escapeHtml(rx.posology || 'A preciser')}</td>
            </tr>
        `).join('');

        popup.document.write(`
            <!doctype html>
            <html lang="fr">
            <head>
                <meta charset="utf-8" />
                <title>Ordonnance ${patient.name}</title>
                <style>
                    body { font-family: Arial, sans-serif; color: #0f172a; margin: 28px; }
                    .header { border-bottom: 2px solid #0b2c4d; padding-bottom: 10px; margin-bottom: 16px; }
                    h1 { margin: 0; font-size: 22px; }
                    .meta { margin-top: 6px; font-size: 13px; color: #334155; }
                    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
                    th, td { border: 1px solid #cbd5e1; padding: 8px; font-size: 13px; text-align: left; }
                    th { background: #f1f5f9; }
                    .block { margin-top: 14px; font-size: 13px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Ordonnance veterinaire</h1>
                    <p class="meta">Patient: ${escapeHtml(patient.name)} · Proprietaire: ${escapeHtml(`${patient.owner.firstName} ${patient.owner.lastName}`)}</p>
                    <p class="meta">Date: ${escapeHtml(appointment.date)} · Veterinaire: ${escapeHtml(appointment.veterinarian)}</p>
                </div>
                <div class="block"><strong>Diagnostic:</strong> ${escapeHtml(diagnosis || '-')}</div>
                <div class="block"><strong>Traitement:</strong> ${escapeHtml(treatment || '-')}</div>
                <table>
                    <thead>
                        <tr>
                            <th>Medicament</th>
                            <th>Quantite</th>
                            <th>Posologie</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${renderedLines}
                    </tbody>
                </table>
            </body>
            </html>
        `);
        popup.document.close();
        popup.focus();
        popup.print();
        popup.close();
    };

    const handleComplete = () => {
        if (!canComplete) return;
        const billingLines = buildInvoiceDefaults();
        const renderedTreatment = `${performedTypeLabel[performedType]} - ${performedProcedure.trim()} · ${treatment.trim()}`;
        onComplete({
            date: appointment.date,
            type: performedType,
            diagnosis,
            treatment: renderedTreatment,
            notes: notes || undefined,
            veterinarian: appointment.veterinarian,
            prescriptions: prescriptions.map((p) => ({
                medication: p.productName,
                dosage: `${p.quantity} unite(s)`,
                frequency: p.posology,
                duration: '',
                instructions: '',
            })),
        }, prescriptions, billingLines);
        setCompleted(true);
    };

    if (!isOpen) return null;

    // ── Success ──
    if (completed) {
        return (
            <div className="fixed inset-0 z-50 bg-white flex items-center justify-center">
                <div className="text-center max-w-sm px-6">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-5">
                        <CheckCircle className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-1">Consultation terminee</h2>
                    <p className="text-slate-400 text-sm mb-2">Dossier medical mis a jour pour {patient.name}</p>
                    <p className="text-xs text-slate-500 mb-2">
                        Acte pratique: {performedTypeLabel[performedType]} - {performedProcedure.trim()}
                    </p>
                    {prescriptions.length > 0 && (
                        <div className="rounded-xl border border-primary-200 bg-primary-50 px-4 py-3 mb-4 text-left">
                            <p className="text-xs font-bold uppercase tracking-wide text-primary-700 mb-2">
                                Ordonnance prete
                            </p>
                            <div className="space-y-1 mb-3">
                                {prescriptions.map((rx) => (
                                    <p key={rx.productId} className="text-sm text-primary-900">
                                        {rx.productName} · qte {rx.quantity}{rx.posology ? ` · ${rx.posology}` : ''}
                                    </p>
                                ))}
                            </div>
                            <button
                                onClick={printPrescription}
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-700 hover:text-primary-800"
                            >
                                <Printer className="w-3.5 h-3.5" />
                                Imprimer l'ordonnance
                            </button>
                        </div>
                    )}
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 mb-3 text-left">
                        <p className="text-xs font-bold uppercase tracking-wide text-emerald-700 mb-1">
                            Facture generee automatiquement
                        </p>
                        <p className="text-sm text-emerald-800">
                            Total estime: <span className="font-bold">{billingPreview.total.toFixed(2)} EUR TTC</span>
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-full py-3 rounded-xl text-slate-500 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                        Retour au tableau de bord <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        );
    }

    // ── Form ──
    return (
        <div className="fixed inset-0 z-50 bg-white flex flex-col">
            {/* Top bar */}
            <div className="border-b border-slate-100 px-5 py-3 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                    <span className="text-2xl shrink-0">{speciesEmoji[patient.species]}</span>
                    <div className="flex items-center gap-2 text-sm min-w-0 flex-wrap">
                        <span className="font-bold text-slate-900">{patient.name}</span>
                        <span className="text-slate-300">·</span>
                        <span className="text-slate-500">{patient.breed}</span>
                        <span className="text-slate-300">·</span>
                        <span className="text-slate-500">{age}</span>
                        <span className="text-slate-300">·</span>
                        <span className="text-slate-500">{patient.weight} kg</span>
                        <span className="text-slate-300">·</span>
                        <span className="text-slate-400">{patient.owner.firstName} {patient.owner.lastName}</span>
                    </div>
                    {/* New / returning patient badge */}
                    {patient.medicalHistory.length === 0 ? (
                        <span className="shrink-0 px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
                            Nouveau patient
                        </span>
                    ) : (
                        <span className="shrink-0 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                            {patient.medicalHistory.length} visite(s) — Dernier: {latestMedicalRecord?.diagnosis ?? 'historique'}
                        </span>
                    )}
                    {patient.alerts.filter((a) => a.severity === 'high').map((a) => (
                        <span key={a.id} className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-700">
                            <AlertTriangle className="w-3 h-3" />{a.description}
                        </span>
                    ))}
                </div>
                <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 shrink-0">
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-2xl mx-auto px-5 py-8 space-y-8">
                    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center justify-between gap-2 mb-3">
                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                                Brief patient avant consultation
                            </h3>
                            <span className="text-xs text-slate-500">
                                {patient.medicalHistory.length} antecedent(s)
                            </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                            <div className="rounded-xl border border-slate-200 bg-white p-3">
                                <p className="text-xs text-slate-500 mb-1">Profil</p>
                                <p className="text-sm font-semibold text-slate-900">
                                    {patient.name} · {patient.breed}
                                </p>
                                <p className="text-xs text-slate-500 mt-1">
                                    {age} · {patient.weight} kg{patient.microchip ? ` · Puce: ${patient.microchip}` : ''}
                                </p>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-white p-3">
                                <p className="text-xs text-slate-500 mb-1">Proprietaire</p>
                                <p className="text-sm font-semibold text-slate-900">
                                    {patient.owner.firstName} {patient.owner.lastName}
                                </p>
                                <p className="text-xs text-slate-500 mt-1">
                                    {patient.owner.phone} · {patient.owner.email}
                                </p>
                            </div>
                        </div>

                        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 mb-3">
                            <p className="text-xs font-bold uppercase tracking-wide text-rose-700 mb-2">
                                Contre-indications et alertes critiques
                            </p>
                            {(contraindicationAlerts.length === 0 && criticalAlerts.length === 0) ? (
                                <p className="text-sm text-emerald-700">Aucune contre-indication signalee.</p>
                            ) : (
                                <div className="space-y-1.5">
                                    {[...new Map(
                                        [...contraindicationAlerts, ...criticalAlerts].map((alert) => [alert.id, alert])
                                    ).values()].map((alert) => (
                                        <p key={alert.id} className="text-sm text-rose-800">
                                            - {alert.description}
                                        </p>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="rounded-xl border border-slate-200 bg-white p-3">
                                <p className="text-xs text-slate-500 mb-1">Dernier antecedent</p>
                                {latestMedicalRecord ? (
                                    <>
                                        <p className="text-sm font-semibold text-slate-900">{latestMedicalRecord.diagnosis}</p>
                                        <p className="text-xs text-slate-500 mt-1">
                                            {latestMedicalRecord.date} · {latestMedicalRecord.treatment}
                                        </p>
                                    </>
                                ) : (
                                    <p className="text-sm text-slate-400">Aucun antecedent medical</p>
                                )}
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-white p-3">
                                <p className="text-xs text-slate-500 mb-1">Derniere vaccination</p>
                                {latestVaccination ? (
                                    <>
                                        <p className="text-sm font-semibold text-slate-900">{latestVaccination.name}</p>
                                        <p className="text-xs text-slate-500 mt-1">
                                            {latestVaccination.date} · Rappel {latestVaccination.nextDueDate}
                                        </p>
                                    </>
                                ) : (
                                    <p className="text-sm text-slate-400">Aucune vaccination enregistree</p>
                                )}
                            </div>
                        </div>
                    </section>

                    <section className="rounded-2xl border border-secondary-200 bg-secondary-50 p-4">
                        <h3 className="text-sm font-bold text-secondary-900 mb-3 uppercase tracking-wide">
                            Acte pratique
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                                    Type d'acte <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    value={performedType}
                                    onChange={(e) => setPerformedType(e.target.value as PerformedType)}
                                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-secondary-200 focus:border-secondary-500"
                                >
                                    <option value="consultation">Consultation</option>
                                    <option value="surgery">Operation</option>
                                    <option value="follow-up">Suivi</option>
                                    <option value="emergency">Urgence</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                                    Detail de l'acte <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={performedProcedure}
                                    onChange={(e) => setPerformedProcedure(e.target.value)}
                                    placeholder="Ex: Suture plaie, detartrage, ovariectomie..."
                                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-secondary-200 focus:border-secondary-500 placeholder:text-slate-300"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                                    Tarif acte HT (EUR) <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    min={1}
                                    step="0.01"
                                    value={performedPrice}
                                    onChange={(e) => setPerformedPrice(Math.max(0, Number(e.target.value) || 0))}
                                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-secondary-200 focus:border-secondary-500"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Diagnostic */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-900 mb-2">
                            Diagnostic <span className="text-rose-400">*</span>
                        </label>
                        <textarea
                            value={diagnosis}
                            onChange={(e) => setDiagnosis(e.target.value)}
                            placeholder="Que constatez-vous ?"
                            rows={3}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-400 placeholder:text-slate-300"
                            autoFocus
                        />
                    </div>

                    {/* Traitement */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-900 mb-2">
                            Traitement et consignes <span className="text-rose-400">*</span>
                        </label>
                        <textarea
                            value={treatment}
                            onChange={(e) => setTreatment(e.target.value)}
                            placeholder="Medicaments, protocole, recommandations post-acte..."
                            rows={3}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-400 placeholder:text-slate-300"
                        />
                    </div>

                    {/* Prescriptions — connected to inventory */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-sm font-semibold text-slate-900">Medicaments prescrits</label>
                            <button
                                onClick={() => setShowProductPicker(true)}
                                className="text-xs font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1"
                            >
                                <Plus className="w-3.5 h-3.5" /> Ajouter du stock
                            </button>
                        </div>

                        {/* Product picker dropdown */}
                        {showProductPicker && (
                            <div className="mb-4 rounded-xl border border-primary-200 bg-white shadow-lg overflow-hidden">
                                <div className="flex items-center gap-2 px-3 border-b border-slate-100">
                                    <Search className="w-4 h-4 text-slate-400" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Chercher un medicament..."
                                        className="flex-1 py-2.5 text-sm border-0 outline-none focus:ring-0 placeholder:text-slate-300"
                                        autoFocus
                                    />
                                    <button onClick={() => { setShowProductPicker(false); setSearchQuery(''); }} className="p-1 text-slate-400 hover:text-slate-600">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="max-h-48 overflow-y-auto">
                                    {filteredMedications.length === 0 ? (
                                        <p className="text-sm text-slate-400 text-center py-4">Aucun medicament trouve</p>
                                    ) : (
                                        filteredMedications.map((p) => (
                                            <button
                                                key={p.id}
                                                onClick={() => addProduct(p)}
                                                className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-slate-50 transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Package className="w-4 h-4 text-slate-400" />
                                                    <div>
                                                        <p className="text-sm font-medium text-slate-900">{p.name}</p>
                                                        <p className="text-xs text-slate-400">{p.sku} · {p.price.toFixed(2)} EUR/{p.unit}</p>
                                                    </div>
                                                </div>
                                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${p.stock <= p.minStock ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'
                                                    }`}>
                                                    {p.stock} {p.unit}
                                                </span>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Prescribed items */}
                        {prescriptions.length === 0 ? (
                            <p className="text-sm text-slate-300 italic">Aucun medicament prescrit</p>
                        ) : (
                            <div className="space-y-2">
                                {prescriptions.map((rx) => {
                                    const product = products.find((p) => p.id === rx.productId);
                                    const lowStock = product ? rx.quantity > product.stock : false;
                                    return (
                                        <div key={rx.productId} className={`flex items-center gap-3 p-3 rounded-xl border ${lowStock ? 'border-rose-200 bg-rose-50' : 'border-slate-100 bg-slate-50'}`}>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-medium text-slate-900">{rx.productName}</p>
                                                    {lowStock && (
                                                        <span className="text-xs text-rose-600 font-medium">Stock insuffisant !</span>
                                                    )}
                                                </div>
                                                {product && (
                                                    <p className="text-xs text-slate-400">
                                                        {product.price.toFixed(2)} EUR/{product.unit} · Stock: {product.stock} {product.unit}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <div className="flex items-center gap-1">
                                                    <label className="text-xs text-slate-500">Qte</label>
                                                    <input
                                                        type="number"
                                                        min={1}
                                                        value={rx.quantity}
                                                        onChange={(e) => updatePrescription(rx.productId, 'quantity', Math.max(1, Number(e.target.value)))}
                                                        className="w-16 px-2 py-1.5 rounded-lg border border-slate-200 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary-100"
                                                    />
                                                </div>
                                                <input
                                                    type="text"
                                                    value={rx.posology}
                                                    onChange={(e) => updatePrescription(rx.productId, 'posology', e.target.value)}
                                                    placeholder="Posologie"
                                                    className="w-40 px-3 py-1.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-100 placeholder:text-slate-300"
                                                />
                                                <button onClick={() => removePrescription(rx.productId)} className="p-1.5 rounded-lg hover:bg-rose-100 text-slate-300 hover:text-rose-500">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-900 mb-2">Notes</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Informations complementaires, rappels..."
                            rows={2}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-400 placeholder:text-slate-300"
                        />
                    </div>
                </div>
            </div>

            {/* Bottom bar */}
            <div className="border-t border-slate-100 px-5 py-4 shrink-0">
                <div className="max-w-2xl mx-auto flex items-center justify-between">
                    <div className="text-xs text-slate-400">
                        {prescriptions.length > 0 && (
                            <span>💊 {prescriptions.length} medicament(s) — ordonnance envoyee a l'accueil pour delivrance</span>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm text-slate-500 hover:bg-slate-50">
                            Annuler
                        </button>
                        <button
                            onClick={handleComplete}
                            disabled={!canComplete}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${canComplete
                                ? 'bg-primary-600 text-white hover:bg-primary-700'
                                : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                                }`}
                        >
                            <CheckCircle className="w-4 h-4" />
                            Terminer la consultation
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
