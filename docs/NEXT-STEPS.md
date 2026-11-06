# Next Steps: From Demo to Real System

The demo stores data in one browser only. To use it for real, the data must live in one shared place.

## Option A: Airtable as the database (fastest)

Good if Pillar 5 already uses Airtable.

1. Create three tables: **Staff**, **Projects**, **Time Entries**.
2. Time Entries fields: Person (link), Project (link), Type of work, Note, Proof link, Start, End, Minutes, Method (Timer / Typed in), Reason, Status (Awaiting approval / Approved / Rejected), Approved by, Review note.
3. Connect the page to Airtable through a small backend (for example a Vercel serverless function) so the Airtable key is never in the browser.
4. Use Airtable views for the client report, or keep the report page from this demo.

## Option B: Supabase (more control, still free to start)

Good if the system will grow (more clients, logins, alerts).

1. Tables: `departments`, `staff`, `projects`, `time_entries`, `cycles`.
2. Supabase Auth for staff, manager and client logins.
3. Row level security: staff see their own entries, managers see all, the client sees only approved entries for their account.
4. Host the frontend on Vercel.

## Features to add after the demo

| Priority | Feature |
|---|---|
| 1 | Shared database (Option A or B) |
| 2 | Logins for staff, managers and the client |
| 3 | Email alert to managers at 80% and 100% of paid hours |
| 4 | Automatic report email to the client at the end of each cycle |
| 5 | Pull time from Jibble instead of a new timer (if management wants) |
| 6 | Support more than one client, each with their own paid hours |

## Rough timeline

- Week 1: Demo approved, choose Option A or B
- Week 2: Database, logins, real team loaded
- Week 3: Testing with 2 or 3 staff from each department
- Week 4: Go live with the client
