import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useMsal } from '@azure/msal-react';
import api from '../services/api';
import { isEntraConfigured, loginRequest } from '../auth/msal';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  /** Real Microsoft Entra ID popup login (falls back to dev exchange when Entra is not configured). */
  loginWithMicrosoft: () => Promise<void>;
  /** DEV ONLY: unverified custom-identity login, usable only while Entra ID is not configured. */
  loginWithMockProfile: (profile: Partial<User>) => Promise<void>;
  switchDevRole: (roleName: 'Admin' | 'Staff' | 'Student', email?: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { instance, inProgress } = useMsal();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState<boolean>(true);
  const pickingUpRedirect = useRef(false);

  const refreshUser = async () => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await api.get('/auth/me');
      setUser(res.data.user);
    } catch {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const applySession = (res: { data: { token: string; user: User } }) => {
    localStorage.setItem('token', res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
  };

  const loginWithMicrosoft = async () => {
    setLoading(true);
    try {
      if (isEntraConfigured) {
        // Real Entra ID: navigate the whole tab to Microsoft sign-in. The result
        // is picked up by the effect below once the app reloads after the redirect
        // (redirect flow avoids the fragile popup child-window coordination).
        await instance.initialize();

        // A stale in-progress flag (e.g. from an earlier closed popup) blocks
        // new interactive calls — clear it before starting.
        if (sessionStorage.getItem('msal.interaction.status') === 'interaction_in_progress') {
          sessionStorage.removeItem('msal.interaction.status');
        }

        await instance.loginRedirect(loginRequest);
        return; // page navigates away; control does not return here
      }

      // Dev fallback: no Entra app registration configured, use seeded demo identity.
      const res = await api.post('/auth/microsoft', {
        email: 'khine.k@student.university.edu',
        name: 'Khine Khant',
        microsoftId: 'ms-student-6611718',
        department: 'Computer Science',
      });
      applySession(res);
    } finally {
      setLoading(false);
    }
  };

  // Completes the redirect flow: after Microsoft returns to the app with an
  // authenticated MSAL account but no app session yet, exchange the account's
  // ID token for the app JWT.
  useEffect(() => {
    if (!isEntraConfigured || inProgress !== 'none' || token) return;
    if (pickingUpRedirect.current) return;

    const account = instance.getAllAccounts()[0];
    if (!account) return;

    pickingUpRedirect.current = true;
    (async () => {
      setLoading(true);
      try {
        await instance.initialize();
        const result = await instance.acquireTokenSilent({ ...loginRequest, account });
        const res = await api.post('/auth/microsoft', { idToken: result.idToken });
        applySession(res);
      } catch (error) {
        console.warn('Entra ID redirect pickup failed:', error);
      } finally {
        setLoading(false);
        // Drop the MSAL #code/#state fragment left in the address bar
        if (window.location.hash) {
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
      }
    })();
  }, [inProgress, token, instance]);

  const loginWithMockProfile = async (profile: Partial<User>) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/microsoft', {
        email: profile.email || 'khine.k@student.university.edu',
        name: profile.name || 'Khine Khant',
        microsoftId: profile.microsoftId || `ms-dev-${Date.now()}`,
        department: profile.department,
      });
      applySession(res);
    } finally {
      setLoading(false);
    }
  };

  const switchDevRole = async (roleName: 'Admin' | 'Staff' | 'Student', email?: string) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/dev-login', { roleName, email });
      applySession(res);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    if (isEntraConfigured) {
      instance.logoutRedirect().catch(() => {
        // Microsoft sign-out navigation failure is not fatal for local session cleanup
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        loginWithMicrosoft,
        loginWithMockProfile,
        switchDevRole,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
