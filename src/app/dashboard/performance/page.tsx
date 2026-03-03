'use client';

import { useState } from 'react';
import { useFirestore, useCollection } from '@/firebase';
import { collection } from 'firebase/firestore';
import { GradeDistributionChart } from '@/components/dashboard/grade-distribution-chart';
import { PerformanceTable } from '@/components/dashboard/performance-table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GraduationCap, BarChart3 } from 'lucide-react';

export default function PerformancePage() {
  const db = useFirestore();
  const { data: classes = [] } = useCollection<{ id: string, name: string }>(
    db ? collection(db, 'classes') : null
  );
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  return (
    <div className="max-w-[1024px] mx-auto px-6 py-12 space-y-16 animate-in fade-in duration-700">
      <header className="space-y-4 text-center">
        <h1 className="text-[48px] font-semibold tracking-tight text-[#1d1d1f]">Performance Analytics</h1>
        <p className="text-[21px] text-[#86868b] max-w-2xl mx-auto leading-relaxed">
          Monitor academic progress, analyze grade distributions, and generate detailed performance reports for your students.
        </p>
      </header>

      <section className="flex flex-col items-center gap-8">
        <div className="inline-flex items-center gap-4 bg-[#f5f5f7] px-8 py-4 rounded-full border border-[#d2d2d7] shadow-sm">
          <GraduationCap className="h-5 w-5 text-[#0071e3]" />
          <span className="text-sm font-bold tracking-tight uppercase text-[#1d1d1f]">Select Class:</span>
          <Select value={selectedClassId || ''} onValueChange={setSelectedClassId}>
            <SelectTrigger className="w-[280px] border-none bg-transparent shadow-none focus:ring-0 text-sm font-bold text-[#0071e3]">
              <SelectValue placeholder="Choose a class group..." />
            </SelectTrigger>
            <SelectContent className="rounded-3xl shadow-2xl border-[#d2d2d7] bg-white text-[#1d1d1f]">
              {classes.map((c) => (
                <SelectItem 
                  key={c.id} 
                  value={c.id} 
                  className="rounded-xl focus:bg-[#f5f5f7] focus:text-black text-black font-semibold py-3 cursor-pointer"
                >
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedClassId ? (
          <div className="w-full space-y-12 animate-in slide-in-from-bottom-4 duration-500">
            <div className="grid gap-8">
              <GradeDistributionChart classId={selectedClassId} />
              <PerformanceTable classId={selectedClassId} />
            </div>
          </div>
        ) : (
          <div className="w-full text-center py-48 bg-[#f5f5f7]/50 rounded-[48px] border border-dashed border-[#d2d2d7]">
            <BarChart3 className="h-20 w-20 text-[#0071e3] opacity-10 mx-auto mb-6" />
            <p className="text-xl text-[#86868b] font-medium">Select a class to view performance insights.</p>
          </div>
        )}
      </section>
    </div>
  );
}
