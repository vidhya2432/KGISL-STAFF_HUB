
'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { checkPlagiarismAction } from '@/app/dashboard/assignments/actions';
import { Loader2, Zap, FileUp, FolderUp, CheckCircle, AlertCircle } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { toast } from '@/hooks/use-toast';

// pdfjs initialization
import * as pdfjsLib from 'pdfjs-dist';
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface AnalysisResult {
  fileName: string;
  isPlagiarized: boolean;
  confidenceScore: number;
  source?: string;
  error?: string;
}

export function PlagiarismChecker() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [manualText, setManualText] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const extractTextFromPdf = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n';
      }
      return fullText;
    } catch (error) {
      console.error('Error parsing PDF:', error);
      throw new Error(`Failed to parse ${file.name}`);
    }
  };

  const processFiles = async (files: FileList | File[]) => {
    if (files.length === 0) return;
    
    setIsAnalyzing(true);
    setResults([]);
    setCurrentProgress(0);
    
    const totalFiles = files.length;
    const newResults: AnalysisResult[] = [];

    for (let i = 0; i < totalFiles; i++) {
      const file = files[i];
      try {
        let text = '';
        if (file.type === 'application/pdf') {
          text = await extractTextFromPdf(file);
        } else if (file.type === 'text/plain') {
          text = await file.text();
        } else {
          throw new Error('Unsupported file type. Use PDF or TXT.');
        }

        if (text.length < 50) {
          throw new Error('Text too short for analysis (min 50 chars).');
        }

        const formData = new FormData();
        formData.append('submissionText', text);
        
        // Call the action. Note: useActionState is great for single forms, 
        // but for batch we call the action directly if possible or wrap it.
        const response = await checkPlagiarismAction(null, formData);
        
        if (response.data) {
          newResults.push({
            fileName: file.name,
            ...response.data,
          });
        } else {
          throw new Error(response.message);
        }
      } catch (error: any) {
        newResults.push({
          fileName: file.name,
          isPlagiarized: false,
          confidenceScore: 0,
          error: error.message,
        });
      }
      
      setCurrentProgress(((i + 1) / totalFiles) * 100);
      setResults([...newResults]);
    }
    
    setIsAnalyzing(false);
    toast({
      title: 'Analysis Complete',
      description: `Processed ${totalFiles} files.`,
    });
  };

  const handleManualCheck = async () => {
    if (manualText.length < 50) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Text must be at least 50 characters.',
      });
      return;
    }

    setIsAnalyzing(true);
    setResults([]);
    setCurrentProgress(50);

    const formData = new FormData();
    formData.append('submissionText', manualText);
    
    try {
      const response = await checkPlagiarismAction(null, formData);
      if (response.data) {
        setResults([{
          fileName: 'Manual Input',
          ...response.data
        }]);
      } else {
        toast({ variant: 'destructive', title: 'Error', description: response.message });
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to process input.' });
    } finally {
      setIsAnalyzing(false);
      setCurrentProgress(100);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AI Plagiarism Analyzer</CardTitle>
          <CardDescription>
            Upload individual PDF files, entire folders, or paste text to detect potential plagiarism.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex flex-col gap-2">
              <Label>File Upload</Label>
              <input
                type="file"
                accept=".pdf,.txt"
                className="hidden"
                ref={fileInputRef}
                onChange={(e) => e.target.files && processFiles(e.target.files)}
                multiple
              />
              <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isAnalyzing}>
                <FileUp className="mr-2 h-4 w-4" />
                Select PDFs
              </Button>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Folder Upload</Label>
              <input
                type="file"
                webkitdirectory=""
                directory=""
                className="hidden"
                ref={folderInputRef}
                onChange={(e) => e.target.files && processFiles(e.target.files)}
              />
              <Button variant="outline" onClick={() => folderInputRef.current?.click()} disabled={isAnalyzing}>
                <FolderUp className="mr-2 h-4 w-4" />
                Select Folder
              </Button>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Batch Progress</Label>
              <Progress value={currentProgress} className="h-10" />
            </div>
          </div>

          <div className="space-y-2 pt-4 border-t">
            <Label htmlFor="submissionText">Or Paste Text Manually</Label>
            <Textarea
              id="submissionText"
              placeholder="Paste content here..."
              className="min-h-[150px]"
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              disabled={isAnalyzing}
            />
            <Button className="w-full" onClick={handleManualCheck} disabled={isAnalyzing}>
              {isAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
              Analyze Manual Input
            </Button>
          </div>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Results ({results.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              {results.map((result, idx) => (
                <div key={idx} className="flex flex-col gap-2 p-4 rounded-lg border bg-card">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 min-w-0">
                      {result.error ? (
                        <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                      ) : (
                        <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                      )}
                      <span className="font-semibold truncate text-sm">{result.fileName}</span>
                    </div>
                    {result.error ? (
                      <Badge variant="destructive">Error</Badge>
                    ) : (
                      <Badge variant={result.isPlagiarized ? 'destructive' : 'default'}>
                        {result.isPlagiarized ? 'Plagiarized' : 'Original'}
                      </Badge>
                    )}
                  </div>
                  {!result.error && (
                    <div className="space-y-2 mt-2">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Confidence Level</span>
                        <span>{(result.confidenceScore * 100).toFixed(0)}%</span>
                      </div>
                      <Progress value={result.confidenceScore * 100} className="h-2" />
                      {result.source && (
                        <div className="text-xs p-2 bg-muted rounded mt-2 overflow-hidden text-ellipsis">
                          <span className="font-bold">Source:</span> {result.source}
                        </div>
                      )}
                    </div>
                  )}
                  {result.error && (
                    <p className="text-xs text-destructive italic mt-1">{result.error}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
