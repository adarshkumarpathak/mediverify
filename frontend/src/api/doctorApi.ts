import axios from 'axios'
import { ApiResponse } from '../types/api.types'
import { ImageRecord } from '../types/image.types'

// Mock for early development before backend is fully integrated
export type VerifyResponse = ApiResponse<{
    result: 'genuine' | 'manipulated';
    confidence: number;
    heatmap_url: string;
}>;

export const verifyImage = async (file: File): Promise<VerifyResponse> => {
    const formData = new FormData()
    formData.append('file', file)

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'

    try {
        const response = await axios.post(
            `${apiUrl}/api/verify`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer mock-token`
                }
            }
        )
        return response.data
    } catch (error) {
        return {
            success: false,
            data: { result: 'genuine', confidence: 0, heatmap_url: '' },
            message: 'Network error or backend issue',
            error: String(error)
        }
    }
}

export const getHistory = async (token: string, limit = 20, offset = 0): Promise<ApiResponse<ImageRecord[]>> => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
    try {
        const response = await axios.get(`${apiUrl}/api/history`, {
            params: { limit, offset },
            headers: { 'Authorization': `Bearer ${token}` }
        })
        return response.data
    } catch (error) {
        return { success: false, data: [], message: 'Failed to fetch history', error: String(error) }
    }
}

export const getRecord = async (token: string, recordId: string): Promise<ApiResponse<ImageRecord>> => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
    try {
        const response = await axios.get(`${apiUrl}/api/history/${recordId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        return response.data
    } catch (error) {
        return { success: false, data: null as any, message: 'Failed to fetch record', error: String(error) }
    }
}

export const deleteRecord = async (token: string, recordId: string): Promise<ApiResponse<null>> => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
    try {
        const response = await axios.delete(`${apiUrl}/api/history/${recordId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        return response.data
    } catch (error) {
        return { success: false, data: null, message: 'Failed to delete record', error: String(error) }
    }
}

export const downloadReport = async (token: string, recordId: string) => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
    try {
        const response = await axios.get(`${apiUrl}/api/report/${recordId}`, {
            headers: { 'Authorization': `Bearer ${token}` },
            responseType: 'blob'
        })

        // Create a link and trigger download
        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `MediVerify_Report_${recordId}.pdf`)
        document.body.appendChild(link)
        link.click()
        link.remove()
    } catch (error) {
        console.error('Failed to download report', error)
    }
}
