import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AssignmentsTable } from '@/components/dashboard/assignments-table';
import { PlagiarismChecker } from '@/components/dashboard/plagiarism-checker';
import { AssignmentSuggester } from '@/components/dashboard/assignment-suggester';

export default function AssignmentsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold font-headline">Assignments</h1>
        <p className="text-muted-foreground">Manage, track, and analyze student assignments.</p>
      </div>
      <Tabs defaultValue="submissions">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="submissions">Submissions</TabsTrigger>
          <TabsTrigger value="plagiarism">Plagiarism Checker</TabsTrigger>
          <TabsTrigger value="ai-suggester">AI Suggestions</TabsTrigger>
        </TabsList>
        <TabsContent value="submissions" className="mt-6">
          <AssignmentsTable />
        </TabsContent>
        <TabsContent value="plagiarism" className="mt-6">
          <PlagiarismChecker />
        </TabsContent>
        <TabsContent value="ai-suggester" className="mt-6">
          <AssignmentSuggester />
        </TabsContent>
      </Tabs>
    </div>
  );
}
