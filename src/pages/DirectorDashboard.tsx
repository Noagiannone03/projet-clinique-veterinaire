import { Header } from '../components/layout';
import {
    Euro,
    Users,
    Calendar,
    AlertTriangle,
    TrendingUp,
    TrendingDown,
    CreditCard,
    Package,
    Pill,
    ArrowRight,
    BarChart3,
    Activity,
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Cell,
} from 'recharts';
import { revenueData } from '../data/invoices';
import {
    getLowStockProducts,
    getOverdueInvoices,
    getPendingInvoices,
    useClinicData,
} from '../context/clinicState';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

export function DirectorDashboard() {
    const { user } = useAuth();
    const { patients, appointments, invoices, products, prescriptionOrders } = useClinicData();
    const navigate = useNavigate();

    const today = format(new Date(), 'yyyy-MM-dd');
    const todayAppointments = appointments.filter((a) => a.date === today);
    const overdueInvoices = getOverdueInvoices(invoices);
    const pendingInvoices = getPendingInvoices(invoices);
    const lowStockProducts = getLowStockProducts(products);
    const openPrescriptionOrders = prescriptionOrders.filter(
        (order) => order.status === 'pending' || order.status === 'prepared'
    );

    const totalRevenue = invoices
        .filter((i) => i.status === 'paid' || i.status === 'partial')
        .reduce((sum, i) => sum + i.total, 0);

    const totalInvoiced = invoices.reduce((sum, i) => sum + i.total, 0);
    const encashmentRate = totalInvoiced > 0 ? Math.round((totalRevenue / totalInvoiced) * 100) : 0;
    const overdueTotal = overdueInvoices.reduce((s, i) => s + i.total, 0);

    // Weekly consultation data
    const weeklyData = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const dateStr = format(d, 'yyyy-MM-dd');
        const dayLabel = format(d, 'EEE', { locale: fr });
        const count = appointments.filter((a) => a.date === dateStr && a.status !== 'cancelled').length;
        const isToday = dateStr === today;
        return { day: dayLabel, consultations: count, isToday };
    });

    const weeklyAvg = Math.round(
        appointments.filter((a) => a.status !== 'cancelled').length / Math.max(1, Math.ceil(appointments.length / 5))
    );

    const greeting = (() => {
        const h = new Date().getHours();
        if (h < 12) return 'Bonjour';
        if (h < 18) return 'Bon apres-midi';
        return 'Bonsoir';
    })();

    // KPI config
    const kpis = [
        {
            label: 'CA Mensuel',
            value: `${totalRevenue.toLocaleString()} EUR`,
            change: 12.5,
            changeType: 'increase' as const,
            icon: Euro,
            iconBg: 'bg-emerald-100',
            iconColor: 'text-emerald-600',
            link: '/billing',
        },
        {
            label: "Taux d'encaissement",
            value: `${encashmentRate}%`,
            change: encashmentRate >= 80 ? 5 : -3,
            changeType: (encashmentRate >= 80 ? 'increase' : 'decrease') as 'increase' | 'decrease',
            icon: Activity,
            iconBg: 'bg-primary-100',
            iconColor: 'text-primary-600',
            link: undefined,
        },
        {
            label: 'Patients actifs',
            value: patients.length,
            change: 8.2,
            changeType: 'increase' as const,
            icon: Users,
            iconBg: 'bg-secondary-100',
            iconColor: 'text-secondary-600',
            link: '/patients',
        },
        {
            label: "RDV aujourd'hui",
            value: todayAppointments.length,
            change: undefined,
            changeType: undefined,
            icon: Calendar,
            iconBg: 'bg-amber-100',
            iconColor: 'text-amber-600',
            link: '/appointments',
        },
    ];

    return (
        <div>
            <Header
                title={`${greeting}, ${user?.name?.split(' ').pop() || 'Directeur'}`}
                subtitle={format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}
            />

            <div className="p-4 sm:p-8 space-y-6">
                {/* ── Hero KPIs ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {kpis.map((kpi) => {
                        const Icon = kpi.icon;
                        return (
                            <button
                                key={kpi.label}
                                onClick={() => kpi.link && navigate(kpi.link)}
                                className={`text-left p-5 rounded-2xl bg-white border border-slate-200 shadow-sm transition-all ${kpi.link ? 'hover:shadow-md hover:border-slate-300 cursor-pointer' : 'cursor-default'
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div className={`w-11 h-11 rounded-xl ${kpi.iconBg} flex items-center justify-center`}>
                                        <Icon className={`w-5 h-5 ${kpi.iconColor}`} />
                                    </div>
                                    {kpi.change !== undefined && (
                                        <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${kpi.changeType === 'increase'
                                            ? 'bg-emerald-50 text-emerald-700'
                                            : 'bg-rose-50 text-rose-700'
                                            }`}>
                                            {kpi.changeType === 'increase'
                                                ? <TrendingUp className="w-3 h-3" />
                                                : <TrendingDown className="w-3 h-3" />
                                            }
                                            {kpi.change > 0 ? '+' : ''}{kpi.change}%
                                        </div>
                                    )}
                                </div>
                                <p className="text-2xl font-bold text-slate-900 mb-0.5">{kpi.value}</p>
                                <p className="text-sm text-slate-500">{kpi.label}</p>
                            </button>
                        );
                    })}
                </div>

                {/* ── Alerts Panel ── */}
                {(overdueInvoices.length > 0 || pendingInvoices.length > 0 || lowStockProducts.length > 0 || openPrescriptionOrders.length > 0) && (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-5 py-3 bg-gradient-to-r from-amber-50 to-rose-50 border-b border-amber-100 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-600" />
                            <h3 className="font-semibold text-slate-900 text-sm">Alertes business</h3>
                        </div>
                        <div className="divide-y divide-slate-50">
                            {overdueInvoices.length > 0 && (
                                <button onClick={() => navigate('/billing')} className="w-full flex items-center gap-4 px-5 py-4 hover:bg-rose-50/50 transition-colors text-left">
                                    <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                                        <CreditCard className="w-5 h-5 text-rose-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-rose-800">{overdueInvoices.length} facture(s) en retard</p>
                                        <p className="text-xs text-rose-600">{overdueTotal.toFixed(0)} EUR a recouvrer</p>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-rose-300 shrink-0" />
                                </button>
                            )}
                            {pendingInvoices.length > 0 && (
                                <button onClick={() => navigate('/billing')} className="w-full flex items-center gap-4 px-5 py-4 hover:bg-amber-50/50 transition-colors text-left">
                                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                                        <Euro className="w-5 h-5 text-amber-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-amber-800">{pendingInvoices.length} facture(s) en attente</p>
                                        <p className="text-xs text-amber-600">Paiement a encaisser</p>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-amber-300 shrink-0" />
                                </button>
                            )}
                            {lowStockProducts.length > 0 && (
                                <button onClick={() => navigate('/inventory')} className="w-full flex items-center gap-4 px-5 py-4 hover:bg-orange-50/50 transition-colors text-left">
                                    <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                                        <Package className="w-5 h-5 text-orange-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-orange-800">{lowStockProducts.length} produit(s) stock critique</p>
                                        <p className="text-xs text-orange-600 truncate">{lowStockProducts.map((p) => p.name).join(', ')}</p>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-orange-300 shrink-0" />
                                </button>
                            )}
                            {openPrescriptionOrders.length > 0 && (
                                <button onClick={() => navigate('/prescriptions')} className="w-full flex items-center gap-4 px-5 py-4 hover:bg-primary-50/50 transition-colors text-left">
                                    <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center shrink-0">
                                        <Pill className="w-5 h-5 text-primary-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-primary-800">{openPrescriptionOrders.length} ordonnance(s) en cours</p>
                                        <p className="text-xs text-primary-600">A preparer ou a delivrer par l'accueil</p>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-primary-300 shrink-0" />
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* ── Charts ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Revenue Chart */}
                    <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <h3 className="font-semibold text-slate-900">Evolution du chiffre d'affaires</h3>
                                <p className="text-xs text-slate-400 mt-0.5">Realise vs objectif mensuel</p>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-slate-500">
                                <span className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded-full bg-primary-500" />Realise</span>
                                <span className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded-full bg-amber-400 opacity-60" />Objectif</span>
                            </div>
                        </div>
                        <ResponsiveContainer width="100%" height={280}>
                            <AreaChart data={revenueData}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.22} />
                                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                                <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `${v / 1000}k`} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                                    formatter={(value) => [`${(value ?? 0).toLocaleString()} EUR`, '']}
                                />
                                <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2.5} fill="url(#colorRevenue)" name="Realise" />
                                <Area type="monotone" dataKey="target" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="6 4" fill="transparent" name="Objectif" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Frequentation */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                        <div className="mb-5">
                            <h3 className="font-semibold text-slate-900">Frequentation</h3>
                            <p className="text-xs text-slate-400 mt-0.5">7 derniers jours · Moy. {weeklyAvg}/j</p>
                        </div>
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={weeklyData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                                <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                                />
                                <Bar dataKey="consultations" radius={[6, 6, 0, 0]} name="RDV">
                                    {weeklyData.map((entry, index) => (
                                        <Cell
                                            key={index}
                                            fill={entry.isToday ? '#2563eb' : '#bfdbfe'}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* ── Bottom: Profitability indicators ── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Unpaid invoices list */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <CreditCard className="w-4 h-4 text-slate-500" />
                                <h3 className="font-semibold text-slate-900 text-sm">Factures impayees</h3>
                            </div>
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-700">
                                {overdueInvoices.length + pendingInvoices.length}
                            </span>
                        </div>
                        <div className="divide-y divide-slate-50 max-h-64 overflow-y-auto">
                            {[...overdueInvoices, ...pendingInvoices].slice(0, 6).map((inv) => (
                                <div key={inv.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors">
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-slate-900 truncate">{inv.ownerName}</p>
                                        <p className="text-xs text-slate-400">{inv.invoiceNumber}</p>
                                    </div>
                                    <div className="text-right shrink-0 ml-3">
                                        <p className="text-sm font-bold text-slate-900">{inv.total.toFixed(2)} EUR</p>
                                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${inv.status === 'overdue' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {inv.status === 'overdue' ? 'En retard' : 'En attente'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {overdueInvoices.length === 0 && pendingInvoices.length === 0 && (
                                <div className="px-5 py-8 text-center">
                                    <p className="text-sm text-slate-400">Aucune facture impayee</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Profitability cards */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                        <div className="flex items-center gap-2 mb-5">
                            <BarChart3 className="w-4 h-4 text-slate-500" />
                            <h3 className="font-semibold text-slate-900 text-sm">Indicateurs de rentabilite</h3>
                        </div>
                        <div className="space-y-4">
                            {/* CA Total */}
                            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm font-medium text-emerald-700">CA encaisse</p>
                                    <p className="text-xl font-bold text-emerald-800">{totalRevenue.toLocaleString()} EUR</p>
                                </div>
                                <div className="w-full bg-emerald-200 rounded-full h-2">
                                    <div className="bg-emerald-500 rounded-full h-2 transition-all" style={{ width: `${Math.min(100, (totalRevenue / Math.max(1, totalInvoiced)) * 100)}%` }} />
                                </div>
                                <p className="text-xs text-emerald-600 mt-1">sur {totalInvoiced.toLocaleString()} EUR factures</p>
                            </div>

                            {/* Encaissement */}
                            <div className="p-4 rounded-xl bg-primary-50 border border-primary-100">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm font-medium text-primary-700">Taux d'encaissement</p>
                                    <p className="text-xl font-bold text-primary-800">{encashmentRate}%</p>
                                </div>
                                <div className="w-full bg-primary-200 rounded-full h-2">
                                    <div className={`rounded-full h-2 transition-all ${encashmentRate >= 80 ? 'bg-primary-500' : 'bg-amber-500'}`} style={{ width: `${encashmentRate}%` }} />
                                </div>
                                <p className="text-xs text-primary-600 mt-1">{encashmentRate >= 80 ? 'Bon niveau' : 'A ameliorer'}</p>
                            </div>

                            {/* RDV avg */}
                            <div className="p-4 rounded-xl bg-secondary-50 border border-secondary-100">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium text-secondary-700">RDV / semaine (moy.)</p>
                                    <p className="text-xl font-bold text-secondary-800">{weeklyAvg}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
