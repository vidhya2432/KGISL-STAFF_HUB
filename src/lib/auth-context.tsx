'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { Department } from '@/lib/departments';

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  department: Department;
  avatarUrl?: string;
}

interface AuthContextType {
  user: StaffUser | null;
  isLoading: boolean;
  login: (email: string, password: string, department: Department) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY = 'kgisl_staff_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<StaffUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, _password: string, department: Department) => {
    // Simulate authentication — replace with Firebase Auth in production
    const staffUser: StaffUser = {
      id: crypto.randomUUID(),
      name: email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      email,
      department,
      avatarUrl: `https://i.pravatar.cc/40?u=${email}`,
    };
    setUser(staffUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(staffUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useStaffAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useStaffAuth must be used within AuthProvider');
  return ctx;
}
