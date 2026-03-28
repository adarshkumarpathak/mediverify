import { create } from 'zustand';
import { User } from '../types/user.types';

interface AuthState {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    login: (user: User, token: string) => void;
    logout: () => void;
}

// We're using a simple mock implementation here before Supabase is fully wired
export const useStore = create<AuthState>((set) => ({
    user: null, // Initially null
    token: null,
    isLoading: false,
    login: (user, token) => set({ user, token }),
    logout: () => set({ user: null, token: null }),
}));
