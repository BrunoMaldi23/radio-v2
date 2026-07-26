'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api, type Article, type Frequency, type Program, type RankingTrack, type User } from '@/lib/api';

type AdminData = {
  articles: Article[];
  programs: Program[];
  ranking: RankingTrack[];
  frequencies: Frequency[];
  users: User[];
};

type AuthContext = {
  token: string | undefined;
  user: User | null;
  adminData: AdminData;
  loading: boolean;
  saving: boolean;
  setSaving: (v: boolean) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshContent: () => Promise<void>;
};

const AuthCtx = createContext<AuthContext | null>(null);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | undefined>(undefined);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [adminData, setAdminData] = useState<AdminData>({
    articles: [], programs: [], ranking: [], frequencies: [], users: []
  });

  // Track mounted state
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    // Try to restore session via httpOnly cookie (sent automatically by browser)
    api.me()
      .then((data) => {
        if (!mountedRef.current) return;
        setUser(data.user);
        setToken(data.accessToken);
        return refreshAll(data.user, data.accessToken);
      })
      .catch(() => {
        if (!mountedRef.current) return;
        setUser(null);
      })
      .finally(() => {
        if (mountedRef.current) setLoading(false);
      });
  }, []);

  async function refreshAll(currentUser = user, accessToken = token) {
    if (!currentUser) return;

    const [articles, programs, ranking, frequencies, users] = await Promise.all([
      api.adminArticles(accessToken).catch(() => api.articles()),
      api.adminPrograms(accessToken).catch(() => [] as Program[]),
      api.adminRanking(accessToken).catch(() => api.ranking()).catch(() => [] as RankingTrack[]),
      api.adminFrequencies(accessToken).catch(() => [] as Frequency[]),
      currentUser.role === 'ADMIN' ? api.users(accessToken).catch(() => [] as User[]) : Promise.resolve([] as User[])
    ]);

    if (!mountedRef.current) return;
    setAdminData((current) => ({
      articles,
      programs,
      ranking,
      frequencies,
      users: currentUser.role === 'ADMIN' ? users : current.users
    }));
  }

  const refreshContent = useCallback(async () => {
    await refreshAll();
  }, [user, token]);

  const login = useCallback(async (email: string, password: string) => {
    const response = await api.login(email, password);
    setToken(response.accessToken);
    setUser(response.user);
    await refreshAll(response.user, response.accessToken);
  }, []);

  const logout = useCallback(async () => {
    // Logout from server to clear httpOnly cookie
    try { await api.logout(); } catch { /* ignore */ }
    setToken('');
    setUser(null);
    setAdminData({ articles: [], programs: [], ranking: [], frequencies: [], users: [] });
  }, []);

  const value = useMemo(() => ({
    token, user, adminData, loading, saving, setSaving,
    login, logout, refreshContent
  }), [token, user, adminData, loading, saving, login, logout, refreshContent]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAdminAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return ctx;
}
