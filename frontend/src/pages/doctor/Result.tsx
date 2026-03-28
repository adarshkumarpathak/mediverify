import { useLocation, Navigate, Link } from 'react-router-dom';
import { ArrowLeft, Download, AlertTriangle, FileText, Share2, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { HeatmapViewer } from '../../components/HeatmapViewer';
import { useStore } from '../../context/AuthContext';
import { downloadReport } from '../../api/doctorApi';

interface VerificationResult {
    id: string;
    result: "authentic" | "suspicious" | "manipulated";
    tf_confidence: number;
    fft_confidence: number;
    combined_score: number;
    heatmap_url: string;
    processing_time_ms: number;
}

const VERDICT_STYLES = {
    authentic: { bg: "bg-green-100", text: "text-green-800", border: "border-green-300", label: "✅ Authentic" },
    suspicious: { bg: "bg-yellow-100", text: "text-yellow-800", border: "border-yellow-300", label: "⚠️ Suspicious" },
    manipulated: { bg: "bg-red-100", text: "text-red-800", border: "border-red-300", label: "🚨 Manipulated" },
};

const ConfidenceBar = ({ label, value, description }: { label: string; value: number; description: string }) => (
    <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
            <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{(value || 0).toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div
                className={`h-2.5 rounded-full transition-all duration-700 ${value > 50 ? "bg-red-500" : "bg-green-500"
                    }`}
                style={{ width: `${Math.min(value || 0, 100)}%` }}
            />
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{description}</p>
    </div>
);

export default function Result() {
    const { token } = useStore();
    const location = useLocation();
    const state = location.state as {
        result: VerificationResult,
        fileUrl: string
    } | null;

    if (!state || !state.result) {
        return <Navigate to="/doctor/upload" replace />;
    }

    const { id, result: verdict, tf_confidence, fft_confidence, combined_score, heatmap_url, processing_time_ms } = state.result;
    const isManipulated = verdict === 'manipulated' || verdict === 'suspicious';

    const handleDownload = async () => {
        if (!token || !id) return;
        await downloadReport(token, id);
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.15 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                type: "spring" as const,
                stiffness: 300,
                damping: 24
            }
        }
    };

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="p-6 md:p-10 max-w-7xl mx-auto space-y-8"
        >
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-between gap-6">
                <Link
                    to="/doctor/upload"
                    className="group flex items-center gap-3 text-muted-foreground hover:text-foreground transition-all px-4 py-2 rounded-xl bg-card border border-border shadow-sm"
                >
                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="font-semibold">New Verification</span>
                </Link>

                <div className="flex items-center gap-3">
                    <button className="p-2.5 bg-card border border-border rounded-xl text-muted-foreground hover:text-foreground transition-all shadow-sm">
                        <Share2 size={18} />
                    </button>
                    <button
                        onClick={handleDownload}
                        className="flex items-center gap-2 bg-foreground text-background dark:bg-primary dark:text-primary-foreground px-6 py-2.5 rounded-xl font-bold hover:opacity-90 transition-all shadow-lg active:scale-95"
                    >
                        <Download size={18} />
                        Export PDF Analysis
                    </button>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Side Panel: Analysis Summary */}
                <motion.div variants={itemVariants} className="lg:col-span-4 space-y-6">
                    <div className="glass-panel p-8 rounded-[2rem] relative overflow-hidden flex flex-col h-full shadow-2xl shadow-primary/5">
                        <div className="relative z-10 flex flex-col h-full">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-xl font-black text-foreground tracking-tight flex items-center gap-2">
                                    <FileText className="text-primary" size={24} /> Analysis Summary
                                </h2>
                                <Info size={18} className="text-muted-foreground cursor-help" />
                            </div>

                            <div className="space-y-10 flex-1">
                                <div className={`p-4 rounded-lg border-2 ${VERDICT_STYLES[verdict].bg} ${VERDICT_STYLES[verdict].border}`}>
                                    <h2 className={`text-2xl font-bold ${VERDICT_STYLES[verdict].text}`}>
                                        {VERDICT_STYLES[verdict].label}
                                    </h2>
                                    <p className={`text-sm mt-1 ${VERDICT_STYLES[verdict].text}`}>
                                        Combined Score: {(combined_score || 0).toFixed(1)}%
                                    </p>
                                </div>

                                <div className="mt-6">
                                    <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-3">
                                        Model Analysis
                                    </h3>
                                    <ConfidenceBar
                                        label="CNN Model (Visual Tampering)"
                                        value={tf_confidence}
                                        description="EfficientNetB0 — detects copy-move, brightness tampering, noise injection"
                                    />
                                    <ConfidenceBar
                                        label="FFT Model (Frequency Fingerprint)"
                                        value={fft_confidence}
                                        description="Frequency analysis — detects AI-generated images and GAN artifacts"
                                    />
                                </div>

                                <p className="text-xs text-gray-400 mt-4">
                                    Processed in {processing_time_ms || 0}ms
                                </p>

                                <AnimatePresence>
                                    {isManipulated && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            className="bg-rose-500/10 border border-rose-500/20 p-5 rounded-2xl flex gap-4"
                                        >
                                            <AlertTriangle className="shrink-0 text-rose-500 mt-1" size={22} />
                                            <div className="space-y-1">
                                                <p className="text-sm font-bold text-rose-600 dark:text-rose-400">Potential Manipulation Found</p>
                                                <p className="text-xs leading-relaxed text-rose-500/80">
                                                    Our AI detected localized editing signatures. Review the primary activation zones in the heatmap before diagnosis.
                                                </p>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <div className="mt-8 pt-8 border-t border-border/50 text-center">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Verification ID</p>
                                <code className="text-xs font-mono bg-muted px-3 py-1.5 rounded-lg mt-2 inline-block border border-border">
                                    {id.substring(0, 16)}...
                                </code>
                            </div>
                        </div>

                        {/* Background dynamic light */}
                        <motion.div
                            animate={{
                                scale: [1, 1.2, 1],
                                opacity: [0.1, 0.2, 0.1]
                            }}
                            transition={{ duration: 10, repeat: Infinity }}
                            className={`absolute -bottom-24 -right-24 w-64 h-64 rounded-full blur-[100px] pointer-events-none ${isManipulated ? 'bg-rose-500' : 'bg-emerald-500'
                                }`}
                        />
                    </div>
                </motion.div>

                {/* Main Panel: Visual Evidence */}
                <motion.div variants={itemVariants} className="lg:col-span-8 flex flex-col gap-6">
                    <div className="glass-panel p-8 rounded-[2rem] flex flex-col h-full shadow-2xl shadow-primary/5">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-xl font-black text-foreground tracking-tight flex items-center gap-2">
                                <span className="text-primary">01</span> Visual Evidence
                            </h2>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] bg-muted px-3 py-1.5 rounded-full border border-border">
                                    Grad-CAM Activation
                                </span>
                            </div>
                        </div>

                        <div className="flex-1 bg-black rounded-2xl overflow-hidden shadow-inner border border-white/5 min-h-[500px]">
                            <HeatmapViewer heatmapUrl={heatmap_url} originalUrl={state.fileUrl} />
                        </div>

                        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
                            <div className="space-y-2">
                                <h4 className="font-bold text-foreground">Understanding the Map</h4>
                                <p className="text-muted-foreground leading-relaxed italic">
                                    Warmer regions (red/yellow) highlight pixels that the model found most influential in reaching its decision.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <h4 className="font-bold text-foreground">Methodology</h4>
                                <p className="text-muted-foreground leading-relaxed">
                                    Scalpel-Net analyzes frequency artifacts and local noise patterns to distinguish genuine tissue from artificial overlays.
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
}
