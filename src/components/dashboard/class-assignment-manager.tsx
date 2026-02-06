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
  ClipboardList
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

interface AssignmentTopicMapping {
  assigneeName: string; // Student Name or Team Name
  assigneeId: string;   // Student Roll or Team ID
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
  const [syllabusInput, setSyllabusInput] = useState('');
  const [isImageUpload, setIsImageUpload] = useState(false);
  const [assignmentType, setAssignmentType] = useState<string>('');
  const [assignmentGrouping, setAssignmentGrouping] = useState<'Individual' | 'Team'>('Individual');
  const [teamSize, setTeamSize] = useState<number>(3);
  
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
      else setActiveAssignmentId('');
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

  const handleSuggest = () => {
    if (!syllabusInput.trim() || !assignmentType || roster.length === 0) {
      if (roster.length === 0) {
        toast({ variant: 'destructive', title: 'Roster Required', description: 'Please add students to the roster first so AI knows how many topics to generate.' });
      }
      return;
    }

    const count = assignmentGrouping === 'Individual' 
      ? roster.length 
      : Math.ceil(roster.length / teamSize);

    const formData = new FormData();
    formData.append('syllabusContent', syllabusInput);
    formData.append('isImage', isImageUpload.toString());
    formData.append('assignmentType', assignmentType);
    formData.append('grouping', assignmentGrouping);
    formData.append('count', count.toString());

    startTransition(() => {
      suggestionDispatch(formData);
    });
  };

  const finalizeAssignment = () => {
    if (!suggestionState.data?.suggestedAssignments) return;

    const topics = suggestionState.data.suggestedAssignments;
    const mappings: AssignmentTopicMapping[] = [];

    if (assignmentGrouping === 'Individual') {
      roster.forEach((student, index) => {
        mappings.push({
          assigneeName: student.name,
          assigneeId: student.roll,
          topic: topics[index] || topics[topics.length - 1] || 'TBD'
        });
      });
    } else {
      // Grouping into teams
      for (let i = 0; i < roster.length; i += teamSize) {
        const teamMembers = roster.slice(i, i + teamSize);
        const teamName = `Team ${Math.floor(i / teamSize) + 1}`;
        const teamIds = teamMembers.map(m => m.roll).join(', ');
        mappings.push({
          assigneeName: `${teamName} (${teamMembers.map(m => m.name).join(', ')})`,
          assigneeId: teamIds,
          topic: topics[Math.floor(i / teamSize)] || topics[topics.length - 1] || 'TBD'
        });
      }
    }

    const newAssignment: Assignment = {
      id: Math.random().toString(36).substr(2, 9),
      title: `${assignmentType} - ${new Date().toLocaleDateString()}`,
      type: assignmentType,
      grouping: assignmentGrouping,
      teamSize: assignmentGrouping === 'Team' ? teamSize : undefined,
      createdAt: new Date().toISOString(),
      mappings
    };

    const updated = [...assignments, newAssignment];
    saveAssignments(updated);
    setActiveAssignmentId(newAssignment.id);
    toast({ title: 'Assignment Finalized', description: `Assigned ${mappings.length} unique topics to your class.` });
  };

  const downloadAssignmentSheet = (assignment: Assignment) => {
    const mappings = assignment.mappings || [];
    const csvContent = [
      ["Assignee (Student/Team)", "ID/Roll Numbers", "Assigned Topic"],
      ...mappings.map(m => [m.assigneeName, m.assigneeId, m.topic])
    ].map(e => e.join(",")).join("\n");

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

  const addStudent = () => {
    if (!newStudentName.trim() || !newStudentRoll.trim()) return;
    const newStudent = { id: Math.random().toString(36).substr(2, 9), name: newStudentName, roll: newStudentRoll };
    saveRoster([...roster, newStudent]);
    setNewStudentName('');
    setNewStudentRoll('');
  };

  const handleSyncDrive = async () => {
    if (!driveLink || !activeAssignmentId || roster.length === 0) return;

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

        const nameKeywords = ['name', 'student', 'candidate', 'full name', 'member'];
        const rollKeywords = ['roll', 'reg', 'enrol', 'admission', 'id', 'student id', 'uax', 'uad'];
        const skipKeywords = ['s.no', 'sno', 'sl.no', 'serial', 'index', 'mobile', 'phone', 'contact', 'whatsapp', 'email'];

        for (let i = 0; i < Math.min(rows.length, 30); i++) {
          const row = rows[i];
          if (!row || row.length < 2) continue;
          
          let potentialNameIdx = -1;
          let potentialRollIdx = -1;

          for (let j = 0; j < row.length; j++) {
            const val = String(row[j] || '').toLowerCase().trim();
            if (val === '') continue;
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

        if (nameColIdx === -1) nameColIdx = 1;
        if (rollColIdx === -1) rollColIdx = 0;

        const extractedStudents: Student[] = [];
        for (let i = headerRowIdx + 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row) continue;
          const nameValue = String(row[nameColIdx] || '').trim();
          const rollValue = String(row[rollColIdx] || '').trim();
          if (!nameValue && !rollValue) continue;
          extractedStudents.push({
            id: Math.random().toString(36).substr(2, 9),
            roll: rollValue || 'N/A',
            name: nameValue || 'Unknown'
          });
        }
        saveRoster(extractedStudents);
        toast({ title: 'Roster Updated', description: `Imported ${extractedStudents.length} students.` });
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
        if (response.success && response.data) {
          const students = response.data.map((s: any) => ({
            id: Math.random().toString(36).substr(2, 9),
            name: s.name,
            roll: s.rollNumber
          }));
          saveRoster(students);
          toast({ title: 'Roster Updated', description: `AI extracted ${students.length} students.` });
        }
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Import Failed', description: error.message });
    } finally {
      setIsRosterUploading(false);
      if (rosterFileInputRef.current) rosterFileInputRef.current.value = '';
    }
  };

  const activeAssignment = assignments.find(a => a.id === activeAssignmentId);
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
              <CardDescription>Generate unique topics for every student based on your syllabus.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Step 1: Upload Syllabus</Label>
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
                    <Textarea placeholder="Paste syllabus text here..." className="min-h-[100px]" value={syllabusInput} onChange={(e) => setSyllabusInput(e.target.value)} />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Step 2: Assignment Details</Label>
                    <Select value={assignmentType} onValueChange={setAssignmentType}>
                      <SelectTrigger><SelectValue placeholder="Select type..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Case Study">Case Study</SelectItem>
                        <SelectItem value="Research Paper">Research Paper</SelectItem>
                        <SelectItem value="Problem Set">Problem Set</SelectItem>
                        <SelectItem value="Essay">Essay</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Step 3: Mode</Label>
                    <div className="flex gap-2">
                      <Button variant={assignmentGrouping === 'Individual' ? 'default' : 'outline'} className="flex-1" onClick={() => setAssignmentGrouping('Individual')}><User className="mr-2 h-4 w-4" /> Individual</Button>
                      <Button variant={assignmentGrouping === 'Team' ? 'default' : 'outline'} className="flex-1" onClick={() => setAssignmentGrouping('Team')}><Users2 className="mr-2 h-4 w-4" /> Team</Button>
                    </div>
                  </div>

                  {assignmentGrouping === 'Team' && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                      <Label>Students per Team</Label>
                      <Input type="number" min={2} max={10} value={teamSize} onChange={(e) => setTeamSize(parseInt(e.target.value))} />
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg border border-dashed text-center">
                <p className="text-sm font-medium">
                  Current Class Size: <span className="text-primary font-bold">{roster.length} students</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  AI will generate {assignmentGrouping === 'Individual' ? roster.length : Math.ceil(roster.length / teamSize)} unique topics.
                </p>
              </div>

              <Button onClick={handleSuggest} disabled={isSuggesting || roster.length === 0 || !assignmentType} className="w-full">
                {isSuggesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Generate & Assign Unique Topics
              </Button>
            </CardContent>
          </Card>

          {suggestionState.data?.suggestedAssignments && (
            <Card className="border-primary/50 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-primary flex items-center gap-2"><ClipboardList className="h-5 w-5" /> Generated Topic Distribution</CardTitle>
                  <CardDescription>AI has created unique topics for your class size.</CardDescription>
                </div>
                <Button onClick={finalizeAssignment}>Confirm & Save to Roster</Button>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border max-h-[300px] overflow-auto">
                  <Table>
                    <TableHeader><TableRow><TableHead>Index</TableHead><TableHead>Suggested Topic</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {suggestionState.data.suggestedAssignments.map((topic: string, i: number) => (
                        <TableRow key={i}><TableCell className="font-mono text-xs">{i + 1}</TableCell><TableCell className="text-sm">{topic}</TableCell></TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {assignments.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-bold">Recent Distribution Sheets</h3>
              <div className="grid gap-3">
                {assignments.map(a => (
                  <Card key={a.id} className="hover:bg-muted/30 transition-colors">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="bg-primary/10 p-2 rounded-full"><FileSpreadsheet className="h-5 w-5 text-primary" /></div>
                        <div>
                          <p className="font-bold text-sm">{a.title}</p>
                          <p className="text-xs text-muted-foreground">{(a.mappings || []).length} {a.grouping} Topics Assigned</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => downloadAssignmentSheet(a)}><Download className="h-4 w-4 mr-2" /> Download Mapping</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="roster" className="space-y-6 mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Class Roster</CardTitle>
                <CardDescription>Add students manually or upload a list.</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={clearRoster} className="text-destructive"><Eraser className="h-4 w-4 mr-2" /> Clear List</Button>
                <input type="file" accept=".xlsx,.xls,.csv,.pdf,image/*" className="hidden" ref={rosterFileInputRef} onChange={handleRosterUpload} />
                <Button variant="secondary" size="sm" onClick={() => rosterFileInputRef.current?.click()} disabled={isRosterUploading}>
                  {isRosterUploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                  Import Roster
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
                  <TableHeader><TableRow><TableHead>Roll No / ID</TableHead><TableHead>Name</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {roster.map(s => (
                      <TableRow key={s.id}>
                        <TableCell className="font-mono text-xs">{s.roll}</TableCell>
                        <TableCell className="font-medium">{s.name}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => saveRoster(roster.filter(x => x.id !== s.id))}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {roster.length === 0 && <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground italic">Roster is empty. Import a list to get started.</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="submissions" className="space-y-6 mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Grading Hub</CardTitle>
                <CardDescription>Track submissions and AI analysis for your assignments.</CardDescription>
              </div>
              <div className="flex gap-2">
                <Select value={activeAssignmentId} onValueChange={setActiveAssignmentId}>
                  <SelectTrigger className="w-[250px]"><SelectValue placeholder="Select Assignment" /></SelectTrigger>
                  <SelectContent>
                    {assignments.map(a => <SelectItem key={a.id} value={a.id}>{a.title}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Dialog open={isDriveDialogOpen} onOpenChange={setIsDriveDialogOpen}>
                  <DialogTrigger asChild><Button disabled={!activeAssignmentId || roster.length === 0}>{isSyncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CloudDownload className="mr-2 h-4 w-4" />} Analyze Drive</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Connect Submission Folder</DialogTitle></DialogHeader>
                    <div className="py-4 space-y-2">
                      <Label>Google Drive Link</Label>
                      <Input placeholder="https://drive.google.com/..." value={driveLink} onChange={e => setDriveLink(e.target.value)} />
                    </div>
                    <DialogFooter><Button onClick={handleSyncDrive} disabled={!driveLink}>Start Sync</Button></DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {activeAssignment && (
                <div className="mb-4 flex flex-wrap gap-2">
                  <Badge variant="secondary" className="flex gap-1 items-center px-3 py-1"><Layers className="h-3 w-3" /> {activeAssignment.type}</Badge>
                  <Badge variant="secondary" className="flex gap-1 items-center px-3 py-1">{activeAssignment.grouping === 'Individual' ? <User className="h-3 w-3" /> : <Users2 className="h-3 w-3" />} {activeAssignment.grouping}</Badge>
                </div>
              )}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>AI Plagiarism</TableHead>
                      <TableHead className="text-right">Grade & Feedback</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeSubmissions.map(sub => (
                      <TableRow key={sub.studentId}>
                        <TableCell><div><p className="font-bold">{sub.studentName}</p><p className="text-xs text-muted-foreground font-mono">{sub.rollNumber}</p></div></TableCell>
                        <TableCell><Badge variant={sub.status === 'Submitted' ? 'secondary' : sub.status === 'Late' ? 'destructive' : 'outline'}>{sub.status}</Badge></TableCell>
                        <TableCell>{sub.plagiarismScore !== null && <div className="flex items-center gap-2"><Progress value={sub.plagiarismScore * 100} className="w-[60px] h-2" /><span className="text-[10px]">{(sub.plagiarismScore * 100).toFixed(0)}%</span></div>}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {sub.marks && <span className="font-bold text-primary">{sub.marks}%</span>}
                            <Button variant="ghost" size="icon" onClick={() => setSelectedSubmission(sub)} disabled={!sub.fileName}><FileSearch className="h-4 w-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedSubmission} onOpenChange={o => !o && setSelectedSubmission(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Submission Analysis</DialogTitle></DialogHeader>
          {selectedSubmission && (
            <div className="space-y-4 py-4">
              <div className="flex justify-between border-b pb-2">
                <div><span className="font-bold block">{selectedSubmission.studentName}</span><span className="text-xs text-muted-foreground">ID: {selectedSubmission.rollNumber}</span></div>
                <span className="text-primary font-bold text-xl">{selectedSubmission.marks}/100</span>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1"><Sparkles className="h-3 w-3" /> AI Feedback</p>
                <div className="text-sm italic p-4 bg-secondary/50 rounded-lg border">"{selectedSubmission.aiFeedback}"</div>
              </div>
            </div>
          )}
          <DialogFooter><Button onClick={() => setSelectedSubmission(null)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}