import React from 'react';
import { motion } from 'framer-motion';

interface Props {
    confidence: number;
    isManipulated: boolean;
}

export const ConfidenceMeter: React.FC<Props> = ({ confidence, isManipulated }) => {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`text-5xl font-black tracking-tighter ${isManipulated ? 'text-rose-500' : 'text-emerald-500'}`}
                >
                    {confidence.toFixed(1)}%
                </motion.span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] bg-muted px-2 py-1 rounded">
                    Match Confidence
                </span>
            </div>

            <div className="relative h-4 w-full bg-muted rounded-full overflow-hidden shadow-inner border border-white/5">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${confidence}%` }}
                    transition={{ duration: 1.5, ease: "circOut" }}
                    className={`h-full rounded-full relative ${isManipulated
                            ? 'bg-gradient-to-r from-rose-400 to-rose-600'
                            : 'bg-gradient-to-r from-emerald-400 to-emerald-600'
                        }`}
                >
                    <div className="absolute inset-0 bg-white/20 animate-pulse" />
                </motion.div>
            </div>
        </div>
    );
};
