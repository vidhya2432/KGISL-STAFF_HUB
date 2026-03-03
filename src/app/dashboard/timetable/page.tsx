'use client';

import { useState, useRef, useMemo } from 'react';
import { useFirestore, useCollection } from '@/firebase';
import { collection, addDoc, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, LayoutGrid, Upload, Loader2, Sparkles, CalendarDays, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { processTimetableUploadAction } from './actions';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// pdfjs initialization
import * as pdfjsLib from 'pdfjs-dist';
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

interface TimetableEntry {
  id: string;
  day: string;
  time: string;
  course: string;
  location: string;
}

export default function TimetablePage() {
  const db = useFirestore();
  const { data: classes = [], loading: classesLoading } = useCollection<{ id: string, name: string }>(
    db ? collection(db, 'classes') : null
  );

  const [newClassName, setNewClassName] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch entries for the selected class
  const entriesQuery = useMemo(() => {
    if (!db || !selectedClassId) return null;
    return collection(db, 'classes', selectedClassId, 'schedule');
  }, [db, selectedClassId]);

  const { data: classEntries = [] } = useCollection<TimetableEntry>(entriesQuery);

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  const addClass = async () => {
    if (!newClassName.trim() || !db) return;
    try {
      const docRef = await addDoc(collection(db, 'classes'), {
        name: newClassName,
        facultyId: 'demo-user',
        createdAt: serverTimestamp(),
      });
      setNewClassName('');
      setSelectedClassId(docRef.id);
      toast({ title: 'Class Added', description: `${newClassName} created successfully.` });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to create class.' });
    }
  };

  const removeClass = async (id: string) => {
    if (!db) return;
    try {
      await deleteDoc(doc(db, 'classes', id));
      if (selectedClassId === id) setSelectedClassId(null);
      toast({ title: 'Class Removed' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to remove class.' });
    }
  };

  const addEntry = async (classId: string) => {
    if (!db) return;
    try {
      await addDoc(collection(db, 'classes', classId, 'schedule'), {
        day: 'Monday',
        time: '09:00 - 10:30',
        course: 'New Course',
        location: 'Room TBD',
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to add slot.' });
    }
  };

  const updateEntry = async (entryId: string, field: keyof TimetableEntry, value: string) => {
    if (!db || !selectedClassId) return;
    try {
      await updateDoc(doc(db, 'classes', selectedClassId, 'schedule', entryId), {
        [field]: value
      });
    } catch (e) {
      console.error('Update failed:', e);
    }
  };

  const removeEntry = async (entryId: string) => {
    if (!db || !selectedClassId) return;
    try {
      await deleteDoc(doc(db, 'classes', selectedClassId, 'schedule', entryId));
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to remove slot.' });
    }
  };

  const extractTextFromPdf = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n';
    }
    return fullText;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedClassId || !db) return;

    setIsUploading(true);
    try {
      let content = '';
      let isImage = false;

      if (file.type === 'application/pdf') {
        content = await extractTextFromPdf(file);
      } else if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        content = await new Promise((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        isImage = true;
      } else {
        throw new Error('Please upload a PDF or an Image file.');
      }

      const response = await processTimetableUploadAction(content, isImage);
      
      if (response.success && response.data) {
        // Batch write entries to Firestore
        for (const entry of response.data) {
          await addDoc(collection(db, 'classes', selectedClassId, 'schedule'), {
            ...entry,
            createdAt: serverTimestamp(),
          });
        }

        toast({
          title: 'Timetable Automated!',
          description: `Extracted ${response.data.length} periods automatically.`,
        });
      } else {
        throw new Error(response.error || 'Failed to analyze timetable.');
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Automation Failed',
        description: error.message,
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const selectedClass = classes.find((c) => c.id === selectedClassId);

  return (
    <div className="max-w-[1024px] mx-auto px-6 py-12 space-y-12 animate-in fade-in duration-700">
      <header className="space-y-2">
        <h1 className="text-[48px] font-semibold tracking-tight text-[#1d1d1f]">Timetable Manager</h1>
        <p className="text-[21px] text-[#86868b] max-w-2xl leading-relaxed">
          Automate your weekly schedule using AI. Simply upload a photo of your timetable and let AcademiaLink organize your sessions.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        <aside className="lg:col-span-1 space-y-8">
          <div className="space-y-6">
            <div className="space-y-4">
              <Label className="text-[12px] font-bold uppercase tracking-widest text-[#86868b] pl-1">Create Class</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. CS-101 (A)"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  className="rounded-full bg-[#f5f5f7] border-none px-5 h-12 shadow-inner focus-visible:ring-1 focus-visible:ring-[#0071e3]"
                />
                <Button size="icon" onClick={addClass} className="rounded-full bg-[#0071e3] hover:bg-[#0077ed] h-12 w-12 shrink-0 shadow-lg shadow-blue-500/20">
                  <Plus className="h-6 w-6" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-3">
               <Label className="text-[12px] font-bold uppercase tracking-widest text-[#86868b] pl-1">Your Classes</Label>
               <div className="space-y-2">
                {classes.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => setSelectedClassId(c.id)}
                    className={cn(
                      "group flex items-center justify-between p-4 rounded-2xl transition-all cursor-pointer",
                      selectedClassId === c.id 
                        ? "bg-[#0071e3] text-white shadow-xl shadow-blue-500/20" 
                        : "bg-white border border-[#d2d2d7] text-[#1d1d1f] hover:border-[#0071e3] hover:bg-[#f5f5f7]"
                    )}
                  >
                    <span className="font-semibold truncate">{c.name}</span>
                    <button
                      className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center transition-opacity",
                        selectedClassId === c.id 
                          ? "text-white/70 hover:text-white hover:bg-white/10" 
                          : "text-[#ff3b30] opacity-0 group-hover:opacity-100 hover:bg-[#ff3b30]/10"
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        removeClass(c.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                
                {classes.length === 0 && !classesLoading && (
                  <div className="py-16 text-center bg-[#f5f5f7] rounded-[32px] border border-dashed border-[#d2d2d7]">
                    <p className="text-sm text-[#86868b] font-medium">No classes yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </aside>

        <section className="lg:col-span-3">
          {selectedClass ? (
            <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-[#f5f5f7]">
                <div>
                  <h2 className="text-[34px] font-semibold text-[#1d1d1f] tracking-tight">{selectedClass.name}</h2>
                  <p className="text-[#86868b] text-xl">Weekly Class Schedule</p>
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                  />
                  <Button 
                    variant="outline"
                    className="flex-1 md:flex-none apple-button-secondary py-6 px-8"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    AI Automate
                  </Button>
                  <Button 
                    onClick={() => addEntry(selectedClass.id)} 
                    className="flex-1 md:flex-none apple-button-primary py-6 px-8"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Slot
                  </Button>
                </div>
              </div>

              <div className="space-y-12">
                {daysOfWeek.map((day) => {
                  const dayEntries = classEntries.filter((e) => e.day === day);
                  return (
                    <div key={day} className="space-y-6">
                      <div className="flex items-center gap-4">
                        <span className="text-[14px] font-bold uppercase tracking-[0.2em] text-[#86868b]">
                          {day}
                        </span>
                        <div className="h-px bg-[#f5f5f7] flex-1" />
                      </div>
                      
                      <div className="grid gap-4">
                        {dayEntries.length > 0 ? (
                          dayEntries.map((entry) => (
                            <div key={entry.id} className="grid grid-cols-1 md:grid-cols-12 gap-6 p-6 rounded-[28px] bg-white border border-[#d2d2d7] hover:border-[#0071e3] transition-all group shadow-sm">
                              <div className="md:col-span-3 space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-[#86868b] flex items-center gap-2">
                                  <Clock className="h-3 w-3" /> Time
                                </Label>
                                <Input
                                  value={entry.time}
                                  onChange={(e) => updateEntry(entry.id, 'time', e.target.value)}
                                  className="h-11 rounded-xl bg-[#f5f5f7] border-none focus-visible:ring-1 focus-visible:ring-[#0071e3]"
                                />
                              </div>
                              <div className="md:col-span-5 space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-[#86868b]">Course</Label>
                                <Input
                                  value={entry.course}
                                  onChange={(e) => updateEntry(entry.id, 'course', e.target.value)}
                                  className="h-11 rounded-xl bg-[#f5f5f7] border-none focus-visible:ring-1 focus-visible:ring-[#0071e3]"
                                />
                              </div>
                              <div className="md:col-span-3 space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-[#86868b]">Location</Label>
                                <Input
                                  value={entry.location}
                                  onChange={(e) => updateEntry(entry.id, 'location', e.target.value)}
                                  className="h-11 rounded-xl bg-[#f5f5f7] border-none focus-visible:ring-1 focus-visible:ring-[#0071e3]"
                                />
                              </div>
                              <div className="md:col-span-1 flex items-end justify-center pb-1">
                                <button
                                  className="text-[#ff3b30] hover:bg-[#ff3b30]/10 rounded-full h-10 w-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => removeEntry(entry.id)}
                                >
                                  <Trash2 className="h-5 w-5" />
                                </button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-12 text-center bg-[#f5f5f7]/50 rounded-[28px] border border-dashed border-[#d2d2d7]">
                            <p className="text-[#86868b] font-medium">No sessions scheduled for {day}.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[600px] flex flex-col items-center justify-center p-12 bg-[#f5f5f7]/30 rounded-[48px] border border-dashed border-[#d2d2d7] space-y-8 text-center animate-in zoom-in-95 duration-700">
              <div className="bg-white p-12 rounded-[40px] shadow-2xl border border-[#f5f5f7] max-w-lg">
                <CalendarDays className="h-24 w-24 text-[#0071e3] opacity-10 mb-8 mx-auto" />
                <h3 className="text-3xl font-semibold text-[#1d1d1f] tracking-tight">Select a Class</h3>
                <p className="text-[#86868b] text-lg mt-4 leading-relaxed font-medium">
                  Choose a class group from the left sidebar to manage its weekly schedule or upload a new automated timetable.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-6 max-w-lg w-full">
                <div className="p-6 bg-white/60 rounded-3xl border border-[#d2d2d7] text-left">
                  <div className="h-10 w-10 bg-[#0071e3]/10 rounded-xl flex items-center justify-center mb-3">
                    <Sparkles className="h-5 w-5 text-[#0071e3]" />
                  </div>
                  <p className="text-sm font-bold text-[#1d1d1f] uppercase tracking-wider">AI Extraction</p>
                  <p className="text-[12px] text-[#86868b] mt-1">Upload images to auto-fill slots</p>
                </div>
                <div className="p-6 bg-white/60 rounded-3xl border border-[#d2d2d7] text-left">
                  <div className="h-10 w-10 bg-[#0071e3]/10 rounded-xl flex items-center justify-center mb-3">
                    <LayoutGrid className="h-5 w-5 text-[#0071e3]" />
                  </div>
                  <p className="text-sm font-bold text-[#1d1d1f] uppercase tracking-wider">Clean View</p>
                  <p className="text-[12px] text-[#86868b] mt-1">Sleek organization by day</p>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
