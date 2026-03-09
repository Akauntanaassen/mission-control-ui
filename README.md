# Mission Control UI

Next.js + Tailwind interface for monitoring the Launch Producer (LUMEN), Offer Engineer (FOUNDRY), and Presale Navigator (VECTOR) agents. The UI now reads live data from the controller service instead of local mock data.

## Prerequisites
- Node 18+
- Mission Control controller API running (default `http://localhost:4000`)

Create a `.env.local` with:
```
NEXT_PUBLIC_CONTROLLER_URL=http://localhost:4000
```
(Replace the URL with your deployed controller endpoint when ready.)

## Scripts
```bash
npm install          # install deps
npm run dev          # start Next dev server on http://localhost:3000
npm run build && npm start  # production build + serve
npm run lint         # ESLint
```

## How it works
- On load the UI calls `${NEXT_PUBLIC_CONTROLLER_URL}/snapshot` for agents/tasks/events.
- Auto-refresh every 15s plus a manual “Refresh” button; falls back to mock data if offline.
- Office view mirrors the pixel-style layout; Task view shows per-agent queues; ticker reflects controller events.

## Next steps
- Hook up mutations (task updates, event posts, heartbeat actions) via the controller endpoints.
- Replace gradient cards with the planned sprite/office artwork.
- Add WebSocket/Server-Sent Events feed once the controller exposes one.
