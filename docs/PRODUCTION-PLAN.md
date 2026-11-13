# Plan: From Demo to Real System

This replaces the short list in `NEXT-STEPS.md`. It follows the demo as built (Next.js, TypeScript, Tailwind, Vitest) and moves it to Supabase and Vercel.

## 1. What "real" means (definition of done)

The system is real when all of this is true:

1. Everyone signs in with their own account. Nobody can pick "Logged in as" someone else.
2. All data lives in one shared database. A timer started on a phone can be stopped on a laptop.
3. Only a manager can approve, and nobody can approve their own hours.
4. The client sees only approved hours for their own account, and nothing else.
5. Managers get an email at 80% and 100% of the paid hours. The client gets a report at the end of each cycle.
6. Data is backed up, and a mistake can be traced to who did what and when.

## 2. Decisions needed before building

These block the design. Ask Mrs Candice in one meeting. The default is what I recommend if she has no preference.

| # | Question | Default |
|---|---|---|
| 1 | Does the client log in, or only receive an emailed report? | Both. Login for one client contact first, email report as the fallback. |
| 2 | Does the client see staff names, or only roles and departments? | Names and roles. Easy to switch off later with one setting. |
| 3 | Who can approve? | Managers (Mrs Candice, Mrs Gabi, Megan). The CEO can view everything and also approve. Nobody approves their own entries. |
| 4 | How many clients at launch? | One. The database is built for many, the screens for one. |
| 5 | Keep our own timer, or use Jibble's time data? | Our own timer. Look at Jibble only after go-live. |
| 6 | Who is the admin who adds and removes staff? | Sibabalwe, plus one manager. |
| 7 | What happens to hours above 45? | Counted as extra hours and shown in gold, as in the demo. They never block logging. |
| 8 | Can staff edit an entry after submitting? | No. They can delete it while it is awaiting approval. A rejected entry is re-submitted as a new one. |

Also get the real inputs: the staff list with email addresses, the department list, the client's name and contact, the real project names, and the real first day of the cycle.

## 3. Target architecture

```
Browser (Next.js, Tailwind)
   │  server actions / route handlers
Next.js on Vercel ──────────────► Supabase
   │                               ├─ Postgres (data, row level security)
   │                               ├─ Auth (email login, magic link)
   │                               └─ (later) Storage for proof files
   ├─► Resend (email)
   └─► Vercel Cron (cycle report, 80% / 100% alerts)
```

Reasons: it is the stack you already use, Supabase free tier covers one client and about 20 staff, and `NEXT-STEPS.md` already named it.

### Data model

| Table | Key columns |
|---|---|
| `departments` | id, name, colour |
| `profiles` | id (= auth user), name, role title, department_id, app_role (`staff` / `manager` / `ceo` / `client` / `admin`), client_id (for client users), active |
| `clients` | id, name, budget_hours, cycle_days, cycle_anchor (date), timezone |
| `projects` | id, client_id, name, active |
| `work_types` | id, name (Development, Design, ...) |
| `time_entries` | id, client_id, staff_id, project_id, work_type, note, proof_url, started_at, ended_at, minutes, method (`timer` / `manual`), manual_reason, status, reviewer_id, review_note, reviewed_at, created_at |
| `running_timers` | staff_id (primary key), project_id, work_type, note, proof_url, started_at, accumulated_ms, running |
| `alerts_sent` | client_id, cycle_start, threshold (80 / 100), sent_at (stops duplicate emails) |
| `audit_log` | id, actor_id, action, entity, entity_id, before, after, at |

Notes:
- `minutes` is a stored value that a database check keeps equal to `ended_at − started_at`.
- Time is stored in UTC. Cycles and "today" are worked out in `Africa/Johannesburg`, so a late-night entry lands in the right cycle.
- Enums for `status` and `method`, and a check that `manual_reason` is present when `method = 'manual'`.

### Security rules (row level security)

| Who | Can read | Can write |
|---|---|---|
| Staff | Their own entries and timer. Names, projects and totals for the overview. | Create own entries, delete own `pending` entries, own timer. |
| Manager / CEO | All entries for their client | Set `status` to approved or rejected, but never on their own entries. |
| Client user | Only `approved` entries for their `client_id` | Nothing |
| Admin | Everything | Staff, departments, projects, settings |

Rules that must live in the database, not only in the screens:
- A staff member cannot create an entry as `approved`.
- Approved and rejected entries cannot be changed or deleted by staff.
- A reviewer cannot be the entry's author.
- Totals for the client are computed from `approved` rows only.

## 4. How the current code maps to the real system

The demo was built so this move is mostly swapping one layer.

| Today | Becomes |
|---|---|
| `src/lib/store.tsx` (localStorage) | Data layer using Supabase: queries on the server, a small client cache for the timer clock |
| `src/lib/actions.ts` (pure functions) | Server actions that call the same validation, then write to the database. The validation functions stay and keep their tests. |
| `src/lib/cycles.ts` `summarize` | Same function, run on rows from the database. Later, a SQL view if the report gets slow. |
| `prefs.staffId` / "Logged in as" | The signed-in user. The dropdown is removed (kept only for admins as "View as", for support). |
| Role switch (Staff / Manager / Client) | Chosen by the user's `app_role`. Routes are guarded by middleware, and the database enforces it again. |
| `sample-data.ts` | A seed script for local development and a "Demo mode" for presentations. Not loaded in production. |
| `import-team.ts` (Airtable JSON) | A one-off import that creates the staff and sends invites. After that, an admin screen. |
| "Reset demo data" | Removed from production. |
| "Add 30 minutes" demo button | Removed from production (behind a demo flag only). |

Things the demo does not have and the real system needs: a login page, an invite flow, a "forgot password" path, an admin screen for staff and projects, a loading and error state for every screen, and a "not allowed" page.

## 5. Phases

About 4 weeks of part-time work, matching `NEXT-STEPS.md`. Each phase ends with something you can show.

### Phase 0: Decide and set up (days 1 to 3)
- Meeting with Mrs Candice to settle section 2.
- Collect the real staff, projects and cycle date.
- Create the Supabase project (separate `staging` and `production`), the Vercel project, a Resend account, and a GitHub repo with branch protection.
- Environment variables and secrets set up. The service key never reaches the browser.
- **Done when:** staging URL loads the current demo and the team list is ready.

### Phase 1: Database and login (week 1)
- Write migrations for the tables above, with the security rules and checks.
- Sign-in with email (magic link first, password later if they want it). Invite flow for staff.
- Route guards by role. A signed-in staff member lands on Track time, a manager on Approvals, the client on the report.
- Database tests: log in as each role and prove what they can and cannot read or write.
- **Done when:** you can sign in as a staff member, a manager and a client user and each sees only what they should.

### Phase 2: Move the screens onto real data (week 2)
- Timer stored in `running_timers`, so it survives refresh and device change.
- Entries, approvals, reject-with-reason and "approve all timer entries" write to the database.
- Overview, per-person, per-project and report pages read real rows.
- CSV and print stay as they are.
- Admin screen for staff, departments, projects and the 45 hours / cycle settings.
- Remove demo-only features from production.
- **Done when:** a full cycle can be logged, approved and reported with no sample data.

### Phase 3: Alerts and the client report (week 3)
- Vercel Cron checks each client a few times a day. At 80% and 100% of approved hours it emails the managers once (`alerts_sent`).
- At the end of each cycle it emails the client the report (PDF or link), after a manager confirms it. Do not auto-send for the first two cycles.
- Reminder to staff who have `pending` timers running overnight, so no timer runs for 3 days by mistake.
- **Done when:** a test client crosses 80% on staging and the email arrives once.

### Phase 4: Pilot and go-live (week 4)
- Pilot with 2 or 3 staff from each department for one full week on staging data.
- Fix what they hit. Watch for: forgotten timers, confusion over typed-in hours, slow screens on phones.
- Short training: a 1-page guide for staff and a 1-page guide for managers (reuse `PRESENTING.md` style).
- Cut over: production database, real accounts, invite everyone, first real cycle starts.
- **Done when:** the first real cycle is running and the first client report goes out.

## 6. Testing

- Keep the current Vitest tests. They already cover cycles, validation, CSV and import.
- Add tests for the database rules (each role against each table).
- Add Playwright end-to-end tests for the main story: staff logs time, manager approves, client sees it, plus "client cannot see pending hours" and "manager cannot approve their own entry".
- Add a check in CI (GitHub Actions) that runs tests, type-check, lint and build on every pull request.
- Test the cycle boundary and the time zone with dates around midnight and the first day of a cycle.

## 7. Operations

- **Backups:** turn on Supabase daily backups (needs the Pro plan, about US$25 a month). On the free tier, schedule a weekly export. Decide which one before go-live.
- **Monitoring:** Vercel logs for errors, and an email to you when a cron job fails.
- **Access:** two admins so one person leaving does not lock the system.
- **Audit:** every approve, reject, delete and settings change is written to `audit_log`.
- **Cost estimate:** Vercel and Supabase free tiers for the pilot, then roughly US$25 to US$50 a month for backups and email.

## 8. Privacy and risks

| Risk | What to do |
|---|---|
| Staff personal information (POPIA in South Africa) | Collect only name, email, role, hours. Tell staff what is recorded and who sees it. The client sees names only if decided in section 2. |
| Staff feel watched | Make clear it records hours on the client, not keystrokes or screens. Staff only see their own detail. |
| Forgotten timers and typed-in hours become the norm | Show the share of typed-in hours to managers. Review in the first month. |
| Hours disputed by the client | Approved entries cannot be edited. Fixes are a new entry, and the audit log shows the history. |
| Time zone and cycle mistakes | Cycles computed in `Africa/Johannesburg` with tests. Cycle start date set once by an admin. |
| Scope grows (more clients, billing, Jibble) | Out of scope for go-live. Collect requests in a list. |
| One person (you) is the only one who can fix it | Document setup and deploys in the README, keep the second admin, keep the code in GitHub. |

## 9. Not in the first release

- Invoicing and billing
- More than one client
- Jibble or Airtable live sync
- Mobile app (the site already works on phones)
- Uploading proof files (links only for now)

## 10. Do this week

1. Book 30 minutes with Mrs Candice and take the section 2 questions.
2. Send her `PRESENTING.md` flow or the WhatsApp guide first, so she has seen it before the meeting.
3. Get the staff list with email addresses and the real project names.
4. Create the Supabase and Vercel projects and push the repo to GitHub.
5. Tell me when 1 to 4 are done, and I will start Phase 1 with the migrations and the sign-in.
