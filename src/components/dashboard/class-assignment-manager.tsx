
'use client';

import { useState, useActionState, useRef, startTransition } from 'react';
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
  CheckCircle2
} from 'lucide-react';
import { suggestAssignmentsAction, syncFromDriveAction } from '@/app/dashboard/assignments/actions';
import { format, parseISO } from 'date-fns';
import { toast } from '@/hooks/use-toast';

// pdfjs initialization
import * as pdfjsLib from 'pdfjs-dist';
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

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
  const [isSyncing, setIsSyncing] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [driveLink, setDriveLink] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<StudentSubmission | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [suggestionState, suggestionDispatch, isSuggesting] = useActionState(suggestAssignmentsAction, {
    message: null,
    errors: null,
    data: null,
  });

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
      toast({
        variant: 'destructive',
        title: 'Missing Link',
        description: 'Please provide a valid Google Drive folder link.',
      });
      return;
    }

    setIsSyncing(true);
    setIsDialogOpen(false);
    
    try {
      const response = await syncFromDriveAction(classId, 'A1', driveLink);
      if (response.success && response.data) {
        setSubmissions(response.data);
        toast({
          title: 'Google Drive Synced',
          description: `Successfully analyzed files from ${driveLink.substring(0, 30)}...`,
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Sync Failed',
        description: 'Could not connect to the provided Google Drive link.',
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
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="syllabus">
            <FileText className="mr-2 h-4 w-4" />
            Syllabus & AI Generator
          </TabsTrigger>
          <TabsTrigger value="submissions">
            <Users className="mr-2 h-4 w-4" />
            Student Submissions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="syllabus" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>AI Assignment Generator</CardTitle>
              <CardDescription>
                Upload your syllabus (PDF/Image) or paste the content below. Our AI will analyze the objectives and suggest assignment questions.
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
                    <Search className="h-4 w-4 rotate-45" />
                  </Button>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="syllabus">Syllabus Content</Label>
                {isImageUpload ? (
                  <div className="flex items-center justify-center border-2 border-dashed rounded-md p-6 bg-muted/30">
                    <div className="flex flex-col items-center gap-2">
                      <ImageIcon className="h-10 w-10 text-muted-foreground opacity-50" />
                      <p className="text-sm font-medium">Syllabus Image Ready for Analysis</p>
                      <Button variant="link" size="sm" onClick={() => { setSyllabusInput(''); setIsImageUpload(false); }}>
                        Remove Image & Paste Text
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Textarea
                    id="syllabus"
                    placeholder="Paste syllabus modules, topics, and learning outcomes here..."
                    className="min-h-[200px]"
                    value={syllabusInput}
                    onChange={(e) => setSyllabusInput(e.target.value)}
                  />
                )}
              </div>
              <Button 
                onClick={handleSuggest} 
                disabled={isSuggesting || syllabusInput.length < 10} 
                className="w-full"
              >
                {isSuggesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Generate Assignment Questions
              </Button>
            </CardContent>
          </Card>

          {suggestionState.data?.suggestedAssignments && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-lg">Suggested Assignment Questions</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  {suggestionState.data.suggestedAssignments.map((q: string, i: number) => (
                    <li key={i} className="flex gap-3 p-3 bg-card rounded-md border shadow-sm">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-bold">
                        {i + 1}
                      </span>
                      <p className="text-sm leading-relaxed">{q}</p>
                    </li>
                  ))}
                </ul>
                <div className="mt-6">
                   <Button className="w-full" variant="secondary">
                     Create Assignment from These Suggestions
                   </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="submissions" className="space-y-6 mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Student Roster & Submissions</CardTitle>
                <CardDescription>Automated tracking linked to your connected Google Drive folder.</CardDescription>
              </div>
              
              <div className="flex gap-2">
                {submissions.length > 0 && (
                  <Badge variant="outline" className="flex gap-1 py-1">
                    <CheckCircle2 className="h-3 w-3 text-primary" />
                    Drive Connected
                  </Badge>
                )}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button disabled={isSyncing}>
                      {isSyncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CloudDownload className="mr-2 h-4 w-4" />}
                      Sync from Drive
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Connect Google Drive Folder</DialogTitle>
                      <DialogDescription>
                        Enter the shareable link of the folder containing student assignment submissions.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="drive-link">Folder Link</Label>
                        <div className="flex gap-2">
                          <Input
                            id="drive-link"
                            placeholder="https://drive.google.com/drive/folders/..."
                            value={driveLink}
                            onChange={(e) => setDriveLink(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                      <Button onClick={handleSyncDrive} disabled={!driveLink}>
                        Start Analysis
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Roll No</TableHead>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Detected File</TableHead>
                      <TableHead>Plagiarism</TableHead>
                      <TableHead className="text-right">Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submissions.length > 0 ? (
                      submissions.map((sub) => (
                        <TableRow key={sub.studentId}>
                          <TableCell className="font-mono text-xs">{sub.rollNumber}</TableCell>
                          <TableCell className="font-medium">{sub.studentName}</TableCell>
                          <TableCell>
                            <Badge variant={sub.status === 'Late' ? 'destructive' : sub.status === 'Submitted' ? 'secondary' : 'outline'}>
                              {sub.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground italic">
                            {sub.fileName || '-'}
                          </TableCell>
                          <TableCell>
                            {sub.plagiarismScore !== null ? (
                              <div className="flex items-center gap-2">
                                <Progress value={sub.plagiarismScore * 100} className="w-[60px] h-1.5" />
                                <span className={`text-[10px] font-bold ${sub.plagiarismScore > 0.5 ? 'text-destructive' : 'text-primary'}`}>
                                  {(sub.plagiarismScore * 100).toFixed(0)}%
                                </span>
                              </div>
                            ) : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => setSelectedSubmission(sub)}
                              disabled={!sub.fileName}
                            >
                              <FileSearch className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                          No submission data synced yet. Click "Sync from Drive" and provide a folder link.
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

      {/* Submission Detail Dialog */}
      <Dialog open={!!selectedSubmission} onOpenChange={(open) => !open && setSelectedSubmission(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Submission Analysis: {selectedSubmission?.studentName}</DialogTitle>
            <DialogDescription>
              Details extracted from Drive link: {driveLink.substring(0, 40)}...
            </DialogDescription>
          </DialogHeader>
          {selectedSubmission && (
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Roll Number</p>
                  <p className="font-mono">{selectedSubmission.rollNumber}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Final Marks</p>
                  <p className="text-2xl font-bold text-primary">{selectedSubmission.marks}/100</p>
                </div>
              </div>
              
              <div className="space-y-2 rounded-md border p-4 bg-muted/30">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Analyzed File</p>
                  <Badge variant="outline">{selectedSubmission.fileName}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Submitted at: {selectedSubmission.submittedAt ? format(parseISO(selectedSubmission.submittedAt), 'PPp') : 'N/A'}
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">AI Analysis & Feedback</p>
                <p className="text-sm leading-relaxed p-4 bg-card rounded-md border italic">
                  "{selectedSubmission.aiFeedback}"
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Plagiarism Status</p>
                <div className="flex items-center gap-4">
                  <Progress value={(selectedSubmission.plagiarismScore || 0) * 100} className="flex-1 h-3" />
                  <span className="font-bold">{( (selectedSubmission.plagiarismScore || 0) * 100).toFixed(0)}% Match</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {selectedSubmission.plagiarismScore && selectedSubmission.plagiarismScore > 0.1 
                    ? "Minor similarities detected with external documentation. Overall original."
                    : "No significant plagiarism detected. Submission appears original."}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setSelectedSubmission(null)}>Close Analysis</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
