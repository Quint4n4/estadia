import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import type { ClienteProfile, AuthTokens } from '../types/customer.types';
import { customersService } from '../api/customers.service';
import { tokenStore } from '../utils/tokenStore';

const BASE_URL = (import.meta as any).env?.VITE_API_URL ?? '/api';

interface AuthState {
  profile:  ClienteProfile | null;
  isAuth:   boolean;
  loading:  boolean;
}

interface AuthContextValue extends AuthState {
  loginWithTokens: (tokens: AuthTokens, profile: ClienteProfile) => void;
  logout:          () => void;
  refreshProfile:  () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    profile: null,
    isAuth:  false,
    loading: true,
  });

  useEffect(() => {
    // Restore session on mount / F5:
    // - refresh token lives in sessionStorage (survives reload, gone on tab close)
    // - profile snapshot lives in sessionStorage for instant UI restore
    const refresh  = tokenStore.getRefresh();
    const cached   = tokenStore.getProfile();

    if (refresh && cached) {
      try {
        const profile = JSON.parse(cached) as ClienteProfile;
        // Optimistically restore UI while we re-validate
        setState({ profile, isAuth: true, loading: false });

        // Re-validate silently: exchange refresh token for a new access token,
        // then fetch a fresh profile. Uses a plain axios call (not apiClient) to
        // avoid a circular dependency with the interceptor.
        axios.post(`${BASE_URL}/auth/refresh/`, { refresh })
          .then(res => {
            const newAccess: string = res.data.access;
            tokenStore.setAccessToken(newAccess);
            if (res.data.refresh) tokenStore.setRefresh(res.data.refresh);
            return customersService.getPerfil();
          })
          .then(p => {
            tokenStore.setProfile(JSON.stringify(p));
            setState({ profile: p, isAuth: true, loading: false });
          })
          .catch(() => {
            tokenStore.clear();
            setState({ profile: null, isAuth: false, loading: false });
          });
      } catch {
        // Corrupted profile JSON — force re-login
        tokenStore.clear();
        setState({ profile: null, isAuth: false, loading: false });
      }
    } else {
      setState(s => ({ ...s, loading: false }));
    }
  }, []);

  const loginWithTokens = (tokens: AuthTokens, profile: ClienteProfile) => {
    tokenStore.setAccessToken(tokens.access);
    tokenStore.setRefresh(tokens.refresh);
    tokenStore.setProfile(JSON.stringify(profile));
    setState({ profile, isAuth: true, loading: false });
  };

  const logout = () => {
    tokenStore.clear();
    setState({ profile: null, isAuth: false, loading: false });
  };

  const refreshProfile = async () => {
    const p = await customersService.getPerfil();
    tokenStore.setProfile(JSON.stringify(p));
    setState(s => ({ ...s, profile: p }));
  };

  return (
    <AuthContext.Provider value={{ ...state, loginWithTokens, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
