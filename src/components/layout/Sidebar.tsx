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
    BarChart3,
    ChevronLeft,
    ChevronRight,
    X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import { useState } from 'react';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import type { Role } from '../../types';

interface NavItem {
    to: string;
    icon: typeof LayoutDashboard;
    label: string;
    roles: Role[];
}

const navItems: NavItem[] = [
    { to: '/', icon: BarChart3, label: 'Dashboard Business', roles: ['director'] },
    { to: '/clinic', icon: LayoutDashboard, label: 'Dashboard Clinique', roles: ['director', 'veterinarian', 'assistant'] },
    { to: '/patients', icon: PawPrint, label: 'Patients', roles: ['director', 'veterinarian', 'assistant'] },
    { to: '/appointments', icon: Calendar, label: 'Rendez-vous', roles: ['director', 'veterinarian', 'assistant'] },
    { to: '/inventory', icon: Package, label: 'Inventaire', roles: ['veterinarian', 'assistant'] },
    { to: '/billing', icon: Receipt, label: 'Facturation', roles: ['director', 'veterinarian', 'assistant'] },
];

export function Sidebar() {
    const { role, user, logout } = useAuth();
    const { isExpanded, isCollapsed, isMobileOpen, toggle, closeMobile } = useSidebar();
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const filteredNav = navItems.filter((item) => role && item.roles.includes(role));
    const showDesktop = isExpanded || isCollapsed;

    return (
        <>
            {/* Desktop Sidebar */}
            {showDesktop && (
                <aside
                    className={`fixed left-0 top-0 h-screen bg-white border-r border-slate-200 flex-col z-40 transition-all duration-300 hidden md:flex ${
                        isExpanded ? 'w-64' : 'w-[56px]'
                    }`}
                >
                    {/* Logo */}
                    <div className={`border-b border-slate-200 ${isExpanded ? 'p-6' : 'p-3'}`}>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center flex-shrink-0">
                                <Stethoscope className="w-5 h-5 text-white" />
                            </div>
                            {isExpanded && (
                                <div>
                                    <h1 className="font-bold text-slate-900 text-base leading-tight">VetCare</h1>
                                    <p className="text-xs text-slate-500">Clinique des Etangs</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className={`flex-1 space-y-1 ${isExpanded ? 'p-4' : 'p-2'}`}>
                        {filteredNav.map((item) => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                end={item.to === '/' || item.to === '/clinic'}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 rounded-lg transition-colors ${
                                        isExpanded ? 'px-3 py-2.5' : 'px-2 py-2.5 justify-center'
                                    } ${
                                        isActive
                                            ? 'bg-primary-50 text-primary-700 font-medium'
                                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                    }`
                                }
                                title={isCollapsed ? item.label : undefined}
                            >
                                <item.icon className="w-5 h-5 flex-shrink-0" />
                                {isExpanded && <span className="text-sm">{item.label}</span>}
                            </NavLink>
                        ))}
                    </nav>

                    {/* Footer */}
                    <div className={`border-t border-slate-200 space-y-1 ${isExpanded ? 'p-4' : 'p-2'}`}>
                        {isExpanded && user && (
                            <div className="px-3 py-2 mb-2">
                                <p className="text-sm font-medium text-slate-900 truncate">{user.name}</p>
                                <p className="text-xs text-slate-500 capitalize">{user.role === 'director' ? 'Directeur' : user.role === 'veterinarian' ? 'Veterinaire' : 'Assistante'}</p>
                            </div>
                        )}
                        <NavLink
                            to="/settings"
                            className={`flex items-center gap-3 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors ${
                                isExpanded ? 'px-3 py-2.5' : 'px-2 py-2.5 justify-center'
                            }`}
                            title={isCollapsed ? 'Parametres' : undefined}
                        >
                            <Settings className="w-5 h-5 flex-shrink-0" />
                            {isExpanded && <span className="text-sm">Parametres</span>}
                        </NavLink>
                        <button
                            onClick={() => setShowLogoutConfirm(true)}
                            className={`w-full flex items-center gap-3 rounded-lg text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors ${
                                isExpanded ? 'px-3 py-2.5' : 'px-2 py-2.5 justify-center'
                            }`}
                            title={isCollapsed ? 'Deconnexion' : undefined}
                        >
                            <LogOut className="w-5 h-5 flex-shrink-0" />
                            {isExpanded && <span className="text-sm">Deconnexion</span>}
                        </button>

                        {/* Collapse toggle */}
                        <button
                            onClick={toggle}
                            className={`w-full flex items-center gap-3 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors mt-2 ${
                                isExpanded ? 'px-3 py-2' : 'px-2 py-2 justify-center'
                            }`}
                        >
                            {isExpanded ? (
                                <>
                                    <ChevronLeft className="w-4 h-4 flex-shrink-0" />
                                    <span className="text-xs">Reduire</span>
                                </>
                            ) : (
                                <ChevronRight className="w-4 h-4" />
                            )}
                        </button>
                    </div>
                </aside>
            )}

            {/* Mobile Overlay */}
            {isMobileOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                    <div className="fixed inset-0 bg-black/50" onClick={closeMobile} />
                    <aside className="fixed left-0 top-0 h-screen w-72 bg-white shadow-xl z-10 animate-fade-in flex flex-col">
                        <div className="flex items-center justify-between p-4 border-b border-slate-200">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                                    <Stethoscope className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h1 className="font-bold text-slate-900 text-base leading-tight">VetCare</h1>
                                    <p className="text-xs text-slate-500">Clinique des Etangs</p>
                                </div>
                            </div>
                            <button onClick={closeMobile} className="p-2 rounded-lg hover:bg-slate-100">
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>

                        <nav className="flex-1 p-4 space-y-1">
                            {filteredNav.map((item) => (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    end={item.to === '/' || item.to === '/clinic'}
                                    onClick={closeMobile}
                                    className={({ isActive }) =>
                                        `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                                            isActive
                                                ? 'bg-primary-50 text-primary-700 font-medium'
                                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                        }`
                                    }
                                >
                                    <item.icon className="w-5 h-5" />
                                    <span className="text-sm">{item.label}</span>
                                </NavLink>
                            ))}
                        </nav>

                        <div className="p-4 border-t border-slate-200 space-y-1">
                            {user && (
                                <div className="px-3 py-2 mb-2">
                                    <p className="text-sm font-medium text-slate-900">{user.name}</p>
                                    <p className="text-xs text-slate-500 capitalize">{user.role === 'director' ? 'Directeur' : user.role === 'veterinarian' ? 'Veterinaire' : 'Assistante'}</p>
                                </div>
                            )}
                            <button
                                onClick={() => { closeMobile(); setShowLogoutConfirm(true); }}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-rose-600 hover:bg-rose-50"
                            >
                                <LogOut className="w-5 h-5" />
                                <span className="text-sm">Deconnexion</span>
                            </button>
                        </div>
                    </aside>
                </div>
            )}

            <ConfirmDialog
                isOpen={showLogoutConfirm}
                onClose={() => setShowLogoutConfirm(false)}
                onConfirm={() => { setShowLogoutConfirm(false); logout(); }}
                title="Deconnexion"
                message="Etes-vous sur de vouloir vous deconnecter ?"
                confirmLabel="Se deconnecter"
                variant="warning"
            />
        </>
    );
}
