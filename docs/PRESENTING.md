# Presenting to Mrs Candice

Pick one of the three ways below. Option 2 is the best if she wants to try it herself.

## 1. On your laptop (fastest, no setup on her side)

1. Open a terminal in the project folder.
2. Run `npm run present`. It builds the app and starts it at http://localhost:3000.
3. Open it in Chrome or Edge and follow `docs/DEMO-SCRIPT.md`.

Use this instead of `npm run dev` for the meeting. It is faster and does not show dev warnings.

Before she arrives:
- Go to **Manager > Team and settings > Reset demo data** so the sample team and hours are fresh.
- Close other tabs, set the browser zoom to 110% if you are showing it on a big screen, and switch off notifications.
- Open the **Client** view once so you know the last cycle shows 52.5 hours (7.5 above the 45 paid hours).

## 2. A link she can open (phone or her own laptop)

Deploy to Vercel once, then send her the link.

1. Push the project to GitHub (`origin` is already set to Ngandana/p5-Client_Hours).
2. In Vercel, choose **Add New > Project**, import the repo, and keep the default Next.js settings.
3. Send her the `*.vercel.app` link.

Her copy of the demo keeps its own data in her browser, so nothing she clicks changes yours. If she finds a broken state, **Reset demo data** fixes it. Turn on Vercel's password protection if you do not want the link to be public (the sample client name and team are made up, but the logo is the real one).

## 3. Backup if the internet or laptop fails

- Open the app, go to the **Client** view, click **Print or save PDF** on the last cycle, and keep the PDF on your phone.
- Take screenshots of Track time, Approvals, Overview and the client report.

## Flow of the meeting (about 10 minutes)

1. The problem (30 seconds) and the demo (5 minutes), using `docs/DEMO-SCRIPT.md`.
2. Let her click around for 2 minutes. Suggest she switches to **Manager** and approves something.
3. Ask the feedback questions at the end of the script.
4. Show `docs/NEXT-STEPS.md`: what is needed to make it real (shared database, logins, email alerts) and the 4-week plan.

## Things she may ask

- **Is this real data?** No. The names and hours are samples. The real team can be loaded from Airtable (`docs/AIRTABLE-PROMPT.md`).
- **Can the client log in?** Not in the demo. Logins are priority 2 in `docs/NEXT-STEPS.md`.
- **Does it share data between people?** Not yet. Each browser has its own copy until the shared database is added.
