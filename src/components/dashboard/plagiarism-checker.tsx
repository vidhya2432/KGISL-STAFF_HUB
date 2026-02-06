'use client';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { checkPlagiarismAction } from '@/app/dashboard/assignments/actions';
import { Loader2, Zap } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Zap className="mr-2 h-4 w-4" />
      )}
      Check for Plagiarism
    </Button>
  );
}

export function PlagiarismChecker() {
  const initialState = { message: null, errors: null, data: null };
  const [state, dispatch] = useActionState(checkPlagiarismAction, initialState);

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Plagiarism Checker</CardTitle>
        <CardDescription>
          Paste a student's submission text to check for potential plagiarism using AI analysis.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-2">
        <form action={dispatch} className="space-y-4">
          <div>
            <Label htmlFor="submissionText">Submission Text</Label>
            <Textarea
              id="submissionText"
              name="submissionText"
              placeholder="Paste the full text of the student's submission here..."
              className="min-h-[200px] mt-2"
              required
            />
            {state?.errors?.submissionText && (
              <p className="text-sm text-destructive mt-1">{state.errors.submissionText[0]}</p>
            )}
          </div>
          <SubmitButton />
        </form>

        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-secondary/50 p-6">
          {state?.data ? (
            <div className="w-full space-y-4 text-center">
              <h3 className="text-lg font-semibold">Analysis Result</h3>
              <div className="flex items-center justify-center gap-2">
                <span className="font-medium">Status:</span>
                <Badge variant={state.data.isPlagiarized ? 'destructive' : 'default'}>
                  {state.data.isPlagiarized ? 'Likely Plagiarized' : 'Original'}
                </Badge>
              </div>
              <div className="space-y-2">
                <Label>Confidence Score</Label>
                <Progress value={state.data.confidenceScore * 100} />
                <p className="text-sm font-bold">{(state.data.confidenceScore * 100).toFixed(0)}%</p>
              </div>
              {state.data.source && (
                 <div className="text-left p-3 bg-muted rounded-md">
                   <p className="text-sm font-semibold">Potential Source:</p>
                   <p className="text-xs text-muted-foreground break-words">{state.data.source}</p>
                 </div>
              )}
            </div>
          ) : (
            <div className="text-center text-muted-foreground">
              <Zap className="mx-auto h-12 w-12" />
              <p className="mt-4">Results will be displayed here.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
