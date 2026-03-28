import { motion } from 'framer-motion';

interface SkeletonProps {
    className?: string;
}

/** A single animated shimmer block */
export const Skeleton = ({ className = '' }: SkeletonProps) => (
    <div className={`relative overflow-hidden rounded-xl bg-muted ${className}`}>
        <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/5 to-transparent"
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
        />
    </div>
);

/** Skeleton for a table row */
export const SkeletonRow = ({ cols = 5 }: { cols?: number }) => (
    <tr className="border-b border-border">
        {Array.from({ length: cols }).map((_, i) => (
            <td key={i} className="p-4">
                <Skeleton className={`h-4 ${i === 0 ? 'w-40' : i === cols - 1 ? 'w-20' : 'w-24'}`} />
                {i === 0 && <Skeleton className="h-3 w-24 mt-2" />}
            </td>
        ))}
    </tr>
);

/** Skeleton for a stat card */
export const SkeletonCard = () => (
    <div className="glass-panel p-6 rounded-[1.5rem] flex flex-col gap-4">
        <div className="flex items-start justify-between">
            <Skeleton className="w-12 h-12 rounded-2xl" />
            <Skeleton className="w-14 h-5 rounded-full" />
        </div>
        <div className="space-y-2">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-10 w-20" />
        </div>
    </div>
);

/** Full-page table skeleton */
export const TableSkeleton = ({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) => (
    <table className="w-full text-left">
        <thead>
            <tr className="border-b border-border">
                {Array.from({ length: cols }).map((_, i) => (
                    <th key={i} className="p-4">
                        <Skeleton className="h-3 w-20" />
                    </th>
                ))}
            </tr>
        </thead>
        <tbody>
            {Array.from({ length: rows }).map((_, i) => (
                <SkeletonRow key={i} cols={cols} />
            ))}
        </tbody>
    </table>
);
