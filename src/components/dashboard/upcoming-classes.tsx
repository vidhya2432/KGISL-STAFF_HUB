import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { timetable } from '@/lib/data';

export function UpcomingClasses() {
  const today = new Date().toLocaleString('en-us', { weekday: 'long' });
  const upcoming = timetable.slice(0, 5); // Show next 5 for simplicity

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Classes</CardTitle>
        <CardDescription>Your next scheduled classes for the week.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Day</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Location</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {upcoming.map((item) => (
              <TableRow key={item.id} className={item.day === today ? 'bg-secondary' : ''}>
                <TableCell className="font-medium">{item.day}</TableCell>
                <TableCell>{item.time}</TableCell>
                <TableCell>{item.course}</TableCell>
                <TableCell>{item.location}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
