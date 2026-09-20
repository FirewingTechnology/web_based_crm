import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, isSuperAdminUser } from '../types/user';
import { authApi } from '../api/auth';

interface AuthContextType {
  user: User | null;
  token: string | null;
  role: UserRole | null;
  isSuperAdmin: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const clearAuthStorage = () => {
  localStorage.removeItem('brokeros_access_token');
  localStorage.removeItem('brokeros_refresh_token');
  localStorage.removeItem('realvion_access_token');
  localStorage.removeItem('realvion_refresh_token');
  localStorage.removeItem('brokeros_user');
  localStorage.removeItem('realvion_user');
  localStorage.removeItem('brokeros_is_demo');
  localStorage.removeItem('realvion_is_demo');
};

export const syncAuthStorage = (accessToken: string, refreshToken?: string, userData?: any) => {
  localStorage.setItem('brokeros_access_token', accessToken);
  localStorage.setItem('realvion_access_token', accessToken);
  if (refreshToken) {
    localStorage.setItem('brokeros_refresh_token', refreshToken);
    localStorage.setItem('realvion_refresh_token', refreshToken);
  }
  if (userData) {
    localStorage.setItem('brokeros_user', JSON.stringify(userData));
    localStorage.setItem('realvion_user', JSON.stringify(userData));
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('realvion_access_token') || localStorage.getItem('brokeros_access_token')
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('realvion_access_token') || localStorage.getItem('brokeros_access_token');
      if (storedToken) {
        try {
          const currentUser = await authApi.getMe(storedToken);
          syncAuthStorage(storedToken, undefined, currentUser);
          setUser(currentUser);
          setToken(storedToken);
        } catch (err) {
          clearAuthStorage();
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    // 1. Wipe ANY stale tokens and data before initiating new authentication
    clearAuthStorage();

    // 2. Perform fresh login request
    const data = await authApi.login(email, password);

    // 3. Immediately sync the fresh tokens to both localStorage keys
    syncAuthStorage(data.access_token, data.refresh_token);
    setToken(data.access_token);

    // 4. Fetch the authenticated user passing the exact access token (bypasses any possible stale interceptor state)
    const currentUser = await authApi.getMe(data.access_token);
    syncAuthStorage(data.access_token, data.refresh_token, currentUser);
    setUser(currentUser);
    return currentUser;
  };

  const logout = () => {
    clearAuthStorage();
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  };

  const isSuper = isSuperAdminUser(user, user?.role);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role: user?.role || null,
        isSuperAdmin: isSuper,
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

