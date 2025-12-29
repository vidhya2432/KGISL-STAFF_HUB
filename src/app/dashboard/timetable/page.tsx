import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { timetable } from '@/lib/data';
import { Upload } from 'lucide-react';

export default function TimetablePage() {
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const scheduleByDay = daysOfWeek.map(day => ({
    day,
    entries: timetable.filter(entry => entry.day === day).sort((a,b) => a.time.localeCompare(b.time)),
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">Weekly Timetable</h1>
          <p className="text-muted-foreground">Your complete teaching schedule for the week.</p>
        </div>
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          Upload Timetable
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {scheduleByDay.map(({ day, entries }) => (
          <Card key={day}>
            <CardHeader>
              <CardTitle className='font-headline'>{day}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[150px]">Time</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead className="w-[150px]">Location</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.length > 0 ? (
                    entries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-medium">{entry.time}</TableCell>
                        <TableCell>{entry.course}</TableCell>
                        <TableCell>{entry.location}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground">
                        No classes scheduled for today.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
