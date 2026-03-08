'use server';

import { detectPlagiarism, DetectPlagiarismInput } from '@/ai/flows/detect-plagiarism-in-submissions';
import { suggestRelevantAssignments, SuggestRelevantAssignmentsInput } from '@/ai/flows/suggest-relevant-assignments';
import { extractStudentRoster as extractRosterFlow } from '@/ai/flows/extract-student-roster-flow';
import { z } from 'zod';

const plagiarismSchema = z.object({
  submissionText: z.string().min(50, 'Submission text must be at least 50 characters.'),
});

const suggestionSchema = z.object({
  syllabusContent: z.string().min(1, 'Content is required.'),
  isImage: z.boolean().optional(),
  assignmentType: z.string().min(1, 'Assignment type is required.'),
  grouping: z.enum(['Individual', 'Team']),
  count: z.number().min(1),
});

export async function checkPlagiarismAction(prevState: any, formData: FormData) {
  const validatedFields = plagiarismSchema.safeParse({
    submissionText: formData.get('submissionText'),
  });

  if (!validatedFields.success) {
    return {
      message: 'Invalid input.',
      errors: validatedFields.error.flatten().fieldErrors,
      data: null,
    };
  }

  try {
    const result = await detectPlagiarism(validatedFields.data as DetectPlagiarismInput);
    return {
      message: 'Plagiarism check complete.',
      errors: null,
      data: result,
    };
  } catch (error) {
    return {
      message: 'An error occurred while checking for plagiarism.',
      errors: null,
      data: null,
    };
  }
}

export async function suggestAssignmentsAction(prevState: any, formData: FormData) {
  const validatedFields = suggestionSchema.safeParse({
    syllabusContent: formData.get('syllabusContent'),
    isImage: formData.get('isImage') === 'true',
    assignmentType: formData.get('assignmentType'),
    grouping: formData.get('grouping'),
    count: parseInt(formData.get('count') as string || '1'),
  });

  if (!validatedFields.success) {
    return {
      message: 'Invalid input.',
      errors: validatedFields.error.flatten().fieldErrors,
      data: null,
    };
  }

  try {
    const result = await suggestRelevantAssignments(validatedFields.data as SuggestRelevantAssignmentsInput);
    return {
      message: 'Suggestions generated.',
      errors: null,
      data: result,
    };
  } catch (error) {
    console.error('AI Suggestion Error:', error);
    return {
      message: 'An error occurred while generating suggestions.',
      errors: null,
      data: null,
    };
  }
}

export async function extractRosterAction(content: string, isImage: boolean) {
  try {
    const result = await extractRosterFlow({ content, isImage });
    return {
      success: true,
      data: result.students,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to extract roster',
    };
  }
}

export async function syncFromDriveAction(classId: string, assignmentId: string, driveLink: string, studentRoster: { id: string, name: string, roll: string }[]) {
  // In production, this would use the Google Drive API to fetch files from the provided link.
  // For now we return the roster with 'Pending' status — grades are entered manually or via AI analysis.
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const syncResults = studentRoster.map((student) => ({
    studentId: student.id,
    studentName: student.name,
    rollNumber: student.roll,
    status: 'Pending' as const,
    submittedAt: null,
    marks: null,
    plagiarismScore: null,
    fileName: null,
    aiFeedback: null,
  }));

  return {
    success: true,
    data: syncResults,
  };
}
