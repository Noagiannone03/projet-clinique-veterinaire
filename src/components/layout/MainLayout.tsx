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
            <Sidebar />
            <main className={`transition-all duration-300 ${marginLeft}`}>
                <Outlet />
            </main>
            <CommandPalette />
        </div>
    );
}
