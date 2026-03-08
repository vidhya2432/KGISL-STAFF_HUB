'use client';

import { useMemo } from 'react';
import { useFirestore, useCollection } from '@/firebase';
import { collection, collectionGroup } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { FileDown, Upload, Loader2 } from 'lucide-react';

export function AssignmentsTable() {
  const db = useFirestore();

  // Fetch all classes
  const { data: classes, loading: classesLoading } = useCollection<{ id: string; name: string }>(
    db ? collection(db, 'classes') : null
  );

  // Fetch all assignments across all classes
  const assignmentsQuery = useMemo(() => {
    if (!db) return null;
    return collectionGroup(db, 'assignments');
  }, [db]);
  const { data: assignments, loading: assignmentsLoading } = useCollection<{
    id: string;
    title: string;
    classId?: string;
    dueDate?: string;
    totalSubmissions?: number;
    totalStudents?: number;
  }>(assignmentsQuery);

  // Fetch all students across all classes
  const studentsQuery = useMemo(() => {
    if (!db) return null;
    return collectionGroup(db, 'students');
  }, [db]);
  const { data: allStudents } = useCollection(studentsQuery);

  const loading = classesLoading || assignmentsLoading;
  const totalStudentCount = allStudents?.length || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assignment Submissions</CardTitle>
        <CardDescription>Track submission status across all your courses.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12 gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Loading assignments…</span>
          </div>
        ) : !assignments || assignments.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">No assignments found. Add classes and assignments to get started.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Assignment</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Submissions</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.map((assignment) => {
                const submitted = assignment.totalSubmissions || 0;
                const total = assignment.totalStudents || totalStudentCount || 1;
                const progress = (submitted / total) * 100;
                return (
                  <TableRow key={assignment.id}>
                    <TableCell className="font-medium">{assignment.title}</TableCell>
                    <TableCell>{assignment.dueDate ?? '—'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={progress} className="w-[100px]" />
                        <span>{submitted} / {total}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon">
                        <FileDown className="h-4 w-4" />
                        <span className="sr-only">Download Submissions</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
