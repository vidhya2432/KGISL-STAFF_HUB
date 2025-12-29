export type Course = {
  id: string;
  name: string;
  code: string;
};

export type Student = {
  id: string;
  name: string;
  avatarUrl: string;
};

export type Assignment = {
  id: string;
  title: string;
  courseId: string;
  dueDate: string;
};

export type Submission = {
  id: string;
  assignmentId: string;
  studentId: string;
  status: 'Submitted' | 'Pending' | 'Late';
  submittedAt?: string;
  grade?: number;
};

export type TimetableEntry = {
  id: string;
  day: string;
  time: string;
  course: string;
  location: string;
};

export type Notification = {
  id: string;
  title: string;
  description: string;
  date: string;
  read: boolean;
};

export type PerformanceData = {
  studentId: string;
  studentName: string;
  [assignmentId: string]: string | number | undefined;
  average: number;
};
