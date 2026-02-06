'use server';

/**
 * @fileOverview AI-powered timetable analysis flow.
 *
 * - analyzeTimetable - A function that extracts structured timetable entries from raw text or images.
 * - AnalyzeTimetableInput - The input type for the analyzeTimetable function.
 * - AnalyzeTimetableOutput - The return type for the analyzeTimetable function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AnalyzeTimetableInputSchema = z.object({
  content: z.string().describe('The raw text content or image data URI of the timetable.'),
  isImage: z.boolean().default(false).describe('Whether the content is an image data URI.'),
});
export type AnalyzeTimetableInput = z.infer<typeof AnalyzeTimetableInputSchema>;

const TimetableEntrySchema = z.object({
  day: z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']),
  time: z.string().describe('Time slot (e.g., 10:00 - 11:30)'),
  course: z.string().describe('Course name or code'),
  location: z.string().describe('Room or building location'),
});

const AnalyzeTimetableOutputSchema = z.object({
  entries: z.array(TimetableEntrySchema),
});
export type AnalyzeTimetableOutput = z.infer<typeof AnalyzeTimetableOutputSchema>;

const analyzeTimetablePrompt = ai.definePrompt({
  name: 'analyzeTimetablePrompt',
  input: { schema: AnalyzeTimetableInputSchema },
  output: { schema: AnalyzeTimetableOutputSchema },
  prompt: `You are an expert at parsing academic timetables. 
  Extract all scheduled classes from the provided content. 
  Each entry must include the day of the week, the time slot, the course name, and the location.
  If the location is missing, use "TBD".
  
  Format the time consistently (e.g., HH:MM - HH:MM).
  
  {{#if isImage}}
  Analyze the provided image: {{media url=content}}
  {{else}}
  Analyze the following text:
  {{{content}}}
  {{/if}}`,
});

export async function analyzeTimetable(input: AnalyzeTimetableInput): Promise<AnalyzeTimetableOutput> {
  const { output } = await analyzeTimetablePrompt(input);
  if (!output) throw new Error('Failed to analyze timetable');
  return output;
}

export const analyzeTimetableFlow = ai.defineFlow(
  {
    name: 'analyzeTimetableFlow',
    inputSchema: AnalyzeTimetableInputSchema,
    outputSchema: AnalyzeTimetableOutputSchema,
  },
  async (input) => {
    return analyzeTimetable(input);
  }
);
