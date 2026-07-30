import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types/user';
import { authApi } from '../api/auth';

interface AuthContextType {
  user: User | null;
  token: string | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('brokeros_access_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const currentUser = await authApi.getMe();
          setUser(currentUser);
        } catch (err) {
          localStorage.removeItem('brokeros_access_token');
          localStorage.removeItem('brokeros_refresh_token');
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, [token]);

  const login = async (email: string, password: string): Promise<User> => {
    const data = await authApi.login(email, password);
    localStorage.setItem('brokeros_access_token', data.access_token);
    localStorage.setItem('brokeros_refresh_token', data.refresh_token);
    setToken(data.access_token);
    const currentUser = await authApi.getMe();
    setUser(currentUser);
    return currentUser;
  };

  const logout = () => {
    localStorage.removeItem('brokeros_access_token');
    localStorage.removeItem('brokeros_refresh_token');
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role: user?.role || null,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
