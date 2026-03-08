
'use client';

import { OverviewStats } from '@/components/dashboard/overview-stats';
import { UpcomingClasses } from '@/components/dashboard/upcoming-classes';
import { RecentSubmissions } from '@/components/dashboard/recent-submissions';
import Image from 'next/image';
import Link from 'next/link';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useStaffAuth } from '@/lib/auth-context';
import { CalendarDays, ClipboardList, MessageSquare } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useStaffAuth();
  const rosterImg = PlaceHolderImages.find(img => img.id === 'hero-roster');
  const aiImg = PlaceHolderImages.find(img => img.id === 'hero-ai');
  const gradingImg = PlaceHolderImages.find(img => img.id === 'hero-grading');

  return (
    <div className="flex flex-col bg-white">
      {/* Hero Section */}
      <section className="relative pt-12 sm:pt-20 pb-12 text-center overflow-hidden">
        <div className="max-w-[800px] mx-auto px-4 sm:px-6 space-y-4">
          <p className="text-[#0071e3] text-[15px] font-medium">
            Welcome back, {user?.name ?? 'Staff'}
          </p>
          <h1 className="text-[32px] sm:text-[48px] md:text-[56px] font-semibold tracking-tight text-[#1d1d1f] leading-tight">
            {user?.department ?? 'Your'} Department
            <br />
            <span className="text-[#86868b]">Dashboard</span>
          </h1>
          <p className="text-[17px] sm:text-[21px] text-[#86868b] font-normal leading-relaxed">
            Manage timetables, track assignments, and collaborate
            <br className="hidden md:block" /> with your department colleagues.
          </p>
          <div className="pt-6 flex flex-wrap items-center justify-center gap-3">
            <Link href="/dashboard/timetable" className="apple-button-primary shadow-sm inline-flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              View Timetable
            </Link>
            <Link href="/dashboard/assignments" className="apple-button-secondary inline-flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Assignments
            </Link>
            <Link href="/dashboard/chat" className="apple-button-secondary inline-flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Chat
            </Link>
          </div>
        </div>

        {/* Product Image Placeholder */}
        <div className="mt-16 max-w-[1000px] mx-auto px-6">
           <div className="aspect-[16/9] bg-gradient-to-b from-gray-50 to-white rounded-[40px] border shadow-2xl overflow-hidden relative">
              <div className="absolute inset-0 grid grid-cols-3 gap-1 p-1 opacity-80">
                <div className="relative h-full w-full overflow-hidden rounded-tl-[39px]">
                   {rosterImg?.imageUrl && (
                     <Image 
                      src={rosterImg.imageUrl} 
                      alt="Roster Management" 
                      fill 
                      className="object-cover"
                      data-ai-hint={rosterImg.imageHint}
                     />
                   )}
                </div>
                <div className="relative h-full w-full overflow-hidden">
                   {aiImg?.imageUrl && (
                     <Image 
                      src={aiImg.imageUrl} 
                      alt="AI Architect" 
                      fill 
                      className="object-cover"
                      data-ai-hint={aiImg.imageHint}
                     />
                   )}
                </div>
                <div className="relative h-full w-full overflow-hidden rounded-tr-[39px]">
                   {gradingImg?.imageUrl && (
                     <Image 
                      src={gradingImg.imageUrl} 
                      alt="Grading Hub" 
                      fill 
                      className="object-cover"
                      data-ai-hint={gradingImg.imageHint}
                     />
                   )}
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-white via-white/40 to-transparent" />
              <div className="relative p-8 h-full flex flex-col justify-end">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
                     <div className="space-y-2">
                        <p className="text-[#86868b] text-sm uppercase tracking-wider font-bold">Roster Management</p>
                        <h3 className="text-xl font-semibold text-[#1d1d1f]">Import with precision.</h3>
                     </div>
                     <div className="space-y-2">
                        <p className="text-[#86868b] text-sm uppercase tracking-wider font-bold">AI Architect</p>
                        <h3 className="text-xl font-semibold text-[#1d1d1f]">Unique topics for all.</h3>
                     </div>
                     <div className="space-y-2">
                        <p className="text-[#86868b] text-sm uppercase tracking-wider font-bold">Grading Hub</p>
                        <h3 className="text-xl font-semibold text-[#1d1d1f]">Analyze in seconds.</h3>
                     </div>
                  </div>
              </div>
           </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-[#f5f5f7] py-24">
        <div className="max-w-[1024px] mx-auto px-6">
          <OverviewStats />
        </div>
      </section>

      {/* Grid Sections */}
      <section className="max-w-[1024px] mx-auto px-6 py-24 space-y-32">
        <div className="grid gap-12 md:grid-cols-2">
          <div className="space-y-4">
            <h2 className="text-[40px] font-semibold tracking-tight text-[#1d1d1f]">Schedule.</h2>
            <p className="text-[21px] text-[#86868b]">Your upcoming sessions and locations at a glance.</p>
            <UpcomingClasses />
          </div>
          <div className="space-y-4">
            <h2 className="text-[40px] font-semibold tracking-tight text-[#1d1d1f]">Submissions.</h2>
            <p className="text-[21px] text-[#86868b]">Review recent work from your active student groups.</p>
            <RecentSubmissions />
          </div>
        </div>
      </section>
    </div>
  );
}
