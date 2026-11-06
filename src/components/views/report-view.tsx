"use client";

import Image from "next/image";
import { useState } from "react";
import { csvFor } from "@/lib/csv";
import { fmtDay, fmtH, fmtRange, ymd } from "@/lib/dates";
import { useStore } from "@/lib/store";
import { Page } from "../app-shell";
import { CycleNav, DeptBars, Meter, ProjectTable, deptById, projById, staffById, useCycle } from "../shared";
import { Icon } from "../ui/icon";
import { Button, Card, CardHeader, Empty, Eyebrow, TableWrap, cn } from "../ui/primitives";

/** The page does not print or download from inside an iframe (e.g. a preview pane). */
const inFrame = () => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
};

export function ReportView() {
  const { data, showToast } = useStore();
  const { offset, index, step, summary: s } = useCycle();
  const [csvFallback, setCsvFallback] = useState<string | null>(null);

  const over = s.approved > s.budget;
  const pct = s.budget ? Math.round((s.approved / s.budget) * 100) : 0;
  const log = s.list.filter((e) => e.status === "approved");

  const copyCsv = async () => {
    const csv = csvFor(data, index);
    try {
      await navigator.clipboard.writeText(csv);
      setCsvFallback(null);
      showToast("Work log copied as CSV");
    } catch {
      setCsvFallback(csv);
      requestAnimationFrame(() => {
        const f = document.getElementById("csv-fb") as HTMLTextAreaElement | null;
        f?.focus();
        f?.select();
      });
    }
  };

  const downloadCsv = () => {
    const url = URL.createObjectURL(new Blob([csvFor(data, index)], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `hours-report-${ymd(s.range.start)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <Page>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-4">
          <span className="grid flex-none place-items-center rounded-lg border border-line bg-white px-2.5 py-1">
            <Image src="/pillar5-logo.png" alt="Pillar 5, Above Average" width={319} height={236} className="block h-[84px] w-auto max-w-none" />
          </span>
          <div>
            <Eyebrow>Hours report</Eyebrow>
            <h2 className="text-xl font-bold">{data.settings.clientName}</h2>
            <p className="max-w-[62ch] text-muted">
              Work done by Pillar 5 Group, {fmtRange(s.range)}. Every entry below was approved by a manager.
            </p>
          </div>
        </div>
        <CycleNav offset={offset} step={step} />
      </div>

      <div className={cn("grid gap-1.5 rounded-card px-5 py-[18px]", over ? "bg-extra-soft" : "bg-accent-soft")}>
        <strong className="text-lg">
          {over
            ? `Pillar 5 delivered ${fmtH(s.approved)} hours. That is ${fmtH(s.approved - s.budget)} hours more than the ${fmtH(s.budget)} paid hours.`
            : `${fmtH(s.approved)} of ${fmtH(s.budget)} paid hours used so far (${pct}%).`}
        </strong>
        <span className="text-sm">
          {Object.keys(s.byStaff).length} people from {Object.keys(s.byDept).length} departments worked on {Object.keys(s.byProject).length} projects in this
          cycle.
        </span>
      </div>

      <Card>
        <h3 className="font-bold">Paid hours used</h3>
        <Meter s={s} showPending={false} />
      </Card>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <Card>
          <h3 className="font-bold">Hours by department</h3>
          <DeptBars s={s} />
        </Card>
        <Card>
          <h3 className="font-bold">Hours by project</h3>
          <ProjectTable s={s} />
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h3 className="font-bold">Work log</h3>
          <div className="flex flex-wrap items-center gap-2.5 print:hidden">
            <Button onClick={copyCsv}>
              <Icon name="copy" />
              Copy as CSV
            </Button>
            {!inFrame() && (
              <>
                <Button onClick={downloadCsv}>
                  <Icon name="download" />
                  Download CSV
                </Button>
                <Button onClick={() => window.print()}>
                  <Icon name="print" />
                  Print or save PDF
                </Button>
              </>
            )}
          </div>
        </CardHeader>

        {csvFallback && (
          <>
            <label htmlFor="csv-fb" className="text-sm font-semibold">
              Copy failed. Select this text and copy it.
            </label>
            <textarea id="csv-fb" readOnly value={csvFallback} className="num min-h-[140px] w-full text-xs" />
          </>
        )}

        {log.length ? (
          <TableWrap>
            <thead>
              <tr>
                <th>Date</th>
                <th>Person</th>
                <th>Department</th>
                <th>Project</th>
                <th>Work done</th>
                <th className="text-right">Hours</th>
              </tr>
            </thead>
            <tbody>
              {log.map((e) => {
                const p = staffById(data, e.staffId);
                return (
                  <tr key={e.id}>
                    <td className="whitespace-nowrap">{fmtDay(new Date(e.start))}</td>
                    <td className="whitespace-nowrap">
                      {p?.name ?? ""}
                      <br />
                      <span className="text-muted">{p?.role ?? ""}</span>
                    </td>
                    <td className="whitespace-nowrap">{(p && deptById(data, p.dept)?.name) ?? ""}</td>
                    <td>{projById(data, e.projectId)?.name ?? ""}</td>
                    <td className="max-w-[360px] min-w-[220px]">
                      {e.task}: {e.note}
                    </td>
                    <td className="num text-right">{fmtH(e.minutes)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={5}>Total approved</td>
                <td className="num text-right">{fmtH(s.approved)}</td>
              </tr>
            </tfoot>
          </TableWrap>
        ) : (
          <Empty>No approved work in this cycle yet.</Empty>
        )}
      </Card>
    </Page>
  );
}
