'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FirebaseClientProvider } from '@/firebase';

const navItems = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/dashboard/timetable', label: 'Timetable' },
  { href: '/dashboard/assignments', label: 'Assignments' },
  { href: '/dashboard/performance', label: 'Performance' },
  { href: '/dashboard/notifications', label: 'Support' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <FirebaseClientProvider>
      <div className="min-h-screen bg-[#f5f5f7]">
        {/* Global Navigation */}
        <nav className="sticky top-0 z-50 bg-[#f5f5f7]/90 backdrop-blur-md border-b border-[#d2d2d7]">
          <div className="max-w-[1024px] mx-auto px-6 h-12 flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-70 transition-opacity">
              <GraduationCap className="h-5 w-5 text-[#1d1d1f]" />
              <span className="font-semibold text-[#1d1d1f] tracking-tight">AcademiaLink</span>
            </Link>
            
            <ul className="hidden md:flex items-center gap-10">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link 
                    href={item.href}
                    className={cn(
                      "apple-nav-link",
                      pathname === item.href && "text-[#1d1d1f] font-semibold"
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="flex items-center gap-6 text-[#1d1d1f]/80">
              <button className="hover:text-[#1d1d1f] transition-colors">
                <Search className="h-5 w-5" />
              </button>
            </div>
          </div>
        </nav>

        <main className="animate-in fade-in duration-1000">
          {children}
        </main>

        <footer className="bg-[#f5f5f7] border-t py-12 mt-24">
          <div className="max-w-[1024px] mx-auto px-6">
            <div className="text-[12px] text-[#86868b] leading-relaxed space-y-4">
              <p>1. Performance analytics and AI insights are based on internal data processing models. Accuracy may vary by dataset complexity.</p>
              <p>2. Subscription to AcademiaLink Plus may be required for some advanced generative features.</p>
              <div className="border-b border-[#d2d2d7] my-4" />
              <div className="flex justify-between items-center">
                <p>© 2024 AcademiaLink Inc. All rights reserved.</p>
                <div className="flex gap-4">
                  <Link href="#" className="hover:underline">Privacy Policy</Link>
                  <Link href="#" className="hover:underline">Terms of Use</Link>
                  <Link href="#" className="hover:underline">Sales Policy</Link>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </FirebaseClientProvider>
  );
}
