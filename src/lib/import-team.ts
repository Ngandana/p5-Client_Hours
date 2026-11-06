import type { Department, Project, Staff } from "./types";

export type ImportResult =
  | { ok: true; departments: Department[]; staff: Staff[]; projects: Project[]; clientName?: string }
  | { ok: false; error: string };

interface RawTeam {
  clientName?: unknown;
  departments?: unknown;
  staff?: unknown;
  projects?: unknown;
}

const asName = (x: unknown): string => {
  if (x && typeof x === "object" && "name" in x) return String((x as { name: unknown }).name || "");
  return String(x ?? "");
};

/** Parses the JSON that Claude in Chrome pulls from the Airtable base (see docs/AIRTABLE-PROMPT.md). */
export function parseTeamJson(raw: string): ImportResult {
  let d: RawTeam;
  try {
    d = JSON.parse(raw.trim());
  } catch {
    return { ok: false, error: "This is not valid JSON. Copy the full block from Claude, including the curly brackets." };
  }
  if (!d || !Array.isArray(d.staff) || !d.staff.length) {
    return { ok: false, error: 'The JSON needs a "staff" list with at least one person.' };
  }

  const departments: Department[] = [];
  const byKey = new Map<string, Department>();
  const dept = (name: unknown): string => {
    const n = String(name || "Unassigned").trim();
    const k = n.toLowerCase();
    let found = byKey.get(k);
    if (!found) {
      // Management keeps the id "mgt" so the manager picker can find it.
      found = { id: k === "management" ? "mgt" : "d" + departments.length, name: n, c: departments.length };
      departments.push(found);
      byKey.set(k, found);
    }
    return found.id;
  };

  if (Array.isArray(d.departments)) d.departments.forEach((x) => dept(asName(x)));
  const staff: Staff[] = (d.staff as Record<string, unknown>[]).map((p, i) => ({
    id: "s" + i,
    name: String(p.name || "Unnamed"),
    role: String(p.role || ""),
    dept: dept(p.department),
  }));
  dept("Management");

  const rawProjects = Array.isArray(d.projects) && d.projects.length ? d.projects : [{ name: "General work" }];
  const projects: Project[] = rawProjects.map((p, i) => ({ id: "p" + i, name: asName(p) }));

  return { ok: true, departments, staff, projects, clientName: d.clientName ? String(d.clientName) : undefined };
}
