'use client';

import { useState, useRef } from 'react';
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
// Use the official unpkg CDN which reliably serves the correct .mjs worker for version 4.x
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

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
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (!file || !selectedClassId) return;

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
        const newEntries = response.data.map((entry: any) => ({
          id: Math.random().toString(36).substr(2, 9),
          ...entry,
        }));

        setClasses(prev => prev.map(c => 
          c.id === selectedClassId 
            ? { ...c, entries: [...c.entries, ...newEntries] } 
            : c
        ));

        toast({
          title: 'Timetable Automated!',
          description: `Extracted ${newEntries.length} periods automatically.`,
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
        <h1 className="text-[40px] font-semibold tracking-tight text-[#1d1d1f]">Faculty Timetable Manager</h1>
        <p className="text-[21px] text-[#86868b] max-w-2xl">
          Automate your weekly schedule using AI. Simply upload a photo of your timetable and let AcademiaLink handle the rest.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <aside className="lg:col-span-1 space-y-6">
          <Card className="rounded-[32px] border-[#d2d2d7] shadow-sm overflow-hidden bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-semibold">Your Classes</CardTitle>
              <CardDescription className="text-sm">Manage class groups</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label htmlFor="className" className="text-[12px] font-bold uppercase tracking-wider text-[#86868b]">New Class</Label>
                <div className="flex gap-2">
                  <Input
                    id="className"
                    placeholder="e.g. CS-101 (A)"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    className="rounded-full bg-[#f5f5f7] border-none px-4"
                  />
                  <Button size="icon" onClick={addClass} className="rounded-full bg-[#0071e3] hover:bg-[#0077ed] shrink-0">
                    <Plus className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2 pt-2">
                {classes.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => setSelectedClassId(c.id)}
                    className={cn(
                      "w-full flex items-center justify-between p-3 rounded-2xl transition-all cursor-pointer text-left group",
                      selectedClassId === c.id 
                        ? "bg-[#0071e3] text-white shadow-md" 
                        : "bg-transparent text-[#1d1d1f] hover:bg-[#f5f5f7]"
                    )}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setSelectedClassId(c.id);
                      }
                    }}
                  >
                    <span className="font-medium truncate pl-1">{c.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "h-8 w-8 rounded-full transition-opacity",
                        selectedClassId === c.id 
                          ? "text-white/80 hover:text-white hover:bg-white/10" 
                          : "text-[#ff3b30] opacity-0 group-hover:opacity-100"
                      )}
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
                  <div className="py-12 text-center border border-dashed border-[#d2d2d7] rounded-[24px]">
                    <p className="text-sm text-[#86868b] px-4 font-medium italic">No classes yet.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </aside>

        <section className="lg:col-span-3">
          {selectedClass ? (
            <Card className="rounded-[32px] border-[#d2d2d7] shadow-sm bg-white overflow-hidden min-h-[600px]">
              <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0 border-b border-[#f5f5f7] pb-8 mb-6">
                <div>
                  <h2 className="text-3xl font-semibold text-[#1d1d1f]">{selectedClass.name}</h2>
                  <p className="text-[#86868b] text-lg">Weekly Schedule</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                  />
                  <Button 
                    variant="outline"
                    className="flex-1 md:flex-none rounded-full border-[#0071e3] text-[#0071e3] hover:bg-[#0071e3]/5 font-medium px-6 py-5"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    AI Automate
                  </Button>
                  <Button 
                    onClick={() => addEntry(selectedClass.id)} 
                    className="flex-1 md:flex-none apple-button-primary px-6 py-5"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Slot
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-12">
                {daysOfWeek.map((day) => {
                  const dayEntries = selectedClass.entries.filter((e) => e.day === day);
                  return (
                    <div key={day} className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="bg-[#f5f5f7] text-[#1d1d1f] font-bold rounded-lg px-3 py-1 text-sm uppercase tracking-wide">
                          {day}
                        </Badge>
                        <div className="h-px bg-[#f5f5f7] flex-1" />
                      </div>
                      
                      <div className="space-y-3">
                        {dayEntries.length > 0 ? (
                          dayEntries.map((entry) => (
                            <div key={entry.id} className="flex flex-wrap items-center gap-4 p-5 rounded-[24px] border border-[#f5f5f7] bg-white hover:shadow-md transition-shadow group">
                              <div className="w-full md:w-[180px] space-y-1.5">
                                <Label className="text-[10px] font-bold uppercase tracking-wider text-[#86868b] flex items-center gap-1">
                                  <Clock className="h-3 w-3" /> Time Slot
                                </Label>
                                <Input
                                  value={entry.time}
                                  onChange={(e) => updateEntry(selectedClass.id, entry.id, 'time', e.target.value)}
                                  className="h-9 rounded-xl bg-[#f5f5f7] border-none focus-visible:ring-1 focus-visible:ring-[#0071e3]"
                                />
                              </div>
                              <div className="flex-1 min-w-[200px] space-y-1.5">
                                <Label className="text-[10px] font-bold uppercase tracking-wider text-[#86868b]">Course Name</Label>
                                <Input
                                  value={entry.course}
                                  onChange={(e) => updateEntry(selectedClass.id, entry.id, 'course', e.target.value)}
                                  className="h-9 rounded-xl bg-[#f5f5f7] border-none focus-visible:ring-1 focus-visible:ring-[#0071e3]"
                                />
                              </div>
                              <div className="w-full md:w-[150px] space-y-1.5">
                                <Label className="text-[10px] font-bold uppercase tracking-wider text-[#86868b]">Location</Label>
                                <Input
                                  value={entry.location}
                                  onChange={(e) => updateEntry(selectedClass.id, entry.id, 'location', e.target.value)}
                                  className="h-9 rounded-xl bg-[#f5f5f7] border-none focus-visible:ring-1 focus-visible:ring-[#0071e3]"
                                />
                              </div>
                              <div className="pt-5">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-[#ff3b30] hover:text-[#ff3b30] hover:bg-[#ff3b30]/10 rounded-full h-10 w-10 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => removeEntry(selectedClass.id, entry.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-8 text-center bg-[#f5f5f7]/50 rounded-[24px] border border-dashed border-[#d2d2d7]">
                            <p className="text-[#86868b] font-medium text-sm">No classes scheduled for {day}.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ) : (
            <div className="h-full min-h-[600px] flex flex-col items-center justify-center p-12 bg-[#f5f5f7]/30 rounded-[40px] border border-dashed border-[#d2d2d7] space-y-6 text-center animate-in zoom-in-95 duration-500">
              <div className="bg-white p-8 rounded-[32px] shadow-xl border border-[#f5f5f7]">
                <CalendarDays className="h-20 w-20 text-[#0071e3] opacity-20 mb-4 mx-auto" />
                <h3 className="text-2xl font-semibold text-[#1d1d1f]">Select a Class</h3>
                <p className="text-[#86868b] max-w-sm mx-auto mt-2 font-medium">
                  Choose a class group from the left sidebar to manage its weekly timetable or upload a new schedule.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 max-w-md w-full">
                <div className="p-4 bg-white/60 rounded-2xl border border-[#f5f5f7] text-left">
                  <div className="h-8 w-8 bg-[#0071e3]/10 rounded-lg flex items-center justify-center mb-2">
                    <Sparkles className="h-4 w-4 text-[#0071e3]" />
                  </div>
                  <p className="text-xs font-bold text-[#1d1d1f]">AI Extraction</p>
                  <p className="text-[10px] text-[#86868b]">Upload images to auto-fill</p>
                </div>
                <div className="p-4 bg-white/60 rounded-2xl border border-[#f5f5f7] text-left">
                  <div className="h-8 w-8 bg-[#0071e3]/10 rounded-lg flex items-center justify-center mb-2">
                    <LayoutGrid className="h-4 w-4 text-[#0071e3]" />
                  </div>
                  <p className="text-xs font-bold text-[#1d1d1f]">Clean View</p>
                  <p className="text-[10px] text-[#86868b]">Organized weekly slots</p>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
