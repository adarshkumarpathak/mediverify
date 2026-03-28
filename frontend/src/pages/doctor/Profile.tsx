import { useStore } from '../../context/AuthContext';
import { User as UserIcon, Mail, Shield, Key, Bell, LogOut, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4, ease: 'easeOut' as const } }),
};

export default function Profile() {
    const { user } = useStore();

    const info = [
        { icon: UserIcon, label: 'Full Name', value: user?.name || 'Dr. Jane Doe' },
        { icon: Mail, label: 'Email Address', value: user?.email || 'jane@hospital.com' },
        { icon: Shield, label: 'System Role', value: user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Doctor' },
    ];

    const actions = [
        { icon: Key, label: 'Change Password', desc: 'Update your login credentials' },
        { icon: Bell, label: 'Notifications', desc: 'Manage email and push alerts' },
        { icon: LogOut, label: 'Sign Out', desc: 'Log out of this device', danger: true },
    ];

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            className="p-6 md:p-10 max-w-4xl mx-auto space-y-8"
        >
            {/* Header */}
            <motion.div custom={0} variants={itemVariants}>
                <h1 className="text-4xl font-black text-foreground tracking-tight">
                    My <span className="text-gradient">Profile</span>
                </h1>
                <p className="text-muted-foreground mt-2 text-lg">Manage your account settings and preferences.</p>
            </motion.div>

            {/* Avatar + Info Card */}
            <motion.div custom={1} variants={itemVariants} className="glass-panel p-8 rounded-[2rem] shadow-xl shadow-primary/5">
                <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                            className="w-28 h-28 rounded-3xl bg-gradient-to-br from-primary/30 to-indigo-500/30 border-2 border-primary/20 flex items-center justify-center shadow-xl shadow-primary/10"
                        >
                            <span className="text-4xl font-black text-primary">
                                {(user?.name?.[0] || 'D').toUpperCase()}
                            </span>
                        </motion.div>
                        <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full border-4 border-card flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full" />
                        </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
                        {info.map(({ icon: Icon, label, value }, i) => (
                            <motion.div
                                key={label}
                                custom={i + 2}
                                variants={itemVariants}
                                className="space-y-1.5 p-4 rounded-2xl bg-muted/40 border border-border hover:border-primary/30 transition-colors"
                            >
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                    <Icon size={13} /> {label}
                                </label>
                                <p className="text-base font-bold text-foreground">{value}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </motion.div>

            {/* Actions */}
            <motion.div custom={5} variants={itemVariants} className="glass-panel rounded-[2rem] overflow-hidden shadow-xl shadow-primary/5 divide-y divide-border">
                {actions.map(({ icon: Icon, label, desc, danger }, i) => (
                    <motion.button
                        key={label}
                        custom={i + 6}
                        variants={itemVariants}
                        whileHover={{ x: 4 }}
                        className={`w-full flex items-center gap-5 p-6 text-left transition-colors hover:bg-muted/30 ${danger ? 'hover:bg-destructive/5' : ''}`}
                    >
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${danger ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
                            <Icon size={20} />
                        </div>
                        <div className="flex-1">
                            <p className={`font-bold ${danger ? 'text-destructive' : 'text-foreground'}`}>{label}</p>
                            <p className="text-sm text-muted-foreground">{desc}</p>
                        </div>
                        <ChevronRight size={18} className="text-muted-foreground" />
                    </motion.button>
                ))}
            </motion.div>
        </motion.div>
    );
}
