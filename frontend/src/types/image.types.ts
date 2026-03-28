export interface ImageRecord {
    id: string;
    doctor_id: string;
    original_filename: string;
    image_url: string;
    result: 'genuine' | 'manipulated';
    confidence: number;
    heatmap_url: string;
    processing_time_ms: number;
    created_at: string;
}
