'use client';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { suggestAssignmentsAction } from '@/app/dashboard/assignments/actions';
import { Loader2, Wand2 } from 'lucide-react';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Wand2 className="mr-2 h-4 w-4" />
      )}
      Generate Suggestions
    </Button>
  );
}

export function AssignmentSuggester() {
  const initialState = { message: null, errors: null, data: null };
  const [state, dispatch] = useActionState(suggestAssignmentsAction, initialState);

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Assignment Suggester</CardTitle>
        <CardDescription>
          Get creative and relevant assignment ideas by providing your course syllabus content.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-2">
        <form action={dispatch} className="space-y-4">
          <div>
            <Label htmlFor="syllabusContent">Syllabus Content</Label>
            <Textarea
              id="syllabusContent"
              name="syllabusContent"
              placeholder="Paste relevant sections of your course syllabus, like topics, learning outcomes, and weekly schedule..."
              className="min-h-[200px] mt-2"
              required
            />
             {state?.errors?.syllabusContent && (
              <p className="text-sm text-destructive mt-1">{state.errors.syllabusContent[0]}</p>
            )}
          </div>
          <SubmitButton />
        </form>

        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-secondary/50 p-6">
          {state?.data?.suggestedAssignments?.length > 0 ? (
            <div className="w-full space-y-4">
              <h3 className="text-lg font-semibold text-center">Suggested Assignments</h3>
              <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                {state.data.suggestedAssignments.map((suggestion: string, index: number) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="text-center text-muted-foreground">
              <Wand2 className="mx-auto h-12 w-12" />
              <p className="mt-4">Suggestions will appear here.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
