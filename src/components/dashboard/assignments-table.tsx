import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { assignments, courses, submissions, students } from '@/lib/data';
import { FileDown, Upload } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export function AssignmentsTable() {
  const getCourseName = (courseId: string) => courses.find(c => c.id === courseId)?.name || 'Unknown Course';
  
  const getSubmissionStats = (assignmentId: string) => {
    const totalStudents = students.length;
    const submittedCount = submissions.filter(s => s.assignmentId === assignmentId && s.status !== 'Pending').length;
    return {
      count: `${submittedCount} / ${totalStudents}`,
      progress: (submittedCount / totalStudents) * 100,
    };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assignment Submissions</CardTitle>
        <CardDescription>Track submission status across all your courses.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-end mb-4">
          <Button variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            Upload New Assignment
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Assignment</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Submissions</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assignments.map((assignment) => {
              const stats = getSubmissionStats(assignment.id);
              return (
                <TableRow key={assignment.id}>
                  <TableCell className="font-medium">{assignment.title}</TableCell>
                  <TableCell>{getCourseName(assignment.courseId)}</TableCell>
                  <TableCell>{format(parseISO(assignment.dueDate), 'PPP')}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={stats.progress} className="w-[100px]" />
                      <span>{stats.count}</span>
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
      </CardContent>
    </Card>
  );
}
