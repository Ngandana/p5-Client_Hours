import type { CycleRange } from "./types";

export const DAY = 86400000;

export const pad = (n: number) => (n < 10 ? "0" : "") + n;

export function sod(d: Date | number | string): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export function parseYMD(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export const dayDiff = (a: Date, b: Date) => Math.round((sod(b).getTime() - sod(a).getTime()) / DAY);

export const hm = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

/** Minutes to hours with one decimal, e.g. 90 -> "1.5". */
export const fmtH = (min: number) => (Math.round(min / 6) / 10).toFixed(1);

export function fmtDur(min: number): string {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return ((h ? `${h}h ` : "") + (m || !h ? `${m}m` : "")).trim();
}

export const fmtDay = (d: Date) =>
  d.toLocaleDateString("en-ZA", { weekday: "short", day: "numeric", month: "short" });

export function fmtRange(r: CycleRange): string {
  const e = addDays(r.end, -1);
  const o = { day: "numeric", month: "short" } as const;
  return `${r.start.toLocaleDateString("en-ZA", o)} to ${e.toLocaleDateString("en-ZA", { ...o, year: "numeric" })}`;
}

export function clock(ms: number): string {
  const t = Math.floor(ms / 1000);
  return `${pad(Math.floor(t / 3600))}:${pad(Math.floor((t % 3600) / 60))}:${pad(t % 60)}`;
}
