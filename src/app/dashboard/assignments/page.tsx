'use client';

import { useState } from 'react';
import { useFirestore, useCollection } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, GraduationCap, Loader2 } from 'lucide-react';
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
  const [isCreating, setIsCreating] = useState(false);

  const handleAddClass = async () => {
    if (!newClassName.trim() || !db) return;
    
    setIsCreating(true);
    const className = newClassName.trim();
    
    try {
      const docRef = await addDoc(collection(db, 'classes'), {
        name: className,
        facultyId: 'demo-user',
        createdAt: serverTimestamp(),
      });
      
      setNewClassName('');
      setSelectedClassId(docRef.id);
      setIsAddClassOpen(false);
      
      toast({ 
        title: 'Class created', 
        description: `${className} has been added and selected.` 
      });
    } catch (error) {
      console.error("Error adding class: ", error);
      toast({ 
        variant: 'destructive', 
        title: 'Error', 
        description: 'Failed to create class. Please try again.' 
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-24 pt-12">
      <section className="text-center space-y-6">
        <h1 className="text-5xl font-bold tracking-tight text-[#1d1d1f]">Assignment Management</h1>
        <p className="text-xl text-[#86868b] font-medium max-w-xl mx-auto leading-relaxed">
          Distribute unique topics, automate roster management, and analyze student performance.
        </p>
        
        <div className="pt-4 flex items-center justify-center gap-4">
          <Dialog open={isAddClassOpen} onOpenChange={setIsAddClassOpen}>
            <DialogTrigger asChild>
              <button className="apple-button-primary inline-flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add New Class
              </button>
            </DialogTrigger>
            <DialogContent className="rounded-[32px] p-8 border-[#d2d2d7] bg-white shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-[#1d1d1f]">Add New Class</DialogTitle>
                <DialogDescription className="text-base text-[#86868b]">
                  Create a new class group to manage specific student cohorts.
                </DialogDescription>
              </DialogHeader>
              <div className="py-8">
                <div className="space-y-3">
                  <Label htmlFor="new-class-name" className="text-sm font-bold uppercase tracking-wider text-[#86868b]">Class Name</Label>
                  <Input
                    id="new-class-name"
                    placeholder="e.g. Advanced Algorithms (Section A)"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    className="rounded-2xl h-12 bg-[#f5f5f7] border-none px-5 text-[#1d1d1f] focus-visible:ring-1 focus-visible:ring-[#0071e3]"
                  />
                </div>
              </div>
              <DialogFooter className="gap-3">
                <Button variant="ghost" onClick={() => setIsAddClassOpen(false)} className="rounded-full px-6">Cancel</Button>
                <button 
                  onClick={handleAddClass} 
                  disabled={!newClassName.trim() || isCreating} 
                  className="apple-button-primary px-10 disabled:opacity-50 flex items-center gap-2"
                >
                  {isCreating && <Loader2 className="h-4 w-4 animate-spin" />}
                  Create
                </button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </section>

      <section className="space-y-12">
        <div className="flex flex-col items-center gap-6">
          <div className="inline-flex items-center gap-4 bg-[#f5f5f7] px-8 py-4 rounded-full border border-[#d2d2d7] shadow-sm">
            <GraduationCap className="h-5 w-5 text-[#0071e3]" />
            <span className="text-sm font-bold tracking-tight uppercase text-[#1d1d1f]">Select Class:</span>
            <Select value={selectedClassId || ''} onValueChange={setSelectedClassId}>
              <SelectTrigger className="w-[280px] border-none bg-transparent shadow-none focus:ring-0 text-sm font-bold text-[#1d1d1f]">
                <SelectValue placeholder="Choose a class..." className="text-[#1d1d1f]" />
              </SelectTrigger>
              <SelectContent className="rounded-[24px] shadow-2xl border-[#d2d2d7] bg-white text-[#1d1d1f]">
                {classesData?.map((c: any) => (
                  <SelectItem 
                    key={c.id} 
                    value={c.id} 
                    className="rounded-xl focus:bg-[#f5f5f7] focus:text-black text-black font-bold py-3 cursor-pointer"
                  >
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {selectedClassId ? (
          <div className="max-w-[1024px] mx-auto px-6 pb-24">
            <ClassAssignmentManager classId={selectedClassId} />
          </div>
        ) : (
          <div className="max-w-[1024px] mx-auto px-6">
            <div className="text-center py-48 bg-[#f5f5f7]/50 rounded-[48px] border border-dashed border-[#d2d2d7] animate-pulse">
              <p className="text-xl text-[#86868b] font-medium">Select a class to begin managing assignments.</p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
