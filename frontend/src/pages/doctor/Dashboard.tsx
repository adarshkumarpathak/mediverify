import { useStore } from '../../context/AuthContext';
import { UploadCloud, FileText, CheckCircle, BarChart2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function DoctorDashboard() {
    const { user } = useStore();

    const stats = [
        { label: 'Scans Verified', value: '42', icon: <FileText className="text-blue-500" size={24} />, color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
        { label: 'Authentic', value: '38', icon: <CheckCircle className="text-emerald-500" size={24} />, color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
        { label: 'Manipulated', value: '4', icon: <BarChart2 className="text-rose-500" size={24} />, color: 'bg-rose-500/10 text-rose-500 border-rose-500/20' },
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
    };

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="p-6 md:p-8 max-w-7xl mx-auto space-y-8"
        >
            <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-card/60 backdrop-blur-md p-8 rounded-3xl border border-white/20 dark:border-white/5 shadow-xl shadow-primary/5">
                <div>
                    <h1 className="text-3xl font-extrabold text-foreground tracking-tight mb-2">
                        Welcome back, <span className="text-gradient">{user?.name || 'Doctor'}</span>
                    </h1>
                    <p className="text-muted-foreground text-lg">Here's your verification activity overview.</p>
                </div>
                <Link
                    to="/doctor/upload"
                    className="group relative flex items-center gap-2 bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 text-primary-foreground px-6 py-3 rounded-full shadow-lg shadow-primary/25 transition-all font-semibold overflow-hidden"
                >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
                    <UploadCloud size={20} className="relative z-10" />
                    <span className="relative z-10">New Verification</span>
                    <ArrowRight size={18} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                </Link>
            </motion.div>

            <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, i) => (
                    <motion.div key={i} variants={itemVariants} className="glass-card p-6 flex items-center gap-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5 cursor-default group">
                        <div className={`p-4 rounded-2xl border ${stat.color} transition-transform group-hover:scale-110 duration-300`}>
                            {stat.icon}
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-1">{stat.label}</p>
                            <h3 className="text-4xl font-black text-foreground tracking-tight">{stat.value}</h3>
                        </div>
                    </motion.div>
                ))}
            </motion.div>

            <motion.div variants={itemVariants} className="glass-card p-0 overflow-hidden">
                <div className="p-6 border-b border-border bg-muted/30">
                    <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                        <History size={20} className="text-primary" /> Recent Activity
                    </h2>
                </div>
                <div className="text-center py-16 text-muted-foreground">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText size={24} className="text-muted-foreground/50" />
                    </div>
                    <p className="font-medium">No recent verifications to show.</p>
                    <p className="text-sm mt-1 opacity-70">Upload a scan to get started.</p>
                </div>
            </motion.div>
        </motion.div>
    );
}

// Temporary import fix for the History icon above
import { History } from 'lucide-react';
