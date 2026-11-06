# P5 Client Hours

A demo system for Pillar 5 Group. Staff from every department log the time they spend on a client's projects. A manager approves the time. The client sees how many of the 45 paid hours (per 2-week cycle) were used, and how many extra hours Pillar 5 delivered.

Built by Sibabalwe Ngandana (ICT, Pillar 5 Group).

## Stack

- Next.js (App Router) and React, in TypeScript
- Tailwind CSS v4, with the Pillar 5 navy and gold tokens in `src/app/globals.css`
- Vitest for the business logic
- Demo data in browser storage, behind a single store (`src/lib/store.tsx`), ready to swap for Supabase
- Deploys to Vercel

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
```

| Script | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm test` | Run the unit tests |
| `npm run typecheck` | Type-check with `tsc` |
| `npm run lint` | ESLint |

The demo saves data in your browser only. Each computer has its own copy. To start fresh, go to **Manager > Team and settings > Reset demo data**.

## How it works

1. **Paid hours.** The client pays for 45 hours every 2 weeks. The cycle resets every 14 days.
2. **Staff track time.** Each person picks a project, starts the timer, and writes a short note on what they did. If they forgot the timer, they can type in the hours, but they must give a reason.
3. **Manager approves.** Every entry waits for approval. Only approved hours count against the 45 hours.
4. **Client sees the proof.** The client report shows hours used, extra hours, hours per department, hours per project, and a full work log. It can be copied or downloaded as CSV, or printed to PDF.

## Routes

Use the **Staff / Manager / Client** switch at the top.

| Route | View |
|---|---|
| `/staff/track` | Timer, note, proof link, or typed-in hours |
| `/staff/entries` | Your own entries and their status |
| `/staff/overview` | The client's hours |
| `/manager/overview` | Stats, hours by department, per day, by project, by person |
| `/manager/approvals` | Approve or reject entries (reject needs a reason) |
| `/manager/entries` | All entries, filter by department and status |
| `/manager/setup` | Paid hours, cycle length, start date, import the team from Airtable |
| `/client/report` | The proof that Pillar 5 used (or went over) the paid hours |

## Project layout

```
src/
  app/            Routes (App Router), layout, global styles and tokens
  components/
    app-shell.tsx Header, role switch, tabs, toast, page wrapper
    shared.tsx    Meter, charts, tables, entry card, cycle picker
    views/        One file per screen group
    ui/           Button, Card, Field, Pill and icons
  lib/
    types.ts      Domain types
    cycles.ts     Cycle maths and the hours summary
    actions.ts    Pure state changes (timer, entries, review, settings, import)
    store.tsx     React context and browser persistence
    sample-data.ts, csv.ts, import-team.ts, dates.ts
legacy/index.html The original single-file demo, kept for reference
docs/             Recommendations, demo script, Airtable prompt, next steps
```

All business rules live in `src/lib` as plain functions and are covered by `src/lib/logic.test.ts`.

## Sample data

The demo has a sample team (16 people in ICT, Acquisitions, Marketing and Management) and sample entries:

- **Last cycle:** 52.5 approved hours, which is 7.5 hours above the 45 paid hours.
- **This cycle:** about 27.5 approved hours, plus a few entries waiting for approval.

The names, except those of the real Pillar 5 people, are made up. Replace them with the real team using `docs/AIRTABLE-PROMPT.md`.

## Branding

The demo uses the Pillar 5 logo (`public/pillar5-logo.png`) and its navy and gold colours. Navy is used for actions and approved hours. Gold marks extra hours, because they are the value Pillar 5 gives above the paid hours. In dark mode, gold becomes the main action colour.

## Accessibility

4.5:1 contrast, visible focus, 44px touch targets, labels on every field, keyboard support, reduced motion respected, light and dark mode, mobile first.

## Next

See `docs/NEXT-STEPS.md` for turning the demo into the real system (shared database, logins, alerts).
