import axios from 'axios';
import { User, LoginCredentials } from '../types/user.types';
import { ApiResponse } from '../types/api.types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const loginUser = async (credentials: LoginCredentials): Promise<ApiResponse<{ user: User, token: string }>> => {
    // This is a placeholder since Supabase auth is handled via its own client usually, 
    // but if we are routing it through FastAPI:
    const response = await axios.post(`${API_URL}/api/auth/login`, credentials);
    return response.data;
};

export const logoutUser = async (): Promise<ApiResponse<null>> => {
    const response = await axios.post(`${API_URL}/api/auth/logout`);
    return response.data;
};
