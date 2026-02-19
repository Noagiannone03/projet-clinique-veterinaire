import { useState, useRef, useEffect } from 'react';
import { Bell, Menu, Search, LogOut, User, ChevronDown } from 'lucide-react';
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
    const { user, role, logout } = useAuth();
    const { openMobile } = useSidebar();
    const { patients, products, invoices, appointments } = useClinicData();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);
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
            notifications.push({ title: `${vaccinationsDue} vaccination(s) a prevoir`, detail: 'Dans les 60 prochains jours', color: 'text-sky-700' });
        const myAppointments = todayAppointments.filter((a) => a.veterinarian === user?.name);
        if (myAppointments.length > 0)
            notifications.push({ title: `${myAppointments.length} RDV aujourd'hui`, detail: `${myAppointments.filter((a) => a.status === 'completed').length} termines`, color: 'text-primary-700' });
        const criticalPatients = patients.filter((p) => p.alerts.some((a) => a.severity === 'critical'));
        if (criticalPatients.length > 0)
            notifications.push({ title: `${criticalPatients.length} alerte(s) patient critique`, detail: criticalPatients.map((p) => p.name).join(', '), color: 'text-rose-700' });
    }

    if (role === 'assistant') {
        if (upcomingCount > 0)
            notifications.push({ title: `${upcomingCount} RDV a venir aujourd'hui`, detail: `${todayAppointments.length} au total`, color: 'text-sky-700' });
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
            if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setShowUserMenu(false);
            if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const roleName = user?.role === 'director' ? 'Directeur' : user?.role === 'veterinarian' ? 'Veterinaire' : 'Assistante';

    return (
        <header className="bg-white border-b border-slate-200 px-4 sm:px-8 py-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    {/* Mobile hamburger */}
                    <button
                        onClick={openMobile}
                        className="md:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-600"
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
                        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
                    </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-4">
                    {/* Cmd+K */}
                    <button
                        onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
                        className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-400 text-sm transition-colors"
                    >
                        <Search className="w-4 h-4" />
                        <span className="hidden lg:inline">Rechercher...</span>
                        <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-slate-100 text-slate-400 font-mono">
                            ⌘K
                        </kbd>
                    </button>

                    {/* Notifications */}
                    <div className="relative" ref={notifRef}>
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                            <Bell className="w-5 h-5 text-slate-600" />
                            {totalAlerts > 0 && (
                                <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                                    {totalAlerts > 9 ? '9+' : totalAlerts}
                                </span>
                            )}
                        </button>

                        {showNotifications && (
                            <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-50 animate-fade-in">
                                <div className="p-4 border-b border-slate-100">
                                    <h3 className="font-semibold text-slate-900">Notifications</h3>
                                    <p className="text-xs text-slate-400 mt-0.5">{roleName}</p>
                                </div>
                                <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                                    {notifications.map((n, i) => (
                                        <div key={i} className="p-4 hover:bg-slate-50">
                                            <p className={`text-sm font-medium ${n.color}`}>{n.title}</p>
                                            <p className="text-xs text-slate-500 mt-0.5">{n.detail}</p>
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

                    {/* User menu */}
                    <div className="relative" ref={userMenuRef}>
                        <button
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            className="flex items-center gap-2 pl-3 sm:pl-4 border-l border-slate-200 hover:bg-slate-50 rounded-r-lg py-1 pr-2 transition-colors"
                        >
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-medium text-slate-900">{user?.name}</p>
                                <p className="text-xs text-slate-500">{roleName}</p>
                            </div>
                            <div className="w-9 h-9 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center">
                                <User className="w-4 h-4 text-white" />
                            </div>
                            <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
                        </button>

                        {showUserMenu && (
                            <div className="absolute right-0 top-12 w-48 bg-white rounded-xl shadow-xl border border-slate-200 z-50 animate-fade-in py-1">
                                <div className="px-4 py-3 border-b border-slate-100 sm:hidden">
                                    <p className="text-sm font-medium text-slate-900">{user?.name}</p>
                                    <p className="text-xs text-slate-500">{roleName}</p>
                                </div>
                                <button
                                    onClick={() => { setShowUserMenu(false); logout(); }}
                                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition-colors"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Deconnexion
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
