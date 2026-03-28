import { useState, useEffect } from 'react';
import { Users, Activity, ShieldAlert, Cpu, TrendingUp, Zap } from 'lucide-react';
import axios from 'axios';
import { useStore } from '../../context/AuthContext';
import { motion } from 'framer-motion';

const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } }
};

export default function AdminDashboard() {
    const { token } = useStore();
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
                const response = await axios.get(`${apiUrl}/api/admin/stats`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (response.data.success) setStats(response.data.data);
            } catch (e) { /* Backend may be offline in dev */ }
        };
        fetchStats();
    }, [token]);

    const cards = [
        { label: 'Total Verifications', value: stats?.total_verifications ?? '—', icon: Activity, color: 'text-blue-500', bg: 'bg-blue-500/10 border-blue-500/20', trend: '+12%' },
        { label: 'Manipulated Found', value: stats?.manipulated_detected ?? '—', icon: ShieldAlert, color: 'text-rose-500', bg: 'bg-rose-500/10 border-rose-500/20', trend: '+3%' },
        { label: 'Active Doctors', value: stats?.active_doctors ?? '—', icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/20', trend: '+2' },
        { label: 'Avg Accuracy', value: stats ? `${stats.avg_accuracy}%` : '94.5%', icon: Cpu, color: 'text-violet-500', bg: 'bg-violet-500/10 border-violet-500/20', trend: 'Stable' },
    ];

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="p-6 md:p-10 max-w-7xl mx-auto space-y-8"
        >
            {/* Header */}
            <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-black text-foreground tracking-tight">
                        Admin <span className="text-gradient">Overview</span>
                    </h1>
                    <p className="text-muted-foreground mt-2 text-lg">System-wide statistics and health.</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-500 text-sm font-bold">
                    <Zap size={14} className="animate-pulse" />
                    System Online
                </div>
            </motion.div>

            {/* Stat Cards */}
            <motion.div variants={containerVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {cards.map(({ label, value, icon: Icon, color, bg, trend }) => (
                    <motion.div
                        key={label}
                        variants={itemVariants}
                        whileHover={{ y: -4, transition: { duration: 0.2 } }}
                        className="glass-panel p-6 rounded-[1.5rem] flex flex-col gap-4 cursor-default shadow-lg"
                    >
                        <div className="flex items-start justify-between">
                            <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${bg}`}>
                                <Icon size={22} className={color} />
                            </div>
                            <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <TrendingUp size={10} /> {trend}
                            </span>
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">{label}</p>
                            <motion.h3
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.3, type: 'spring' }}
                                className="text-4xl font-black text-foreground tracking-tight mt-1"
                            >
                                {value}
                            </motion.h3>
                        </div>
                    </motion.div>
                ))}
            </motion.div>

            {/* Placeholder Panels */}
            <motion.div variants={containerVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <motion.div variants={itemVariants} className="glass-panel p-8 rounded-[1.5rem] h-80 flex flex-col items-center justify-center gap-4 border-2 border-dashed border-border">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                        <Activity size={22} />
                    </div>
                    <p className="font-bold text-foreground">Analytics Chart</p>
                    <p className="text-sm text-muted-foreground text-center">Recharts area chart will render here once backend is connected.</p>
                </motion.div>
                <motion.div variants={itemVariants} className="glass-panel p-8 rounded-[1.5rem] h-80 flex flex-col items-center justify-center gap-4 border-2 border-dashed border-border">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                        <ShieldAlert size={22} />
                    </div>
                    <p className="font-bold text-foreground">Recent Audit Logs</p>
                    <p className="text-sm text-muted-foreground text-center">Latest system events will appear here.</p>
                </motion.div>
            </motion.div>
        </motion.div>
    );
}
