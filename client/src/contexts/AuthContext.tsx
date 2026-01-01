import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authApi, setToken, removeToken, User } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await authApi.getMe();
        setUser(response.user);
      } catch (error) {
        // Token is invalid, remove it
        removeToken();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Handle redirects based on user status (only redirect from incorrect status pages)
  useEffect(() => {
    if (!loading && user) {
      const currentPath = location.pathname;

      // Skip redirect logic for auth pages
      if (currentPath.startsWith('/login') || currentPath.startsWith('/signup')) {
        return;
      }

      // Redirect based on user status - only if on wrong status-specific pages
      switch (user.status) {
        case 'pending':
          // Only redirect if not on pending page and not on auth pages
          if (currentPath !== '/pending') {
            navigate('/pending', { replace: true });
          }
          break;
        case 'approved':
          // Don't redirect if already on any app page (dashboard, projects, tasks, etc.)
          if (currentPath === '/pending' || currentPath === '/blocked' || currentPath === '/') {
            navigate('/app/dashboard', { replace: true });
          }
          break;
        case 'rejected':
        case 'inactive':
          // Only redirect if not on blocked page
          if (currentPath !== '/blocked') {
            navigate('/blocked', { replace: true });
          }
          break;
      }
    }
  }, [user, loading, navigate, location.pathname]);

  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login(email, password);
      setToken(response.token);
      setUser(response.user);
    } catch (error: any) {
      throw error;
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    try {
      const response = await authApi.signup(name, email, password);
      setToken(response.token);
      setUser(response.user);
    } catch (error: any) {
      throw error;
    }
  };

  const logout = () => {
    removeToken();
    setUser(null);
    navigate('/login', { replace: true });
  };

  const refreshUser = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUser(null);
      return;
    }
    try {
      const response = await authApi.getMe();
      setUser(response.user);
    } catch (error) {
      removeToken();
      setUser(null);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    signup,
    logout,
    isAuthenticated: !!user,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

