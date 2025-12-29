'use server';
/**
 * @fileOverview Detects plagiarism in student assignment submissions.
 *
 * - detectPlagiarism - A function that handles the plagiarism detection process.
 * - DetectPlagiarismInput - The input type for the detectPlagiarism function.
 * - DetectPlagiarismOutput - The return type for the detectPlagiarism function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DetectPlagiarismInputSchema = z.object({
  submissionText: z
    .string()
    .describe('The text content of the student assignment submission.'),
});
export type DetectPlagiarismInput = z.infer<typeof DetectPlagiarismInputSchema>;

const DetectPlagiarismOutputSchema = z.object({
  isPlagiarized: z
    .boolean()
    .describe('Whether the submission is likely plagiarized.'),
  confidenceScore: z
    .number()
    .describe(
      'A score between 0 and 1 indicating the confidence level of the plagiarism detection.  Higher score indicates higher likelihood of plagiarism.'
    ),
  source: z
    .string()
    .optional()
    .describe(
      'If plagiarism is detected, this field may contain the source of the plagiarized content.'
    ),
});
export type DetectPlagiarismOutput = z.infer<typeof DetectPlagiarismOutputSchema>;

export async function detectPlagiarism(input: DetectPlagiarismInput): Promise<DetectPlagiarismOutput> {
  return detectPlagiarismFlow(input);
}

const detectPlagiarismPrompt = ai.definePrompt({
  name: 'detectPlagiarismPrompt',
  input: {schema: DetectPlagiarismInputSchema},
  output: {schema: DetectPlagiarismOutputSchema},
  prompt: `You are an AI plagiarism detector.  You will receive the text of a student submission, and you must determine if it is plagiarized from another source.  You must return a confidence score between 0 and 1.  The higher the score, the more likely it is that the submission is plagiarized.  If you detect plagiarism, include the source in the output. Always set isPlagiarized to true or false.

Submission Text: {{{submissionText}}}`,
});

const detectPlagiarismFlow = ai.defineFlow(
  {
    name: 'detectPlagiarismFlow',
    inputSchema: DetectPlagiarismInputSchema,
    outputSchema: DetectPlagiarismOutputSchema,
  },
  async input => {
    const {output} = await detectPlagiarismPrompt(input);
    return output!;
  }
);
