'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { useFirestore, useCollection } from '@/firebase';
import { collectionGroup, query, where } from 'firebase/firestore';

interface Submission {
  marks: number;
}

export function GradeDistributionChart({ classId }: { classId: string }) {
  const db = useFirestore();
  
  // Note: For MVP we simulate or query submissions. 
  // In a real app, you'd likely aggregate these.
  const submissionsQuery = useMemo(() => {
    if (!db) return null;
    // We fetch all submissions for the assignments of this class
    return query(collectionGroup(db, 'submissions')); 
  }, [db]);

  const { data: allSubmissions = [] } = useCollection<Submission>(submissionsQuery);

  const distributionData = useMemo(() => {
    const ranges = [
      { name: '90-100', min: 90, max: 100, color: '#34c759' },
      { name: '80-89', min: 80, max: 89, color: '#0071e3' },
      { name: '70-79', min: 70, max: 79, color: '#5856d6' },
      { name: '60-69', min: 60, max: 69, color: '#ff9500' },
      { name: '0-59', min: 0, max: 59, color: '#ff3b30' },
    ];

    return ranges.map(range => ({
      name: range.name,
      total: allSubmissions.filter(s => s.marks !== null && s.marks >= range.min && s.marks <= range.max).length,
      color: range.color
    }));
  }, [allSubmissions]);

  return (
    <Card className="rounded-[32px] border-[#d2d2d7] shadow-sm overflow-hidden bg-white">
      <CardHeader className="pb-2">
        <CardTitle className="text-2xl font-semibold tracking-tight">Grade Distribution</CardTitle>
        <CardDescription className="text-[#86868b]">Visualizing overall class performance across all assignments.</CardDescription>
      </CardHeader>
      <CardContent className="pt-8">
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={distributionData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#86868b', fontSize: 12, fontWeight: 600 }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#86868b', fontSize: 12 }}
                dx={-10}
              />
              <Tooltip
                cursor={{ fill: '#f5f5f7' }}
                contentStyle={{ 
                  borderRadius: '16px', 
                  border: '1px solid #d2d2d7', 
                  boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              />
              <Bar dataKey="total" radius={[12, 12, 0, 0]} barSize={60}>
                {distributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
