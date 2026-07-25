import React from 'react';
import { AdminAuthContext, useAdminAuthState } from '../hooks/useAdminAuth';

interface AdminAuthProviderProps {
  children: React.ReactNode;
}

export const AdminAuthProvider: React.FC<AdminAuthProviderProps> = ({ children }) => {
  const authState = useAdminAuthState();

  return (
    <AdminAuthContext.Provider value={authState}>
      {children}
    </AdminAuthContext.Provider>
  );
};
