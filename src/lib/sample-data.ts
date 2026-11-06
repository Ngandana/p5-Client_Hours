import { addDays, dayDiff, parseYMD, ymd } from "./dates";
import { uid } from "./ids";
import type { AppData, Entry, Method, Status } from "./types";

// [staff, project, task, hours, day, note, method, status, reviewer, typed-in reason, review note]
type Seed = [string, string, string, number, number, string, Method, Status, string?, string?, string?];

const PREVIOUS: Seed[] = [
  ["sib", "web", "Development", 4, 0, "Set up the project repo and the login page", "timer", "approved", "candice"],
  ["megan", "pm", "Meetings", 1.5, 0, "Kick-off meeting with the client", "timer", "approved", "candice"],
  ["thabo", "web", "Development", 3.5, 1, "Built the home page layout", "timer", "approved", "megan"],
  ["zanele", "brand", "Design", 3, 1, "Logo concepts, three options", "timer", "approved", "megan"],
  ["ryan", "brand", "Design", 2.5, 2, "Colour palette and type guide", "timer", "approved", "megan"],
  ["kayla", "social", "Content", 2, 2, "Content calendar for November", "timer", "approved", "megan"],
  ["lerato", "supplier", "Research", 3, 3, "Shortlisted five suppliers", "timer", "approved", "candice"],
  ["candice", "pm", "Admin", 1, 4, "Scope review and sign-off", "manual", "approved", "megan", "Logged after the client meeting"],
  ["lerato", "supplier", "Admin", 1, 4, "Filed supplier contracts", "timer", "approved", "candice"],
  ["sib", "web", "Development", 3, 7, "Booking form with field checks", "timer", "approved", "megan"],
  ["aisha", "web", "Support", 1.5, 7, "Hosting and domain setup", "timer", "approved", "megan"],
  ["sipho", "social", "Content", 2.5, 8, "Wrote eight social posts", "timer", "approved", "megan"],
  ["zanele", "social", "Design", 3, 8, "Designed graphics for the posts", "timer", "approved", "megan"],
  ["johan", "supplier", "Meetings", 2, 9, "Calls with three suppliers", "manual", "approved", "candice", "Was on the road, timer not available"],
  ["nomsa", "supplier", "Research", 2.5, 9, "Price comparison sheet", "timer", "approved", "candice"],
  ["thabo", "web", "Testing", 2, 10, "Tested the site on phones", "timer", "approved", "megan"],
  ["ryan", "brand", "Design", 3, 10, "Business card and letterhead", "timer", "approved", "megan"],
  ["megan", "pm", "Meetings", 1.5, 11, "Progress meeting with the client", "timer", "approved", "candice"],
  ["kayla", "social", "Content", 1.5, 11, "Scheduled the week's posts", "timer", "approved", "megan"],
  ["sib", "web", "Development", 4, 11, "Connected the booking form to the database", "timer", "approved", "megan"],
  ["aisha", "web", "Support", 2, 12, "Fixed the company email setup", "timer", "approved", "megan"],
  ["sipho", "brand", "Content", 2.5, 12, "Wrote the brand story text", "timer", "approved", "megan"],
  ["johan", "supplier", "Admin", 2, 13, "Supplier admin", "manual", "rejected", "candice", "Forgot to log it", "Already logged on the same day"],
];

const CURRENT: Seed[] = [
  ["megan", "pm", "Meetings", 1.5, 0, "Cycle planning with the team", "timer", "approved", "candice"],
  ["sib", "web", "Development", 4, 0, "Built the payment page", "timer", "approved", "megan"],
  ["zanele", "brand", "Design", 3, 0, "Final pages of the brand guide", "timer", "approved", "megan"],
  ["thabo", "web", "Development", 3, 1, "Gallery page", "timer", "approved", "megan"],
  ["kayla", "social", "Content", 2, 1, "Campaign launch posts", "timer", "approved", "megan"],
  ["lerato", "supplier", "Meetings", 2.5, 1, "Met two new suppliers", "manual", "approved", "candice", "Meeting was off-site"],
  ["ryan", "social", "Design", 3, 2, "Ad banners in four sizes", "timer", "approved", "megan"],
  ["nomsa", "supplier", "Research", 2, 2, "Supplier risk check", "timer", "approved", "candice"],
  ["sib", "web", "Testing", 2.5, 2, "Fixed bugs from client feedback", "timer", "approved", "megan"],
  ["aisha", "web", "Support", 1, 2, "Renewed the SSL certificate", "timer", "approved", "megan"],
  ["candice", "pm", "Admin", 1, 3, "Budget check", "timer", "approved", "megan"],
  ["sipho", "social", "Content", 2, 3, "Blog article draft", "timer", "approved", "megan"],
  ["sib", "web", "Development", 3, 3, "Admin dashboard for bookings", "timer", "pending"],
  ["zanele", "social", "Design", 2.5, 3, "Story templates", "timer", "pending"],
  ["johan", "supplier", "Meetings", 1.5, 3, "Supplier price negotiation", "manual", "pending", undefined, "Phone calls while travelling"],
];

function seedEntries(d: AppData, now: Date): Entry[] {
  const set = d.settings;
  const anchor = parseYMD(set.anchor);
  const idx = Math.floor(dayDiff(anchor, now) / set.cycleDays);
  const cur = addDays(anchor, idx * set.cycleDays);
  const prev = addDays(cur, -set.cycleDays);
  const elapsed = Math.max(0, dayDiff(cur, now));
  const out: Entry[] = [];
  const cursor: Record<string, number> = {};

  const add = (t: Seed, base: Date, clamp: boolean) => {
    const day = clamp ? Math.min(t[4], elapsed) : t[4];
    const date = addDays(base, day);
    const key = t[0] + ymd(date);
    const startMin = cursor[key] ?? 8 * 60 + ((t[0].length * 13) % 4) * 15;
    const mins = Math.round(t[3] * 60);
    cursor[key] = startMin + mins + 30;
    const st = new Date(date);
    st.setHours(0, startMin, 0, 0);
    const en = new Date(st.getTime() + mins * 60000);
    out.push({
      id: uid() + out.length,
      staffId: t[0],
      projectId: t[1],
      task: t[2],
      note: t[5],
      proof: "",
      start: st.toISOString(),
      end: en.toISOString(),
      minutes: mins,
      method: t[6],
      reason: t[6] === "manual" ? (t[9] ?? "") : "",
      status: t[7],
      reviewerId: t[8] ?? null,
      reviewNote: t[10] ?? "",
      reviewedAt: t[8] ? new Date(en.getTime() + 3 * 3600000).toISOString() : null,
      createdAt: en.toISOString(),
    });
  };

  PREVIOUS.forEach((t) => add(t, prev, false));
  CURRENT.forEach((t) => add(t, cur, true));
  return out;
}

export function sampleData(now: Date = new Date()): AppData {
  const d: AppData = {
    settings: { clientName: "Sample Client (Pty) Ltd", budgetHours: 45, cycleDays: 14, anchor: "2026-10-05", sample: true },
    departments: [
      { id: "ict", name: "ICT", c: 0 },
      { id: "acq", name: "Acquisitions", c: 1 },
      { id: "mkt", name: "Marketing", c: 2 },
      { id: "mgt", name: "Management", c: 3 },
    ],
    staff: [
      { id: "sib", name: "Sibabalwe Ngandana", role: "Software Developer", dept: "ict" },
      { id: "thabo", name: "Thabo Mokoena", role: "Web Developer", dept: "ict" },
      { id: "aisha", name: "Aisha Daniels", role: "IT Support Technician", dept: "ict" },
      { id: "lerato", name: "Lerato Khumalo", role: "Acquisitions Lead", dept: "acq" },
      { id: "johan", name: "Johan van Wyk", role: "Business Development Officer", dept: "acq" },
      { id: "nomsa", name: "Nomsa Dlamini", role: "Research Analyst", dept: "acq" },
      { id: "zanele", name: "Zanele Mthembu", role: "Graphic Designer", dept: "mkt" },
      { id: "ryan", name: "Ryan Petersen", role: "Graphic Designer", dept: "mkt" },
      { id: "kayla", name: "Kayla Adams", role: "Social Media Manager", dept: "mkt" },
      { id: "sipho", name: "Sipho Ndlovu", role: "Content Writer", dept: "mkt" },
      { id: "candice", name: "Mrs Candice", role: "Manager", dept: "mgt" },
      { id: "megan", name: "Megan Fortuin", role: "Project Manager", dept: "mgt" },
    ],
    projects: [
      { id: "web", name: "Website and booking system" },
      { id: "brand", name: "Brand refresh" },
      { id: "social", name: "Social media campaign" },
      { id: "supplier", name: "Supplier sourcing" },
      { id: "pm", name: "Project management and reporting" },
    ],
    tasks: ["Development", "Design", "Testing", "Content", "Research", "Meetings", "Support", "Admin"],
    entries: [],
    timers: {},
  };
  d.entries = seedEntries(d, now);
  return d;
}
