import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    PawPrint,
    Calendar,
    Package,
    Receipt,
    Settings,
    LogOut,
    Stethoscope,
} from 'lucide-react';

const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Tableau de bord' },
    { to: '/patients', icon: PawPrint, label: 'Patients' },
    { to: '/appointments', icon: Calendar, label: 'Rendez-vous' },
    { to: '/inventory', icon: Package, label: 'Inventaire' },
    { to: '/billing', icon: Receipt, label: 'Facturation' },
];

export function Sidebar() {
    return (
        <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-slate-200 flex flex-col z-40">
            {/* Logo */}
            <div className="p-6 border-b border-slate-200">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                        <Stethoscope className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="font-bold text-slate-900 text-lg leading-tight">VetCare</h1>
                        <p className="text-xs text-slate-500">Clinique des Etangs</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) =>
                            isActive ? 'sidebar-link-active' : 'sidebar-link'
                        }
                    >
                        <item.icon className="w-5 h-5" />
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 space-y-1">
                <NavLink to="/settings" className="sidebar-link">
                    <Settings className="w-5 h-5" />
                    <span>Parametres</span>
                </NavLink>
                <button className="sidebar-link w-full text-left text-rose-600 hover:bg-rose-50 hover:text-rose-700">
                    <LogOut className="w-5 h-5" />
                    <span>Deconnexion</span>
                </button>
            </div>
        </aside>
    );
}
