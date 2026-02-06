
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
  Search, 
  FileText, 
  Users, 
  Loader2,
  Upload,
  Image as ImageIcon,
  FileSearch,
  CheckCircle2,
  Plus,
  Trash2,
  UserPlus
} from 'lucide-react';
import { suggestAssignmentsAction, syncFromDriveAction } from '@/app/dashboard/assignments/actions';
import { format, parseISO } from 'date-fns';
import { toast } from '@/hooks/use-toast';

// pdfjs initialization
import * as pdfjsLib from 'pdfjs-dist';
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

interface Student {
  id: string;
  name: string;
  roll: string;
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
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
  const [roster, setRoster] = useState<Student[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [driveLink, setDriveLink] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<StudentSubmission | null>(null);
  
  // Student input state
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentRoll, setNewStudentRoll] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [suggestionState, suggestionDispatch, isSuggesting] = useActionState(suggestAssignmentsAction, {
    message: null,
    errors: null,
    data: null,
  });

  // Load roster from localStorage or defaults
  useEffect(() => {
    const saved = localStorage.getItem(`roster_${classId}`);
    if (saved) {
      setRoster(JSON.parse(saved));
    } else {
      // Default mock roster if empty
      const initial = [
        { id: '1', name: 'Alice Johnson', roll: 'CS001' },
        { id: '2', name: 'Bob Williams', roll: 'CS002' },
      ];
      setRoster(initial);
      localStorage.setItem(`roster_${classId}`, JSON.stringify(initial));
    }
    // Reset submissions when class changes
    setSubmissions([]);
    setDriveLink('');
  }, [classId]);

  const saveRoster = (newRoster: Student[]) => {
    setRoster(newRoster);
    localStorage.setItem(`roster_${classId}`, JSON.stringify(newRoster));
  };

  const addStudent = () => {
    if (!newStudentName.trim() || !newStudentRoll.trim()) return;
    const newStudent = {
      id: Math.random().toString(36).substr(2, 9),
      name: newStudentName,
      roll: newStudentRoll,
    };
    saveRoster([...roster, newStudent]);
    setNewStudentName('');
    setNewStudentRoll('');
    toast({ title: 'Student Added', description: `${newStudentName} added to roster.` });
  };

  const removeStudent = (id: string) => {
    saveRoster(roster.filter(s => s.id !== id));
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
    if (!file) return;

    setIsExtracting(true);
    try {
      if (file.type === 'application/pdf') {
        const text = await extractTextFromPdf(file);
        setSyllabusInput(text);
        setIsImageUpload(false);
        toast({ title: 'PDF Analyzed', description: 'Syllabus text extracted successfully.' });
      } else if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        const dataUri = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        setSyllabusInput(dataUri);
        setIsImageUpload(true);
        toast({ title: 'Image Selected', description: 'Syllabus image will be analyzed by AI.' });
      } else {
        throw new Error('Please upload a PDF or an Image file.');
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: error.message,
      });
    } finally {
      setIsExtracting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSyncDrive = async () => {
    if (!driveLink) {
      toast({ variant: 'destructive', title: 'Missing Link', description: 'Please provide a valid Drive link.' });
      return;
    }
    if (roster.length === 0) {
      toast({ variant: 'destructive', title: 'Empty Roster', description: 'Please add students to your roster first.' });
      return;
    }

    setIsSyncing(true);
    setIsDialogOpen(false);
    
    try {
      const response = await syncFromDriveAction(classId, 'A1', driveLink, roster);
      if (response.success && response.data) {
        setSubmissions(response.data);
        toast({
          title: 'Analysis Complete',
          description: `Checked submissions for ${roster.length} students from the Drive link.`,
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Sync Failed',
        description: 'Could not analyze files from the provided Drive link.',
      });
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

  return (
    <div className="space-y-6">
      <Tabs defaultValue="syllabus">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="syllabus">
            <FileText className="mr-2 h-4 w-4" />
            Syllabus & AI
          </TabsTrigger>
          <TabsTrigger value="roster">
            <UserPlus className="mr-2 h-4 w-4" />
            Class Roster
          </TabsTrigger>
          <TabsTrigger value="submissions">
            <Users className="mr-2 h-4 w-4" />
            Drive Sync
          </TabsTrigger>
        </TabsList>

        <TabsContent value="syllabus" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>AI Assignment Generator</CardTitle>
              <CardDescription>
                Upload your syllabus (PDF/Image) to generate assignment questions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="file"
                  accept=".pdf,image/*"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                />
                <Button 
                  variant="outline" 
                  className="w-full flex-1" 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isExtracting || isSuggesting}
                >
                  {isExtracting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                  Upload Syllabus (PDF/Image)
                </Button>
                {syllabusInput && (
                  <Button variant="ghost" size="icon" onClick={() => { setSyllabusInput(''); setIsImageUpload(false); }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="syllabus">Syllabus Content</Label>
                {isImageUpload ? (
                  <div className="flex items-center justify-center border-2 border-dashed rounded-md p-6 bg-muted/30">
                    <div className="flex flex-col items-center gap-2">
                      <ImageIcon className="h-10 w-10 text-muted-foreground opacity-50" />
                      <p className="text-sm font-medium">Syllabus Image Ready</p>
                    </div>
                  </div>
                ) : (
                  <Textarea
                    id="syllabus"
                    placeholder="Paste syllabus text here..."
                    className="min-h-[150px]"
                    value={syllabusInput}
                    onChange={(e) => setSyllabusInput(e.target.value)}
                  />
                )}
              </div>
              <Button onClick={handleSuggest} disabled={isSuggesting || syllabusInput.length < 10} className="w-full">
                {isSuggesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Generate Questions
              </Button>
            </CardContent>
          </Card>

          {suggestionState.data?.suggestedAssignments && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader><CardTitle className="text-lg">AI Suggestions</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {suggestionState.data.suggestedAssignments.map((q: string, i: number) => (
                    <li key={i} className="p-3 bg-card rounded-md border text-sm">{q}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="roster" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Manage Class Roster</CardTitle>
              <CardDescription>Add your students below. Drive sync will use these details to find submissions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Roll Number</Label>
                  <Input placeholder="e.g. CS101" value={newStudentRoll} onChange={(e) => setNewStudentRoll(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Student Name</Label>
                  <Input placeholder="e.g. John Doe" value={newStudentName} onChange={(e) => setNewStudentName(e.target.value)} />
                </div>
              </div>
              <Button onClick={addStudent} variant="secondary" className="w-full">
                <Plus className="mr-2 h-4 w-4" /> Add Student to Roster
              </Button>

              <div className="rounded-md border mt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Roll No</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roster.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-mono">{s.roll}</TableCell>
                        <TableCell className="font-medium">{s.name}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => removeStudent(s.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {roster.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                          Roster is empty. Add students to get started.
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
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Google Drive Integration</CardTitle>
                <CardDescription>Analyze submissions from a shared folder for your roster.</CardDescription>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button disabled={isSyncing || roster.length === 0}>
                    {isSyncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CloudDownload className="mr-2 h-4 w-4" />}
                    Start Sync
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Connect Drive Folder</DialogTitle>
                    <DialogDescription>Paste the link to the folder containing your student submissions.</DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <Label>Folder Link</Label>
                    <Input 
                      placeholder="https://drive.google.com/..." 
                      value={driveLink} 
                      onChange={(e) => setDriveLink(e.target.value)} 
                    />
                  </div>
                  <DialogFooter>
                    <Button onClick={handleSyncDrive} disabled={!driveLink}>Analyze {roster.length} Students</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Roll No</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Plagiarism</TableHead>
                      <TableHead className="text-right">Analysis</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submissions.map((sub) => (
                      <TableRow key={sub.studentId}>
                        <TableCell className="font-mono text-xs">{sub.rollNumber}</TableCell>
                        <TableCell className="font-medium">{sub.studentName}</TableCell>
                        <TableCell>
                          <Badge variant={sub.status === 'Late' ? 'destructive' : sub.status === 'Submitted' ? 'secondary' : 'outline'}>
                            {sub.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {sub.plagiarismScore !== null && (
                            <div className="flex items-center gap-2">
                              <Progress value={sub.plagiarismScore * 100} className="w-[50px] h-1.5" />
                              <span className="text-[10px]">{(sub.plagiarismScore * 100).toFixed(0)}%</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => setSelectedSubmission(sub)} disabled={!sub.fileName}>
                            <FileSearch className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {submissions.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                          {roster.length === 0 ? "Setup your roster first." : "Click 'Start Sync' to analyze submissions."}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedSubmission} onOpenChange={(open) => !open && setSelectedSubmission(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submission Analysis</DialogTitle>
          </DialogHeader>
          {selectedSubmission && (
            <div className="space-y-4 py-4">
              <div className="flex justify-between border-b pb-2">
                <span className="font-bold">{selectedSubmission.studentName}</span>
                <span className="text-primary font-bold">Grade: {selectedSubmission.marks}/100</span>
              </div>
              <div className="text-sm italic p-3 bg-muted rounded-md">
                "{selectedSubmission.aiFeedback}"
              </div>
              <div className="text-xs text-muted-foreground">
                File Analyzed: {selectedSubmission.fileName}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setSelectedSubmission(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
