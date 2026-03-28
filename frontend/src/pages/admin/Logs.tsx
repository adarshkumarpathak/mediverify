import { useState, useEffect } from 'react';
import axios from 'axios';
import { useStore } from '../../context/AuthContext';
import { TableSkeleton } from '../../components/Skeleton';
import { Clock, Download, Filter, Terminal } from 'lucide-react';
import { motion } from 'framer-motion';

const actionColors: Record<string, string> = {
    login: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    logout: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
    verify: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    create_user: 'bg-violet-500/10 text-violet-500 border-violet-500/20',
    delete_user: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
};

export default function Logs() {
    const { token } = useStore();
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
                const response = await axios.get(`${apiUrl}/api/admin/logs?limit=100`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (response.data.success) setLogs(response.data.data);
            } catch { /* Backend may be offline */ }
            finally { setLoading(false); }
        };
        fetchLogs();
    }, [token]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="p-6 md:p-10 max-w-7xl mx-auto space-y-8"
        >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-black text-foreground tracking-tight flex items-center gap-3">
                        <Terminal className="text-primary" size={36} />
                        Audit <span className="text-gradient">Logs</span>
                    </h1>
                    <p className="text-muted-foreground mt-2 text-lg">Immutable record of all system events.</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold border border-border bg-card text-foreground hover:bg-muted transition-all text-sm">
                        <Filter size={16} /> Filter
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold bg-gradient-to-r from-primary to-indigo-600 text-primary-foreground shadow-lg shadow-primary/20 text-sm hover:opacity-90 transition-all">
                        <Download size={16} /> Export CSV
                    </button>
                </div>
            </div>

            <div className="glass-panel rounded-[1.5rem] overflow-hidden shadow-xl shadow-primary/5">
                <div className="p-4 border-b border-border bg-muted/30 flex items-center gap-4 text-sm font-bold text-muted-foreground">
                    <Clock size={15} /> Live feed · auto-refresh every 30s
                </div>

                {loading ? (
                    <TableSkeleton rows={8} cols={5} />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-border">
                                    {['Timestamp', 'Action', 'User', 'IP Address', 'Details'].map(h => (
                                        <th key={h} className="p-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border font-mono text-xs">
                                {logs.map((log, i) => (
                                    <motion.tr
                                        key={i}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.03 }}
                                        className="hover:bg-muted/30 transition-colors"
                                    >
                                        <td className="p-4 text-muted-foreground">
                                            {new Date(log.timestamp).toLocaleString()}
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${actionColors[log.action] || 'bg-muted text-muted-foreground border-border'}`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="p-4 text-foreground">{log.user_id || 'unauthenticated'}</td>
                                        <td className="p-4 text-muted-foreground">{log.ip_address || '—'}</td>
                                        <td className="p-4 text-muted-foreground max-w-xs truncate" title={JSON.stringify(log.details)}>
                                            {JSON.stringify(log.details)}
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                        {logs.length === 0 && (
                            <div className="text-center py-16 text-muted-foreground">
                                <Terminal size={32} className="mx-auto mb-3 opacity-30" />
                                <p className="font-bold">No logs found.</p>
                                <p className="text-sm mt-1 opacity-60">Events will appear here once the backend is online.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </motion.div>
    );
}
