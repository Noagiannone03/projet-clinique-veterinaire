import { Header } from '../components/layout';
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    Users,
    Calendar,
    AlertTriangle,
    Clock,
    CheckCircle,
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import { revenueData } from '../data/invoices';
import { patients } from '../data/patients';
import {
    getLowStockProducts,
    getOverdueInvoices,
    getPendingInvoices,
    getVaccinationDueSoonCount,
    useClinicData,
} from '../context/clinicState';

interface KPICardProps {
    title: string;
    value: string;
    change?: number;
    icon: React.ReactNode;
    color: 'teal' | 'amber' | 'emerald' | 'rose';
}

function KPICard({ title, value, change, icon, color }: KPICardProps) {
    const colorClasses = {
        teal: 'from-primary-500 to-primary-600',
        amber: 'from-secondary-400 to-secondary-500',
        emerald: 'from-emerald-500 to-emerald-600',
        rose: 'from-rose-500 to-rose-600',
    };

    return (
        <div className="card card-hover animate-fade-in">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-500">{title}</p>
                    <p className="text-3xl font-bold text-slate-900 mt-2">{value}</p>
                    {change !== undefined && (
                        <div className="flex items-center gap-1 mt-2">
                            {change >= 0 ? (
                                <TrendingUp className="w-4 h-4 text-emerald-500" />
                            ) : (
                                <TrendingDown className="w-4 h-4 text-rose-500" />
                            )}
                            <span
                                className={`text-sm font-medium ${change >= 0 ? 'text-emerald-600' : 'text-rose-600'
                                    }`}
                            >
                                {change >= 0 ? '+' : ''}
                                {change}%
                            </span>
                            <span className="text-sm text-slate-400">vs mois dernier</span>
                        </div>
                    )}
                </div>
                <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center`}
                >
                    {icon}
                </div>
            </div>
        </div>
    );
}

export function Dashboard() {
    const { appointments, invoices, products } = useClinicData();
    const todayAppointments = appointments.filter((appointment) => appointment.date === '2026-01-20');
    const overdueInvoices = getOverdueInvoices(invoices);
    const pendingInvoices = getPendingInvoices(invoices);
    const lowStockProducts = getLowStockProducts(products);
    const vaccinationReminders = getVaccinationDueSoonCount(patients, 60);
    const revenue = invoices.reduce((sum, invoice) => sum + invoice.total, 0);

    const completedToday = todayAppointments.filter((a) => a.status === 'completed').length;
    const totalToday = todayAppointments.length;

    return (
        <div>
            <Header title="Tableau de bord" subtitle="Bienvenue, Dr. Martin" />

            <div className="p-8 space-y-8">
                {/* KPI Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <KPICard
                        title="Chiffre d'affaires"
                        value={`${revenue.toFixed(2)} EUR`}
                        change={12.5}
                        icon={<DollarSign className="w-6 h-6 text-white" />}
                        color="teal"
                    />
                    <KPICard
                        title="Patients actifs"
                        value={patients.length.toString()}
                        change={8.2}
                        icon={<Users className="w-6 h-6 text-white" />}
                        color="amber"
                    />
                    <KPICard
                        title="RDV aujourd'hui"
                        value={`${completedToday}/${totalToday}`}
                        icon={<Calendar className="w-6 h-6 text-white" />}
                        color="emerald"
                    />
                    <KPICard
                        title="Factures en retard"
                        value={overdueInvoices.length.toString()}
                        icon={<AlertTriangle className="w-6 h-6 text-white" />}
                        color="rose"
                    />
                </div>

                <div className="card">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-slate-900">Suivi clinique (MVP)</h3>
                        <span className="badge-info">Qualite des donnees</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <div className="p-4 rounded-lg bg-slate-50">
                            <p className="text-sm text-slate-500">Rappels vaccinaux (60 jours)</p>
                            <p className="text-2xl font-bold text-slate-900">{vaccinationReminders}</p>
                        </div>
                        <div className="p-4 rounded-lg bg-slate-50">
                            <p className="text-sm text-slate-500">Factures a suivre</p>
                            <p className="text-2xl font-bold text-amber-600">{pendingInvoices.length}</p>
                        </div>
                        <div className="p-4 rounded-lg bg-slate-50">
                            <p className="text-sm text-slate-500">Articles en tension</p>
                            <p className="text-2xl font-bold text-rose-600">{lowStockProducts.length}</p>
                        </div>
                    </div>
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Revenue Chart */}
                    <div className="lg:col-span-2 card">
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
                                    contentStyle={{
                                        backgroundColor: 'white',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '8px',
                                    }}
                                    formatter={(value) => [`${(value ?? 0).toLocaleString()} EUR`, 'CA']}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="#0d9488"
                                    strokeWidth={3}
                                    fill="url(#colorRevenue)"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="target"
                                    stroke="#f59e0b"
                                    strokeWidth={2}
                                    strokeDasharray="5 5"
                                    fill="transparent"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Today's Schedule */}
                    <div className="card">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-slate-900">Planning du jour</h3>
                            <span className="badge-info">{totalToday} RDV</span>
                        </div>
                        <div className="space-y-3">
                            {todayAppointments.slice(0, 5).map((apt) => (
                                <div
                                    key={apt.id}
                                    className="flex items-center gap-3 p-3 rounded-lg bg-slate-50"
                                >
                                    <div className="flex-shrink-0">
                                        {apt.status === 'completed' ? (
                                            <CheckCircle className="w-5 h-5 text-emerald-500" />
                                        ) : apt.status === 'in-progress' ? (
                                            <Clock className="w-5 h-5 text-amber-500" />
                                        ) : (
                                            <Clock className="w-5 h-5 text-slate-400" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-900 truncate">
                                            {apt.patientName}
                                        </p>
                                        <p className="text-xs text-slate-500">{apt.time} - {apt.type}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Alerts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Pending Payments */}
                    <div className="card">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-slate-900">Paiements en attente</h3>
                            <span className="badge-warning">{pendingInvoices.length}</span>
                        </div>
                        <div className="space-y-3">
                            {pendingInvoices.map((invoice) => (
                                <div
                                    key={invoice.id}
                                    className="flex items-center justify-between p-3 rounded-lg bg-slate-50"
                                >
                                    <div>
                                        <p className="text-sm font-medium text-slate-900">{invoice.ownerName}</p>
                                        <p className="text-xs text-slate-500">{invoice.invoiceNumber}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-slate-900">{invoice.total} EUR</p>
                                        <span
                                            className={
                                                invoice.status === 'overdue' ? 'badge-danger' : 'badge-warning'
                                            }
                                        >
                                            {invoice.status === 'overdue' ? 'En retard' : 'En attente'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Low Stock Alert */}
                    <div className="card">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-slate-900">Alertes stock</h3>
                            <span className="badge-danger">{lowStockProducts.length}</span>
                        </div>
                        <div className="space-y-3">
                            {lowStockProducts.map((product) => (
                                <div
                                    key={product.id}
                                    className="flex items-center justify-between p-3 rounded-lg bg-slate-50"
                                >
                                    <div>
                                        <p className="text-sm font-medium text-slate-900">{product.name}</p>
                                        <p className="text-xs text-slate-500">{product.category}</p>
                                    </div>
                                    <div className="text-right">
                                        <p
                                            className={`text-sm font-bold ${product.stock === 0 ? 'text-rose-600' : 'text-amber-600'
                                                }`}
                                        >
                                            {product.stock} / {product.minStock}
                                        </p>
                                        <span className={product.stock === 0 ? 'badge-danger' : 'badge-warning'}>
                                            {product.stock === 0 ? 'Rupture' : 'Stock bas'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
