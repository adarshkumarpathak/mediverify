import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    UploadCloud, FileImage, X,
    RefreshCw, Check, ShieldCheck, Zap, Brain
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { verifyImage } from '../../api/doctorApi';
import { toast } from 'react-toastify';

const features = [
    { icon: Brain, label: 'Deep Neural Analysis', desc: 'EfficientNet-based model trained on 50k+ scans' },
    { icon: Zap, label: 'Results in Seconds', desc: 'Real-time inference with Grad-CAM heatmaps' },
    { icon: ShieldCheck, label: 'HIPAA Compliant', desc: 'Images are never stored without consent' },
];

export default function Upload() {
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        if (!selected) return;
        if (!['image/jpeg', 'image/png'].includes(selected.type)) {
            toast.error('Only JPEG and PNG files are supported.');
            return;
        }
        if (selected.size > 10 * 1024 * 1024) {
            toast.error('File size must be under 10 MB.');
            return;
        }
        setFile(selected);
        setPreviewUrl(URL.createObjectURL(selected));
    };

    const clearFile = () => {
        setFile(null);
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleVerify = async () => {
        if (!file) return;
        setIsUploading(true);
        try {
            const response = await verifyImage(file);
            if (response.success) {
                toast.success('Verification complete!');
                navigate('/doctor/result/latest', {
                    state: { result: response.data, fileUrl: previewUrl }
                });
            } else {
                toast.error(response.message || 'Verification failed.');
            }
        } catch {
            toast.error('An unexpected error occurred.');
        } finally {
            setIsUploading(false);
        }
    };

    const containerVariants = {
        hidden: {},
        visible: { transition: { staggerChildren: 0.12 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 24 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } }
    };

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="p-6 md:p-10 max-w-5xl mx-auto space-y-10"
        >
            {/* Header */}
            <motion.div variants={itemVariants}>
                <h1 className="text-4xl font-black text-foreground tracking-tight">
                    Verify <span className="text-gradient">Medical Image</span>
                </h1>
                <p className="text-muted-foreground mt-2 text-lg">
                    Select a scan below — our AI will analyze it in seconds.
                </p>
            </motion.div>

            {/* Feature pills */}
            <motion.div variants={itemVariants} className="flex flex-wrap gap-3">
                {features.map(({ icon: Icon, label }) => (
                    <span key={label} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest bg-primary/10 text-primary border border-primary/20">
                        <Icon size={13} />
                        {label}
                    </span>
                ))}
            </motion.div>

            {/* Upload Card */}
            <motion.div
                variants={itemVariants}
                className="glass-panel rounded-[2rem] overflow-hidden shadow-2xl shadow-primary/5"
            >
                <AnimatePresence mode="wait">
                    {!file ? (
                        /* ── Empty State ── */
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0, scale: 0.96 }}
                            transition={{ duration: 0.3 }}
                            className="p-12 flex flex-col items-center text-center gap-8"
                        >
                            {/* Pulsing icon ring */}
                            <div className="relative">
                                <motion.div
                                    animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.15, 0.3] }}
                                    transition={{ duration: 2.5, repeat: Infinity }}
                                    className="absolute inset-0 rounded-full bg-primary/20"
                                />
                                <motion.div
                                    animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0.25, 0.5] }}
                                    transition={{ duration: 2.5, repeat: Infinity, delay: 0.4 }}
                                    className="absolute -inset-4 rounded-full bg-primary/10"
                                />
                                <div className="relative w-24 h-24 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center">
                                    <UploadCloud size={40} className="text-primary" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h2 className="text-2xl font-black text-foreground">Select a Medical Scan</h2>
                                <p className="text-muted-foreground max-w-sm">
                                    Choose an X-ray, MRI, or CT scan from your device to begin AI-powered tamper detection.
                                </p>
                            </div>

                            {/* CTA button */}
                            <motion.button
                                whileHover={{ scale: 1.04, y: -2 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => fileInputRef.current?.click()}
                                className="relative flex items-center gap-3 bg-gradient-to-r from-primary to-indigo-600 text-primary-foreground px-10 py-4 rounded-2xl font-bold text-lg shadow-xl shadow-primary/25 overflow-hidden group"
                            >
                                <motion.div
                                    className="absolute inset-0 bg-white/15"
                                    initial={{ x: '-100%' }}
                                    whileHover={{ x: '100%' }}
                                    transition={{ duration: 0.5 }}
                                />
                                <FileImage size={22} className="relative z-10" />
                                <span className="relative z-10">Browse Files</span>
                            </motion.button>

                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">
                                JPEG · PNG &nbsp;·&nbsp; Max 10 MB
                            </p>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png"
                                className="hidden"
                                onChange={handleFileChange}
                            />
                        </motion.div>
                    ) : (
                        /* ── File Selected ── */
                        <motion.div
                            key="selected"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.4, ease: 'easeOut' }}
                            className="p-8 space-y-8"
                        >
                            {/* Preview */}
                            <div className="flex flex-col md:flex-row gap-8 items-start">
                                <motion.div
                                    initial={{ scale: 0.85, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ duration: 0.5, ease: 'easeOut' }}
                                    className="relative w-full md:w-64 h-48 md:h-64 rounded-2xl overflow-hidden border-2 border-primary/20 shadow-xl shadow-primary/10 flex-shrink-0 bg-black"
                                >
                                    <img src={previewUrl!} alt="Preview" className="w-full h-full object-contain" />
                                    {/* Scan-line animation */}
                                    <motion.div
                                        animate={{ top: ['0%', '100%', '0%'] }}
                                        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                                        className="absolute left-0 right-0 h-0.5 bg-primary/60 blur-[1px]"
                                        style={{ top: '0%' }}
                                    />
                                </motion.div>

                                <div className="flex-1 space-y-5">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="text-xl font-black text-foreground truncate max-w-xs">{file.name}</h3>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                {(file.size / (1024 * 1024)).toFixed(2)} MB &nbsp;·&nbsp; {file.type.split('/')[1].toUpperCase()}
                                            </p>
                                        </div>
                                        <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={clearFile}
                                            disabled={isUploading}
                                            className="p-2.5 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                                        >
                                            <X size={20} />
                                        </motion.button>
                                    </div>

                                    {/* Status indicator */}
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: '100%' }}
                                        transition={{ duration: 0.8 }}
                                        className="h-1 bg-gradient-to-r from-primary to-indigo-500 rounded-full"
                                    />

                                    <div className="flex flex-wrap gap-3 pt-1">
                                        {[
                                            { label: 'Format Validated', ok: true },
                                            { label: 'Size OK', ok: true },
                                            { label: 'Ready for AI', ok: true },
                                        ].map(({ label, ok }, i) => (
                                            <motion.span
                                                key={label}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.12 }}
                                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${ok ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-500'}`}
                                            >
                                                <Check size={11} />
                                                {label}
                                            </motion.span>
                                        ))}
                                    </div>

                                    {/* Info Box */}
                                    <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 px-4 py-3 rounded-2xl text-sm">
                                        <Brain size={16} className="shrink-0 text-primary" />
                                        <p className="text-primary/80 font-medium">
                                            Ensure all patient identifiers are removed before upload.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col sm:flex-row gap-4 justify-end pt-2 border-t border-border">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={clearFile}
                                    disabled={isUploading}
                                    className="px-6 py-3 rounded-2xl font-bold border border-border bg-card text-foreground hover:bg-muted transition-all"
                                >
                                    Choose Different File
                                </motion.button>

                                <motion.button
                                    whileHover={{ scale: 1.03, y: -2 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={handleVerify}
                                    disabled={isUploading}
                                    className="relative flex items-center justify-center gap-3 bg-gradient-to-r from-primary to-indigo-600 disabled:opacity-60 disabled:scale-100 text-primary-foreground px-10 py-4 rounded-2xl font-bold shadow-xl shadow-primary/20 overflow-hidden"
                                >
                                    <motion.div
                                        className="absolute inset-0 bg-white/10"
                                        initial={{ x: '-100%' }}
                                        whileHover={{ x: '100%' }}
                                        transition={{ duration: 0.5 }}
                                    />
                                    <AnimatePresence mode="wait">
                                        {isUploading ? (
                                            <motion.span
                                                key="loading"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="flex items-center gap-2 relative z-10"
                                            >
                                                <RefreshCw size={18} className="animate-spin" />
                                                Analyzing…
                                            </motion.span>
                                        ) : (
                                            <motion.span
                                                key="ready"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="flex items-center gap-2 relative z-10"
                                            >
                                                <Check size={18} />
                                                Run AI Verification
                                            </motion.span>
                                        )}
                                    </AnimatePresence>
                                </motion.button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Info cards */}
            <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {features.map(({ icon: Icon, label, desc }) => (
                    <motion.div
                        key={label}
                        variants={itemVariants}
                        whileHover={{ y: -4, transition: { duration: 0.2 } }}
                        className="glass-panel p-6 rounded-2xl space-y-3 cursor-default"
                    >
                        <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                            <Icon size={22} />
                        </div>
                        <p className="font-bold text-foreground">{label}</p>
                        <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                    </motion.div>
                ))}
            </motion.div>
        </motion.div>
    );
}
