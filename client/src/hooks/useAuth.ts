import { useMutation } from '@tanstack/react-query';
import api from '../lib/api';
import { AuthResponse, LoginCredentials, RegisterData } from '../types';
import { useAuthStore } from '../store/authStore';
import { connectSocket } from '../lib/socket';

// Login
export const useLogin = () => {
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const { data } = await api.post<AuthResponse>('/auth/login', credentials);
      return data;
    },
    onSuccess: (data) => {
      setAuth(data.user, data.token);
      connectSocket();
    },
  });
};

// Register
export const useRegister = () => {
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: async (userData: RegisterData) => {
      const { data } = await api.post<AuthResponse>('/auth/register', userData);
      return data;
    },
    onSuccess: (data) => {
      setAuth(data.user, data.token);
      connectSocket();
    },
  });
};

// Logout (client-side only)
export const useLogout = () => {
  const logout = useAuthStore((state) => state.logout);

  return () => {
    logout();
    // Disconnect socket if needed
  };
};