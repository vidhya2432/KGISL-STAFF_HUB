
'use server';

import { detectPlagiarism, DetectPlagiarismInput } from '@/ai/flows/detect-plagiarism-in-submissions';
import { suggestRelevantAssignments, SuggestRelevantAssignmentsInput } from '@/ai/flows/suggest-relevant-assignments';
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

export async function syncFromDriveAction(classId: string, assignmentId: string, driveLink: string) {
  // Simulate connecting to the provided link
  console.log(`Connecting to Google Drive link: ${driveLink} for class ${classId}`);
  
  // Simulate an API call to Google Drive
  await new Promise((resolve) => setTimeout(resolve, 3000));

  const mockStudents = [
    { id: 'S1', name: 'Alice Johnson', roll: 'CS001' },
    { id: 'S2', name: 'Bob Williams', roll: 'CS002' },
    { id: 'S3', name: 'Charlie Brown', roll: 'CS003' },
    { id: 'S4', name: 'Diana Miller', roll: 'CS004' },
    { id: 'S5', name: 'Ethan Davis', roll: 'CS005' },
  ];

  const syncResults = mockStudents.map((student) => {
    const hasSubmitted = Math.random() > 0.1;
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
    const marks = Math.floor(Math.random() * 40) + 60;
    const plagiarismScore = Math.random() * 0.25;
    const fileName = `${student.roll}_Assignment_Final.pdf`;
    
    // Simulated AI Feedback
    const feedbacks = [
      "Excellent logic and clear explanation of concepts.",
      "Good effort, but needs more depth in the analysis section.",
      "Solid implementation. Plagiarism check passed successfully.",
      "Well-structured report with accurate calculations.",
    ];
    const aiFeedback = feedbacks[Math.floor(Math.random() * feedbacks.length)];

    return {
      studentId: student.id,
      studentName: student.name,
      rollNumber: student.roll,
      status: isLate ? 'Late' : 'Submitted',
      submittedAt: new Date(Date.now() - Math.random() * 86400000).toISOString(),
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
