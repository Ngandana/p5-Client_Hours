import { cycleIndexOf, summarize } from "./cycles";
import { parseYMD } from "./dates";
import { uid } from "./ids";
import { parseTeamJson } from "./import-team";
import { sampleData } from "./sample-data";
import type { AppData, Entry, Method, Settings, Status, Timer } from "./types";

/** A form problem: the message to show and the id of the field to focus. */
export interface FieldError {
  message: string;
  field?: string;
}

export const MIN_NOTE_LENGTH = 5;

/** Proof links are rendered as anchors, so only web links are allowed (no javascript: or data: URLs). */
export function isSafeUrl(value: string): boolean {
  try {
    const { protocol } = new URL(value);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

// ---------- Entries ----------

interface NewEntry {
  staffId: string;
  projectId: string;
  task: string;
  note: string;
  proof?: string;
  start: Date;
  end: Date;
  minutes: number;
  method: Method;
  reason?: string;
}

export function addEntry(data: AppData, o: NewEntry): AppData {
  const entry: Entry = {
    id: uid(),
    staffId: o.staffId,
    projectId: o.projectId,
    task: o.task,
    note: o.note,
    proof: o.proof ?? "",
    start: o.start.toISOString(),
    end: o.end.toISOString(),
    minutes: o.minutes,
    method: o.method,
    reason: o.reason ?? "",
    status: "pending",
    reviewerId: null,
    reviewNote: "",
    reviewedAt: null,
    createdAt: new Date().toISOString(),
  };
  return { ...data, entries: [...data.entries, entry] };
}

/** True when the cycle holding `at` is above the paid hours once pending time is counted. */
export function isOverBudget(data: AppData, at: Date): boolean {
  const s = summarize(data, cycleIndexOf(data.settings, at));
  return s.approved + s.pending > s.budget;
}

export function deleteEntry(data: AppData, id: string): AppData {
  // Only entries still awaiting approval can be deleted.
  return { ...data, entries: data.entries.filter((e) => !(e.id === id && e.status === "pending")) };
}

function withReview(e: Entry, status: Status, note: string, reviewerId: string): Entry {
  return { ...e, status, reviewerId, reviewNote: note, reviewedAt: new Date().toISOString() };
}

export function reviewEntry(data: AppData, id: string, status: Status, note: string, reviewerId: string): AppData {
  return { ...data, entries: data.entries.map((e) => (e.id === id ? withReview(e, status, note, reviewerId) : e)) };
}

export function approveTimerEntries(data: AppData, reviewerId: string): { data: AppData; count: number } {
  let count = 0;
  const entries = data.entries.map((e) => {
    if (e.status === "pending" && e.method === "timer") {
      count++;
      return withReview(e, "approved", "", reviewerId);
    }
    return e;
  });
  return { data: { ...data, entries }, count };
}

export interface ManualInput {
  date: string;
  start: string;
  end: string;
  projectId: string;
  task: string;
  note: string;
  reason: string;
}

/** Validates a typed-in entry. Returns the parsed times, or the first problem found. */
export function parseManualEntry(
  input: ManualInput,
  now: Date,
): { ok: true; start: Date; end: Date; minutes: number; note: string; reason: string } | { ok: false; error: FieldError } {
  const note = input.note.trim();
  const reason = input.reason.trim();
  if (!input.date || !input.start || !input.end) {
    return { ok: false, error: { message: "Fill in the date, start and end time.", field: "m-date" } };
  }
  const start = parseYMD(input.date);
  const [sh, sm] = input.start.split(":").map(Number);
  start.setHours(sh, sm, 0, 0);
  const end = parseYMD(input.date);
  const [eh, em] = input.end.split(":").map(Number);
  end.setHours(eh, em, 0, 0);
  if (end <= start) return { ok: false, error: { message: "The end time must be after the start time.", field: "m-end" } };
  if (end > now) return { ok: false, error: { message: "You cannot log time in the future.", field: "m-end" } };
  if (note.length < MIN_NOTE_LENGTH) {
    return { ok: false, error: { message: "Write a short note on what you did.", field: "m-note" } };
  }
  if (!reason) return { ok: false, error: { message: "Add the reason the timer was not used.", field: "m-reason" } };
  return { ok: true, start, end, minutes: Math.round((end.getTime() - start.getTime()) / 60000), note, reason };
}

// ---------- Timers ----------

export const elapsedMs = (t: Timer, now: number = Date.now()) => t.accMs + (t.running ? now - t.startedAt : 0);

const setTimer = (data: AppData, staffId: string, timer: Timer): AppData => ({
  ...data,
  timers: { ...data.timers, [staffId]: timer },
});

export function startTimer(
  data: AppData,
  staffId: string,
  fields: Pick<Timer, "projectId" | "task" | "note" | "proof">,
  now: number = Date.now(),
): AppData {
  return setTimer(data, staffId, { ...fields, startedAt: now, accMs: 0, running: true });
}

export function pauseTimer(data: AppData, staffId: string, now: number = Date.now()): AppData {
  const t = data.timers[staffId];
  return t && t.running ? setTimer(data, staffId, { ...t, accMs: t.accMs + now - t.startedAt, running: false }) : data;
}

export function resumeTimer(data: AppData, staffId: string, now: number = Date.now()): AppData {
  const t = data.timers[staffId];
  return t && !t.running ? setTimer(data, staffId, { ...t, startedAt: now, running: true }) : data;
}

/** Demo helper: add 30 minutes so a full entry can be shown without waiting. */
export function skipTimer(data: AppData, staffId: string): AppData {
  const t = data.timers[staffId];
  return t ? setTimer(data, staffId, { ...t, accMs: t.accMs + 30 * 60000 }) : data;
}

export function editTimer(data: AppData, staffId: string, patch: Partial<Pick<Timer, "note" | "proof">>): AppData {
  const t = data.timers[staffId];
  return t ? setTimer(data, staffId, { ...t, ...patch }) : data;
}

export function discardTimer(data: AppData, staffId: string): AppData {
  const timers = { ...data.timers };
  delete timers[staffId];
  return { ...data, timers };
}

export function stopTimer(
  data: AppData,
  staffId: string,
  fields: { note: string; proof: string },
  now: Date = new Date(),
): { ok: true; data: AppData; minutes: number } | { ok: false; error: FieldError } {
  const t = data.timers[staffId];
  if (!t) return { ok: false, error: { message: "There is no timer to stop." } };
  const note = fields.note.trim();
  const minutes = Math.round(elapsedMs(t, now.getTime()) / 60000);
  if (note.length < MIN_NOTE_LENGTH) {
    return { ok: false, error: { message: "Write a short note on what you did before you submit.", field: "t-note" } };
  }
  if (minutes < 1) {
    return { ok: false, error: { message: "The timer ran for less than a minute. Keep it running, or discard it." } };
  }
  const proof = fields.proof.trim();
  if (proof && !isSafeUrl(proof)) {
    return { ok: false, error: { message: "The proof link must start with http:// or https://.", field: "t-proof" } };
  }
  const start = new Date(now.getTime() - minutes * 60000);
  const next = addEntry(discardTimer(data, staffId), {
    staffId,
    projectId: t.projectId,
    task: t.task,
    note,
    proof,
    start,
    end: now,
    minutes,
    method: "timer",
  });
  return { ok: true, data: next, minutes };
}

// ---------- Settings and team ----------

export interface SettingsInput {
  clientName: string;
  budgetHours: string;
  cycleDays: string;
  anchor: string;
}

export function parseSettings(input: SettingsInput): { ok: true; values: Omit<Settings, "sample"> } | { ok: false; error: FieldError } {
  const clientName = input.clientName.trim();
  const budgetHours = parseFloat(input.budgetHours);
  const cycleDays = parseInt(input.cycleDays, 10);
  if (!clientName) return { ok: false, error: { message: "Add the client name.", field: "s-client" } };
  if (!(budgetHours > 0)) return { ok: false, error: { message: "Paid hours must be more than 0.", field: "s-hours" } };
  if (!(cycleDays >= 1 && cycleDays <= 62)) {
    return { ok: false, error: { message: "Cycle length must be between 1 and 62 days.", field: "s-days" } };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.anchor)) {
    return { ok: false, error: { message: "Pick the first day of a cycle.", field: "s-anchor" } };
  }
  return { ok: true, values: { clientName, budgetHours, cycleDays, anchor: input.anchor } };
}

export function saveSettings(data: AppData, values: Omit<Settings, "sample">): AppData {
  return { ...data, settings: { ...data.settings, ...values } };
}

export function importTeam(
  data: AppData,
  raw: string,
): { ok: true; data: AppData; people: number; projects: number } | { ok: false; error: FieldError } {
  const r = parseTeamJson(raw);
  if (!r.ok) return { ok: false, error: { message: r.error, field: "imp" } };
  const settings = { ...data.settings, sample: false, ...(r.clientName ? { clientName: r.clientName } : {}) };
  return {
    ok: true,
    data: { ...data, settings, departments: r.departments, staff: r.staff, projects: r.projects, entries: [], timers: {} },
    people: r.staff.length,
    projects: r.projects.length,
  };
}

export const resetDemo = (): AppData => sampleData();
