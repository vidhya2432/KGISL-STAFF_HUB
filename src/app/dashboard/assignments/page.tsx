'use client';

import { useState } from 'react';
import { useFirestore, useCollection } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, GraduationCap } from 'lucide-react';
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
import { toast } from '@/hooks/use-toast';

export default function AssignmentsPage() {
  const db = useFirestore();
  const { data: classesData, loading } = useCollection(db ? collection(db, 'classes') : null);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [newClassName, setNewClassName] = useState('');
  const [isAddClassOpen, setIsAddClassOpen] = useState(false);

  const handleAddClass = () => {
    if (!newClassName.trim() || !db) return;
    
    addDoc(collection(db, 'classes'), {
      name: newClassName,
      facultyId: 'demo-user', // Hardcoded for demo/MVP
      createdAt: serverTimestamp(),
    }).then(() => {
      setNewClassName('');
      setIsAddClassOpen(false);
      toast({ title: 'Class created', description: `${newClassName} has been added successfully.` });
    });
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-24">
      <section className="text-center space-y-6">
        <h1 className="text-5xl font-bold tracking-tight">Assignment Management</h1>
        <p className="text-xl text-muted-foreground font-medium max-w-xl mx-auto">
          Distribute unique topics, automate roster management, and analyze student performance.
        </p>
        
        <div className="pt-4 flex items-center justify-center gap-4">
          <Dialog open={isAddClassOpen} onOpenChange={setIsAddClassOpen}>
            <DialogTrigger asChild>
              <button className="bg-primary text-primary-foreground px-6 py-2.5 rounded-full font-medium text-sm hover:opacity-90 transition-opacity inline-flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add New Class
              </button>
            </DialogTrigger>
            <DialogContent className="rounded-3xl">
              <DialogHeader>
                <DialogTitle>Add New Class</DialogTitle>
                <DialogDescription>
                  Create a new class group to manage specific student cohorts.
                </DialogDescription>
              </DialogHeader>
              <div className="py-6">
                <div className="space-y-2">
                  <Label htmlFor="new-class-name">Class Name</Label>
                  <Input
                    id="new-class-name"
                    placeholder="e.g. Advanced Algorithms (Section A)"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setIsAddClassOpen(false)} className="rounded-full">Cancel</Button>
                <Button onClick={handleAddClass} disabled={!newClassName.trim()} className="rounded-full px-8">Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </section>

      <section className="space-y-12">
        <div className="flex flex-col items-center gap-6">
          <div className="inline-flex items-center gap-4 bg-secondary/50 px-6 py-3 rounded-full border">
            <GraduationCap className="h-5 w-5 text-primary" />
            <span className="text-sm font-bold tracking-tight uppercase">Select Class:</span>
            <Select value={selectedClassId || ''} onValueChange={setSelectedClassId}>
              <SelectTrigger className="w-[240px] border-none bg-transparent shadow-none focus:ring-0 text-sm font-bold">
                <SelectValue placeholder="Choose a class..." />
              </SelectTrigger>
              <SelectContent className="rounded-2xl shadow-xl">
                {classesData?.map((c) => (
                  <SelectItem key={c.id} value={c.id} className="rounded-xl">
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {selectedClassId ? (
          <ClassAssignmentManager classId={selectedClassId} />
        ) : (
          <div className="text-center py-48 bg-secondary/20 rounded-[40px] border border-dashed animate-pulse">
            <p className="text-xl text-muted-foreground font-medium">Select a class to begin managing assignments.</p>
          </div>
        )}
      </section>
    </div>
  );
}