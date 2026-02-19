import { useState, useRef, useEffect } from 'react';
import { Bell, Menu, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import { useClinicData } from '../../context/clinicState';
import { Breadcrumbs, type BreadcrumbItem } from '../ui/Breadcrumbs';
import { getVaccinationDueSoonCount, getLowStockProducts, getOverdueInvoices, getPendingInvoices } from '../../context/clinicState';

interface HeaderProps {
    title: string;
    subtitle?: string;
    breadcrumbs?: BreadcrumbItem[];
}

export function Header({ title, subtitle, breadcrumbs }: HeaderProps) {
    const { user, role } = useAuth();
    const { openMobile } = useSidebar();
    const { patients, products, invoices, appointments } = useClinicData();
    const [showNotifications, setShowNotifications] = useState(false);
    const notifRef = useRef<HTMLDivElement>(null);

    const vaccinationsDue = getVaccinationDueSoonCount(patients);
    const lowStock = getLowStockProducts(products);
    const overdueInvoices = getOverdueInvoices(invoices);
    const pendingInvoices = getPendingInvoices(invoices);

    const today = new Date().toISOString().split('T')[0];
    const todayAppointments = appointments.filter((a) => a.date === today);
    const upcomingCount = todayAppointments.filter((a) => a.status === 'scheduled').length;

    // Role-specific notifications
    type Notification = { title: string; detail: string; color: string };
    const notifications: Notification[] = [];

    if (role === 'director') {
        if (overdueInvoices.length > 0)
            notifications.push({ title: `${overdueInvoices.length} facture(s) en retard`, detail: `Total: ${overdueInvoices.reduce((s, i) => s + i.total, 0).toFixed(2)} EUR`, color: 'text-rose-700' });
        if (pendingInvoices.length > 0)
            notifications.push({ title: `${pendingInvoices.length} facture(s) en attente`, detail: 'Paiement a encaisser', color: 'text-amber-700' });
        const totalRevenue = invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + i.total, 0);
        notifications.push({ title: 'Chiffre d\'affaires encaisse', detail: `${totalRevenue.toFixed(2)} EUR`, color: 'text-emerald-700' });
    }

    if (role === 'veterinarian') {
        if (vaccinationsDue > 0)
            notifications.push({ title: `${vaccinationsDue} vaccination(s) a prevoir`, detail: 'Dans les 60 prochains jours', color: 'text-primary-700' });
        const myAppointments = todayAppointments.filter((a) => a.veterinarian === user?.name);
        if (myAppointments.length > 0)
            notifications.push({ title: `${myAppointments.length} RDV aujourd'hui`, detail: `${myAppointments.filter((a) => a.status === 'completed').length} termines`, color: 'text-primary-700' });
        const criticalPatients = patients.filter((p) => p.alerts.some((a) => a.severity === 'high'));
        if (criticalPatients.length > 0)
            notifications.push({ title: `${criticalPatients.length} alerte(s) patient critique`, detail: criticalPatients.map((p) => p.name).join(', '), color: 'text-rose-700' });
    }

    if (role === 'assistant') {
        if (upcomingCount > 0)
            notifications.push({ title: `${upcomingCount} RDV a venir aujourd'hui`, detail: `${todayAppointments.length} au total`, color: 'text-primary-700' });
        if (lowStock.length > 0)
            notifications.push({ title: `${lowStock.length} produit(s) en stock bas`, detail: lowStock.map((p) => p.name).join(', '), color: 'text-amber-700' });
        if (pendingInvoices.length > 0)
            notifications.push({ title: `${pendingInvoices.length} facture(s) a encaisser`, detail: 'Paiement en attente', color: 'text-primary-700' });
        if (overdueInvoices.length > 0)
            notifications.push({ title: `${overdueInvoices.length} facture(s) en retard`, detail: 'Relance necessaire', color: 'text-rose-700' });
    }

    const totalAlerts = notifications.length;

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const roleName = user?.role === 'director' ? 'Directeur' : user?.role === 'veterinarian' ? 'Veterinaire' : 'Assistante';

    return (
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white px-4 py-4 sm:px-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    {/* Mobile hamburger */}
                    <button
                        onClick={openMobile}
                        className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-primary-50 md:hidden"
                    >
                        <Menu className="w-5 h-5" />
                    </button>

                    <div>
                        {breadcrumbs && breadcrumbs.length > 0 && (
                            <div className="mb-1">
                                <Breadcrumbs items={breadcrumbs} />
                            </div>
                        )}
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{title}</h1>
                        {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
                    </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-4">
                    {/* Cmd+K */}
                    <button
                        onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
                        className="group hidden items-center gap-3 rounded-xl border-2 border-primary-200 bg-white px-4 py-2.5 text-sm shadow-[0_4px_14px_rgba(15,118,216,0.12)] transition-all hover:border-primary-300 hover:bg-primary-50/30 sm:flex"
                    >
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary-100 text-primary-700 transition-colors group-hover:bg-primary-200">
                            <Search className="h-4 w-4" />
                        </span>
                        <span className="hidden text-sm font-semibold tracking-tight text-slate-700 lg:inline">Rechercher un patient, un RDV...</span>
                        <span className="text-sm font-semibold tracking-tight text-slate-700 lg:hidden">Rechercher...</span>
                        <kbd className="hidden items-center rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-xs text-slate-500 lg:inline-flex">
                            ⌘K
                        </kbd>
                    </button>

                    {/* Notifications */}
                    <div className="relative" ref={notifRef}>
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="relative rounded-xl border border-slate-200 bg-white p-2 transition-all hover:border-primary-200 hover:bg-primary-50/40"
                        >
                            <Bell className="w-5 h-5 text-slate-600" />
                            {totalAlerts > 0 && (
                                <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                                    {totalAlerts > 9 ? '9+' : totalAlerts}
                                </span>
                            )}
                        </button>

                        {showNotifications && (
                            <div className="animate-pulse-in absolute right-0 top-12 z-50 w-80 rounded-2xl border border-slate-200 bg-white shadow-2xl">
                                <div className="border-b border-slate-100 p-4">
                                    <h3 className="font-semibold text-slate-900">Notifications</h3>
                                    <p className="mt-0.5 text-xs text-slate-400">{roleName}</p>
                                </div>
                                <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                                    {notifications.map((n, i) => (
                                        <div key={i} className="p-4 transition-colors hover:bg-primary-50/45">
                                            <p className={`text-sm font-medium ${n.color}`}>{n.title}</p>
                                            <p className="mt-0.5 text-xs text-slate-500">{n.detail}</p>
                                        </div>
                                    ))}
                                    {notifications.length === 0 && (
                                        <div className="p-8 text-center text-sm text-slate-400">
                                            Aucune notification
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
