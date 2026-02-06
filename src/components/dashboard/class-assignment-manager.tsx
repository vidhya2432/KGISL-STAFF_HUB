'use client';

import { useState, useActionState, useRef, startTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Sparkles, 
  CloudDownload, 
  Search, 
  FileText, 
  Users, 
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Upload,
  FileUp,
  Image as ImageIcon
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
}

export function ClassAssignmentManager({ classId }: { classId: string }) {
  const [syllabusInput, setSyllabusInput] = useState('');
  const [isImageUpload, setIsImageUpload] = useState(false);
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);

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
    setIsSyncing(true);
    try {
      const response = await syncFromDriveAction(classId, 'A1'); // Mock assignment ID
      if (response.success && response.data) {
        setSubmissions(response.data);
        toast({
          title: 'Google Drive Synced',
          description: `Successfully analyzed submissions for ${response.data.length} students.`,
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Sync Failed',
        description: 'Could not connect to Google Drive or analyze files.',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSuggest = () => {
    if (!syllabusInput.trim()) return;
    
    // Construct FormData and call the action dispatch within a transition
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
              <Button onClick={handleSyncDrive} disabled={isSyncing}>
                {isSyncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CloudDownload className="mr-2 h-4 w-4" />}
                Sync from Drive
              </Button>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Roll No</TableHead>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted On</TableHead>
                      <TableHead>Plagiarism</TableHead>
                      <TableHead className="text-right">Marks / 100</TableHead>
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
                          <TableCell className="text-muted-foreground text-xs">
                            {sub.submittedAt ? format(parseISO(sub.submittedAt), 'PPp') : '-'}
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
                          <TableCell className="text-right font-bold text-primary">
                            {sub.marks ?? '-'}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                          No submission data synced yet. Click "Sync from Drive" to analyze student folders.
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
    </div>
  );
}
