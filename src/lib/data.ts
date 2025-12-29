import type { Course, Student, Assignment, Submission, TimetableEntry, Notification, PerformanceData } from './types';

export const courses: Course[] = [
  { id: 'C1', name: 'Advanced Algorithms', code: 'CS-401' },
  { id: 'C2', name: 'Modern Compilers', code: 'CS-402' },
  { id: 'C3', name: 'Quantum Computing', code: 'PHY-350' },
];

export const students: Student[] = [
  { id: 'S1', name: 'Alice Johnson', avatarUrl: 'https://i.pravatar.cc/40?u=a042581f4e29026704d' },
  { id: 'S2', name: 'Bob Williams', avatarUrl: 'https://i.pravatar.cc/40?u=a042581f4e29026705d' },
  { id: 'S3', name: 'Charlie Brown', avatarUrl: 'https://i.pravatar.cc/40?u=a042581f4e29026706d' },
  { id: 'S4', name: 'Diana Miller', avatarUrl: 'https://i.pravatar.cc/40?u=a042581f4e29026707d' },
  { id: 'S5', name: 'Ethan Davis', avatarUrl: 'https://i.pravatar.cc/40?u=a042581f4e29026708d' },
];

export const assignments: Assignment[] = [
  { id: 'A1', title: 'Problem Set 1', courseId: 'C1', dueDate: '2024-09-15' },
  { id: 'A2', title: 'Lexical Analyzer Implementation', courseId: 'C2', dueDate: '2024-09-20' },
  { id: 'A3', title: 'Quantum Entanglement Report', courseId: 'C3', dueDate: '2024-09-22' },
];

export const submissions: Submission[] = [
  { id: 'SUB1', assignmentId: 'A1', studentId: 'S1', status: 'Submitted', submittedAt: '2024-09-14', grade: 92 },
  { id: 'SUB2', assignmentId: 'A1', studentId: 'S2', status: 'Late', submittedAt: '2024-09-16', grade: 78 },
  { id: 'SUB3', assignmentId: 'A1', studentId: 'S3', status: 'Submitted', submittedAt: '2024-09-15', grade: 88 },
  { id: 'SUB4', assignmentId: 'A2', studentId: 'S1', status: 'Submitted', submittedAt: '2024-09-19', grade: 95 },
  { id: 'SUB5', assignmentId: 'A2', studentId: 'S2', status: 'Pending' },
];

export const timetable: TimetableEntry[] = [
  { id: 'T1', day: 'Monday', time: '10:00 - 11:30', course: 'Advanced Algorithms (CS-401)', location: 'Hall A' },
  { id: 'T2', day: 'Tuesday', time: '13:00 - 14:30', course: 'Modern Compilers (CS-402)', location: 'Lab 3' },
  { id: 'T3', day: 'Wednesday', time: '09:00 - 10:30', course: 'Advanced Algorithms (CS-401)', location: 'Hall A' },
  { id: 'T4', day: 'Thursday', time: '11:00 - 12:30', course: 'Quantum Computing (PHY-350)', location: 'Room 101' },
  { id: 'T5', day: 'Friday', time: '14:00 - 15:30', course: 'Modern Compilers (CS-402)', location: 'Lab 3' },
];

export const notifications: Notification[] = [
  { id: 'N1', title: 'CS-402 Assignment Graded', description: 'Grades for the Lexical Analyzer have been published.', date: '2024-09-25', read: false },
  { id: 'N2', title: 'Faculty Meeting Scheduled', description: 'A mandatory faculty meeting is scheduled for this Friday at 4 PM.', date: '2024-09-24', read: false },
  { id: 'N3', title: 'Timetable Updated', description: 'The timetable for PHY-350 has been updated for next week.', date: '2024-09-23', read: true },
];

export const performanceData: PerformanceData[] = [
  { studentId: 'S1', studentName: 'Alice Johnson', 'A1': 92, 'A2': 95, average: 93.5 },
  { studentId: 'S2', studentName: 'Bob Williams', 'A1': 78, 'A2': 0, average: 39 },
  { studentId: 'S3', studentName: 'Charlie Brown', 'A1': 88, 'A2': 85, average: 86.5 },
  { studentId: 'S4', studentName: 'Diana Miller', 'A1': 95, 'A2': 91, average: 93 },
  { studentId: 'S5', studentName: 'Ethan Davis', 'A1': 82, 'A2': 88, average: 85 },
];
