'use server';

import { detectPlagiarism, DetectPlagiarismInput } from '@/ai/flows/detect-plagiarism-in-submissions';
import { suggestRelevantAssignments, SuggestRelevantAssignmentsInput } from '@/ai/flows/suggest-relevant-assignments';
import { z } from 'zod';

const plagiarismSchema = z.object({
  submissionText: z.string().min(50, 'Submission text must be at least 50 characters.'),
});

const suggestionSchema = z.object({
  syllabusContent: z.string().min(50, 'Syllabus content must be at least 50 characters.'),
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
    return {
      message: 'An error occurred while generating suggestions.',
      errors: null,
      data: null,
    };
  }
}
