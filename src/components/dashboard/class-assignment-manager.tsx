
'use client';

import { useState, useActionState, useRef, startTransition, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  Users, 
  Loader2,
  Upload,
  FileSearch,
  Plus,
  Trash2,
  UserPlus,
  FileSpreadsheet,
  CheckCircle2,
  BookOpenCheck,
  Eraser
} from 'lucide-react';
import { suggestAssignmentsAction, syncFromDriveAction, extractRosterAction } from '@/app/dashboard/assignments/actions';
import { toast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

// pdfjs initialization
import * as pdfjsLib from 'pdfjs-dist';
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

interface Student {
  id: string;
  name: string;
  roll: string;
}

interface Assignment {
  id: string;
  title: string;
  createdAt: string;
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
  const [syllabusInput, setSyllabusInput] = useState('');
  const [isImageUpload, setIsImageUpload] = useState(false);
  const [roster, setRoster] = useState<Student[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [activeAssignmentId, setActiveAssignmentId] = useState<string>('');
  const [submissionsMap, setSubmissionsMap] = useState<Record<string, StudentSubmission[]>>({});
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isRosterUploading, setIsRosterUploading] = useState(false);
  const [driveLink, setDriveLink] = useState('');
  const [isDriveDialogOpen, setIsDriveDialogOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<StudentSubmission | null>(null);
  
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
    const savedRoster = localStorage.getItem(`roster_${classId}`);
    if (savedRoster) setRoster(JSON.parse(savedRoster));
    else setRoster([]);

    const savedAssignments = localStorage.getItem(`assignments_${classId}`);
    if (savedAssignments) {
      const parsed = JSON.parse(savedAssignments);
      setAssignments(parsed);
      if (parsed.length > 0) setActiveAssignmentId(parsed[0].id);
    } else {
      setAssignments([]);
      setActiveAssignmentId('');
    }

    const savedSubmissions = localStorage.getItem(`submissions_${classId}`);
    if (savedSubmissions) setSubmissionsMap(JSON.parse(savedSubmissions));
    else setSubmissionsMap({});
  }, [classId]);

  const saveRoster = (newRoster: Student[]) => {
    setRoster(newRoster);
    localStorage.setItem(`roster_${classId}`, JSON.stringify(newRoster));
  };

  const clearRoster = () => {
    saveRoster([]);
    toast({ title: 'Roster Cleared', description: 'All student data for this class has been removed.' });
  };

  const saveAssignments = (newAssignments: Assignment[]) => {
    setAssignments(newAssignments);
    localStorage.setItem(`assignments_${classId}`, JSON.stringify(newAssignments));
  };

  const saveSubmissions = (newMap: Record<string, StudentSubmission[]>) => {
    setSubmissionsMap(newMap);
    localStorage.setItem(`submissions_${classId}`, JSON.stringify(newMap));
  };

  const handleAddAssignment = (title: string) => {
    const newAssignment: Assignment = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      createdAt: new Date().toISOString(),
    };
    const updated = [...assignments, newAssignment];
    saveAssignments(updated);
    if (!activeAssignmentId) setActiveAssignmentId(newAssignment.id);
    toast({ title: 'Assignment Created', description: `"${title}" added to class.` });
  };

  const addStudent = () => {
    if (!newStudentName.trim() || !newStudentRoll.trim()) return;
    const newStudent = { id: Math.random().toString(36).substr(2, 9), name: newStudentName, roll: newStudentRoll };
    saveRoster([...roster, newStudent]);
    setNewStudentName('');
    setNewStudentRoll('');
  };

  const handleSyncDrive = async () => {
    if (!driveLink || !activeAssignmentId || roster.length === 0) {
      toast({ variant: 'destructive', title: 'Action Required', description: 'Ensure assignment is selected, roster is set, and link is provided.' });
      return;
    }

    setIsSyncing(true);
    setIsDriveDialogOpen(false);
    
    try {
      const response = await syncFromDriveAction(classId, activeAssignmentId, driveLink, roster);
      if (response.success && response.data) {
        const newMap = { ...submissionsMap, [activeAssignmentId]: response.data };
        saveSubmissions(newMap);
        toast({ title: 'Analysis Complete', description: `Processed ${roster.length} students.` });
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Sync Failed', description: 'Could not analyze files.' });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSuggest = () => {
    if (!syllabusInput.trim()) return;
    const formData = new FormData();
    formData.append('syllabusContent', syllabusInput);
    formData.append('isImage', isImageUpload.toString());
    startTransition(() => {
      suggestionDispatch(formData);
    });
  };

  const activeSubmissions = activeAssignmentId ? (submissionsMap[activeAssignmentId] || roster.map(s => ({
    studentId: s.id,
    studentName: s.name,
    rollNumber: s.roll,
    status: 'Pending',
    submittedAt: null,
    marks: null,
    plagiarismScore: null,
    fileName: null,
    aiFeedback: null
  }))) : [];

  const handleRosterUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsRosterUploading(true);
    
    try {
      const isExcel = file.name.match(/\.(xlsx|xls|csv)$/i);
      
      if (isExcel) {
        const dataBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(dataBuffer);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][];
        
        if (!rows || rows.length === 0) throw new Error('File is empty.');

        let nameColIdx = -1;
        let rollColIdx = -1;
        let headerRowIdx = -1;

        // More specific keywords for better accuracy
        const nameKeywords = ['name', 'student', 'candidate', 'full name', 'member'];
        const rollKeywords = ['roll', 'reg', 'enrol', 'admission', 'id', 'student id', 'uax', 'uad'];
        const skipKeywords = ['s.no', 'sno', 'sl.no', 'serial', 'index', 'mobile', 'phone', 'contact', 'whatsapp', 'email'];

        // 1. SCAN FOR HEADERS
        for (let i = 0; i < Math.min(rows.length, 30); i++) {
          const row = rows[i];
          if (!row || row.length < 2) continue;
          
          let potentialNameIdx = -1;
          let potentialRollIdx = -1;

          for (let j = 0; j < row.length; j++) {
            const val = String(row[j] || '').toLowerCase().trim();
            if (val === '') continue;

            // Specifically avoid serial number or contact number columns
            if (skipKeywords.some(k => val.includes(k))) continue;

            if (potentialNameIdx === -1 && nameKeywords.some(k => val.includes(k))) potentialNameIdx = j;
            if (potentialRollIdx === -1 && rollKeywords.some(k => val.includes(k))) potentialRollIdx = j;
          }

          if (potentialNameIdx !== -1 && potentialRollIdx !== -1) {
            nameColIdx = potentialNameIdx;
            rollColIdx = potentialRollIdx;
            headerRowIdx = i;
            break;
          }
        }

        // 2. FALLBACK PATTERN DETECTION (Improved to skip mobile numbers)
        if (nameColIdx === -1 || rollColIdx === -1) {
          for (let i = 0; i < Math.min(rows.length, 20); i++) {
            const row = rows[i];
            if (!row || row.length < 2) continue;

            let colCandidates: { idx: number; type: 'serial' | 'roll' | 'name' | 'mobile' }[] = [];

            for (let j = 0; j < row.length; j++) {
              const val = String(row[j] || '').trim();
              if (val.length === 0) continue;

              const isSequentialInt = /^\d+$/.test(val) && parseInt(val) < 200; // Small numbers are likely serials
              const isMobile = /^\d{10}$/.test(val) || (val.length >= 10 && /^\d+$/.test(val)); // 10 digits are likely mobiles
              const hasDigits = /\d/.test(val);
              const isAlpha = /^[a-zA-Z\s.]+$/.test(val);
              
              if (isMobile) colCandidates.push({ idx: j, type: 'mobile' });
              else if (isSequentialInt) colCandidates.push({ idx: j, type: 'serial' });
              else if (hasDigits && val.length > 2) colCandidates.push({ idx: j, type: 'roll' });
              else if (isAlpha && val.length > 3) colCandidates.push({ idx: j, type: 'name' });
            }

            // Prefer columns that aren't mobile or serial
            const bestName = colCandidates.find(c => c.type === 'name');
            const bestRoll = colCandidates.find(c => c.type === 'roll');

            if (bestName && bestRoll) {
              nameColIdx = bestName.idx;
              rollColIdx = bestRoll.idx;
              headerRowIdx = i - 1;
              break;
            }
          }
        }

        // Final Default Guess
        if (nameColIdx === -1) nameColIdx = 1;
        if (rollColIdx === -1) rollColIdx = 0;

        const extractedStudents: Student[] = [];
        const seen = new Set();

        for (let i = headerRowIdx + 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row) continue;
          
          const nameValue = String(row[nameColIdx] || '').trim();
          const rollValue = String(row[rollColIdx] || '').trim();
          
          if (!nameValue && !rollValue) continue;
          // Skip rows that look like headers we found
          if (nameKeywords.includes(nameValue.toLowerCase())) continue;

          const key = `${rollValue}-${nameValue}`;
          if (seen.has(key)) continue;
          seen.add(key);

          extractedStudents.push({
            id: Math.random().toString(36).substr(2, 9),
            roll: rollValue || 'N/A',
            name: nameValue || 'Unknown Student'
          });
        }

        if (extractedStudents.length === 0) throw new Error('Could not extract any student data.');
        
        // REPLACE roster with newly uploaded one
        saveRoster(extractedStudents);
        toast({ title: 'Roster Replaced', description: `Imported ${extractedStudents.length} students from file.` });
      } else {
        // AI extraction for PDF/Images
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
        if (response.success && response.data) {
          const students = response.data.map((s: any) => ({
            id: Math.random().toString(36).substr(2, 9),
            name: s.name,
            roll: s.rollNumber
          }));
          saveRoster(students); // REPLACE
          toast({ title: 'Roster Replaced', description: `AI extracted ${students.length} students.` });
        } else {
          throw new Error(response.error);
        }
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Import Failed', description: error.message || 'Failed to process file.' });
    } finally {
      setIsRosterUploading(false);
      if (rosterFileInputRef.current) rosterFileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="syllabus">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="syllabus"><FileText className="mr-2 h-4 w-4" /> Syllabus & AI</TabsTrigger>
          <TabsTrigger value="roster"><UserPlus className="mr-2 h-4 w-4" /> Class Roster</TabsTrigger>
          <TabsTrigger value="submissions"><BookOpenCheck className="mr-2 h-4 w-4" /> Grading Hub</TabsTrigger>
        </TabsList>

        <TabsContent value="syllabus" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>AI Assignment Architect</CardTitle>
              <CardDescription>Upload syllabus to generate and formalize class assignments.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <input type="file" accept=".pdf,image/*" className="hidden" ref={syllabusFileInputRef} onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setIsExtracting(true);
                  try {
                    if (file.type === 'application/pdf') {
                      const arrayBuffer = await file.arrayBuffer();
                      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                      let fullText = '';
                      for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const content = await page.getTextContent();
                        fullText += content.items.map((item: any) => item.str).join(' ') + '\n';
                      }
                      setSyllabusInput(fullText);
                      setIsImageUpload(false);
                    } else {
                      const reader = new FileReader();
                      const dataUri = await new Promise<string>(r => { reader.onload = () => r(reader.result as string); reader.readAsDataURL(file); });
                      setSyllabusInput(dataUri);
                      setIsImageUpload(true);
                    }
                  } catch (err) {
                    toast({ variant: 'destructive', title: 'Upload Error', description: 'Failed to read file.' });
                  } finally {
                    setIsExtracting(false);
                  }
                }} />
                <Button variant="outline" className="w-full" onClick={() => syllabusFileInputRef.current?.click()} disabled={isExtracting}>
                  {isExtracting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                  Upload Syllabus (PDF/IMG)
                </Button>
              </div>
              <Textarea placeholder="Or paste syllabus here..." className="min-h-[100px]" value={syllabusInput} onChange={(e) => setSyllabusInput(e.target.value)} />
              <Button onClick={handleSuggest} disabled={isSuggesting || syllabusInput.length < 5} className="w-full">
                {isSuggesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Generate Assignments
              </Button>
            </CardContent>
          </Card>

          {suggestionState.data?.suggestedAssignments && (
            <div className="grid gap-4">
              <h3 className="font-bold flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-primary" /> AI Suggested Tasks</h3>
              {suggestionState.data.suggestedAssignments.map((q: string, i: number) => (
                <Card key={i} className="hover:border-primary/50 transition-colors">
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <p className="text-sm font-medium">{q}</p>
                    <Button size="sm" onClick={() => handleAddAssignment(q)} variant="secondary">
                      <Plus className="h-3.5 w-3.5 mr-1" /> Add to Class
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="roster" className="space-y-6 mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Student Directory</CardTitle>
                <CardDescription>Populate the roster for automated tracking.</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={clearRoster} className="text-destructive">
                  <Eraser className="h-4 w-4 mr-2" />
                  Clear List
                </Button>
                <input 
                  type="file" 
                  accept=".xlsx,.xls,.csv,.pdf,image/*" 
                  className="hidden" 
                  ref={rosterFileInputRef} 
                  onChange={handleRosterUpload} 
                />
                <Button variant="secondary" size="sm" onClick={() => rosterFileInputRef.current?.click()} disabled={isRosterUploading}>
                  {isRosterUploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileSpreadsheet className="h-4 w-4 mr-2" />}
                  Import & Replace
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input placeholder="Roll No" className="w-[150px]" value={newStudentRoll} onChange={e => setNewStudentRoll(e.target.value)} />
                <Input placeholder="Full Name" className="flex-1" value={newStudentName} onChange={e => setNewStudentName(e.target.value)} />
                <Button variant="outline" onClick={addStudent}><Plus className="h-4 w-4" /></Button>
              </div>
              <div className="rounded-md border max-h-[400px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Roll No / ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roster.map(s => (
                      <TableRow key={s.id}>
                        <TableCell className="font-mono text-xs">{s.roll}</TableCell>
                        <TableCell className="font-medium">{s.name}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => saveRoster(roster.filter(x => x.id !== s.id))}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {roster.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-8 text-muted-foreground italic">
                          No students in roster. Use the fields above or Import Roster.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="submissions" className="space-y-6 mt-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="space-y-1">
                  <CardTitle>Assignment Gradebook</CardTitle>
                  <CardDescription>Select a task and analyze submissions from your shared folder.</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Select value={activeAssignmentId} onValueChange={setActiveAssignmentId}>
                    <SelectTrigger className="w-[200px]"><SelectValue placeholder="Select Assignment" /></SelectTrigger>
                    <SelectContent>
                      {assignments.map(a => <SelectItem key={a.id} value={a.id}>{a.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Dialog open={isDriveDialogOpen} onOpenChange={setIsDriveDialogOpen}>
                    <DialogTrigger asChild>
                      <Button disabled={!activeAssignmentId || roster.length === 0}>
                        {isSyncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CloudDownload className="mr-2 h-4 w-4" />}
                        Analyze Drive
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Connect Submission Folder</DialogTitle><DialogDescription>Analyze folder for assignment: {assignments.find(a => a.id === activeAssignmentId)?.title}</DialogDescription></DialogHeader>
                      <div className="py-4 space-y-2">
                        <Label>Google Drive Link</Label>
                        <Input placeholder="https://drive.google.com/..." value={driveLink} onChange={e => setDriveLink(e.target.value)} />
                      </div>
                      <DialogFooter><Button onClick={handleSyncDrive} disabled={!driveLink}>Start Analysis</Button></DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student (Roll)</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Submission Date</TableHead>
                        <TableHead>AI Plagiarism</TableHead>
                        <TableHead className="text-right">Score & Feedback</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeSubmissions.map(sub => (
                        <TableRow key={sub.studentId}>
                          <TableCell><div><p className="font-bold">{sub.studentName}</p><p className="text-xs text-muted-foreground font-mono">{sub.rollNumber}</p></div></TableCell>
                          <TableCell><Badge variant={sub.status === 'Submitted' ? 'secondary' : sub.status === 'Late' ? 'destructive' : 'outline'}>{sub.status}</Badge></TableCell>
                          <TableCell className="text-sm">{sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString() : '-'}</TableCell>
                          <TableCell>
                            {sub.plagiarismScore !== null && (
                              <div className="flex items-center gap-2"><Progress value={sub.plagiarismScore * 100} className="w-[60px] h-2" /><span className="text-[10px]">{(sub.plagiarismScore * 100).toFixed(0)}%</span></div>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {sub.marks && <span className="font-bold text-primary">{sub.marks}%</span>}
                              <Button variant="ghost" size="icon" onClick={() => setSelectedSubmission(sub)} disabled={!sub.fileName}><FileSearch className="h-4 w-4" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {assignments.length === 0 && (
                        <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground italic">No assignments created yet. Go to Syllabus tab to generate tasks.</TableCell></TableRow>
                      )}
                      {assignments.length > 0 && roster.length === 0 && (
                        <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground italic">Roster is empty. Import students in the Roster tab first.</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedSubmission} onOpenChange={o => !o && setSelectedSubmission(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Detailed Analysis Result</DialogTitle></DialogHeader>
          {selectedSubmission && (
            <div className="space-y-4 py-4">
              <div className="flex justify-between border-b pb-2"><span className="font-bold">{selectedSubmission.studentName}</span><span className="text-primary font-bold">Grade: {selectedSubmission.marks}/100</span></div>
              <div className="space-y-2"><p className="text-xs font-bold uppercase text-muted-foreground">AI Evaluator Feedback</p><div className="text-sm italic p-4 bg-secondary/50 rounded-lg border">"{selectedSubmission.aiFeedback}"</div></div>
              <div className="flex items-center justify-between text-xs text-muted-foreground"><span>Source File: {selectedSubmission.fileName}</span><span>Status: {selectedSubmission.status}</span></div>
            </div>
          )}
          <DialogFooter><Button onClick={() => setSelectedSubmission(null)}>Close Report</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
