import { useStore } from '../context/AuthContext';

export const useAuth = () => {
    // Zustand hook already provides what we need, wrapping it here for consistency
    // with the plan's hook structure.
    const store = useStore();
    return {
        user: store.user,
        token: store.token,
        isLoading: store.isLoading,
        login: store.login,
        logout: store.logout,
        isAuthenticated: !!store.user
    };
};
