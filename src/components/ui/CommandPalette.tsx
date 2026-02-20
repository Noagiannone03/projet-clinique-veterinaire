import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Search, PawPrint, Calendar, Package, Receipt, ArrowRight, Plus, Stethoscope, CreditCard, BarChart3, Pill } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useClinicData } from '../../context/clinicState';
import { useAuth } from '../../context/AuthContext';
import type { Role } from '../../types';

interface SearchResult {
    id: string;
    label: string;
    sublabel: string;
    type: 'patient' | 'appointment' | 'product' | 'invoice' | 'prescription' | 'action';
    link: string;
    icon: React.ReactNode;
}

const typeIcons = {
    patient: <PawPrint className="w-4 h-4" />,
    appointment: <Calendar className="w-4 h-4" />,
    product: <Package className="w-4 h-4" />,
    invoice: <Receipt className="w-4 h-4" />,
    prescription: <Pill className="w-4 h-4" />,
};

interface QuickAction {
    id: string;
    label: string;
    sublabel: string;
    link: string;
    icon: React.ReactNode;
    roles: Role[];
}

const quickActions: QuickAction[] = [
    { id: 'qa-rdv', label: 'Nouveau rendez-vous', sublabel: 'Planifier une consultation', link: '/appointments', icon: <Plus className="w-4 h-4" />, roles: ['veterinarian', 'assistant'] },
    { id: 'qa-patient', label: 'Nouveau patient', sublabel: 'Enregistrer un animal', link: '/patients', icon: <PawPrint className="w-4 h-4" />, roles: ['veterinarian', 'assistant'] },
    { id: 'qa-invoice', label: 'Nouvelle facture', sublabel: 'Creer une facture', link: '/billing', icon: <CreditCard className="w-4 h-4" />, roles: ['assistant', 'veterinarian'] },
    { id: 'qa-inventory', label: 'Gerer inventaire', sublabel: 'Stock et produits', link: '/inventory', icon: <Package className="w-4 h-4" />, roles: ['assistant', 'veterinarian'] },
    { id: 'qa-consult', label: 'Mes consultations', sublabel: 'Voir mon planning', link: '/appointments', icon: <Stethoscope className="w-4 h-4" />, roles: ['veterinarian'] },
    { id: 'qa-prescriptions', label: 'Ordonnances', sublabel: 'Suivi preparation et delivrance', link: '/prescriptions', icon: <Pill className="w-4 h-4" />, roles: ['director', 'veterinarian', 'assistant'] },
    { id: 'qa-dashboard', label: 'Dashboard financier', sublabel: 'KPIs et chiffre d\'affaires', link: '/', icon: <BarChart3 className="w-4 h-4" />, roles: ['director'] },
    { id: 'qa-billing', label: 'Suivi facturation', sublabel: 'Factures et paiements', link: '/billing', icon: <Receipt className="w-4 h-4" />, roles: ['director'] },
];

// Which entity types each role can search
const searchableTypes: Record<Role, Set<string>> = {
    director: new Set(['patient', 'appointment', 'invoice', 'prescription']),
    veterinarian: new Set(['patient', 'appointment', 'product', 'invoice', 'prescription']),
    assistant: new Set(['patient', 'appointment', 'product', 'invoice', 'prescription']),
};

export function CommandPalette() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();
    const { patients, appointments, products, invoices, prescriptionOrders } = useClinicData();
    const { role } = useAuth();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen((o) => !o);
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    const allowedTypes = role ? searchableTypes[role] : new Set<string>();

    const results = useCallback((): SearchResult[] => {
        // If no query, show role-specific quick actions
        if (!query.trim()) {
            if (!role) return [];
            return quickActions
                .filter((a) => a.roles.includes(role))
                .map((a) => ({
                    id: a.id,
                    label: a.label,
                    sublabel: a.sublabel,
                    type: 'action' as const,
                    link: a.link,
                    icon: a.icon,
                }));
        }

        const q = query.toLowerCase();
        const res: SearchResult[] = [];

        if (allowedTypes.has('patient')) {
            patients.forEach((p) => {
                if (
                    p.name.toLowerCase().includes(q) ||
                    p.owner.lastName.toLowerCase().includes(q) ||
                    p.breed.toLowerCase().includes(q) ||
                    p.microchip?.toLowerCase().includes(q)
                ) {
                    res.push({
                        id: p.id,
                        label: p.name,
                        sublabel: `${p.species} - ${p.owner.firstName} ${p.owner.lastName}`,
                        type: 'patient',
                        link: `/patients/${p.id}`,
                        icon: typeIcons.patient,
                    });
                }
            });
        }

        if (allowedTypes.has('appointment')) {
            appointments.forEach((a) => {
                if (
                    a.patientName.toLowerCase().includes(q) ||
                    a.ownerName.toLowerCase().includes(q) ||
                    a.veterinarian.toLowerCase().includes(q)
                ) {
                    res.push({
                        id: a.id,
                        label: `${a.patientName} - ${a.type}`,
                        sublabel: `${a.date} ${a.time} - ${a.veterinarian}`,
                        type: 'appointment',
                        link: '/appointments',
                        icon: typeIcons.appointment,
                    });
                }
            });
        }

        if (allowedTypes.has('product')) {
            products.forEach((p) => {
                if (p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)) {
                    res.push({
                        id: p.id,
                        label: p.name,
                        sublabel: `Stock: ${p.stock} ${p.unit} - ${p.price.toFixed(2)} EUR`,
                        type: 'product',
                        link: '/inventory',
                        icon: typeIcons.product,
                    });
                }
            });
        }

        if (allowedTypes.has('invoice')) {
            invoices.forEach((inv) => {
                if (
                    inv.invoiceNumber.toLowerCase().includes(q) ||
                    inv.patientName.toLowerCase().includes(q) ||
                    inv.ownerName.toLowerCase().includes(q)
                ) {
                    res.push({
                        id: inv.id,
                        label: inv.invoiceNumber,
                        sublabel: `${inv.ownerName} - ${inv.total.toFixed(2)} EUR`,
                        type: 'invoice',
                        link: '/billing',
                        icon: typeIcons.invoice,
                    });
                }
            });
        }

        if (allowedTypes.has('prescription')) {
            prescriptionOrders.forEach((order) => {
                if (
                    order.prescriptionNumber.toLowerCase().includes(q) ||
                    order.patientName.toLowerCase().includes(q) ||
                    order.ownerName.toLowerCase().includes(q)
                ) {
                    res.push({
                        id: order.id,
                        label: order.prescriptionNumber,
                        sublabel: `${order.patientName} - ${order.veterinarian}`,
                        type: 'prescription',
                        link: '/prescriptions',
                        icon: typeIcons.prescription,
                    });
                }
            });
        }

        return res.slice(0, 10);
    }, [query, patients, appointments, products, invoices, prescriptionOrders, role, allowedTypes])();

    const select = (result: SearchResult) => {
        setIsOpen(false);
        navigate(result.link);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex((i) => Math.max(i - 1, 0));
        } else if (e.key === 'Enter' && results[selectedIndex]) {
            select(results[selectedIndex]);
        } else if (e.key === 'Escape') {
            setIsOpen(false);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh]" onClick={() => setIsOpen(false)}>
            <div className="fixed inset-0 bg-black/50" />
            <div
                className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden animate-fade-in z-10"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center gap-3 px-4 border-b border-slate-200">
                    <Search className="w-5 h-5 text-slate-400" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
                        onKeyDown={handleKeyDown}
                        placeholder="Rechercher patients, RDV, produits, factures..."
                        className="flex-1 py-4 text-sm border-0 outline-none focus:ring-0 placeholder:text-slate-400"
                    />
                    <kbd className="hidden sm:inline-flex items-center px-2 py-1 rounded text-xs text-slate-400 bg-slate-100">
                        ESC
                    </kbd>
                </div>
                {results.length > 0 && (
                    <div className="max-h-72 overflow-y-auto p-2">
                        {!query.trim() && (
                            <p className="px-3 py-1.5 text-xs font-medium text-slate-400 uppercase tracking-wider">Actions rapides</p>
                        )}
                        {results.map((r, i) => (
                            <button
                                key={r.id}
                                onClick={() => select(r)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${i === selectedIndex ? 'bg-primary-50 text-primary-700' : 'hover:bg-slate-50 text-slate-700'
                                    }`}
                            >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${i === selectedIndex ? 'bg-primary-100' : 'bg-slate-100'
                                    }`}>
                                    {r.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{r.label}</p>
                                    <p className="text-xs text-slate-500 truncate">{r.sublabel}</p>
                                </div>
                                <ArrowRight className="w-4 h-4 text-slate-300" />
                            </button>
                        ))}
                    </div>
                )}
                {query && results.length === 0 && (
                    <div className="py-8 text-center text-sm text-slate-500">
                        Aucun resultat pour "{query}"
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
}
