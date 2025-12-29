import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { submissions, students, assignments } from '@/lib/data';
import { format, parseISO } from 'date-fns';

export function RecentSubmissions() {
  const recentSubmissions = submissions
    .filter(s => s.submittedAt)
    .sort((a, b) => new Date(b.submittedAt!).getTime() - new Date(a.submittedAt!).getTime())
    .slice(0, 5);

  const getStudent = (studentId: string) => students.find(s => s.id === studentId);
  const getAssignment = (assignmentId: string) => assignments.find(a => a.id === assignmentId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Submissions</CardTitle>
        <CardDescription>The latest assignment submissions from your students.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Assignment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted On</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentSubmissions.map((sub) => {
              const student = getStudent(sub.studentId);
              const assignment = getAssignment(sub.assignmentId);
              if (!student || !assignment) return null;

              return (
                <TableRow key={sub.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={student.avatarUrl} alt={student.name} />
                        <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{student.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{assignment.title}</TableCell>
                  <TableCell>
                    <Badge variant={sub.status === 'Late' ? 'destructive' : 'secondary'}>{sub.status}</Badge>
                  </TableCell>
                  <TableCell>{format(parseISO(sub.submittedAt!), 'PPp')}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
