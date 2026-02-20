import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    PawPrint,
    Calendar,
    Package,
    Receipt,
    Pill,
    Settings,
    LogOut,
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
import clinicLogo from '../../assets/logoclinique copie.png';

interface NavItem {
    to: string;
    icon: typeof LayoutDashboard;
    label: string;
    roles: Role[];
}

const navItems: NavItem[] = [
    { to: '/', icon: BarChart3, label: 'Dashboard Business', roles: ['director'] },
    { to: '/clinic', icon: LayoutDashboard, label: 'Tableau de bord', roles: ['veterinarian', 'assistant'] },
    { to: '/patients', icon: PawPrint, label: 'Patients', roles: ['veterinarian', 'assistant'] },
    { to: '/appointments', icon: Calendar, label: 'Rendez-vous', roles: ['veterinarian', 'assistant'] },
    { to: '/inventory', icon: Package, label: 'Inventaire', roles: ['veterinarian', 'assistant'] },
    { to: '/billing', icon: Receipt, label: 'Facturation', roles: ['director', 'assistant'] },
    { to: '/prescriptions', icon: Pill, label: 'Ordonnances', roles: ['director', 'veterinarian', 'assistant'] },
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
                    className={`fixed left-0 top-0 z-40 hidden h-screen flex-col border-r border-slate-200 bg-white transition-all duration-300 md:flex ${isExpanded ? 'w-64' : 'w-[56px]'
                        }`}
                >
                    {/* Logo */}
                    <div className={`border-b border-slate-200 ${isExpanded ? 'p-4' : 'p-2'}`}>
                        <div className="flex items-center gap-3">
                            <div className={`${isExpanded ? 'h-16 w-44 rounded-xl border border-slate-200 bg-white p-1' : 'h-12 w-12 rounded-lg border border-slate-200 bg-white p-1'} overflow-hidden flex-shrink-0`}>
                                <img
                                    src={clinicLogo}
                                    alt="Clinique des Etangs"
                                    className={`h-full w-full object-cover ${isExpanded ? 'object-center scale-125' : 'object-left scale-140'}`}
                                />
                            </div>
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
                                    `flex items-center gap-3 rounded-xl transition-all ${isExpanded ? 'px-3 py-2.5' : 'justify-center px-2 py-2.5'
                                    } ${isActive
                                        ? 'border border-primary-200 bg-primary-50 text-primary-700 shadow-sm'
                                        : 'border border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-900'
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
                    <div className={`space-y-1 border-t border-slate-200 ${isExpanded ? 'p-4' : 'p-2'}`}>
                        {isExpanded && user && (
                            <div className="mb-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
                                <p className="text-sm font-medium text-slate-900 truncate">{user.name}</p>
                                <p className="text-xs text-slate-500 capitalize">{user.role === 'director' ? 'Directeur' : user.role === 'veterinarian' ? 'Veterinaire' : 'Assistante'}</p>
                            </div>
                        )}
                        <NavLink
                            to="/settings"
                            className={`flex items-center gap-3 rounded-xl border border-transparent text-slate-600 transition-all hover:border-slate-200 hover:bg-slate-50 hover:text-slate-900 ${isExpanded ? 'px-3 py-2.5' : 'justify-center px-2 py-2.5'
                                }`}
                            title={isCollapsed ? 'Parametres' : undefined}
                        >
                            <Settings className="w-5 h-5 flex-shrink-0" />
                            {isExpanded && <span className="text-sm">Parametres</span>}
                        </NavLink>
                        <button
                            onClick={() => setShowLogoutConfirm(true)}
                            className={`flex w-full items-center gap-3 rounded-xl border border-transparent text-rose-600 transition-all hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 ${isExpanded ? 'px-3 py-2.5' : 'justify-center px-2 py-2.5'
                                }`}
                            title={isCollapsed ? 'Deconnexion' : undefined}
                        >
                            <LogOut className="w-5 h-5 flex-shrink-0" />
                            {isExpanded && <span className="text-sm">Deconnexion</span>}
                        </button>

                        {/* Collapse toggle */}
                        <button
                            onClick={toggle}
                            className={`mt-2 flex w-full items-center gap-3 rounded-xl border border-transparent text-slate-400 transition-all hover:border-slate-200 hover:bg-slate-50 hover:text-slate-600 ${isExpanded ? 'px-3 py-2' : 'justify-center px-2 py-2'
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
                    <aside className="animate-pulse-in fixed left-0 top-0 z-10 flex h-screen w-72 flex-col border-r border-slate-200 bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-200 p-4">
                            <div className="flex items-center gap-3">
                                <div className="h-14 w-40 flex-shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white p-1">
                                    <img
                                        src={clinicLogo}
                                        alt="Clinique des Etangs"
                                        className="h-full w-full object-cover object-center scale-125"
                                    />
                                </div>
                            </div>
                            <button onClick={closeMobile} className="rounded-lg p-2 hover:bg-primary-50">
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
                                        `flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all ${isActive
                                            ? 'border-primary-200 bg-primary-50 text-primary-700'
                                            : 'border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                                        }`
                                    }
                                >
                                    <item.icon className="w-5 h-5" />
                                    <span className="text-sm">{item.label}</span>
                                </NavLink>
                            ))}
                        </nav>

                        <div className="space-y-1 border-t border-slate-200 p-4">
                            {user && (
                                <div className="mb-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                                    <p className="text-sm font-medium text-slate-900">{user.name}</p>
                                    <p className="text-xs text-slate-500 capitalize">{user.role === 'director' ? 'Directeur' : user.role === 'veterinarian' ? 'Veterinaire' : 'Assistante'}</p>
                                </div>
                            )}
                            <button
                                onClick={() => { closeMobile(); setShowLogoutConfirm(true); }}
                                className="flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-rose-600 transition-all hover:border-rose-200 hover:bg-rose-50"
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
