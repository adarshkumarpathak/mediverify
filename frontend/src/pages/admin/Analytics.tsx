import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { BarChart2, TrendingUp } from 'lucide-react';

const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.12 } }
};
const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } }
};

const data = [
    { name: 'Mon', verifications: 12, manipulated: 2 },
    { name: 'Tue', verifications: 19, manipulated: 4 },
    { name: 'Wed', verifications: 15, manipulated: 1 },
    { name: 'Thu', verifications: 28, manipulated: 6 },
    { name: 'Fri', verifications: 22, manipulated: 3 },
    { name: 'Sat', verifications: 10, manipulated: 0 },
    { name: 'Sun', verifications: 8, manipulated: 1 },
];

const metrics = [
    { label: 'Accuracy', value: 94.5, color: 'from-primary to-indigo-500' },
    { label: 'Recall (Manipulated)', value: 96.2, color: 'from-emerald-400 to-emerald-600' },
    { label: 'Precision', value: 91.8, color: 'from-violet-400 to-violet-600' },
    { label: 'F1 Score', value: 93.0, color: 'from-sky-400 to-sky-600' },
];

export default function Analytics() {
    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="p-6 md:p-10 max-w-7xl mx-auto space-y-8"
        >
            <motion.div variants={itemVariants}>
                <h1 className="text-4xl font-black text-foreground tracking-tight">
                    Analytics <span className="text-gradient">&amp; Insights</span>
                </h1>
                <p className="text-muted-foreground mt-2 text-lg">Verification trends and model accuracy metrics.</p>
            </motion.div>

            <motion.div variants={containerVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Chart */}
                <motion.div variants={itemVariants} className="lg:col-span-2 glass-panel p-8 rounded-[1.5rem] flex flex-col shadow-xl shadow-primary/5">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-black text-foreground flex items-center gap-2">
                            <BarChart2 className="text-primary" size={22} /> Weekly Volume
                        </h2>
                        <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full border border-primary/20">Last 7 Days</span>
                    </div>
                    <div className="flex-1 w-full min-h-0 h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorVerifications" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorManipulated" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: '16px',
                                        border: '1px solid hsl(var(--border))',
                                        background: 'hsl(var(--card))',
                                        color: 'hsl(var(--foreground))',
                                        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'
                                    }}
                                />
                                <Area type="monotone" dataKey="verifications" name="Total Verifications" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorVerifications)" />
                                <Area type="monotone" dataKey="manipulated" name="Manipulated" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorManipulated)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Model Metrics */}
                <motion.div variants={itemVariants} className="glass-panel p-8 rounded-[1.5rem] flex flex-col space-y-6 shadow-xl shadow-primary/5">
                    <h2 className="text-xl font-black text-foreground flex items-center gap-2">
                        <TrendingUp className="text-primary" size={22} /> Model Performance
                    </h2>
                    <div className="space-y-6 flex-1">
                        {metrics.map(({ label, value, color }, i) => (
                            <div key={label} className="space-y-2">
                                <div className="flex justify-between text-sm font-bold">
                                    <span className="text-muted-foreground">{label}</span>
                                    <span className="text-foreground">{value}%</span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${value}%` }}
                                        transition={{ duration: 1.2, delay: i * 0.15, ease: 'easeOut' }}
                                        className={`h-full rounded-full bg-gradient-to-r ${color}`}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="bg-primary/5 border border-primary/20 p-4 rounded-2xl">
                        <p className="text-sm text-primary/80 font-medium leading-relaxed italic">
                            "Recall is prioritized to minimize missed manipulations in clinical settings."
                        </p>
                    </div>
                </motion.div>
            </motion.div>
        </motion.div>
    );
}
