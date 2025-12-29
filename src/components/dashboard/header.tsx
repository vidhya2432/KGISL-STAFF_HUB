'use client';
import {
  Bell,
  Home,
  LineChart,
  Package,
  Package2,
  PanelLeft,
  Search,
  Settings,
  ShoppingCart,
  Users,
} from 'lucide-react';
import Link from 'next/link';
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
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { usePathname } from 'next/navigation';
import {
  SidebarTrigger,
} from '@/components/ui/sidebar';

const pageTitles: { [key: string]: string } = {
  '/dashboard': 'Dashboard',
  '/dashboard/timetable': 'Timetable',
  '/dashboard/assignments': 'Assignments',
  '/dashboard/performance': 'Performance Tracking',
  '/dashboard/notifications': 'Notifications',
};

export function Header() {
  const pathname = usePathname();
  const userAvatar = PlaceHolderImages.find((img) => img.id === 'user-avatar-1');

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-card px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <SidebarTrigger className="sm:hidden" />
      <div className="relative flex-1 md:grow-0">
         <h1 className="text-2xl font-semibold font-headline">{pageTitles[pathname] || 'AcademiaLink'}</h1>
      </div>
      <div className="flex items-center gap-4 md:ml-auto md:grow-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="overflow-hidden rounded-full"
            >
              <Image
                src={userAvatar?.imageUrl || '/placeholder.svg'}
                width={40}
                height={40}
                alt={userAvatar?.description || 'User avatar'}
                data-ai-hint={userAvatar?.imageHint}
                className="overflow-hidden rounded-full"
              />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuItem>Support</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
