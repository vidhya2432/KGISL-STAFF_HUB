
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Calendar, LayoutGrid } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface TimetableEntry {
  id: string;
  day: string;
  time: string;
  course: string;
  location: string;
}

interface ClassData {
  id: string;
  name: string;
  entries: TimetableEntry[];
}

export default function TimetablePage() {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [newClassName, setNewClassName] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  const addClass = () => {
    if (!newClassName.trim()) return;
    const newClass: ClassData = {
      id: Math.random().toString(36).substr(2, 9),
      name: newClassName,
      entries: [],
    };
    setClasses([...classes, newClass]);
    setNewClassName('');
    if (!selectedClassId) setSelectedClassId(newClass.id);
  };

  const removeClass = (id: string) => {
    setClasses(classes.filter((c) => c.id !== id));
    if (selectedClassId === id) setSelectedClassId(null);
  };

  const addEntry = (classId: string) => {
    setClasses(
      classes.map((c) => {
        if (c.id === classId) {
          return {
            ...c,
            entries: [
              ...c.entries,
              {
                id: Math.random().toString(36).substr(2, 9),
                day: 'Monday',
                time: '09:00 - 10:30',
                course: 'New Course',
                location: 'Room TBD',
              },
            ],
          };
        }
        return c;
      })
    );
  };

  const updateEntry = (classId: string, entryId: string, field: keyof TimetableEntry, value: string) => {
    setClasses(
      classes.map((c) => {
        if (c.id === classId) {
          return {
            ...c,
            entries: c.entries.map((e) => (e.id === entryId ? { ...e, [field]: value } : e)),
          };
        }
        return c;
      })
    );
  };

  const removeEntry = (classId: string, entryId: string) => {
    setClasses(
      classes.map((c) => {
        if (c.id === classId) {
          return { ...c, entries: c.entries.filter((e) => e.id !== entryId) };
        }
        return c;
      })
    );
  };

  const selectedClass = classes.find((c) => c.id === selectedClassId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">Faculty Timetable Manager</h1>
          <p className="text-muted-foreground">Manage schedules for all your classes in one place.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Your Classes</CardTitle>
            <CardDescription>Setup the classes you handle.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="className">New Class Name</Label>
              <div className="flex gap-2">
                <Input
                  id="className"
                  placeholder="e.g. CS-101 (A)"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                />
                <Button size="icon" onClick={addClass}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              {classes.map((c) => (
                <div
                  key={c.id}
                  className={`flex items-center justify-between p-2 rounded-md border cursor-pointer transition-colors ${
                    selectedClassId === c.id ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted'
                  }`}
                  onClick={() => setSelectedClassId(c.id)}
                >
                  <span className="font-medium truncate">{c.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={selectedClassId === c.id ? 'text-primary-foreground hover:text-primary-foreground/80' : 'text-destructive'}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeClass(c.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {classes.length === 0 && (
                <p className="text-sm text-center text-muted-foreground py-4 border border-dashed rounded-md">
                  No classes added yet.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          {selectedClass ? (
            <>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="font-headline text-2xl">Timetable for {selectedClass.name}</CardTitle>
                  <CardDescription>Define schedule for this specific class group.</CardDescription>
                </div>
                <Button onClick={() => addEntry(selectedClass.id)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Slot
                </Button>
              </CardHeader>
              <CardContent>
                {daysOfWeek.map((day) => {
                  const dayEntries = selectedClass.entries.filter((e) => e.day === day);
                  return (
                    <div key={day} className="mb-6 last:mb-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{day}</Badge>
                      </div>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[180px]">Time</TableHead>
                            <TableHead>Course</TableHead>
                            <TableHead className="w-[150px]">Location</TableHead>
                            <TableHead className="w-[80px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {dayEntries.length > 0 ? (
                            dayEntries.map((entry) => (
                              <TableRow key={entry.id}>
                                <TableCell>
                                  <Input
                                    value={entry.time}
                                    onChange={(e) => updateEntry(selectedClass.id, entry.id, 'time', e.target.value)}
                                    className="h-8 text-sm"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    value={entry.course}
                                    onChange={(e) => updateEntry(selectedClass.id, entry.id, 'course', e.target.value)}
                                    className="h-8 text-sm"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    value={entry.location}
                                    onChange={(e) => updateEntry(selectedClass.id, entry.id, 'location', e.target.value)}
                                    className="h-8 text-sm"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive h-8 w-8"
                                    onClick={() => removeEntry(selectedClass.id, entry.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center text-muted-foreground py-4 italic">
                                No entries for {day}.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  );
                })}
              </CardContent>
            </>
          ) : (
            <div className="h-[400px] flex flex-col items-center justify-center text-muted-foreground p-8">
              <LayoutGrid className="h-16 w-16 mb-4 opacity-20" />
              <p className="text-lg font-medium">Select a class to manage its timetable</p>
              <p className="text-sm">Add classes in the sidebar to get started.</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
