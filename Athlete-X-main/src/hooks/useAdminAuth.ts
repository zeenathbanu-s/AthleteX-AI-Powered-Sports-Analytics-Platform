import { useState, useEffect, createContext, useContext } from 'react';
import adminAuthService from '../services/adminAuthService';

interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: 'admin';
}

interface AdminAuthContextType {
  admin: AdminUser | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export const AdminAuthContext = createContext<AdminAuthContextType | null>(null);

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }
  return context;
};

export const useAdminAuthState = () => {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize admin auth state
    const initializeAuth = () => {
      try {
        const currentAdmin = adminAuthService.initialize();
        setAdmin(currentAdmin);
      } catch (error) {
        console.error('Error initializing admin auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (username: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      const adminUser = await adminAuthService.login({ username, password });
      setAdmin(adminUser);
    } catch (error) {
      setAdmin(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    adminAuthService.logout();
    setAdmin(null);
  };

  return {
    admin,
    login,
    logout,
    isLoading,
    isAuthenticated: !!admin,
  };
};
