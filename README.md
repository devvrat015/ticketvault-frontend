# TicketVault Test Frontend

React + Vite test console built against the current TicketVault API.

## Run

```bash
npm install
cp .env.example .env
npm run dev
```

Default API URL: `http://localhost:8000`.

## Features
- Register/login with the real `/auth` endpoints
- Event list + `/events/search`
- Event details + 50-seat live map
- WebSocket seat updates
- Redis hold endpoint
- Direct booking endpoint
- Stripe Checkout + Idempotency-Key
- Current-user bookings
- Profile
- Organizer/admin venue + event creation

The frontend expects the small backend patch in `../backend-patch` because the original API has no read endpoint for seats and no current-user booking-history endpoint. It also adds CORS for Vite.
