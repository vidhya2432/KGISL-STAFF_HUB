export const DEPARTMENTS = [
  'CSE',
  'AI&DS',
  'ECE',
  'IT',
  'MECH',
  'CYBER',
  'ROBOTIC&AUTOMATION',
  'AI&ML',
] as const;

export type Department = (typeof DEPARTMENTS)[number];
