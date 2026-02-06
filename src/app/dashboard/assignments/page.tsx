
'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Plus, BookOpen, GraduationCap } from 'lucide-react';
import { ClassAssignmentManager } from '@/components/dashboard/class-assignment-manager';

export default function AssignmentsPage() {
  const [classes, setClasses] = useState([
    { id: 'c1', name: 'Advanced Algorithms (A)' },
    { id: 'c2', name: 'Modern Compilers (B)' },
  ]);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">Academic Assignments</h1>
          <p className="text-muted-foreground">Manage class syllabi, AI-generated assignments, and student submissions.</p>
        </div>
        <Button variant="outline" size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add New Class
        </Button>
      </div>

      <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-lg border">
        <GraduationCap className="h-5 w-5 text-primary" />
        <span className="font-medium">Select Class:</span>
        <Select value={selectedClassId || ''} onValueChange={setSelectedClassId}>
          <SelectTrigger className="w-[300px]">
            <SelectValue placeholder="Choose a class to manage..." />
          </SelectTrigger>
          <SelectContent>
            {classes.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedClassId ? (
        <ClassAssignmentManager classId={selectedClassId} />
      ) : (
        <Card className="flex flex-col items-center justify-center p-12 border-dashed">
          <BookOpen className="h-16 w-16 text-muted-foreground opacity-20 mb-4" />
          <h3 className="text-xl font-semibold">No Class Selected</h3>
          <p className="text-muted-foreground max-w-sm text-center mt-2">
            Please select a class from the dropdown above to manage its syllabus, assignments, and student grades.
          </p>
        </Card>
      )}
    </div>
  );
}
