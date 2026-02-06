'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { usePathname } from 'next/navigation';

const pageTitles: { [key: string]: string } = {
  '/dashboard': 'Dashboard Overview',
  '/dashboard/timetable': 'Weekly Timetable',
  '/dashboard/assignments': 'Assignment Management',
  '/dashboard/performance': 'Performance Analytics',
  '/dashboard/notifications': 'Notifications & Alerts',
};

export function Header() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const userAvatar = PlaceHolderImages.find((img) => img.id === 'user-avatar-1');

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4 md:px-6">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <div className="flex-1">
        <h1 className="text-xl font-bold font-headline tracking-tight">
          {pageTitles[pathname] || 'AcademiaLink'}
        </h1>
      </div>
      <div className="flex items-center gap-4">
        {mounted ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="overflow-hidden rounded-full h-9 w-9"
              >
                <Image
                  src={userAvatar?.imageUrl || '/placeholder.svg'}
                  width={36}
                  height={36}
                  alt={userAvatar?.description || 'User avatar'}
                  data-ai-hint={userAvatar?.imageHint}
                  className="aspect-square object-cover"
                />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile Settings</DropdownMenuItem>
              <DropdownMenuItem>Academic Preferences</DropdownMenuItem>
              <DropdownMenuItem>Help & Support</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive">
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
        )}
      </div>
    </header>
  );
}
