
'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, BookOpen, GraduationCap } from 'lucide-react';
import { ClassAssignmentManager } from '@/components/dashboard/class-assignment-manager';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function AssignmentsPage() {
  const [classes, setClasses] = useState([
    { id: 'c1', name: 'Advanced Algorithms (A)' },
    { id: 'c2', name: 'Modern Compilers (B)' },
  ]);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [newClassName, setNewClassName] = useState('');
  const [isAddClassOpen, setIsAddClassOpen] = useState(false);

  const handleAddClass = () => {
    if (!newClassName.trim()) return;
    const newClass = {
      id: Math.random().toString(36).substr(2, 9),
      name: newClassName,
    };
    setClasses([...classes, newClass]);
    setNewClassName('');
    setIsAddClassOpen(false);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">Academic Assignments</h1>
          <p className="text-muted-foreground">Manage class syllabi, AI-generated assignments, and student submissions.</p>
        </div>
        
        <Dialog open={isAddClassOpen} onOpenChange={setIsAddClassOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add New Class
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Class</DialogTitle>
              <DialogDescription>
                Create a new class group to manage assignments and students.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="new-class-name">Class Name</Label>
                <Input
                  id="new-class-name"
                  placeholder="e.g. CS-301 (Data Structures)"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddClassOpen(false)}>Cancel</Button>
              <Button onClick={handleAddClass} disabled={!newClassName.trim()}>
                Create Class
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
