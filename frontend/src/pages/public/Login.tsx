import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, HeartPulse, Stethoscope, Lock, ArrowRight, Activity } from 'lucide-react';
import { useStore } from '../../context/AuthContext';

const Login: React.FC = () => {
    const { login, user } = useStore();
    const navigate = useNavigate();

    if (user) {
        return <Navigate to={`/${user.role}/dashboard`} replace />;
    }

    const handleLogin = (role: 'doctor' | 'admin') => {
        const mockUser = role === 'doctor'
            ? { id: '1', email: 'doctor@example.com', role: 'doctor' as const, name: 'Dr. Smith' }
            : { id: '2', email: 'admin@example.com', role: 'admin' as const, name: 'Admin User' };

        login(mockUser, 'mock-token');
        navigate(`/${role}/dashboard`);
    };

    return (
        <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center overflow-hidden p-6 bg-background">
            {/* Background Decorative Elements */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/10 blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />

                {/* Animated Grid Pattern */}
                <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
                    style={{
                        backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
                        backgroundSize: '40px 40px'
                    }}
                />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="relative z-10 w-full max-w-lg"
            >
                <div className="text-center mb-10">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                        className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary/10 text-primary mb-6 shadow-2xl shadow-primary/20 backdrop-blur-md border border-primary/20"
                    >
                        <Shield size={40} />
                    </motion.div>
                    <motion.h2
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="text-4xl font-black text-foreground tracking-tight mb-3"
                    >
                        Welcome to <span className="text-gradient">MediVerify</span>
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="text-muted-foreground text-lg"
                    >
                        AI-Powered Medical Image Authentication
                    </motion.p>
                </div>

                <div className="glass-panel p-1 rounded-[2.5rem] shadow-2xl shadow-primary/5">
                    <div className="p-10 space-y-8">
                        <div>
                            <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                                <Lock size={20} className="text-primary" />
                                Secure Access
                            </h3>

                            <div className="grid gap-6">
                                <motion.button
                                    whileHover={{ scale: 1.02, y: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handleLogin('doctor')}
                                    className="group relative flex items-center justify-between p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all shadow-sm hover:shadow-xl hover:shadow-primary/5"
                                >
                                    <div className="flex items-center gap-5">
                                        <div className="w-14 h-14 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <Stethoscope size={28} />
                                        </div>
                                        <div className="text-left">
                                            <p className="font-bold text-lg text-foreground">Medical Professional</p>
                                            <p className="text-sm text-muted-foreground">Verification & Analysis</p>
                                        </div>
                                    </div>
                                    <ArrowRight size={20} className="text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                </motion.button>

                                <motion.button
                                    whileHover={{ scale: 1.02, y: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handleLogin('admin')}
                                    className="group relative flex items-center justify-between p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all shadow-sm hover:shadow-xl hover:shadow-primary/5"
                                >
                                    <div className="flex items-center gap-5">
                                        <div className="w-14 h-14 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <Shield size={28} />
                                        </div>
                                        <div className="text-left">
                                            <p className="font-bold text-lg text-foreground">System Administrator</p>
                                            <p className="text-sm text-muted-foreground">Management & Analytics</p>
                                        </div>
                                    </div>
                                    <ArrowRight size={20} className="text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                </motion.button>
                            </div>
                        </div>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-border"></div>
                            </div>
                            <div className="relative flex justify-center text-[10px] font-black uppercase tracking-[0.3em]">
                                <span className="px-4 bg-card rounded-full border border-border text-muted-foreground">Demo Version</span>
                            </div>
                        </div>

                        <div className="bg-muted/50 border border-border p-5 rounded-2xl flex gap-4">
                            <Activity className="shrink-0 text-primary animate-pulse" size={20} />
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                <strong>System Note:</strong> Multi-factor authentication is currently in sandbox mode. Select a role above to proceed to the secure dashboard.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex justify-center gap-6">
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-widest">
                        <HeartPulse size={14} className="text-rose-500" />
                        Patient Trust
                    </div>
                    <div className="w-1 h-1 rounded-full bg-border self-center" />
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-widest">
                        <Shield size={14} className="text-emerald-500" />
                        AI Verified
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
