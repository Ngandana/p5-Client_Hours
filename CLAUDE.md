# P5 Client Hours

Next.js (App Router) + TypeScript + Tailwind v4 + Vitest. Demo data lives in localStorage behind `src/lib/store.tsx`.

- Business rules are pure functions in `src/lib` (`actions.ts`, `cycles.ts`, `csv.ts`, `import-team.ts`). Add a test in `src/lib/logic.test.ts` for any rule you change.
- Views are client components in `src/components/views`; routes in `src/app` just render them.
- Colours are CSS variables in `src/app/globals.css` (light and dark), exposed to Tailwind as `bg-surface`, `text-muted`, `border-line`, etc. Do not hard-code hex values.
- Keep the accessibility basics: labelled fields, 44px targets, visible focus, 4.5:1 contrast.
- `legacy/index.html` is the original single-file demo. Reference only.
- Check before finishing: `npm test && npm run typecheck && npm run lint && npm run build`.
