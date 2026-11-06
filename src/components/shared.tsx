"use client";

import { useMemo, useState } from "react";
import { isSafeUrl } from "@/lib/actions";
import { cycleIndexOf, cycleRange, summarize } from "@/lib/cycles";
import { addDays, dayDiff, fmtDay, fmtDur, fmtH, fmtRange, hm } from "@/lib/dates";
import { useStore } from "@/lib/store";
import type { AppData, Department, Entry, Summary } from "@/lib/types";
import { Icon } from "./ui/icon";
import { Button, Dot, Eyebrow, IconButton, Pill, TableWrap, cn, Empty, Buttons, Field, focusField } from "./ui/primitives";

export const DEPT_COLORS = ["var(--d0)", "var(--d1)", "var(--d2)", "var(--d3)", "var(--d4)", "var(--d5)"];
export const deptColor = (d?: Department | null) => DEPT_COLORS[((d && d.c) || 0) % DEPT_COLORS.length];

export const staffById = (data: AppData, id: string) => data.staff.find((p) => p.id === id);
export const deptById = (data: AppData, id: string) => data.departments.find((d) => d.id === id);
export const projById = (data: AppData, id: string) => data.projects.find((p) => p.id === id);

// ---------- Cycle selection ----------

/** Which 2-week cycle a view shows: 0 is the current cycle, -1 the one before, and so on. */
export function useCycle() {
  const { data } = useStore();
  const [offset, setOffset] = useState(0);
  const index = cycleIndexOf(data.settings, new Date()) + offset;
  const summary = useMemo(() => summarize(data, index), [data, index]);
  return { offset, index, summary, step: (d: number) => setOffset((o) => Math.min(0, o + d)) };
}

export function CycleNav({ offset, step }: { offset: number; step: (d: number) => void }) {
  const { data } = useStore();
  const { settings } = data;
  const index = cycleIndexOf(settings, new Date()) + offset;
  const r = cycleRange(settings, index);
  const current = offset === 0;
  const sub = current
    ? `Current cycle, day ${Math.min(dayDiff(r.start, new Date()), settings.cycleDays - 1) + 1} of ${settings.cycleDays}`
    : offset === -1
      ? "Last cycle"
      : "Past cycle";
  return (
    <div role="group" aria-label="Choose a 2-week cycle" className="flex items-center gap-2 rounded-full border border-line bg-surface p-[3px] print:hidden">
      <IconButton aria-label="Previous cycle" onClick={() => step(-1)}>
        <Icon name="left" />
      </IconButton>
      <div className="min-w-0 px-1.5 text-center">
        <strong className="block text-[0.9375rem] whitespace-nowrap">{fmtRange(r)}</strong>
        <span className="block text-xs text-muted">{sub}</span>
      </div>
      <IconButton aria-label="Next cycle" disabled={current} onClick={() => step(1)}>
        <Icon name="right" />
      </IconButton>
    </div>
  );
}

// ---------- Stats and meter ----------

export function Stat({ label, value, sub, tone }: { label: string; value: string; sub: string; tone?: "extra" | "low" }) {
  return (
    <div
      className={cn(
        "grid min-w-0 gap-1 rounded-card border bg-surface px-4 py-3.5",
        tone === "extra" ? "border-extra bg-extra-soft" : tone === "low" ? "border-warn bg-warn-soft" : "border-line",
      )}
    >
      <Eyebrow>{label}</Eyebrow>
      <span className={cn("num text-[1.75rem] leading-[1.1] font-semibold", tone === "extra" && "text-extra")}>
        {value} <small className="text-sm font-medium text-muted">h</small>
      </span>
      <span className="text-[0.8125rem] text-muted">{sub}</span>
    </div>
  );
}

export function StatTiles({ s }: { s: Summary }) {
  const over = s.remaining < 0;
  const low = !over && s.remaining <= s.budget * 0.15;
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <Stat label="Paid hours" value={fmtH(s.budget)} sub="per 2-week cycle" />
      <Stat label="Hours used" value={fmtH(s.approved)} sub="approved work" />
      {over ? (
        <Stat label="Extra hours" value={fmtH(-s.remaining)} sub="worked above the paid hours" tone="extra" />
      ) : (
        <Stat
          label="Hours left"
          value={fmtH(s.remaining)}
          sub={low ? "almost used up" : "before the paid hours run out"}
          tone={low ? "low" : undefined}
        />
      )}
      <Stat label="Awaiting approval" value={fmtH(s.pending)} sub="logged, not yet approved" />
    </div>
  );
}

export function Meter({ s, showPending }: { s: Summary; showPending: boolean }) {
  const b = s.budget;
  const a = s.approved;
  const p = showPending ? s.pending : 0;
  const scale = Math.max(b, a + p) || 1;
  const w = (v: number) => `${((v / scale) * 100).toFixed(2)}%`;
  const within = Math.min(a, b);
  const extra = Math.max(0, a - b);
  const label =
    `${fmtH(a)} hours approved out of ${fmtH(b)} paid hours` +
    (extra ? `, ${fmtH(extra)} extra hours` : "") +
    (p ? `, ${fmtH(p)} hours awaiting approval` : "");
  return (
    <div className="grid gap-2.5 pt-[26px]">
      <div role="img" aria-label={label} className="relative flex h-[22px] rounded-md bg-surface-2">
        {within > 0 && <span className="block h-full rounded-l-md bg-[var(--seg)]" style={{ width: w(within) }} />}
        {extra > 0 && <span className="block h-full bg-[var(--seg-x)]" style={{ width: w(extra) }} />}
        {p > 0 && (
          <span
            className="block h-full"
            style={{ width: w(p), background: "repeating-linear-gradient(135deg,var(--muted) 0 5px,var(--surface-2) 5px 10px)" }}
          />
        )}
        <span className="absolute -top-[26px] -bottom-1 w-0 border-l-2 border-dashed border-ink" style={{ left: w(b) }}>
          <span className="absolute top-0 right-1.5 text-xs font-bold whitespace-nowrap">{fmtH(b)} h paid</span>
        </span>
      </div>
      <ul className="m-0 flex list-none flex-wrap gap-x-[18px] gap-y-2 p-0 text-[0.8125rem] text-muted">
        <LegendItem swatch="var(--seg)">Approved within paid hours ({fmtH(within)} h)</LegendItem>
        <LegendItem swatch="var(--seg-x)">Extra hours ({fmtH(extra)} h)</LegendItem>
        {showPending && (
          <LegendItem swatch="repeating-linear-gradient(135deg,var(--muted) 0 3px,var(--surface-2) 3px 6px)">
            Awaiting approval ({fmtH(s.pending)} h)
          </LegendItem>
        )}
      </ul>
    </div>
  );
}

const LegendItem = ({ swatch, children }: { swatch: string; children: React.ReactNode }) => (
  <li className="flex items-center gap-1.5">
    <span className="inline-block size-3 flex-none rounded-[3px]" style={{ background: swatch }} />
    {children}
  </li>
);

// ---------- Breakdowns ----------

export function DeptBars({ s }: { s: Summary }) {
  const { data } = useStore();
  const rows = data.departments.map((d) => ({
    d,
    m: s.byDept[d.id] ?? 0,
    n: data.staff.filter((p) => p.dept === d.id && s.byStaff[p.id]).length,
  }));
  const max = Math.max(1, ...rows.map((r) => r.m));
  return (
    <div className="grid gap-3">
      {rows.map(({ d, m, n }) => {
        const share = s.approved ? Math.round((m / s.approved) * 100) : 0;
        return (
          <div key={d.id} className="grid grid-cols-[minmax(96px,140px)_minmax(0,1fr)_auto] items-center gap-3">
            <div className="flex min-w-0 items-center gap-2 text-[0.9375rem] font-semibold">
              <Dot color={deptColor(d)} />
              <span className="truncate">{d.name}</span>
            </div>
            <div aria-hidden="true" className="h-3.5 overflow-hidden rounded bg-surface-2">
              <span className="block h-full rounded" style={{ width: `${((m / max) * 100).toFixed(1)}%`, background: deptColor(d) }} />
            </div>
            <div className="num min-w-[92px] text-right text-sm">
              {fmtH(m)} h{" "}
              <small className="text-muted">
                {share}% · {n} {n === 1 ? "person" : "people"}
              </small>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function DailyChart({ s, isCurrent }: { s: Summary; isCurrent: boolean }) {
  const n = s.byDay.length;
  const mx = Math.max(1, ...s.byDay);
  const top = Math.max(2, Math.ceil(mx / 2) * 2);
  const W = 640, H = 210, L = 34, R = 8, T = 12, B = 40;
  const pw = W - L - R, ph = H - T - B, bw = pw / n;
  const todayI = isCurrent ? dayDiff(s.range.start, new Date()) : -1;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Approved hours per day in this cycle" className="block h-auto w-full">
      {[0, top / 2, top].map((v) => {
        const y = T + ph - (v / top) * ph;
        return (
          <g key={v}>
            <line x1={L} x2={W - R} y1={y} y2={y} stroke="var(--line)" strokeWidth={1} />
            <text x={L - 6} y={y + 4} textAnchor="end" fill="var(--muted)" fontSize={11}>
              {v}
            </text>
          </g>
        );
      })}
      {s.byDay.map((v, i) => {
        const d = addDays(s.range.start, i);
        const h = (v / top) * ph;
        const cx = L + i * bw + bw / 2;
        return (
          <g key={i}>
            {v > 0 && (
              <rect
                x={L + i * bw + bw * 0.18}
                y={T + ph - h}
                width={bw * 0.64}
                height={h}
                rx={2}
                fill={i === todayI ? "var(--seg-x)" : "var(--seg)"}
              >
                <title>{`${fmtDay(d)}: ${v.toFixed(1)} h`}</title>
              </rect>
            )}
            <text x={cx} y={H - B + 16} textAnchor="middle" fill="var(--muted)" fontSize={11}>
              {d.getDate()}
            </text>
            <text x={cx} y={H - B + 30} textAnchor="middle" fill="var(--muted)" fontSize={11}>
              {"SMTWTFS"[d.getDay()]}
            </text>
          </g>
        );
      })}
      <line x1={L} x2={W - R} y1={T + ph} y2={T + ph} stroke="var(--muted)" strokeWidth={1} />
    </svg>
  );
}

export function ProjectTable({ s }: { s: Summary }) {
  const { data } = useStore();
  const rows = data.projects
    .map((p) => ({ p, m: s.byProject[p.id] ?? 0 }))
    .filter((r) => r.m > 0)
    .sort((a, b) => b.m - a.m);
  if (!rows.length) return <Empty>No approved hours in this cycle yet.</Empty>;
  return (
    <TableWrap>
      <thead>
        <tr>
          <th>Project</th>
          <th className="text-right">Hours</th>
          <th className="text-right">Share</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(({ p, m }) => (
          <tr key={p.id}>
            <td>{p.name}</td>
            <td className="num text-right">{fmtH(m)}</td>
            <td className="num text-right">{s.approved ? Math.round((m / s.approved) * 100) : 0}%</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr>
          <td>Total</td>
          <td className="num text-right">{fmtH(s.approved)}</td>
          <td className="num text-right">100%</td>
        </tr>
      </tfoot>
    </TableWrap>
  );
}

export function DeptCell({ id }: { id: string }) {
  const { data } = useStore();
  const d = deptById(data, id);
  return (
    <td className="whitespace-nowrap">
      <Dot color={deptColor(d)} className="mr-1.5" />
      {d?.name ?? ""}
    </td>
  );
}

export function PeopleTable({ s, withPending }: { s: Summary; withPending: boolean }) {
  const { data } = useStore();
  const rows = data.staff
    .map((p) => ({ p, m: s.byStaff[p.id] ?? 0, q: s.pendStaff[p.id] ?? 0 }))
    .filter((r) => r.m || (withPending && r.q))
    .sort((a, b) => b.m - a.m);
  if (!rows.length) return <Empty>Nobody has logged hours in this cycle yet.</Empty>;
  return (
    <TableWrap>
      <thead>
        <tr>
          <th>Person</th>
          <th>Role</th>
          <th>Department</th>
          <th className="text-right">Approved</th>
          {withPending && <th className="text-right">Pending</th>}
        </tr>
      </thead>
      <tbody>
        {rows.map(({ p, m, q }) => (
          <tr key={p.id}>
            <td className="whitespace-nowrap">{p.name}</td>
            <td>{p.role}</td>
            <DeptCell id={p.dept} />
            <td className="num text-right">{fmtH(m)}</td>
            {withPending && <td className="num text-right">{fmtH(q)}</td>}
          </tr>
        ))}
      </tbody>
    </TableWrap>
  );
}

// ---------- Entries ----------

interface EntryItemProps {
  entry: Entry;
  showPerson?: boolean;
  canDelete?: boolean;
  onDelete?: (id: string) => void;
  /** Present on the approvals screen. */
  review?: { onApprove: (id: string) => void; onReject: (id: string, reason: string) => void };
}

const STATUS_LABEL = { approved: "Approved", pending: "Awaiting approval", rejected: "Rejected" } as const;

export function EntryItem({ entry: e, showPerson, canDelete, onDelete, review }: EntryItemProps) {
  const { data } = useStore();
  const p = staffById(data, e.staffId);
  const d = p ? deptById(data, p.dept) : null;
  const pr = projById(data, e.projectId);
  const st = new Date(e.start);
  const en = new Date(e.end);
  const reviewer = e.reviewerId ? (staffById(data, e.reviewerId)?.name ?? "Removed person") : "Removed person";

  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState(false);

  const confirmReject = () => {
    if (!reason.trim()) {
      setReasonError(true);
      focusField(`rej-${e.id}`);
      return;
    }
    review?.onReject(e.id, reason.trim());
  };

  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3.5 gap-y-2 rounded-card border border-line bg-surface px-4 py-3.5">
      <div className="min-w-0">
        {showPerson && (
          <div className="text-sm">
            <strong>{p?.name ?? "Removed person"}</strong> · {p?.role ?? ""} · {d?.name ?? ""}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
          <strong>{pr?.name ?? "Removed project"}</strong>
          <Pill tone={e.status}>{STATUS_LABEL[e.status]}</Pill>
          {e.method === "manual" ? (
            <Pill tone="manual">Typed in</Pill>
          ) : (
            <Pill tone="timer">
              <Icon name="clock" size={14} />
              Timer
            </Pill>
          )}
        </div>
        <div className="text-[0.8125rem] text-muted">
          {e.task} · {fmtDay(st)} · {hm(st)} to {hm(en)}
        </div>
        <p className="mt-1 text-[0.9375rem] [overflow-wrap:anywhere]">{e.note}</p>
        {e.proof && isSafeUrl(e.proof) && (
          <p className="text-sm">
            <a href={e.proof} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1">
              <Icon name="link" size={16} /> Proof of work
            </a>
          </p>
        )}
        {e.method === "manual" && e.reason && (
          <p className="mt-1.5 rounded-md bg-warn-soft px-2.5 py-1.5 text-[0.8125rem]">
            <strong>Why typed in:</strong> {e.reason}
          </p>
        )}
        {e.status !== "pending" && e.reviewerId && (
          <p className="mt-1 text-sm text-muted">
            {e.status === "approved" ? "Approved" : "Rejected"} by {reviewer}
            {e.reviewNote ? `: ${e.reviewNote}` : ""}
          </p>
        )}
      </div>
      <div className="num text-right font-semibold">{fmtDur(e.minutes)}</div>

      {canDelete && e.status === "pending" && (
        <div className="col-span-full flex flex-wrap items-start gap-2">
          <Button variant="ghost" onClick={() => onDelete?.(e.id)}>
            <Icon name="trash" />
            Delete
          </Button>
        </div>
      )}

      {review &&
        (rejecting ? (
          <div className="col-span-full grid gap-2 border-t border-dashed border-line pt-2.5">
            <Field
              label="Reason for rejecting"
              htmlFor={`rej-${e.id}`}
              error={reasonError ? "Add a short reason so the person knows what to fix." : null}
            >
              <input
                id={`rej-${e.id}`}
                type="text"
                value={reason}
                aria-invalid={reasonError}
                placeholder="For example: already logged, wrong project"
                onChange={(ev) => {
                  setReason(ev.target.value);
                  if (ev.target.value.trim()) setReasonError(false);
                }}
              />
            </Field>
            <Buttons>
              <Button variant="bad" onClick={confirmReject}>
                <Icon name="x" />
                Reject entry
              </Button>
              <Button variant="ghost" onClick={() => setRejecting(false)}>
                Cancel
              </Button>
            </Buttons>
          </div>
        ) : (
          <div className="col-span-full flex flex-wrap items-start gap-2">
            <Button variant="ok" onClick={() => review.onApprove(e.id)}>
              <Icon name="check" />
              Approve
            </Button>
            <Button
              variant="bad"
              onClick={() => {
                setRejecting(true);
                focusField(`rej-${e.id}`);
              }}
            >
              <Icon name="x" />
              Reject
            </Button>
          </div>
        ))}
    </li>
  );
}

export const EntryList = ({ children }: { children: React.ReactNode }) => (
  <ul className="m-0 grid list-none gap-2.5 p-0">{children}</ul>
);
