import { useState, useEffect } from 'react';
import { Search, DownloadCloud, AlertCircle, History as HistoryIcon, FileText } from 'lucide-react';
import { ResultBadge } from '../../components/ResultBadge';
import { getHistory, downloadReport } from '../../api/doctorApi';
import { useStore } from '../../context/AuthContext';
import { TableSkeleton } from '../../components/Skeleton';
import { ImageRecord } from '../../types/image.types';
import { motion } from 'framer-motion';

export default function History() {
    const { token } = useStore();
    const [history, setHistory] = useState<ImageRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchHistory = async () => {
            if (!token) return;
            setLoading(true);
            const response = await getHistory(token);
            if (response.success) {
                setHistory(response.data);
            } else {
                setError(response.message);
            }
            setLoading(false);
        };
        fetchHistory();
    }, [token]);

    const filteredHistory = history.filter(item =>
        item.original_filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDownload = async (recordId: string) => {
        if (!token) return;
        await downloadReport(token, recordId);
    };

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
                        <HistoryIcon className="text-primary" size={36} />
                        Verification <span className="text-gradient">History</span>
                    </h1>
                    <p className="text-muted-foreground mt-2 text-lg">Review your past image analysis reports.</p>
                </div>
            </div>

            {error && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="bg-rose-500/10 border border-rose-500/20 text-rose-500 px-5 py-4 rounded-2xl flex items-center gap-3"
                >
                    <AlertCircle size={20} /> <p className="font-medium">{error}</p>
                </motion.div>
            )}

            <div className="glass-panel rounded-[1.5rem] overflow-hidden shadow-xl shadow-primary/5">
                {/* Toolbar */}
                <div className="p-4 border-b border-border bg-muted/30 flex flex-wrap items-center justify-between gap-4">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                        <input
                            type="text"
                            placeholder="Search by filename or ID…"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm transition-all"
                        />
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold bg-gradient-to-r from-primary to-indigo-600 text-primary-foreground text-sm shadow-lg shadow-primary/20 hover:opacity-90 transition-all">
                        <DownloadCloud size={16} /> Export All
                    </button>
                </div>

                {/* Table */}
                {loading ? (
                    <TableSkeleton rows={7} cols={5} />
                ) : (
                    <div className="overflow-x-auto">
                        {filteredHistory.length === 0 ? (
                            <div className="py-20 flex flex-col items-center text-muted-foreground gap-4">
                                <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center">
                                    <FileText size={28} className="opacity-40" />
                                </div>
                                <p className="font-bold text-lg">No verification records found.</p>
                                <p className="text-sm opacity-60">Upload a scan to see your history here.</p>
                            </div>
                        ) : (
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b border-border">
                                        {['File Name', 'Date', 'Result', 'Confidence', 'Action'].map((h, i) => (
                                            <th key={h} className={`p-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ${i === 4 ? 'text-right' : ''}`}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {filteredHistory.map((item, i) => (
                                        <motion.tr
                                            key={item.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            className="hover:bg-muted/30 transition-colors group"
                                        >
                                            <td className="p-4">
                                                <p className="font-bold text-foreground truncate max-w-[200px]">{item.original_filename}</p>
                                                <p className="text-xs text-muted-foreground mt-0.5 font-mono">{item.id.substring(0, 12)}…</p>
                                            </td>
                                            <td className="p-4 text-muted-foreground">
                                                {new Date(item.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="p-4">
                                                <ResultBadge result={item.result} />
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-20 bg-muted rounded-full h-2 overflow-hidden border border-border">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${item.confidence}%` }}
                                                            transition={{ duration: 1, delay: i * 0.05 }}
                                                            className={`h-full rounded-full ${item.result === 'manipulated' ? 'bg-gradient-to-r from-rose-400 to-rose-600' : 'bg-gradient-to-r from-emerald-400 to-emerald-600'}`}
                                                        />
                                                    </div>
                                                    <span className="text-sm font-bold text-foreground">{item.confidence}%</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-right">
                                                <motion.button
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => handleDownload(item.id)}
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold px-4 py-2 rounded-xl bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20"
                                                >
                                                    Download
                                                </motion.button>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                        <div className="p-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground font-bold uppercase tracking-widest">
                            <span>{filteredHistory.length} result{filteredHistory.length !== 1 ? 's' : ''}</span>
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
