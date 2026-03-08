'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useStaffAuth } from '@/lib/auth-context';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useStaffAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-[3px] border-[#0071e3]/30 border-t-[#0071e3] rounded-full animate-spin" />
          <p className="text-[15px] text-[#86868b]">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}
