export type Role = "staff" | "manager" | "client";
export type Status = "approved" | "pending" | "rejected";
export type Method = "timer" | "manual";

export interface Department {
  id: string;
  name: string;
  /** Index into the department colour palette. */
  c: number;
}

export interface Staff {
  id: string;
  name: string;
  role: string;
  dept: string;
}

export interface Project {
  id: string;
  name: string;
}

export interface Entry {
  id: string;
  staffId: string;
  projectId: string;
  task: string;
  note: string;
  proof: string;
  /** ISO timestamps. */
  start: string;
  end: string;
  minutes: number;
  method: Method;
  reason: string;
  status: Status;
  reviewerId: string | null;
  reviewNote: string;
  reviewedAt: string | null;
  createdAt: string;
}

export interface Timer {
  projectId: string;
  task: string;
  note: string;
  proof: string;
  startedAt: number;
  accMs: number;
  running: boolean;
}

export interface Settings {
  clientName: string;
  budgetHours: number;
  cycleDays: number;
  /** First day of a cycle, YYYY-MM-DD. */
  anchor: string;
  sample: boolean;
}

export interface AppData {
  settings: Settings;
  departments: Department[];
  staff: Staff[];
  projects: Project[];
  tasks: string[];
  entries: Entry[];
  timers: Record<string, Timer>;
}

export interface Prefs {
  staffId: string;
  managerId: string;
}

export interface CycleRange {
  start: Date;
  end: Date;
}

export interface Summary {
  range: CycleRange;
  list: Entry[];
  approved: number;
  pending: number;
  rejected: number;
  byDept: Record<string, number>;
  byProject: Record<string, number>;
  byStaff: Record<string, number>;
  pendStaff: Record<string, number>;
  byDay: number[];
  budget: number;
  remaining: number;
}
