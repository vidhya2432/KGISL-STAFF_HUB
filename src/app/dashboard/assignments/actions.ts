'use server';

import { detectPlagiarism, DetectPlagiarismInput } from '@/ai/flows/detect-plagiarism-in-submissions';
import { suggestRelevantAssignments, SuggestRelevantAssignmentsInput } from '@/ai/flows/suggest-relevant-assignments';
import { extractStudentRoster } from '@/ai/flows/extract-student-roster-flow';
import { z } from 'zod';

const plagiarismSchema = z.object({
  submissionText: z.string().min(50, 'Submission text must be at least 50 characters.'),
});

const suggestionSchema = z.object({
  syllabusContent: z.string().min(1, 'Content is required.'),
  isImage: z.boolean().optional(),
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

export async function extractRosterAction(content: string, isImage: boolean) {
  try {
    const result = await extractStudentRoster({ content, isImage });
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
  // Simulate connecting to the provided link
  console.log(`Connecting to Google Drive link: ${driveLink} for class ${classId}`);
  
  // Simulate an API call to Google Drive
  await new Promise((resolve) => setTimeout(resolve, 2500));

  const syncResults = studentRoster.map((student) => {
    // Randomly decide if this student has submitted (85% chance)
    const hasSubmitted = Math.random() > 0.15;
    
    if (!hasSubmitted) {
      return {
        studentId: student.id,
        studentName: student.name,
        rollNumber: student.roll,
        status: 'Pending',
        submittedAt: null,
        marks: null,
        plagiarismScore: null,
        fileName: null,
        aiFeedback: null,
      };
    }

    const isLate = Math.random() > 0.8;
    const marks = Math.floor(Math.random() * 35) + 65;
    const plagiarismScore = Math.random() * 0.18; // Keep it mostly low for realism
    const fileName = `${student.roll}_Assignment_Submission.pdf`;
    
    const feedbacks = [
      "Well-structured response with clear arguments.",
      "Demonstrates a solid understanding of the core concepts.",
      "Good use of references and data supporting the conclusions.",
      "Clear explanation of the methodology used.",
      "Creative approach to the problem solving section."
    ];
    const aiFeedback = feedbacks[Math.floor(Math.random() * feedbacks.length)];

    return {
      studentId: student.id,
      studentName: student.name,
      rollNumber: student.roll,
      status: isLate ? 'Late' : 'Submitted',
      submittedAt: new Date(Date.now() - Math.random() * 172800000).toISOString(),
      marks,
      plagiarismScore,
      fileName,
      aiFeedback,
    };
  });

  return {
    success: true,
    data: syncResults,
  };
}
