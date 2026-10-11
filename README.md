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
