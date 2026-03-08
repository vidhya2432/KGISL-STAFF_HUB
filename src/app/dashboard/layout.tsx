'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  GraduationCap,
  LogOut,
  MessageSquare,
  Megaphone,
  Menu,
  X,
  LayoutDashboard,
  CalendarDays,
  ClipboardList,
  BarChart3,
  LifeBuoy,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { FirebaseClientProvider } from '@/firebase';
import { AuthGuard } from '@/components/auth-guard';
import { useStaffAuth } from '@/lib/auth-context';

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/timetable', label: 'Timetable', icon: CalendarDays },
  { href: '/dashboard/assignments', label: 'Assignments', icon: ClipboardList },
  { href: '/dashboard/performance', label: 'Performance', icon: BarChart3 },
  { href: '/dashboard/chat', label: 'Chat', icon: MessageSquare },
  { href: '/dashboard/announcements', label: 'Announcements', icon: Megaphone },
  { href: '/dashboard/notifications', label: 'Support', icon: LifeBuoy },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <FirebaseClientProvider>
      <AuthGuard>
        <DashboardContent pathname={pathname}>
          {children}
        </DashboardContent>
      </AuthGuard>
    </FirebaseClientProvider>
  );
}

function DashboardContent({ children, pathname }: { children: React.ReactNode; pathname: string }) {
  const { user, logout } = useStaffAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  // Close mobile menu on route change
  React.useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
      <div className="min-h-screen bg-white">
        {/* Global Navigation */}
        <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-[#d2d2d7]">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-1.5 -ml-1.5 rounded-lg hover:bg-[#f5f5f7] transition-colors"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="h-5 w-5 text-[#1d1d1f]" /> : <Menu className="h-5 w-5 text-[#1d1d1f]" />}
              </button>
              <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-70 transition-opacity">
                <GraduationCap className="h-6 w-6 text-[#1d1d1f]" />
                <span className="font-bold text-[18px] text-[#1d1d1f] tracking-tight hidden sm:inline">KGISL Staff Hub</span>
                <span className="font-bold text-[18px] text-[#1d1d1f] tracking-tight sm:hidden">KGISL</span>
              </Link>
            </div>
            
            {/* Desktop nav */}
            <ul className="hidden md:flex items-center gap-6">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link 
                    href={item.href}
                    className={cn(
                      "text-[13px] font-semibold text-[#1d1d1f]/60 hover:text-[#1d1d1f] transition-colors tracking-tight py-2",
                      pathname === item.href && "text-[#1d1d1f] font-bold"
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="flex items-center gap-3 text-[#1d1d1f]">
              {user && (
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="hidden sm:flex flex-col items-end">
                    <span className="text-[13px] font-semibold text-[#1d1d1f] leading-tight">{user.name}</span>
                    <span className="text-[11px] text-[#0071e3] font-medium leading-tight">{user.department}</span>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-[#0071e3] flex items-center justify-center text-white text-[13px] font-semibold shrink-0">
                    {user.name.charAt(0)}
                  </div>
                  <button
                    onClick={logout}
                    className="hover:opacity-60 transition-opacity text-[#86868b] hover:text-red-500"
                    title="Sign out"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile slide-down menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-[#d2d2d7] bg-white/95 backdrop-blur-xl animate-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-3 space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[15px] font-medium transition-colors",
                        pathname === item.href
                          ? "bg-[#0071e3]/10 text-[#0071e3]"
                          : "text-[#1d1d1f]/70 hover:bg-[#f5f5f7]"
                      )}
                    >
                      <Icon className="h-4.5 w-4.5" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
              {user && (
                <div className="border-t border-[#d2d2d7] px-4 py-3">
                  <div className="flex items-center gap-3 px-3">
                    <div className="h-9 w-9 rounded-full bg-[#0071e3] flex items-center justify-center text-white text-[14px] font-semibold shrink-0">
                      {user.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold text-[#1d1d1f] truncate">{user.name}</p>
                      <p className="text-[12px] text-[#0071e3] font-medium">{user.department}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </nav>

        <main className="animate-in fade-in duration-500">
          {children}
        </main>

        <footer className="bg-[#f5f5f7] border-t py-12 mt-16">
          <div className="max-w-[1024px] mx-auto px-6">
            <div className="text-[12px] text-[#86868b] leading-relaxed space-y-4">
              <p>Performance analytics and AI insights are based on internal data processing models. Accuracy may vary by dataset complexity.</p>
              <div className="border-b border-[#d2d2d7] my-6" />
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <p>© {new Date().getFullYear()} KGISL Institute of Technology. All rights reserved.</p>
                <div className="flex gap-6">
                  <Link href="#" className="hover:underline">Privacy Policy</Link>
                  <Link href="#" className="hover:underline">Terms of Use</Link>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
  );
}
