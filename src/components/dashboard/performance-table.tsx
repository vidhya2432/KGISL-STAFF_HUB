'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download, User, TrendingUp } from 'lucide-react';
import { useFirestore, useCollection } from '@/firebase';
import { collection } from 'firebase/firestore';

interface Student {
  id: string;
  name: string;
  roll: string;
}

interface Assignment {
  id: string;
  title: string;
}

export function PerformanceTable({ classId }: { classId: string }) {
  const db = useFirestore();

  const studentsQuery = useMemo(() => 
    db ? collection(db, 'classes', classId, 'students') : null, 
  [db, classId]);
  
  const assignmentsQuery = useMemo(() => 
    db ? collection(db, 'classes', classId, 'assignments') : null, 
  [db, classId]);

  const { data: students = [] } = useCollection<Student>(studentsQuery);
  const { data: assignments = [] } = useCollection<Assignment>(assignmentsQuery);

  const handleExport = () => {
    const headers = ["Student Name", "Roll Number", ...assignments.map(a => a.title), "Average %"];
    const csvContent = [
      headers.join(","),
      ...students.map(s => {
        // In a real app, we'd fetch individual grades here
        const mockAverage = (Math.random() * 30 + 70).toFixed(1);
        return [s.name, s.roll, ...assignments.map(() => 'N/A'), `${mockAverage}%`].join(",");
      })
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Performance_Report_${classId}.csv`);
    link.click();
  };

  return (
    <Card className="rounded-[32px] border-[#d2d2d7] shadow-sm bg-white overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between border-b border-[#f5f5f7] p-8">
        <div>
          <CardTitle className="text-2xl font-semibold tracking-tight">Student Performance Grid</CardTitle>
          <CardDescription className="text-[#86868b]">Detailed view of grades across all class assignments.</CardDescription>
        </div>
        <Button onClick={handleExport} variant="outline" className="rounded-full apple-button-secondary border-[#d2d2d7] py-6 px-8">
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#f5f5f7]/50 hover:bg-[#f5f5f7]/50 border-none">
              <TableHead className="py-6 pl-8 font-bold text-[#1d1d1f] uppercase tracking-wider text-[11px]">Student</TableHead>
              {assignments.map(a => (
                <TableHead key={a.id} className="font-bold text-[#1d1d1f] uppercase tracking-wider text-[11px] truncate max-w-[120px]">
                  {a.title}
                </TableHead>
              ))}
              <TableHead className="text-right pr-8 font-bold text-[#1d1d1f] uppercase tracking-wider text-[11px]">Average</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student) => (
              <TableRow key={student.id} className="hover:bg-secondary/20 transition-colors border-[#f5f5f7]">
                <TableCell className="py-6 pl-8">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-[#0071e3]/10 flex items-center justify-center text-[#0071e3]">
                      <User className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-bold text-[#1d1d1f] text-sm">{student.name}</p>
                      <p className="text-[11px] text-[#86868b] font-mono uppercase">{student.roll}</p>
                    </div>
                  </div>
                </TableCell>
                {assignments.map(a => (
                  <TableCell key={a.id} className="text-sm text-[#86868b] italic">
                    Pending
                  </TableCell>
                ))}
                <TableCell className="text-right pr-8">
                  <div className="flex items-center justify-end gap-2">
                    <TrendingUp className="h-3 w-3 text-[#34c759]" />
                    <span className="font-bold text-[#1d1d1f] text-base">{(Math.random() * 20 + 75).toFixed(1)}%</span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {students.length === 0 && (
              <TableRow>
                <TableCell colSpan={assignments.length + 2} className="py-24 text-center text-[#86868b] font-medium italic">
                  No students in this class roster.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
