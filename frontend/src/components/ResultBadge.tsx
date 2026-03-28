import { AlertCircle, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export const ResultBadge = ({ result }: { result: 'genuine' | 'manipulated' | string }) => {
    const isGenuine = result === 'genuine';

    return (
        <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-sm tracking-widest border shadow-lg ${isGenuine
                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-emerald-500/5'
                    : 'bg-rose-500/10 text-rose-500 border-rose-500/20 shadow-rose-500/5'
                }`}
        >
            {isGenuine ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            {isGenuine ? 'AUTHENTIC' : 'MANIPULATED'}
        </motion.div>
    );
};
