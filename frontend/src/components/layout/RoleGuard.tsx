import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { Role } from '../../types';

interface RoleGuardProps {
    allowedRoles: Role[];
    children: React.ReactNode;
}

/**
 * Protects a route based on user role.
 * Redirects to the user's home page if their role is not in allowedRoles.
 */
export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
    const { role } = useAuth();

    if (!role || !allowedRoles.includes(role)) {
        // Redirect to appropriate home
        const home = role === 'director' ? '/' : '/clinic';
        return <Navigate to={home} replace />;
    }

    return <>{children}</>;
}
