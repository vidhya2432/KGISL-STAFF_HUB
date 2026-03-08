'use client';

import { Users, BookCopy, AlertCircle } from 'lucide-react';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, collectionGroup } from 'firebase/firestore';
import { useMemo } from 'react';

export function OverviewStats() {
  const db = useFirestore();
  const { data: classes } = useCollection(db ? collection(db, 'classes') : null);

  // Count all students across all classes
  const studentsQuery = useMemo(() => {
    if (!db) return null;
    return collectionGroup(db, 'students');
  }, [db]);
  const { data: allStudents } = useCollection(studentsQuery);

  // Count all assignments across all classes
  const assignmentsQuery = useMemo(() => {
    if (!db) return null;
    return collectionGroup(db, 'assignments');
  }, [db]);
  const { data: allAssignments } = useCollection(assignmentsQuery);

  const activeCoursesCount = classes?.length || 0;
  const totalStudents = allStudents?.length || 0;
  const pendingAssignments = allAssignments?.length || 0;

  const stats = [
    { label: 'Total Students', value: totalStudents.toString(), icon: Users, description: 'Active participants' },
    { label: 'Active Courses', value: activeCoursesCount.toString(), icon: BookCopy, description: 'Current semester' },
    { label: 'Assignments', value: pendingAssignments.toString(), icon: AlertCircle, description: 'Across all classes' },
  ];

  return (
    <div className="grid gap-12 md:grid-cols-3">
      {stats.map((stat) => (
        <div key={stat.label} className="text-center space-y-2 group cursor-default">
          <div className="flex justify-center mb-6">
            <div className="h-16 w-16 bg-white rounded-2xl shadow-sm border flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
               <stat.icon className="h-8 w-8 text-[#0066cc]" />
            </div>
          </div>
          <p className="text-[14px] font-bold uppercase tracking-wider text-[#86868b]">{stat.label}</p>
          <p className="text-[48px] font-semibold tracking-tight text-[#1d1d1f]">{stat.value}</p>
          <p className="text-[17px] text-[#86868b] font-normal">{stat.description}</p>
        </div>
      ))}
    </div>
  );
}
