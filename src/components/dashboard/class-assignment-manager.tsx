'use client';

import { useState, useActionState, useRef, startTransition, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useFirestore, useCollection } from '@/firebase';
import { collection, addDoc, deleteDoc, doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Sparkles, 
  CloudDownload, 
  FileText, 
  Loader2,
  Upload,
  FileSearch,
  Plus,
  Trash2,
  UserPlus,
  FileSpreadsheet,
  CheckCircle2,
  BookOpenCheck,
  Eraser,
  Layers,
  Users2,
  User,
  Download,
  ClipboardList,
  AlertCircle
} from 'lucide-react';
import { suggestAssignmentsAction, syncFromDriveAction, extractRosterAction } from '@/app/dashboard/assignments/actions';
import { toast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import { cn } from '@/lib/utils';

import * as pdfjsLib from 'pdfjs-dist';
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

interface Student {
  id: string;
  name: string;
  roll: string;
}

interface AssignmentTopicMapping {
  assigneeName: string;
  assigneeId: string;
  topic: string;
}

interface Assignment {
  id: string;
  title: string;
  type: string;
  grouping: 'Individual' | 'Team';
  teamSize?: number;
  createdAt: string;
  mappings: AssignmentTopicMapping[];
}

interface StudentSubmission {
  studentId: string;
  studentName: string;
  rollNumber: string;
  status: string;
  submittedAt: string | null;
  marks: number | null;
  plagiarismScore: number | null;
  fileName: string | null;
  aiFeedback: string | null;
}

export function ClassAssignmentManager({ classId }: { classId: string }) {
  const db = useFirestore();
  
  const rosterQuery = useMemo(() => {
    if (!db || !classId) return null;
    return collection(db, 'classes', classId, 'students');
  }, [db, classId]);
  const { data: roster = [] } = useCollection<Student>(rosterQuery);

  const assignmentsQuery = useMemo(() => {
    if (!db || !classId) return null;
    return collection(db, 'classes', classId, 'assignments');
  }, [db, classId]);
  const { data: assignments = [] } = useCollection<Assignment>(assignmentsQuery);

  const [syllabusInput, setSyllabusInput] = useState('');
  const [isImageUpload, setIsImageUpload] = useState(false);
  const [assignmentType, setAssignmentType] = useState<string>('');
  const [assignmentGrouping, setAssignmentGrouping] = useState<'Individual' | 'Team'>('Individual');
  const [teamSize, setTeamSize] = useState<number>(3);
  
  const [activeAssignmentId, setActiveAssignmentId] = useState<string>('');
  const [submissionsMap, setSubmissionsMap] = useState<Record<string, StudentSubmission[]>>({});
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isRosterUploading, setIsRosterUploading] = useState(false);
  const [driveLink, setDriveLink] = useState('');
  const [isDriveDialogOpen, setIsDriveDialogOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<StudentSubmission | null>(null);
  const [hideGenerationResult, setHideGenerationResult] = useState(false);
  
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentRoll, setNewStudentRoll] = useState('');

  const syllabusFileInputRef = useRef<HTMLInputElement>(null);
  const rosterFileInputRef = useRef<HTMLInputElement>(null);

  const [suggestionState, suggestionDispatch, isSuggesting] = useActionState(suggestAssignmentsAction, {
    message: null,
    errors: null,
    data: null,
  });

  useEffect(() => {
    if (assignments.length > 0 && !activeAssignmentId) {
      setActiveAssignmentId(assignments[assignments.length - 1].id);
    }
  }, [assignments, activeAssignmentId]);

  const handleAddStudent = () => {
    if (!newStudentName.trim() || !newStudentRoll.trim() || !db) return;
    addDoc(collection(db, 'classes', classId, 'students'), {
      name: newStudentName,
      roll: newStudentRoll,
    }).then(() => {
      setNewStudentName('');
      setNewStudentRoll('');
    });
  };

  const clearRoster = async () => {
    if (!db) return;
    const batch = writeBatch(db);
    roster.forEach(s => {
      batch.delete(doc(db, 'classes', classId, 'students', s.id));
    });
    await batch.commit();
    toast({ title: 'Roster Cleared', description: 'All student data for this class has been removed.' });
  };

  const handleSuggest = () => {
    if (!syllabusInput.trim() || !assignmentType || roster.length === 0) {
      if (roster.length === 0) {
        toast({ variant: 'destructive', title: 'Roster Required', description: 'Please add students to the roster first so AI knows how many topics to generate.' });
      } else {
        toast({ variant: 'destructive', title: 'Missing Info', description: 'Please provide syllabus content and select an assignment type.' });
      }
      return;
    }
    setHideGenerationResult(false);
    const count = assignmentGrouping === 'Individual' 
      ? roster.length 
      : Math.ceil(roster.length / teamSize);
    const formData = new FormData();
    formData.append('syllabusContent', syllabusInput);
    formData.append('isImage', isImageUpload.toString());
    formData.append('assignmentType', assignmentType);
    formData.append('grouping', assignmentGrouping);
    formData.append('count', count.toString());
    startTransition(() => { suggestionDispatch(formData); });
  };

  const finalizeAssignment = async () => {
    if (!suggestionState.data?.suggestedAssignments || !db) return;
    const topics = suggestionState.data.suggestedAssignments;
    const mappings: AssignmentTopicMapping[] = [];
    if (assignmentGrouping === 'Individual') {
      roster.forEach((student, index) => {
        mappings.push({
          assigneeName: student.name,
          assigneeId: student.roll,
          topic: topics[index] || topics[topics.length - 1] || 'General Research Topic'
        });
      });
    } else {
      for (let i = 0; i < roster.length; i += teamSize) {
        const teamMembers = roster.slice(i, i + teamSize);
        const teamName = `Team ${Math.floor(i / teamSize) + 1}`;
        const teamIds = teamMembers.map(m => m.roll).join(', ');
        mappings.push({
          assigneeName: `${teamName} (${teamMembers.map(m => m.name).join(', ')})`,
          assigneeId: teamIds,
          topic: topics[Math.floor(i / teamSize)] || topics[topics.length - 1] || 'General Team Topic'
        });
      }
    }
    const docRef = await addDoc(collection(db, 'classes', classId, 'assignments'), {
      title: `${assignmentType} - ${new Date().toLocaleDateString()}`,
      type: assignmentType,
      grouping: assignmentGrouping,
      teamSize: assignmentGrouping === 'Team' ? teamSize : null,
      mappings,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: serverTimestamp()
    });
    setActiveAssignmentId(docRef.id);
    setHideGenerationResult(true);
    toast({ title: 'Assignment Saved', description: `Topic distribution is now active for ${mappings.length} entries.` });
  };

  const handleSyncDrive = async () => {
    if (!driveLink || !activeAssignmentId || !db) return;
    setIsSyncing(true);
    try {
      const response = await syncFromDriveAction(classId, activeAssignmentId, driveLink, roster.map(s => ({ id: s.id, name: s.name, roll: s.roll })));
      if (response.success && response.data) {
        setSubmissionsMap(prev => ({ ...prev, [activeAssignmentId]: response.data as StudentSubmission[] }));
        setIsDriveDialogOpen(false);
        setDriveLink('');
        toast({ title: 'Sync Complete', description: `Processed submissions for ${response.data.length} students.` });
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Sync Failed', description: 'Could not connect to Google Drive.' });
    } finally {
      setIsSyncing(false);
    }
  };

  const downloadAssignmentSheet = (assignment: Assignment) => {
    const mappings = assignment.mappings || [];
    const csvContent = [["Assignee (Student/Team)", "ID/Roll Numbers", "Assigned Topic"], ...mappings.map(m => [m.assigneeName, m.assigneeId, m.topic])].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${assignment.title}_Distribution.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRosterUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !db) return;
    setIsRosterUploading(true);
    try {
      let extractedStudents: { name: string, roll: string }[] = [];
      const isExcel = file.name.match(/\.(xlsx|xls|csv)$/i);
      if (isExcel) {
        const dataBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(dataBuffer);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][];
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row) continue;
          const nameValue = String(row[1] || '').trim();
          const rollValue = String(row[0] || '').trim();
          if (!nameValue && !rollValue) continue;
          extractedStudents.push({ name: nameValue || 'Unknown', roll: rollValue || 'N/A' });
        }
      } else {
        let content = '';
        let isImage = false;
        if (file.type === 'application/pdf') {
          const arrayBuffer = await file.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            content += textContent.items.map((item: any) => item.str).join(' ') + '\n';
          }
        } else {
          const reader = new FileReader();
          content = await new Promise<string>(r => { reader.onload = () => r(reader.result as string); reader.readAsDataURL(file); });
          isImage = true;
        }
        const response = await extractRosterAction(content, isImage);
        if (response.success && response.data) extractedStudents = response.data.map((s: any) => ({ name: s.name, roll: s.rollNumber }));
      }
      const batch = writeBatch(db);
      extractedStudents.forEach(s => {
        const newDocRef = doc(collection(db, 'classes', classId, 'students'));
        batch.set(newDocRef, s);
      });
      await batch.commit();
      toast({ title: 'Roster Updated', description: `Imported ${extractedStudents.length} students.` });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Import Failed', description: error.message });
    } finally {
      setIsRosterUploading(false);
      if (rosterFileInputRef.current) rosterFileInputRef.current.value = '';
    }
  };

  const activeAssignment = assignments.find(a => a.id === activeAssignmentId);
  const activeSubmissions = activeAssignmentId ? (submissionsMap[activeAssignmentId] || (activeAssignment?.grouping === 'Individual' ? roster.map(s => ({ studentId: s.id, studentName: s.name, rollNumber: s.roll, status: 'Pending', submittedAt: null, marks: null, plagiarismScore: null, fileName: null, aiFeedback: null })) : [])) : [];

  return (
    <div className="space-y-6">
      <Tabs defaultValue="syllabus">
        <TabsList className="grid w-full grid-cols-3 h-12 bg-secondary/50 p-1">
          <TabsTrigger value="syllabus" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm font-semibold"><FileText className="mr-2 h-4 w-4" /> Syllabus & AI</TabsTrigger>
          <TabsTrigger value="roster" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm font-semibold"><UserPlus className="mr-2 h-4 w-4" /> Class Roster</TabsTrigger>
          <TabsTrigger value="submissions" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm font-semibold"><BookOpenCheck className="mr-2 h-4 w-4" /> Grading Hub</TabsTrigger>
        </TabsList>

        <TabsContent value="syllabus" className="space-y-6 mt-6">
          <Card className="rounded-[32px] border-[#d2d2d7] shadow-sm">
            <CardHeader><CardTitle className="text-3xl font-semibold tracking-tight text-[#1d1d1f]">AI Assignment Architect</CardTitle><CardDescription className="text-lg">Generate unique topics for every student based on your syllabus.</CardDescription></CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <Label className="text-sm font-bold uppercase tracking-wider text-[#86868b]">Step 1: Upload Syllabus</Label>
                  <input type="file" accept=".pdf,image/*" className="hidden" ref={syllabusFileInputRef} onChange={async (e) => {
                    const file = e.target.files?.[0]; if (!file) return; setIsExtracting(true);
                    try {
                      if (file.type === 'application/pdf') {
                        const arrayBuffer = await file.arrayBuffer(); const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                        let fullText = ''; for (let i = 1; i <= pdf.numPages; i++) { const page = await pdf.getPage(i); const content = await page.getTextContent(); fullText += content.items.map((item: any) => item.str).join(' ') + '\n'; }
                        setSyllabusInput(fullText); setIsImageUpload(false);
                      } else {
                        const reader = new FileReader(); const dataUri = await new Promise<string>(r => { reader.onload = () => r(reader.result as string); reader.readAsDataURL(file); });
                        setSyllabusInput(dataUri); setIsImageUpload(true);
                      }
                    } catch (err) { toast({ variant: 'destructive', title: 'Upload Error', description: 'Failed to read file.' }); } finally { setIsExtracting(false); }
                  }} />
                  <Button variant="outline" className="w-full rounded-full py-6 text-black font-semibold" onClick={() => syllabusFileInputRef.current?.click()} disabled={isExtracting}>{isExtracting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />} Upload Syllabus</Button>
                  <Textarea placeholder="Paste syllabus text here..." className="min-h-[120px] rounded-2xl text-black" value={syllabusInput} onChange={(e) => setSyllabusInput(e.target.value)} />
                </div>
                <div className="space-y-6">
                  <Label className="text-sm font-bold uppercase tracking-wider text-[#86868b]">Step 2: Assignment Details</Label>
                  <Select value={assignmentType} onValueChange={setAssignmentType}>
                    <SelectTrigger className="rounded-full py-6 text-black font-semibold"><SelectValue placeholder="Select type..." /></SelectTrigger>
                    <SelectContent className="rounded-2xl bg-white text-black">
                      <SelectItem value="Case Study" className="focus:bg-[#f5f5f7] focus:text-black text-black font-semibold">Case Study</SelectItem>
                      <SelectItem value="Research Paper" className="focus:bg-[#f5f5f7] focus:text-black text-black font-semibold">Research Paper</SelectItem>
                      <SelectItem value="Problem Set" className="focus:bg-[#f5f5f7] focus:text-black text-black font-semibold">Problem Set</SelectItem>
                      <SelectItem value="Essay" className="focus:bg-[#f5f5f7] focus:text-black text-black font-semibold">Essay</SelectItem>
                      <SelectItem value="Practical Lab Report" className="focus:bg-[#f5f5f7] focus:text-black text-black font-semibold">Practical Lab Report</SelectItem>
                    </SelectContent>
                  </Select>
                  <Label className="text-sm font-bold uppercase tracking-wider text-[#86868b]">Step 3: Mode</Label>
                  <div className="flex gap-4"><Button variant={assignmentGrouping === 'Individual' ? 'default' : 'outline'} className="flex-1 rounded-full py-6 font-semibold" onClick={() => setAssignmentGrouping('Individual')}><User className="mr-2 h-4 w-4" /> Individual</Button><Button variant={assignmentGrouping === 'Team' ? 'default' : 'outline'} className="flex-1 rounded-full py-6 font-semibold" onClick={() => setAssignmentGrouping('Team')}><Users2 className="mr-2 h-4 w-4" /> Team</Button></div>
                  {assignmentGrouping === 'Team' && <div className="space-y-2 animate-in fade-in slide-in-from-top-1"><Label className="text-sm font-bold uppercase tracking-wider text-[#86868b]">Students per Team</Label><Input type="number" min={2} max={15} value={teamSize} onChange={(e) => setTeamSize(parseInt(e.target.value))} className="rounded-full py-6 text-black font-semibold" /></div>}
                </div>
              </div>
              <div className="bg-[#f5f5f7] p-6 rounded-3xl border border-[#d2d2d7] text-center"><p className="text-lg font-medium text-[#1d1d1f]">Current Class Size: <span className="text-[#0066cc] font-bold">{roster.length} students</span></p><p className="text-sm text-[#86868b]">AI will generate {assignmentGrouping === 'Individual' ? roster.length : Math.ceil(roster.length / teamSize)} unique topics.</p></div>
              <Button onClick={handleSuggest} disabled={isSuggesting || roster.length === 0 || !assignmentType} className="w-full apple-button-primary py-7 font-bold text-lg shadow-lg">{isSuggesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />} Generate & Assign Unique Topics</Button>
            </CardContent>
          </Card>
          {!hideGenerationResult && suggestionState.data?.suggestedAssignments && (
            <Card className="rounded-[32px] border-[#0066cc]/30 shadow-lg animate-in zoom-in-95 duration-200"><CardHeader className="flex flex-row items-center justify-between"><div><CardTitle className="text-[#0066cc] flex items-center gap-2 text-2xl font-bold"><ClipboardList className="h-6 w-6" /> Generated Topic Distribution</CardTitle></div><Button onClick={finalizeAssignment} className="apple-button-primary font-bold"><CheckCircle2 className="mr-2 h-4 w-4" /> Confirm & Save to Class</Button></CardHeader><CardContent><div className="rounded-2xl border border-[#d2d2d7] max-h-[300px] overflow-auto"><Table><TableHeader><TableRow className="bg-[#f5f5f7]"><TableHead className="font-bold text-black">Index</TableHead><TableHead className="font-bold text-black">Suggested Topic</TableHead></TableRow></TableHeader><TableBody>{suggestionState.data.suggestedAssignments.map((topic: string, i: number) => (<TableRow key={i}><TableCell className="font-mono text-xs text-black font-semibold">{i + 1}</TableCell><TableCell className="text-sm text-black font-medium">{topic}</TableCell></TableRow>))}</TableBody></Table></div></CardContent></Card>
          )}
          {assignments.length > 0 && (
            <div className="space-y-6 pt-12"><h3 className="text-2xl font-semibold tracking-tight flex items-center gap-2 text-[#1d1d1f]"><Layers className="h-5 w-5" /> Active Class Assignments</h3><div className="grid gap-4">{assignments.map(a => (<Card key={a.id} className="hover:bg-white transition-colors border-[#d2d2d7] rounded-3xl shadow-sm border-l-4 border-l-[#0066cc]"><CardContent className="p-6 flex items-center justify-between"><div className="flex items-center gap-6"><div className="bg-[#0066cc]/10 p-3 rounded-2xl"><FileSpreadsheet className="h-6 w-6 text-[#0066cc]" /></div><div><p className="font-bold text-lg text-[#1d1d1f]">{a.title}</p><div className="flex gap-2 items-center mt-1"><Badge variant="outline" className="text-[10px] h-4 rounded-md font-bold">{a.type}</Badge><span className="text-xs text-[#86868b] font-medium">{(a.mappings || []).length} {a.grouping} Topics</span></div></div></div><div className="flex gap-4"><Button variant="ghost" size="sm" onClick={() => setActiveAssignmentId(a.id)} className={cn("rounded-full px-6 font-bold", activeAssignmentId === a.id ? 'bg-[#f5f5f7] text-black' : 'text-[#86868b]')}>{activeAssignmentId === a.id ? 'Active' : 'Select'}</Button><Button variant="outline" size="sm" className="rounded-full px-6 font-bold text-black" onClick={() => downloadAssignmentSheet(a)}><Download className="h-4 w-4 mr-2" /> Download Sheet</Button><Button variant="ghost" size="icon" onClick={() => db && deleteDoc(doc(db, 'classes', classId, 'assignments', a.id))} className="text-[#ff3b30] hover:text-[#ff3b30] hover:bg-[#ff3b30]/10 rounded-full"><Trash2 className="h-4 w-4" /></Button></div></CardContent></Card>))}</div></div>
          )}
        </TabsContent>

        <TabsContent value="roster" className="space-y-6 mt-6">
          <Card className="rounded-[32px] border-[#d2d2d7] shadow-sm"><CardHeader className="flex flex-row items-center justify-between space-y-0"><div><CardTitle className="text-2xl font-semibold text-[#1d1d1f]">Class Roster</CardTitle><CardDescription className="text-base">{activeAssignment ? `Showing topics for: ${activeAssignment.title}` : 'Add students or upload a roster list.'}</CardDescription></div><div className="flex gap-3"><Button variant="outline" size="sm" onClick={clearRoster} className="text-[#ff3b30] border-[#ff3b30] hover:bg-[#ff3b30]/10 rounded-full px-6 font-bold"><Eraser className="h-4 w-4 mr-2" /> Clear List</Button><input type="file" accept=".xlsx,.xls,.csv,.pdf,image/*" className="hidden" ref={rosterFileInputRef} onChange={handleRosterUpload} /><Button variant="secondary" size="sm" className="rounded-full px-6 text-black font-bold" onClick={() => rosterFileInputRef.current?.click()} disabled={isRosterUploading}>{isRosterUploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />} Import Roster</Button></div></CardHeader><CardContent className="space-y-6"><div className="flex gap-4"><Input placeholder="Roll No" className="w-[180px] rounded-full text-black font-semibold" value={newStudentRoll} onChange={e => setNewStudentRoll(e.target.value)} /><Input placeholder="Full Name" className="flex-1 rounded-full text-black font-semibold" value={newStudentName} onChange={e => setNewStudentName(e.target.value)} /><Button variant="outline" className="rounded-full w-12 h-12 text-[#0066cc] border-[#0066cc] hover:bg-[#0066cc]/10" onClick={handleAddStudent}><Plus className="h-5 w-5" /></Button></div><div className="rounded-2xl border border-[#d2d2d7] max-h-[500px] overflow-auto shadow-inner"><Table><TableHeader><TableRow className="bg-[#f5f5f7]"><TableHead className="font-bold text-black">Roll No / ID</TableHead><TableHead className="font-bold text-black">Name</TableHead>{activeAssignment && <TableHead className="font-bold text-black">Assigned Topic</TableHead>}<TableHead className="text-right font-bold text-black">Action</TableHead></TableRow></TableHeader><TableBody>{roster.map(s => { const mapping = activeAssignment?.mappings?.find(m => m.assigneeId.includes(s.roll)); return (<TableRow key={s.id} className="hover:bg-secondary/20"><TableCell className="font-mono text-xs text-black font-semibold">{s.roll}</TableCell><TableCell className="font-bold text-black">{s.name}</TableCell>{activeAssignment && (<TableCell className="text-sm italic text-[#86868b] max-w-[300px] truncate font-medium" title={mapping?.topic}>{mapping?.topic || 'TBD'}</TableCell>)}<TableCell className="text-right"><Button variant="ghost" size="icon" className="rounded-full hover:bg-[#ff3b30]/10" onClick={() => db && deleteDoc(doc(db, 'classes', classId, 'students', s.id))}><Trash2 className="h-4 w-4 text-[#ff3b30]" /></Button></TableCell></TableRow>);})}{roster.length === 0 && <TableRow><TableCell colSpan={activeAssignment ? 4 : 3} className="text-center py-24 text-[#86868b] italic font-medium">Roster is empty. Import a list to get started.</TableCell></TableRow>}</TableBody></Table></div></CardContent></Card>
        </TabsContent>

        <TabsContent value="submissions" className="space-y-6 mt-6">
          <Card className="rounded-[32px] border-[#d2d2d7] shadow-sm"><CardHeader className="flex flex-row items-center justify-between"><div><CardTitle className="text-2xl font-semibold text-[#1d1d1f]">Grading Hub</CardTitle><CardDescription className="text-base">Track submissions and AI analysis.</CardDescription></div><div className="flex gap-4">
            <Select value={activeAssignmentId} onValueChange={setActiveAssignmentId}>
              <SelectTrigger className="w-[280px] rounded-full py-6 text-black font-bold"><SelectValue placeholder="Select Assignment" /></SelectTrigger>
              <SelectContent className="rounded-2xl bg-white text-black">
                {assignments.map(a => <SelectItem key={a.id} value={a.id} className="focus:bg-[#f5f5f7] focus:text-black text-black font-semibold">{a.title}</SelectItem>)}
              </SelectContent>
            </Select>
            <Dialog open={isDriveDialogOpen} onOpenChange={setIsDriveDialogOpen}><DialogTrigger asChild><Button className="apple-button-primary font-bold" disabled={!activeAssignmentId || roster.length === 0}>{isSyncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CloudDownload className="mr-2 h-4 w-4" />} Analyze Drive</Button></DialogTrigger><DialogContent className="rounded-[32px] bg-white border-[#d2d2d7] shadow-2xl"><DialogHeader><DialogTitle className="text-[#1d1d1f] font-bold text-xl">Connect Submission Folder</DialogTitle></DialogHeader><div className="py-6 space-y-4"><div className="space-y-2"><Label className="text-sm font-bold uppercase tracking-wider text-[#86868b]">Google Drive Link</Label><Input placeholder="https://drive.google.com/..." className="rounded-full py-6 text-black font-semibold" value={driveLink} onChange={e => setDriveLink(e.target.value)} /></div></div><DialogFooter><Button onClick={handleSyncDrive} disabled={!driveLink} className="apple-button-primary w-full font-bold py-6">Start Sync</Button></DialogFooter></DialogContent></Dialog></div></CardHeader><CardContent>{!activeAssignmentId ? (<div className="flex flex-col items-center justify-center p-24 border-2 border-dashed rounded-[32px] bg-[#f5f5f7]/50"><AlertCircle className="h-16 w-16 text-[#86868b] opacity-20 mb-6" /><p className="text-lg text-[#86868b] font-medium">Select an assignment to begin grading.</p></div>) : (<><div className="mb-6 flex flex-wrap gap-3"><Badge variant="secondary" className="flex gap-2 items-center px-4 py-1.5 rounded-full bg-[#f5f5f7] border-[#d2d2d7] text-black font-bold"><Layers className="h-3 w-3" /> {activeAssignment?.type}</Badge><Badge variant="secondary" className="flex gap-2 items-center px-4 py-1.5 rounded-full bg-[#f5f5f7] border-[#d2d2d7] text-black font-bold">{activeAssignment?.grouping === 'Individual' ? <User className="h-3 w-3" /> : <Users2 className="h-3 w-3" />} {activeAssignment?.grouping}</Badge><Badge variant="outline" className="px-4 py-1.5 rounded-full border-[#d2d2d7] text-black font-bold">{activeSubmissions.length} Total Entries</Badge></div><div className="rounded-[24px] border border-[#d2d2d7] overflow-hidden shadow-sm"><Table><TableHeader><TableRow className="bg-[#f5f5f7]"><TableHead className="font-bold text-black">{activeAssignment?.grouping === 'Individual' ? 'Student' : 'Team / Members'}</TableHead><TableHead className="font-bold text-black">Status</TableHead><TableHead className="font-bold text-black">AI Plagiarism</TableHead><TableHead className="text-right font-bold text-black">Grade & Feedback</TableHead></TableRow></TableHeader><TableBody>{activeSubmissions.map(sub => (<TableRow key={sub.studentId} className="hover:bg-secondary/20 transition-colors"><TableCell><div><p className="font-bold text-[#1d1d1f]">{sub.studentName}</p><p className="text-xs text-[#86868b] font-mono font-bold">{sub.rollNumber}</p></div></TableCell><TableCell><Badge className="rounded-full px-3 font-bold" variant={sub.status === 'Submitted' ? 'secondary' : sub.status === 'Late' ? 'destructive' : 'outline'}>{sub.status}</Badge></TableCell><TableCell>{sub.plagiarismScore !== null && <div className="flex items-center gap-3"><Progress value={sub.plagiarismScore * 100} className="w-[80px] h-1.5" /><span className="text-[10px] font-bold text-black">{(sub.plagiarismScore * 100).toFixed(0)}%</span></div>}</TableCell><TableCell className="text-right"><div className="flex items-center justify-end gap-3">{sub.marks && <span className="font-bold text-[#0066cc] text-lg">{sub.marks}%</span>}<Button variant="ghost" size="icon" className="rounded-full hover:bg-[#0066cc]/10" onClick={() => setSelectedSubmission(sub)} disabled={!sub.fileName}><FileSearch className="h-4 w-4 text-[#0066cc]" /></Button></div></TableCell></TableRow>))}</TableBody></Table></div></>)}</CardContent></Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedSubmission} onOpenChange={o => !o && setSelectedSubmission(null)}>
        <DialogContent className="rounded-[32px] p-8 max-w-2xl bg-white shadow-2xl border-[#d2d2d7]"><DialogHeader><DialogTitle className="text-2xl font-bold text-[#1d1d1f]">Submission Analysis</DialogTitle></DialogHeader>{selectedSubmission && (<div className="space-y-8 py-6"><div className="flex justify-between items-center border-b border-[#d2d2d7] pb-6"><div className="space-y-1"><span className="font-bold text-xl block text-[#1d1d1f]">{selectedSubmission.studentName}</span><span className="text-sm text-[#86868b] font-semibold">ID: {selectedSubmission.rollNumber}</span></div><div className="text-right"><span className="text-[#0066cc] font-bold text-4xl">{selectedSubmission.marks}</span><span className="text-[#86868b] text-xl font-bold">/100</span></div></div><div className="space-y-4"><p className="text-xs font-bold uppercase tracking-widest text-[#86868b] flex items-center gap-2"><Sparkles className="h-4 w-4 text-[#0066cc]" /> AI Feedback</p><div className="text-lg leading-relaxed italic p-8 bg-[#f5f5f7] rounded-[24px] border border-[#d2d2d7] text-[#1d1d1f] font-medium">"{selectedSubmission.aiFeedback}"</div></div></div>)}<DialogFooter><Button onClick={() => setSelectedSubmission(null)} className="apple-button-primary w-full font-bold py-6">Done</Button></DialogFooter></DialogContent>
      </Dialog>
    </div>
  );
}
