import { NavLink } from 'react-router-dom';
import { useStore } from '../context/AuthContext';
import {
    Home,
    UploadCloud,
    History,
    User as UserIcon,
    Users,
    BarChart2,
    FileText
} from 'lucide-react';

export const Sidebar = () => {
    const { user } = useStore();

    if (!user) return null;

    const doctorLinks = [
        { to: '/doctor/dashboard', icon: <Home size={22} />, label: 'Dashboard' },
        { to: '/doctor/upload', icon: <UploadCloud size={22} />, label: 'Verify Image' },
        { to: '/doctor/history', icon: <History size={22} />, label: 'History' },
        { to: '/doctor/profile', icon: <UserIcon size={22} />, label: 'Profile' },
    ];

    const adminLinks = [
        { to: '/admin/dashboard', icon: <Home size={22} />, label: 'Overview' },
        { to: '/admin/users', icon: <Users size={22} />, label: 'Manage Users' },
        { to: '/admin/analytics', icon: <BarChart2 size={22} />, label: 'Analytics' },
        { to: '/admin/logs', icon: <FileText size={22} />, label: 'Audit Logs' },
    ];

    const links = user.role === 'admin' ? adminLinks : doctorLinks;

    return (
        <aside className="w-64 bg-card border-r border-border hidden md:flex flex-col h-[calc(100vh-4rem)] sticky top-16 shadow-sm transition-colors duration-300 z-40">
            <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4 mt-2 px-3">
                    Navigation
                </div>
                {links.map((link) => (
                    <NavLink
                        key={link.to}
                        to={link.to}
                        className={({ isActive }) =>
                            `flex items-center gap-3.5 px-3 py-3 rounded-xl transition-all duration-200 group relative ${isActive
                                ? 'bg-primary/10 text-primary font-semibold shadow-sm'
                                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                            }`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                {/* Active Indicator line */}
                                {isActive && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
                                )}
                                <div className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110 group-hover:text-primary'}`}>
                                    {link.icon}
                                </div>
                                <span className="tracking-wide">{link.label}</span>
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>
            <div className="p-4 border-t border-border mt-auto">
                <div className="bg-gradient-to-br from-primary/10 to-indigo-500/10 p-4 rounded-xl border border-primary/20 text-center">
                    <p className="text-xs font-semibold text-primary mb-1">MediVerify System</p>
                    <p className="text-[10px] text-muted-foreground">Version 1.0.0 Pro</p>
                </div>
            </div>
        </aside>
    );
};
