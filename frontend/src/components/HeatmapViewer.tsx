

interface Props {
    heatmapUrl?: string;
    originalUrl: string;
}

export const HeatmapViewer: React.FC<Props> = ({ heatmapUrl, originalUrl }) => {
    return (
        <div className="flex-1 min-h-[400px] bg-slate-900 rounded-xl overflow-hidden relative group">
            {/* Overlay text */}
            <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-sm font-medium z-10 flex gap-4">
                <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500" /> Original</span>
                <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500" /> Manipulation Heatmap</span>
            </div>

            {heatmapUrl ? (
                <img
                    src={heatmapUrl}
                    alt="Grad-CAM Heatmap"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                        // Fallback if heatmap fails to load
                        (e.target as HTMLImageElement).src = originalUrl;
                    }}
                />
            ) : (
                <img
                    src={originalUrl}
                    alt="Original Upload"
                    className="w-full h-full object-contain"
                />
            )}
        </div>
    );
};
