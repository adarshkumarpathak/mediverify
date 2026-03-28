import axios from 'axios';
import { ApiResponse } from '../types/api.types';
import { User } from '../types/user.types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const fetchUsers = async (token: string): Promise<ApiResponse<User[]>> => {
    const response = await axios.get(`${API_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const fetchStats = async (token: string): Promise<ApiResponse<any>> => {
    const response = await axios.get(`${API_URL}/api/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const fetchLogs = async (token: string, limit: number = 100): Promise<ApiResponse<any[]>> => {
    const response = await axios.get(`${API_URL}/api/admin/logs?limit=${limit}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const createUser = async (token: string, userData: any): Promise<ApiResponse<User>> => {
    const response = await axios.post(`${API_URL}/api/admin/users`, userData, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const updateUser = async (token: string, userId: string, updates: any): Promise<ApiResponse<User>> => {
    const response = await axios.put(`${API_URL}/api/admin/users/${userId}`, updates, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const deleteUser = async (token: string, userId: string): Promise<ApiResponse<null>> => {
    const response = await axios.delete(`${API_URL}/api/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};
