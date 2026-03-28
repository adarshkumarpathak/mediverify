import { useStore } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { LogOut, User as UserIcon, Moon, Sun } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Navbar = () => {
    const { user, logout } = useStore();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <header className="bg-card/80 backdrop-blur-lg border-b border-border sticky top-0 z-50 transition-colors duration-300 shadow-sm">
            <div className="flex h-16 items-center px-4 md:px-8 justify-between max-w-7xl mx-auto">
                <div className="flex items-center gap-3 font-extrabold text-2xl tracking-tight text-gradient select-none">
                    <span className="text-3xl drop-shadow-sm">🏥</span> MediVerify
                </div>

                <div className="flex items-center gap-3 md:gap-6">
                    <button
                        onClick={toggleTheme}
                        className="p-2.5 text-muted-foreground hover:text-foreground hover:bg-muted bg-transparent rounded-full transition-all duration-300 focus:outline-none"
                        title="Toggle dark mode"
                    >
                        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                    </button>

                    {user && (
                        <div className="flex items-center gap-4 border-l border-border pl-4 md:pl-6">
                            <div className="hidden md:flex flex-col items-end">
                                <span className="text-sm font-semibold text-foreground">{user.name || user.email}</span>
                                <span className="text-xs font-medium text-muted-foreground capitalize bg-muted px-2 py-0.5 rounded-full mt-1">{user.role}</span>
                            </div>
                            <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center text-primary border border-primary/20 shadow-inner">
                                <UserIcon size={20} />
                            </div>
                            <button
                                onClick={handleLogout}
                                className="p-2.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all duration-200"
                                title="Log out"
                            >
                                <LogOut size={20} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};
