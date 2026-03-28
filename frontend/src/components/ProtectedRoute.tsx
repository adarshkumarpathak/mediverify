import { Navigate, useLocation } from 'react-router-dom';
import { useStore } from '../context/AuthContext';


export const ProtectedRoute = ({
    children,
    allowedRoles = ['doctor', 'admin']
}: {
    children: React.ReactNode,
    allowedRoles?: string[]
}) => {
    const { user, isLoading } = useStore();
    const location = useLocation();

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    if (!user) {
        // Return to login with state showing where they tried to go
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (!allowedRoles.includes(user.role)) {
        // Unauthorized route
        const redirectPath = user.role === 'admin' ? '/admin/dashboard' : '/doctor/dashboard';
        return <Navigate to={redirectPath} replace />;
    }

    return <>{children}</>;
};
