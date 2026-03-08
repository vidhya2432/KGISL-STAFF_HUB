'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GraduationCap, LogIn, Eye, EyeOff } from 'lucide-react';
import { useStaffAuth } from '@/lib/auth-context';
import { DEPARTMENTS, type Department } from '@/lib/departments';

export default function LoginPage() {
  const { user, isLoading, login } = useStaffAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState<Department | ''>('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Auto-redirect if already logged in
  React.useEffect(() => {
    if (!isLoading && user) {
      router.replace('/dashboard');
    }
  }, [user, isLoading, router]);

  // Show nothing while checking auth state
  if (isLoading || user) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center">
        <div className="h-8 w-8 border-[3px] border-[#0071e3]/30 border-t-[#0071e3] rounded-full animate-spin" />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password || !department) {
      setError('Please fill in all fields and select a department.');
      return;
    }

    setLoading(true);
    try {
      await login(email, password, department as Department);
      router.push('/dashboard');
    } catch {
      setError('Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center p-4">
      <div className="w-full max-w-[420px]">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#0071e3] mb-4">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-[28px] font-semibold tracking-tight text-[#1d1d1f]">
            KGISL Staff Hub
          </h1>
          <p className="text-[15px] text-[#86868b] mt-1">
            Sign in to your department portal
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-[#d2d2d7]/50 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Department Select */}
            <div className="space-y-1.5">
              <label htmlFor="department" className="block text-[13px] font-medium text-[#1d1d1f]">
                Department
              </label>
              <select
                id="department"
                value={department}
                onChange={(e) => setDepartment(e.target.value as Department)}
                className="w-full h-11 px-3 rounded-xl border border-[#d2d2d7] bg-[#f5f5f7] text-[15px] text-[#1d1d1f] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/40 focus:border-[#0071e3] transition-all appearance-none cursor-pointer"
              >
                <option value="">Select your department</option>
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-[13px] font-medium text-[#1d1d1f]">
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@kgisl.ac.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-[#d2d2d7] bg-[#f5f5f7] text-[15px] text-[#1d1d1f] placeholder:text-[#86868b] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/40 focus:border-[#0071e3] transition-all"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-[13px] font-medium text-[#1d1d1f]">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 px-3 pr-10 rounded-xl border border-[#d2d2d7] bg-[#f5f5f7] text-[15px] text-[#1d1d1f] placeholder:text-[#86868b] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/40 focus:border-[#0071e3] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#86868b] hover:text-[#1d1d1f] transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="bg-red-50 text-red-600 text-[13px] p-3 rounded-xl border border-red-200">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-[#0071e3] hover:bg-[#0077ed] disabled:opacity-60 text-white rounded-xl text-[15px] font-medium transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  Sign In
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-[12px] text-[#86868b] mt-6">
          © {new Date().getFullYear()} KGISL Institute of Technology. All rights reserved.
        </p>
      </div>
    </div>
  );
}
