import { addDays, dayDiff, parseYMD } from "./dates";
import type { AppData, CycleRange, Entry, Settings, Staff, Summary } from "./types";

export const anchorOf = (s: Settings) => parseYMD(s.anchor);

export const cycleIndexOf = (s: Settings, d: Date) => Math.floor(dayDiff(anchorOf(s), d) / s.cycleDays);

export function cycleRange(s: Settings, i: number): CycleRange {
  const start = addDays(anchorOf(s), i * s.cycleDays);
  return { start, end: addDays(start, s.cycleDays) };
}

/** Entries that start inside cycle `i`, newest first. */
export function entriesIn(data: AppData, i: number): Entry[] {
  const r = cycleRange(data.settings, i);
  return data.entries
    .filter((e) => {
      const t = new Date(e.start);
      return t >= r.start && t < r.end;
    })
    .sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime());
}

export function summarize(data: AppData, i: number): Summary {
  const range = cycleRange(data.settings, i);
  const list = entriesIn(data, i);
  const s: Summary = {
    range,
    list,
    approved: 0,
    pending: 0,
    rejected: 0,
    byDept: {},
    byProject: {},
    byStaff: {},
    pendStaff: {},
    byDay: Array.from({ length: data.settings.cycleDays }, () => 0),
    budget: data.settings.budgetHours * 60,
    remaining: 0,
  };
  const staffById = new Map<string, Staff>(data.staff.map((p) => [p.id, p]));
  for (const e of list) {
    if (e.status === "approved") {
      s.approved += e.minutes;
      const dId = staffById.get(e.staffId)?.dept ?? "none";
      s.byDept[dId] = (s.byDept[dId] ?? 0) + e.minutes;
      s.byProject[e.projectId] = (s.byProject[e.projectId] ?? 0) + e.minutes;
      s.byStaff[e.staffId] = (s.byStaff[e.staffId] ?? 0) + e.minutes;
      const di = dayDiff(range.start, new Date(e.start));
      if (di >= 0 && di < s.byDay.length) s.byDay[di] += e.minutes / 60;
    } else if (e.status === "pending") {
      s.pending += e.minutes;
      s.pendStaff[e.staffId] = (s.pendStaff[e.staffId] ?? 0) + e.minutes;
    } else {
      s.rejected += e.minutes;
    }
  }
  s.remaining = s.budget - s.approved;
  return s;
}
