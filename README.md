# TicketVault Frontend — Test Console

A React + Vite test console for exercising the real [TicketVault](https://github.com/devvrat015/ticketvault) booking API end to end: JWT auth, event browsing and search, live 50-seat maps over WebSockets, Redis-backed seat holds, direct booking, Stripe Checkout, booking history, and organizer/admin management.

> This is a **testing client**, not a customer-facing storefront. The entire app lives in `src/main.jsx` (~950 lines) plus `src/styles.css` — no component folders, no state library, on purpose: it's meant to stay small and readable while hitting every backend workflow.

## Features

| Area | What it does |
|---|---|
| Auth | Register + login against `/auth/*`, JWT stored in `localStorage` (`tv_token`), auto-attached via an axios interceptor |
| Events | Paginated list (`GET /events/`) + full-text search (`GET /events/search`) with a search bar |
| Live seat map | 50-seat map per event (`GET /events/{id}/seats`), grouped by row with a STAGE header, live-dot connection indicator, manual refresh |
| Realtime | Native WebSocket to `/ws/events/{id}/seats` — `{seat_id, status}` messages patch the map and the selected seat in place |
| Seat actions | Hold (Redis TTL, shows `expires_in`), Direct book, Pay with Stripe — each button enables only for valid seat states (`available` / `held` / `booked`) |
| Payments | Stripe Checkout via `POST /payments/checkout/{seatId}` with a fresh `Idempotency-Key` per click; checkout opens in a new tab |
| Account | Booking history (`GET /bookings/me`), profile (`GET /auth/me`) |
| Manage | Organizer/admin only: create venues (`POST /venues/`) and events (`POST /events/`, auto-creates 50 seats), plus a current-events list |

## Tech stack

React 18 · React Router 7 (`BrowserRouter`) · axios · Vite 6 · vanilla CSS (no UI framework) · Node 22 (see `.nvmrc`)

## Project structure

```text
frontend/
├── index.html        # Vite entry, mounts #root
├── package.json      # scripts: dev / build / preview
├── vercel.json       # SPA rewrite so deep links don't 404 on Vercel
├── .nvmrc            # pins Node 22
├── .env.example      # required env vars (template)
├── .env              # your local values (gitignored, never commit)
└── src/
    ├── main.jsx      # the whole app: API client, router, all pages
    └── styles.css    # all styling, no framework
```

Routes: `/` home · `/login` · `/events` · `/events/:id` · `/bookings` · `/profile` · `/manage` (organizer/admin nav-gated) · `*` → `/`.

## Run locally

```bash
npm install
cp .env.example .env   # then set VITE_API_URL if your API isn't on localhost:8000
npm run dev
```

| Variable | Default | Purpose |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8000` | Base URL of the TicketVault backend (Vite bakes this in at build time) |

The backend must be running with CORS allowing the Vite origin (`http://localhost:5173`), plus the seat-read (`GET /events/{id}/seats`) and booking-history (`GET /bookings/me`) endpoints — see `../backend-patch` if your API predates them.

## Deploy on Vercel

1. Push this folder's contents (repo root = `frontend/`).
2. Import the repo in Vercel — build (`vite build`) and output (`dist`) are auto-detected; `vercel.json` handles SPA rewrites.
3. Set environment variable **`VITE_API_URL`** to your deployed backend's `https://` URL (required — `.env` files are ignored by Vercel builds).
4. The deployed backend must serve **HTTPS** (browsers block `http` API/`ws` calls from an `https` page) and list your `https://<app>.vercel.app` origin in its CORS settings.

## Notes / limitations

- Auth token lives in `localStorage` — fine for a test console, not a pattern for production auth.
- WebSocket reconnects only via the in-app refresh (remount on `refresh` counter).
- Routes are nav-gated by role, not guard-gated — typing `/manage` directly still renders (the API enforces the real authorization).
- No test suite for the frontend; backend correctness is covered by the API's own pytest suite including its concurrency test.
