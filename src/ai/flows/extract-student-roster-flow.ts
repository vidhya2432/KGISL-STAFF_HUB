'use server';

/**
 * @fileOverview AI flow to extract student roster from documents or images.
 *
 * - extractStudentRoster - A function that extracts names and roll numbers from content.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ExtractStudentRosterInputSchema = z.object({
  content: z.string().describe('The raw text content or image data URI of the student list.'),
  isImage: z.boolean().default(false).describe('Whether the content is an image data URI.'),
});

const StudentSchema = z.object({
  name: z.string().describe('Full name of the student.'),
  rollNumber: z.string().describe('The unique roll number or student ID.'),
});

const ExtractStudentRosterOutputSchema = z.object({
  students: z.array(StudentSchema),
});

export type ExtractStudentRosterOutput = z.infer<typeof ExtractStudentRosterOutputSchema>;

const extractRosterPrompt = ai.definePrompt({
  name: 'extractRosterPrompt',
  input: { schema: ExtractStudentRosterInputSchema },
  output: { schema: ExtractStudentRosterOutputSchema },
  prompt: `You are an expert administrative assistant. 
  Extract a list of students from the provided content. 
  For each student, find their full name and their roll number (or student ID).
  
  {{#if isImage}}
  Analyze the provided image: {{media url=content}}
  {{else}}
  Analyze the following text:
  {{{content}}}
  {{/if}}
  
  Ensure all students present in the document are captured accurately.`,
});

export async function extractStudentRoster(input: { content: string, isImage: boolean }): Promise<ExtractStudentRosterOutput> {
  const { output } = await extractRosterPrompt(input);
  if (!output) throw new Error('Failed to extract roster');
  return output;
}

export const extractStudentRosterFlow = ai.defineFlow(
  {
    name: 'extractStudentRosterFlow',
    inputSchema: ExtractStudentRosterInputSchema,
    outputSchema: ExtractStudentRosterOutputSchema,
  },
  async (input) => {
    return extractStudentRoster(input);
  }
);
