'use server';

/**
 * @fileOverview AI-powered assignment suggestion flow for faculty members.
 *
 * - suggestRelevantAssignments - A function that suggests relevant assignments based on syllabus content.
 * - SuggestRelevantAssignmentsInput - The input type for the suggestRelevantAssignments function.
 * - SuggestRelevantAssignmentsOutput - The return type for the suggestRelevantAssignments function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestRelevantAssignmentsInputSchema = z.object({
  syllabusContent: z
    .string()
    .describe('The syllabus content for the course (text or image data URI).'),
  isImage: z.boolean().optional().describe('Whether the content is an image data URI.'),
  assignmentType: z.string().describe('The type of assignment to generate (e.g., Case Study, Research Paper, Sums).'),
  grouping: z.enum(['Individual', 'Team']).describe('Whether the assignment is for individuals or teams.'),
  count: z.number().describe('The exact number of unique topics to generate.'),
});
export type SuggestRelevantAssignmentsInput = z.infer<
  typeof SuggestRelevantAssignmentsInputSchema
>;

const SuggestRelevantAssignmentsOutputSchema = z.object({
  suggestedAssignments: z
    .array(z.string())
    .describe('A list of suggested assignments relevant to the syllabus content and chosen parameters.'),
});
export type SuggestRelevantAssignmentsOutput = z.infer<
  typeof SuggestRelevantAssignmentsOutputSchema
>;

export async function suggestRelevantAssignments(
  input: SuggestRelevantAssignmentsInput
): Promise<SuggestRelevantAssignmentsOutput> {
  return suggestRelevantAssignmentsFlow(input);
}

const assignmentSuggestionPrompt = ai.definePrompt({
  name: 'assignmentSuggestionPrompt',
  input: {schema: SuggestRelevantAssignmentsInputSchema},
  output: {schema: SuggestRelevantAssignmentsOutputSchema},
  prompt: `You are an AI assistant designed to suggest unique and relevant assignments for a given course syllabus.

  Based on the following syllabus content, generate exactly {{{count}}} unique and creative assignment topics/questions of type: {{{assignmentType}}}.
  
  IMPORTANT:
  - These assignments are for {{{grouping}}} work.
  - You MUST generate exactly {{{count}}} distinct topics. No duplicates.
  - Each topic should be specific and actionable.
  - Return the results as an array of strings.

  {{#if isImage}}
  Analyze the provided syllabus image: {{media url=syllabusContent}}
  {{else}}
  Analyze the following syllabus text:
  {{{syllabusContent}}}
  {{/if}}`,
});

const suggestRelevantAssignmentsFlow = ai.defineFlow(
  {
    name: 'suggestRelevantAssignmentsFlow',
    inputSchema: SuggestRelevantAssignmentsInputSchema,
    outputSchema: SuggestRelevantAssignmentsOutputSchema,
  },
  async input => {
    const {output} = await assignmentSuggestionPrompt(input);
    return output!;
  }
);
