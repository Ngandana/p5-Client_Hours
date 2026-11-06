import { describe, expect, it } from "vitest";
import {
  addEntry,
  approveTimerEntries,
  deleteEntry,
  importTeam,
  isSafeUrl,
  parseManualEntry,
  parseSettings,
  pauseTimer,
  resumeTimer,
  reviewEntry,
  startTimer,
  stopTimer,
} from "./actions";
import { csvFor } from "./csv";
import { cycleIndexOf, cycleRange, summarize } from "./cycles";
import { fmtDur, fmtH } from "./dates";
import { sampleData } from "./sample-data";

const NOW = new Date(2026, 9, 12, 14, 0, 0); // 12 Oct 2026, day 8 of the cycle starting 5 Oct

describe("formatting", () => {
  it("formats minutes as hours with one decimal", () => {
    expect(fmtH(90)).toBe("1.5");
    expect(fmtH(2700)).toBe("45.0");
  });
  it("formats durations", () => {
    expect(fmtDur(90)).toBe("1h 30m");
    expect(fmtDur(120)).toBe("2h");
    expect(fmtDur(0)).toBe("0m");
  });
});

describe("cycles", () => {
  const data = sampleData(NOW);
  it("finds the cycle a date belongs to", () => {
    expect(cycleIndexOf(data.settings, NOW)).toBe(0);
    expect(cycleIndexOf(data.settings, new Date(2026, 9, 4))).toBe(-1);
    expect(cycleRange(data.settings, 1).start.getDate()).toBe(19);
  });
  it("matches the demo story: last cycle is 7.5 h over the 45 paid hours", () => {
    const last = summarize(data, -1);
    expect(last.approved).toBe(52.5 * 60);
    expect(last.approved - last.budget).toBe(7.5 * 60);
  });
  it("counts only approved time against the budget", () => {
    const cur = summarize(data, 0);
    expect(cur.pending).toBeGreaterThan(0);
    expect(cur.remaining).toBe(cur.budget - cur.approved);
    expect(cur.byDay.reduce((a, b) => a + b, 0) * 60).toBeCloseTo(cur.approved);
  });
});

describe("csv", () => {
  it("exports approved entries only, with a header row and quoted commas", () => {
    let data = sampleData(NOW);
    data = addEntry(data, {
      staffId: "sib",
      projectId: "web",
      task: "Development",
      note: 'Said "hi", then left',
      start: new Date(2026, 9, 12, 9),
      end: new Date(2026, 9, 12, 10),
      minutes: 60,
      method: "timer",
    });
    const id = data.entries[data.entries.length - 1].id;
    data = reviewEntry(data, id, "approved", "", "candice");
    const lines = csvFor(data, 0).split("\n");
    expect(lines[0]).toMatch(/^Date,Start,End,Person/);
    expect(csvFor(data, 0)).toContain('"Said ""hi"", then left"');
    expect(csvFor(data, -1)).not.toContain("Supplier admin"); // the rejected entry
  });
});

describe("entries and review", () => {
  it("adds entries as pending, deletes only pending ones", () => {
    let data = sampleData(NOW);
    data = addEntry(data, {
      staffId: "sib", projectId: "web", task: "Admin", note: "Filing", start: NOW, end: NOW, minutes: 30, method: "timer",
    });
    const added = data.entries[data.entries.length - 1];
    expect(added.status).toBe("pending");
    const approved = data.entries.find((e) => e.status === "approved")!;
    expect(deleteEntry(data, approved.id).entries).toHaveLength(data.entries.length);
    expect(deleteEntry(data, added.id).entries).toHaveLength(data.entries.length - 1);
  });
  it("approves all pending timer entries but leaves typed-in ones", () => {
    const data = sampleData(NOW);
    const pendingTimers = data.entries.filter((e) => e.status === "pending" && e.method === "timer").length;
    const r = approveTimerEntries(data, "candice");
    expect(r.count).toBe(pendingTimers);
    expect(r.data.entries.some((e) => e.status === "pending" && e.method === "manual")).toBe(true);
  });
});

describe("manual entry validation", () => {
  const ok = { date: "2026-10-12", start: "09:00", end: "10:30", projectId: "web", task: "Admin", note: "Wrote docs", reason: "Forgot" };
  it("accepts a valid entry", () => {
    const r = parseManualEntry(ok, NOW);
    expect(r.ok && r.minutes).toBe(90);
  });
  it.each([
    [{ end: "08:00" }, "m-end"],
    [{ end: "15:00" }, "m-end"],
    [{ note: "hi" }, "m-note"],
    [{ reason: " " }, "m-reason"],
    [{ date: "" }, "m-date"],
  ])("rejects %j", (patch, field) => {
    const r = parseManualEntry({ ...ok, ...patch }, NOW);
    expect(!r.ok && r.error.field).toBe(field);
  });
});

describe("timer", () => {
  const fields = { projectId: "web", task: "Development", note: "", proof: "" };
  it("accumulates elapsed time across pause and resume, then submits", () => {
    let data = startTimer(sampleData(NOW), "sib", fields, 0);
    data = pauseTimer(data, "sib", 20 * 60000);
    data = resumeTimer(data, "sib", 30 * 60000);
    const r = stopTimer(data, "sib", { note: "Built the page", proof: "" }, new Date(40 * 60000));
    expect(r.ok && r.minutes).toBe(30);
    expect(r.ok && r.data.timers.sib).toBeUndefined();
  });
  it("blocks a stop with a short note or under a minute", () => {
    const data = startTimer(sampleData(NOW), "sib", fields, 0);
    const shortNote = stopTimer(data, "sib", { note: "x", proof: "" }, new Date(10 * 60000));
    expect(!shortNote.ok && shortNote.error.field).toBe("t-note");
    const tooShort = stopTimer(data, "sib", { note: "Long enough", proof: "" }, new Date(10000));
    expect(tooShort.ok).toBe(false);
  });
});

describe("settings and team import", () => {
  it("validates settings", () => {
    const base = { clientName: "Acme", budgetHours: "45", cycleDays: "14", anchor: "2026-10-05" };
    expect(parseSettings(base).ok).toBe(true);
    expect(parseSettings({ ...base, budgetHours: "0" })).toMatchObject({ ok: false, error: { field: "s-hours" } });
    expect(parseSettings({ ...base, cycleDays: "99" })).toMatchObject({ ok: false, error: { field: "s-days" } });
  });
  it("imports a team, keeps Management as mgt and clears sample entries", () => {
    const raw = JSON.stringify({
      clientName: "Real Client",
      departments: [{ name: "ICT" }],
      staff: [{ name: "A", role: "Dev", department: "ICT" }, { name: "B", role: "Boss", department: "management" }],
      projects: [{ name: "Site" }],
    });
    const r = importTeam(sampleData(NOW), raw);
    if (!r.ok) throw new Error(r.error.message);
    expect(r.data.entries).toHaveLength(0);
    expect(r.data.settings).toMatchObject({ sample: false, clientName: "Real Client" });
    expect(r.data.staff[1].dept).toBe("mgt");
    expect(r.data.departments.filter((d) => d.id === "mgt")).toHaveLength(1);
  });
  it("rejects bad JSON and empty staff", () => {
    expect(importTeam(sampleData(NOW), "nope").ok).toBe(false);
    expect(importTeam(sampleData(NOW), '{"staff":[]}').ok).toBe(false);
  });
});

describe("proof links", () => {
  it("allows only http(s) links", () => {
    expect(isSafeUrl("https://github.com/org/repo/commit/1")).toBe(true);
    expect(isSafeUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeUrl("data:text/html,hi")).toBe(false);
    expect(isSafeUrl("not a url")).toBe(false);
  });
  it("blocks stopping a timer with an unsafe proof link", () => {
    const data = startTimer(sampleData(NOW), "sib", { projectId: "web", task: "Admin", note: "", proof: "" }, 0);
    const r = stopTimer(data, "sib", { note: "Long enough", proof: "javascript:alert(1)" }, new Date(10 * 60000));
    expect(!r.ok && r.error.field).toBe("t-proof");
  });
});
