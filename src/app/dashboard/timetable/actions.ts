'use server';

import { analyzeTimetable } from '@/ai/flows/analyze-timetable-flow';

export async function processTimetableUploadAction(content: string, isImage: boolean) {
  try {
    const result = await analyzeTimetable({ content, isImage });
    return {
      success: true,
      data: result.entries,
      error: null,
    };
  } catch (error: any) {
    console.error('Error in processTimetableUploadAction:', error);
    return {
      success: false,
      data: null,
      error: error.message || 'Failed to analyze timetable with AI.',
    };
  }
}
