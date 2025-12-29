'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookMarked,
  Bell,
  LayoutDashboard,
  CalendarDays,
  LineChart,
  BookOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Header } from '@/components/dashboard/header';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/timetable', icon: CalendarDays, label: 'Timetable' },
  { href: '/dashboard/assignments', icon: BookMarked, label: 'Assignments' },
  { href: '/dashboard/performance', icon: LineChart, label: 'Performance' },
  { href: '/dashboard/notifications', icon: Bell, label: 'Notifications' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full flex-col bg-background">
        <Sidebar>
            <SidebarHeader>
              <div className="flex items-center gap-2 p-2">
                <BookOpen className="h-8 w-8 text-primary" />
                <h2 className="text-xl font-bold font-headline text-primary">
                  AcademiaLink
                </h2>
              </div>
            </SidebarHeader>
            <SidebarContent>
              <SidebarMenu>
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href}
                      className={cn(
                        'justify-start',
                        pathname === item.href &&
                          'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground'
                      )}
                    >
                      <Link href={item.href}>
                        <item.icon className="mr-2 h-5 w-5" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarContent>
        </Sidebar>
        <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
        <SidebarInset>
          <Header />
          <main className="flex-1 p-4 sm:p-6">{children}</main>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}
