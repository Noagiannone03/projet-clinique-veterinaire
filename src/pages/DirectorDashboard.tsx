import { Header } from '../components/layout';
import { StatsCard } from '../components/ui';
import {
    DollarSign,
    Users,
    Calendar,
    AlertTriangle,
    TrendingUp,
    Receipt,
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
import { Badge } from '../components/ui';

export function DirectorDashboard() {
    const { user } = useAuth();
    const { patients, appointments, invoices, products } = useClinicData();

    const today = format(new Date(), 'yyyy-MM-dd');
    const todayAppointments = appointments.filter((a) => a.date === today);
    const overdueInvoices = getOverdueInvoices(invoices);
    const pendingInvoices = getPendingInvoices(invoices);
    const lowStockProducts = getLowStockProducts(products);

    const totalRevenue = invoices
        .filter((i) => i.status === 'paid' || i.status === 'partial')
        .reduce((sum, i) => sum + i.total, 0);

    const totalInvoiced = invoices.reduce((sum, i) => sum + i.total, 0);
    const encashmentRate = totalInvoiced > 0 ? Math.round((totalRevenue / totalInvoiced) * 100) : 0;

    // Weekly consultation data
    const weeklyData = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const dateStr = format(d, 'yyyy-MM-dd');
        const dayLabel = format(d, 'EEE', { locale: fr });
        const count = appointments.filter((a) => a.date === dateStr && a.status !== 'cancelled').length;
        return { day: dayLabel, consultations: count };
    });

    return (
        <div>
            <Header
                title="Dashboard Business"
                subtitle={`Bienvenue, ${user?.name || 'Directeur'} - ${format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}`}
            />

            <div className="p-4 sm:p-8 space-y-6">
                {/* KPIs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatsCard
                        label="CA Mensuel"
                        value={`${totalRevenue.toFixed(0)} EUR`}
                        change={12.5}
                        changeType="increase"
                        icon={<DollarSign className="w-6 h-6" />}
                        link="/billing"
                    />
                    <StatsCard
                        label="Taux d'encaissement"
                        value={`${encashmentRate}%`}
                        change={encashmentRate >= 80 ? 5 : -3}
                        changeType={encashmentRate >= 80 ? 'increase' : 'decrease'}
                        icon={<TrendingUp className="w-6 h-6" />}
                    />
                    <StatsCard
                        label="Patients actifs"
                        value={patients.length}
                        change={8.2}
                        changeType="increase"
                        icon={<Users className="w-6 h-6" />}
                        link="/patients"
                    />
                    <StatsCard
                        label="RDV aujourd'hui"
                        value={todayAppointments.length}
                        icon={<Calendar className="w-6 h-6" />}
                        link="/appointments"
                    />
                </div>

                {/* Alerts */}
                {(overdueInvoices.length > 0 || lowStockProducts.length > 0) && (
                    <div className="bg-gradient-to-r from-amber-50 to-rose-50 border border-amber-200 rounded-xl p-4">
                        <div className="flex items-center gap-3 mb-3">
                            <AlertTriangle className="w-5 h-5 text-amber-600" />
                            <h3 className="font-semibold text-slate-900">Alertes business</h3>
                        </div>
                        <div className="flex flex-wrap gap-4">
                            {overdueInvoices.length > 0 && (
                                <div className="flex items-center gap-2">
                                    <Badge variant="danger">{overdueInvoices.length}</Badge>
                                    <span className="text-sm text-rose-700">facture(s) impayee(s) &gt; 30 jours</span>
                                </div>
                            )}
                            {lowStockProducts.length > 0 && (
                                <div className="flex items-center gap-2">
                                    <Badge variant="warning">{lowStockProducts.length}</Badge>
                                    <span className="text-sm text-amber-700">produit(s) en stock critique</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Revenue Chart */}
                    <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                        <h3 className="font-semibold text-slate-900 mb-4">Evolution du chiffre d'affaires</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={revenueData}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0d9488" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                                <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `${v / 1000}k`} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                                    formatter={(value) => [`${(value ?? 0).toLocaleString()} EUR`, '']}
                                />
                                <Area type="monotone" dataKey="revenue" stroke="#0d9488" strokeWidth={3} fill="url(#colorRevenue)" name="CA" />
                                <Area type="monotone" dataKey="target" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" fill="transparent" name="Objectif" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Frequentation */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                        <h3 className="font-semibold text-slate-900 mb-4">Frequentation (7 jours)</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={weeklyData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="day" stroke="#64748b" fontSize={12} />
                                <YAxis stroke="#64748b" fontSize={12} allowDecimals={false} />
                                <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                                <Bar dataKey="consultations" fill="#0d9488" radius={[4, 4, 0, 0]} name="RDV" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Bottom row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Pending */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-slate-900">Factures impayees</h3>
                            <Badge variant="danger">{overdueInvoices.length + pendingInvoices.length}</Badge>
                        </div>
                        <div className="space-y-3">
                            {[...overdueInvoices, ...pendingInvoices].slice(0, 5).map((inv) => (
                                <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                                    <div>
                                        <p className="text-sm font-medium text-slate-900">{inv.ownerName}</p>
                                        <p className="text-xs text-slate-500">{inv.invoiceNumber}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-slate-900">{inv.total.toFixed(2)} EUR</p>
                                        <Badge variant={inv.status === 'overdue' ? 'danger' : 'warning'}>
                                            {inv.status === 'overdue' ? 'En retard' : 'En attente'}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                            {overdueInvoices.length === 0 && pendingInvoices.length === 0 && (
                                <p className="text-sm text-slate-500 text-center py-4">Aucune facture impayee</p>
                            )}
                        </div>
                    </div>

                    {/* Ratio */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                        <h3 className="font-semibold text-slate-900 mb-4">Indicateurs de rentabilite</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200">
                                <p className="text-sm text-emerald-700">CA Total</p>
                                <p className="text-2xl font-bold text-emerald-800">{totalRevenue.toFixed(0)} EUR</p>
                            </div>
                            <div className="p-4 rounded-lg bg-sky-50 border border-sky-200">
                                <p className="text-sm text-sky-700">Total facture</p>
                                <p className="text-2xl font-bold text-sky-800">{totalInvoiced.toFixed(0)} EUR</p>
                            </div>
                            <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                                <p className="text-sm text-amber-700">Encaissement</p>
                                <p className="text-2xl font-bold text-amber-800">{encashmentRate}%</p>
                            </div>
                            <div className="p-4 rounded-lg bg-primary-50 border border-primary-200">
                                <p className="text-sm text-primary-700">RDV / semaine</p>
                                <p className="text-2xl font-bold text-primary-800">
                                    {Math.round(appointments.filter((a) => a.status !== 'cancelled').length / Math.max(1, Math.ceil(appointments.length / 5)))}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
