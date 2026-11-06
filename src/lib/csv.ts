import { entriesIn } from "./cycles";
import { fmtH, hm, ymd } from "./dates";
import type { AppData } from "./types";

export function csvFor(data: AppData, cycle: number): string {
  const staff = new Map(data.staff.map((p) => [p.id, p]));
  const depts = new Map(data.departments.map((d) => [d.id, d]));
  const projects = new Map(data.projects.map((p) => [p.id, p]));
  const rows: string[][] = [
    ["Date", "Start", "End", "Person", "Role", "Department", "Project", "Type of work", "Hours", "Note", "Logged by", "Approved by"],
  ];
  entriesIn(data, cycle)
    .filter((e) => e.status === "approved")
    .reverse()
    .forEach((e) => {
      const p = staff.get(e.staffId);
      const st = new Date(e.start);
      const en = new Date(e.end);
      rows.push([
        ymd(st),
        hm(st),
        hm(en),
        p?.name ?? "",
        p?.role ?? "",
        (p && depts.get(p.dept)?.name) ?? "",
        projects.get(e.projectId)?.name ?? "",
        e.task,
        fmtH(e.minutes),
        e.note,
        e.method === "manual" ? "Typed in" : "Timer",
        (e.reviewerId && staff.get(e.reviewerId)?.name) || "Removed person",
      ]);
    });
  return rows
    .map((r) => r.map((c) => (/[",\n]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c)).join(","))
    .join("\n");
}
