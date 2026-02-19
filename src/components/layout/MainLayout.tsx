import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import { CommandPalette } from '../ui/CommandPalette';

export function MainLayout() {
    const { isAuthenticated } = useAuth();
    const { isExpanded, isCollapsed } = useSidebar();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    const marginLeft = isExpanded ? 'md:ml-64' : isCollapsed ? 'md:ml-[56px]' : '';

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="pointer-events-none fixed inset-0 z-0">
                <div className="absolute -right-40 -top-24 h-96 w-96 rounded-full bg-primary-200/40 blur-3xl" />
                <div className="absolute -left-24 bottom-0 h-80 w-80 rounded-full bg-secondary-200/35 blur-3xl" />
            </div>
            <Sidebar />
            <main className={`relative z-10 transition-all duration-300 ${marginLeft}`}>
                <Outlet />
            </main>
            <CommandPalette />
        </div>
    );
}
