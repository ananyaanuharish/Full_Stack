'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface AuthCtx { token: string | null; setToken: (t: string | null) => void; logout: () => void; }
const AuthContext = createContext<AuthCtx>({ token: null, setToken: () => {}, logout: () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem('token');
    if (stored) setTokenState(stored);
  }, []);

  const setToken = (t: string | null) => {
    setTokenState(t);
    if (t) localStorage.setItem('token', t);
    else localStorage.removeItem('token');
  };

  const logout = () => { setToken(null); router.push('/login'); };

  return <AuthContext.Provider value={{ token, setToken, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
