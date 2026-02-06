import { config } from 'dotenv';
config();

import '@/ai/flows/detect-plagiarism-in-submissions.ts';
import '@/ai/flows/suggest-relevant-assignments.ts';
import '@/ai/flows/analyze-timetable-flow.ts';
import '@/ai/flows/extract-student-roster-flow.ts';
