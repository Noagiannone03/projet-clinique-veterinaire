import { useState, useMemo } from 'react';
import {
    X,
    AlertTriangle,
    Plus,
    Trash2,
    CheckCircle,
    Receipt,
    ArrowRight,
    Search,
    Package,
} from 'lucide-react';
import type { Appointment, Patient, Product } from '../../types';
import type { MedicalRecordFormData } from '../../schemas';

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
    onComplete: (record: MedicalRecordFormData, prescribedProducts: PrescriptionItem[]) => void;
    onInvoice: () => void;
    onClose: () => void;
}

const speciesEmoji: Record<string, string> = {
    dog: '🐕', cat: '🐈', bird: '🐦', rabbit: '🐇', other: '🐾',
};

export function ConsultationPanel({ isOpen, appointment, patient, products, onComplete, onInvoice, onClose }: ConsultationPanelProps) {
    const [diagnosis, setDiagnosis] = useState('');
    const [treatment, setTreatment] = useState('');
    const [notes, setNotes] = useState('');
    const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>([]);
    const [completed, setCompleted] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showProductPicker, setShowProductPicker] = useState(false);

    if (!isOpen) return null;

    const age = (() => {
        const birth = new Date(patient.birthDate);
        const diff = Date.now() - birth.getTime();
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

    const canComplete = diagnosis.trim() && treatment.trim();

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

    const handleComplete = () => {
        if (!canComplete) return;
        const typeMap: Record<string, 'consultation' | 'surgery' | 'emergency' | 'follow-up'> = {
            consultation: 'consultation', vaccination: 'consultation', surgery: 'surgery', 'follow-up': 'follow-up', emergency: 'emergency',
        };
        onComplete({
            date: appointment.date,
            type: typeMap[appointment.type] || 'consultation',
            diagnosis,
            treatment,
            notes: notes || undefined,
            veterinarian: appointment.veterinarian,
            prescriptions: prescriptions.map((p) => ({
                medication: p.productName,
                dosage: `${p.quantity} unite(s)`,
                frequency: p.posology,
                duration: '',
                instructions: '',
            })),
        }, prescriptions);
        setCompleted(true);
    };

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
                    {prescriptions.length > 0 && (
                        <p className="text-xs text-emerald-600 font-medium mb-6">
                            Stock debite pour {prescriptions.length} produit(s)
                        </p>
                    )}
                    <button
                        onClick={onInvoice}
                        className="w-full py-3.5 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 mb-3"
                    >
                        <Receipt className="w-5 h-5" />
                        Facturer cette consultation
                    </button>
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
                        <span className="shrink-0 px-2 py-0.5 rounded-full text-xs font-medium bg-sky-100 text-sky-700">
                            Nouveau patient
                        </span>
                    ) : (
                        <span className="shrink-0 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                            {patient.medicalHistory.length} visite(s) — Dernier: {patient.medicalHistory[0].diagnosis}
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
                            Traitement <span className="text-rose-400">*</span>
                        </label>
                        <textarea
                            value={treatment}
                            onChange={(e) => setTreatment(e.target.value)}
                            placeholder="Soins effectues et a suivre"
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
                            <p className="text-sm text-slate-300 italic">Aucun medicament prescrit — le stock ne sera pas debite</p>
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
                            <span>💊 {prescriptions.length} medicament(s) — stock sera debite automatiquement</span>
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
