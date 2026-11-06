import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import api from '@/lib/api';
import type { User, Company, AuthState, Role } from '@/types';

type AuthContextType = {
  state: AuthState;
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  registerCompany: (data: {
    companyName: string;
    industry?: string;
    country?: string;
    timezone?: string;
    adminName: string;
    email: string;
    password: string;
  }) => Promise<{ success: boolean; error?: string; user?: User; company?: Company }>;
  joinCompany: (data: {
    companyCode: string;
    name: string;
    email: string;
    password: string;
    jobTitle?: string;
  }) => Promise<{ success: boolean; error?: string; user?: User; company?: Company }>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<{ success: boolean; error?: string }>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  hasRole: (roles: Role[]) => boolean;
  isPlatformOwner: () => boolean;
  isCompanyAdmin: () => boolean;
  isEmployee: () => boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    company: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Load saved session on mount
  useEffect(() => {
    const token = localStorage.getItem('tasksphere_token');
    const userStr = localStorage.getItem('tasksphere_user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as User;
        setState({
          user,
          token,
          company: null,
          isAuthenticated: true,
          isLoading: false,
        });
        // Fetch company info if user has one
        if (user.company_id) {
          fetchCompany(user.company_id);
        }
      } catch {
        setState({ user: null, token: null, company: null, isAuthenticated: false, isLoading: false });
      }
    } else {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  const fetchCompany = async (companyId: string) => {
    try {
      const res = await api.get(`/companies/my`);
      setState((prev) => ({ ...prev, company: res.data.company }));
    } catch {
      // ignore
    }
  };

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      const { token, user, company } = res.data;
      localStorage.setItem('tasksphere_token', token);
      localStorage.setItem('tasksphere_user', JSON.stringify(user));
      setState({ user, token, company: company || null, isAuthenticated: true, isLoading: false });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.response?.data?.error || 'Login gagal.' };
    }
  }, []);

  const registerCompany = useCallback(async (data) => {
    try {
      const res = await api.post('/auth/register-company', data);
      const { token, user, company } = res.data;
      localStorage.setItem('tasksphere_token', token);
      localStorage.setItem('tasksphere_user', JSON.stringify(user));
      setState({ user, token, company, isAuthenticated: true, isLoading: false });
      return { success: true, user, company };
    } catch (err: any) {
      return { success: false, error: err.response?.data?.error || 'Gagal membuat perusahaan.' };
    }
  }, []);

  const joinCompany = useCallback(async (data) => {
    try {
      const res = await api.post('/auth/join-company', data);
      const { token, user, company } = res.data;
      localStorage.setItem('tasksphere_token', token);
      localStorage.setItem('tasksphere_user', JSON.stringify(user));
      setState({ user, token, company, isAuthenticated: true, isLoading: false });
      return { success: true, user, company };
    } catch (err: any) {
      return { success: false, error: err.response?.data?.error || 'Gagal bergabung perusahaan.' };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('tasksphere_token');
    localStorage.removeItem('tasksphere_user');
    setState({ user: null, token: null, company: null, isAuthenticated: false, isLoading: false });
    window.location.href = '/login';
  }, []);

  const updateProfile = useCallback(async (data: Partial<User>) => {
    try {
      const res = await api.put('/auth/profile', data);
      const updated = res.data.user;
      localStorage.setItem('tasksphere_user', JSON.stringify(updated));
      setState((prev) => ({ ...prev, user: updated }));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.response?.data?.error || 'Gagal memperbarui profil.' };
    }
  }, []);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    try {
      await api.put('/auth/change-password', { currentPassword, newPassword });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.response?.data?.error || 'Gagal mengganti password.' };
    }
  }, []);

  const hasRole = useCallback((roles: Role[]) => {
    return state.user ? roles.includes(state.user.role) : false;
  }, [state.user]);

  const isPlatformOwner = useCallback(() => state.user?.role === 'PLATFORM_OWNER', [state.user]);
  const isCompanyAdmin = useCallback(() => state.user?.role === 'COMPANY_ADMIN', [state.user]);
  const isEmployee = useCallback(() => state.user?.role === 'EMPLOYEE', [state.user]);

  const value = {
    state: { ...state, unreadCount: state.unreadCount ?? 0 },
    user: state.user,
    login,
    registerCompany,
    joinCompany,
    logout,
    updateProfile,
    changePassword,
    hasRole,
    isPlatformOwner,
    isCompanyAdmin,
    isEmployee,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
