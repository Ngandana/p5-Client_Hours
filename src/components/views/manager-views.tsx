"use client";

import { useState, type FormEvent } from "react";
import {
  approveTimerEntries,
  importTeam,
  parseSettings,
  resetDemo,
  reviewEntry,
  saveSettings,
  type FieldError,
} from "@/lib/actions";
import { fmtH } from "@/lib/dates";
import { useStore } from "@/lib/store";
import { Page } from "../app-shell";
import { CycleNav, DeptCell, EntryItem, EntryList, useCycle } from "../shared";
import { Icon } from "../ui/icon";
import { Button, Buttons, Card, CardHeader, Empty, Field, FormError, Grid2, Muted, PageHead, Row2, TableWrap, focusField } from "../ui/primitives";

export function ApprovalsView() {
  const { data, prefs, update, showToast } = useStore();
  const list = data.entries
    .filter((e) => e.status === "pending")
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  const timerCount = list.filter((e) => e.method === "timer").length;
  const reviewer = prefs.managerId;

  return (
    <Page>
      <PageHead
        title="Approvals"
        action={
          timerCount > 0 && (
            <Button
              variant="ok"
              onClick={() => {
                const r = approveTimerEntries(data, reviewer);
                update(() => r.data);
                showToast(`${r.count} entries approved`);
              }}
            >
              <Icon name="check" />
              Approve all {timerCount} timer entries
            </Button>
          )
        }
      >
        Check each entry before it counts against the client&apos;s paid hours. Typed-in entries show the reason the timer was not used.
      </PageHead>
      {list.length ? (
        <EntryList>
          {list.map((e) => (
            <EntryItem
              key={e.id}
              entry={e}
              showPerson
              review={{
                onApprove: (id) => {
                  update((d) => reviewEntry(d, id, "approved", "", reviewer));
                  showToast("Entry approved");
                },
                onReject: (id, reason) => {
                  update((d) => reviewEntry(d, id, "rejected", reason, reviewer));
                  showToast("Entry rejected");
                },
              }}
            />
          ))}
        </EntryList>
      ) : (
        <Empty>Nothing waiting. All entries are reviewed.</Empty>
      )}
    </Page>
  );
}

export function AllEntriesView() {
  const { data } = useStore();
  const { offset, step, summary } = useCycle();
  const [dept, setDept] = useState("all");
  const [status, setStatus] = useState("all");
  const list = summary.list.filter((e) => {
    const p = data.staff.find((x) => x.id === e.staffId);
    return (dept === "all" || p?.dept === dept) && (status === "all" || e.status === status);
  });
  const total = list.reduce((a, e) => a + e.minutes, 0);
  return (
    <Page>
      <PageHead title="All entries" action={<CycleNav offset={offset} step={step} />}>
        {list.length} entries, {fmtH(total)} h in this view.
      </PageHead>
      <div className="max-w-[560px]">
        <Row2>
          <Field label="Department" htmlFor="f-dept">
            <select id="f-dept" value={dept} onChange={(e) => setDept(e.target.value)}>
              <option value="all">All departments</option>
              {data.departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Status" htmlFor="f-status">
            <select id="f-status" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="all">All</option>
              <option value="approved">Approved</option>
              <option value="pending">Awaiting approval</option>
              <option value="rejected">Rejected</option>
            </select>
          </Field>
        </Row2>
      </div>
      {list.length ? (
        <EntryList>
          {list.map((e) => (
            <EntryItem key={e.id} entry={e} showPerson />
          ))}
        </EntryList>
      ) : (
        <Empty>No entries match these filters.</Empty>
      )}
    </Page>
  );
}

export function SetupView() {
  const { data, update, setPrefs, showToast } = useStore();
  const st = data.settings;
  const [settingsError, setSettingsError] = useState<FieldError | null>(null);
  const [importError, setImportError] = useState<FieldError | null>(null);
  const [resetArmed, setResetArmed] = useState(false);
  const [teamJson, setTeamJson] = useState("");

  const fail = (e: FieldError, set: (e: FieldError) => void) => {
    set(e);
    focusField(e.field);
  };

  const submitSettings = (ev: FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    const f = new FormData(ev.currentTarget);
    const get = (k: string) => String(f.get(k) ?? "");
    const r = parseSettings({ clientName: get("client"), budgetHours: get("hours"), cycleDays: get("days"), anchor: get("anchor") });
    if (!r.ok) return fail(r.error, setSettingsError);
    update((d) => saveSettings(d, r.values));
    setSettingsError(null);
    showToast("Settings saved");
  };

  const runImport = () => {
    const r = importTeam(data, teamJson);
    if (!r.ok) return fail(r.error, setImportError);
    update(() => r.data);
    const mgr = r.data.staff.find((p) => p.dept === "mgt") ?? r.data.staff[0];
    setPrefs({ staffId: r.data.staff[0].id, managerId: mgr.id });
    setImportError(null);
    setTeamJson("");
    showToast(`Imported ${r.people} people and ${r.projects} projects`);
  };

  return (
    <Page>
      <PageHead title="Team and settings">Set the paid hours and cycle, and load the real team from Airtable.</PageHead>

      <Grid2>
        <Card>
          <h3 className="font-bold">Client and hours</h3>
          {/* Keyed on the saved values so the form shows fresh defaults after an import or reset. */}
          <form key={`${st.clientName}|${st.budgetHours}|${st.cycleDays}|${st.anchor}`} noValidate onSubmit={submitSettings} className="grid gap-3">
            <Field label="Client name" htmlFor="s-client">
              <input id="s-client" name="client" type="text" required defaultValue={st.clientName} />
            </Field>
            <Row2>
              <Field label="Paid hours per cycle" htmlFor="s-hours">
                <input id="s-hours" name="hours" type="number" min={1} step={0.5} required defaultValue={st.budgetHours} />
              </Field>
              <Field label="Cycle length (days)" htmlFor="s-days">
                <input id="s-days" name="days" type="number" min={1} max={62} required defaultValue={st.cycleDays} />
              </Field>
            </Row2>
            <Field
              label="First day of a cycle"
              htmlFor="s-anchor"
              hint="Cycles repeat from this date. Hours reset at the start of each cycle."
            >
              <input id="s-anchor" name="anchor" type="date" required defaultValue={st.anchor} />
            </Field>
            <FormError message={settingsError?.message} />
            <Buttons>
              <Button variant="primary" type="submit">
                <Icon name="check" />
                Save settings
              </Button>
            </Buttons>
          </form>
        </Card>

        <Card>
          <h3 className="font-bold">Load the team from Airtable</h3>
          <p className="text-sm text-muted">
            Paste the JSON that Claude in Chrome gives you from the Airtable base. This replaces the sample team and clears the sample entries.
          </p>
          <Field label="Team JSON" htmlFor="imp" error={importError?.message}>
            <textarea
              id="imp"
              className="num min-h-[140px] w-full text-xs"
              value={teamJson}
              aria-invalid={!!importError}
              onChange={(e) => setTeamJson(e.target.value)}
              placeholder='{"departments":[{"name":"ICT"}],"staff":[{"name":"...","role":"...","department":"ICT"}],"projects":[{"name":"..."}]}'
            />
          </Field>
          <Buttons>
            <Button variant="primary" onClick={runImport}>
              <Icon name="download" />
              Import team
            </Button>
            {resetArmed ? (
              <>
                <Button
                  variant="bad"
                  onClick={() => {
                    update(() => resetDemo());
                    setPrefs({ staffId: "sib", managerId: "candice" });
                    setResetArmed(false);
                    showToast("Demo data reset");
                  }}
                >
                  Yes, reset everything
                </Button>
                <Button variant="ghost" onClick={() => setResetArmed(false)}>
                  Cancel
                </Button>
              </>
            ) : (
              <Button variant="ghost" onClick={() => setResetArmed(true)}>
                Reset demo data
              </Button>
            )}
          </Buttons>
        </Card>
      </Grid2>

      <Card>
        <CardHeader>
          <h3 className="font-bold">Team</h3>
          <Muted>{st.sample ? "Sample team for the demo. Replace with the real staff list." : `${data.staff.length} people`}</Muted>
        </CardHeader>
        <TableWrap>
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Department</th>
            </tr>
          </thead>
          <tbody>
            {data.staff.map((p) => (
              <tr key={p.id}>
                <td className="whitespace-nowrap">{p.name}</td>
                <td>{p.role}</td>
                <DeptCell id={p.dept} />
              </tr>
            ))}
          </tbody>
        </TableWrap>
        <h3 className="font-bold">Projects</h3>
        <ul className="m-0 list-disc pl-5 text-sm">
          {data.projects.map((p) => (
            <li key={p.id}>{p.name}</li>
          ))}
        </ul>
      </Card>
    </Page>
  );
}
