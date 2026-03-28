import { useState } from 'react';
import { verifyImage } from '../api/doctorApi';
import { VerifyResponse } from '../api/doctorApi';

export const useVerify = () => {
    const [isVerifying, setIsVerifying] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const verify = async (file: File): Promise<VerifyResponse | null> => {
        setIsVerifying(true);
        setError(null);
        try {
            const response = await verifyImage(file);
            return response;
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || err.message || 'Verification failed';
            setError(errorMsg);
            return null;
        } finally {
            setIsVerifying(false);
        }
    };

    return {
        verify,
        isVerifying,
        error
    };
};
