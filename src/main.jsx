import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import axios from 'axios';
import {
  BrowserRouter,
  Link,
  Navigate,
  Route,
  Routes,
  useNavigate,
  useParams,
} from 'react-router-dom';
import './styles.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('tv_token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

const fmtDate = (value) =>
  value
    ? new Date(value).toLocaleString([], {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : '—';

const errMsg = (error) =>
  error?.response?.data?.detail || error?.message || 'Request failed';

function saveAuth(data) {
  localStorage.setItem('tv_token', data.access_token);
}

function logout() {
  localStorage.removeItem('tv_token');
  window.location.href = '/';
}

function Shell({ children }) {
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem('tv_token')) {
      setLoading(false);
      return;
    }

    api
      .get('/auth/me')
      .then((response) => setMe(response.data))
      .catch(() => localStorage.removeItem('tv_token'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="center">Loading TicketVault…</div>;
  }

  return (
    <>
      <header>
        <Link className="brand" to="/">
          TicketVault <span>TEST CONSOLE</span>
        </Link>

        <nav>
          <Link to="/events">Events</Link>

          {me && <Link to="/bookings">My Bookings</Link>}
          {me && <Link to="/profile">Profile</Link>}

          {me && (me.role === 'organizer' || me.role === 'admin') && (
            <Link to="/manage">Manage</Link>
          )}

          {me ? (
            <button className="ghost" onClick={logout}>
              Logout
            </button>
          ) : (
            <Link className="btn small" to="/login">
              Login
            </Link>
          )}
        </nav>
      </header>

      <main>{children}</main>

      <footer>FastAPI · PostgreSQL · Redis · WebSocket · Stripe</footer>
    </>
  );
}

function Home() {
  return (
    <section className="hero">
      <div>
        <p className="eyebrow">BACKEND TEST FRONTEND</p>
        <h1>Exercise the real TicketVault API.</h1>

        <p className="lead">
          A small React console for testing authentication, events, seat
          concurrency, Redis holds, live WebSocket updates, bookings and
          Stripe Checkout.
        </p>

        <div className="actions">
          <Link className="btn" to="/events">
            Browse events
          </Link>
          <Link className="btn secondary" to="/login">
            Sign in
          </Link>
        </div>
      </div>

      <div className="card architecture">
        <b>What this tests</b>
        <div>JWT authentication</div>
        <div>Event CRUD &amp; search</div>
        <div>50-seat event maps</div>
        <div>Hold → book / payment</div>
        <div>Real-time seat updates</div>
        <div>Booking history</div>
      </div>
    </section>
  );
}

function Login() {
  const nav = useNavigate();

  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');

    try {
      if (mode === 'register') {
        await api.post('/auth/register', {
          email,
          password,
        });
      }

      const body = new URLSearchParams();
      body.set('username', email);
      body.set('password', password);

      const response = await api.post('/auth/login', body, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      saveAuth(response.data);
      nav('/events');
      window.location.reload();
    } catch (error) {
      setError(errMsg(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth">
      <div className="card">
        <div className="tabs">
          <button
            className={mode === 'login' ? 'active' : ''}
            onClick={() => setMode('login')}
          >
            Login
          </button>

          <button
            className={mode === 'register' ? 'active' : ''}
            onClick={() => setMode('register')}
          >
            Register
          </button>
        </div>

        <h2>{mode === 'login' ? 'Sign in' : 'Create account'}</h2>

        <form onSubmit={submit}>
          <label>
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>

          <label>
            Password
            <input
              type="password"
              required
              minLength="6"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          {error && <div className="error">{error}</div>}

          <button className="btn full" disabled={busy}>
            {busy
              ? 'Working…'
              : mode === 'login'
                ? 'Login'
                : 'Register & login'}
          </button>
        </form>
      </div>
    </div>
  );
}

function Events() {
  const [events, setEvents] = useState([]);
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setBusy(true);

    try {
      const response = q
        ? await api.get('/events/search', {
            params: {
              q,
              page: 1,
              page_size: 50,
            },
          })
        : await api.get('/events/', {
            params: {
              page: 1,
              limit: 50,
            },
          });

      setEvents(q ? response.data.results || [] : response.data || []);
    } catch (error) {
      setError(errMsg(error));
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <>
      <div className="pagehead">
        <div>
          <p className="eyebrow">EVENTS</p>
          <h1>Browse events</h1>
        </div>

        <form
          className="search"
          onSubmit={(event) => {
            event.preventDefault();
            load();
          }}
        >
          <input
            placeholder="Search title, description…"
            value={q}
            onChange={(event) => setQ(event.target.value)}
          />

          <button className="btn">Search</button>
        </form>
      </div>

      {error && <div className="error">{error}</div>}

      {busy ? (
        <div className="center">Loading events…</div>
      ) : events.length ? (
        <div className="grid">
          {events.map((event) => (
            <Link
              className="card event"
              key={event.id}
              to={`/events/${event.id}`}
            >
              <div className="pill">EVENT #{event.id}</div>
              <h3>{event.title}</h3>
              <p>{event.description || 'No description'}</p>
              <strong>{fmtDate(event.event_date)}</strong>
              <span>
                {event.venue?.name} · {event.venue?.city}
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="empty">No events found.</div>
      )}
    </>
  );
}

function SeatMap({ eventId, onSelect, onSeatUpdate, refresh }) {
  const [seats, setSeats] = useState([]);
  const [error, setError] = useState('');
  const [live, setLive] = useState(false);

  const load = () =>
    api
      .get(`/events/${eventId}/seats`)
      .then((response) => setSeats(response.data))
      .catch((error) => setError(errMsg(error)));

  useEffect(() => {
    load();

    const wsUrl = `${API.replace(/^http/, 'ws')}/ws/events/${eventId}/seats`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => setLive(true);

    ws.onclose = () => setLive(false);

    ws.onmessage = (event) => {
      try {
        const update = JSON.parse(event.data);

        setSeats((currentSeats) =>
          currentSeats.map((seat) =>
            seat.id === update.seat_id
              ? { ...seat, status: update.status }
              : seat,
          ),
        );

        // Keep the selected seat in sync with live backend state.
        onSeatUpdate?.(update);
      } catch {
        // Ignore malformed WebSocket messages.
      }
    };

    return () => ws.close();
  }, [eventId, refresh, onSeatUpdate]);

  const rows = useMemo(() => {
    if (Object.groupBy) {
      return Object.groupBy(seats, (seat) => seat.row_label);
    }

    return seats.reduce((groups, seat) => {
      (groups[seat.row_label] ??= []).push(seat);
      return groups;
    }, {});
  }, [seats]);

  return (
    <div>
      <div className="live">
        <span className={live ? 'dot on' : 'dot'}></span>
        {live ? 'WebSocket connected' : 'WebSocket disconnected'}
        <button className="textbtn" onClick={load}>
          refresh
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="stage">STAGE</div>

      <div className="seatmap">
        {Object.entries(rows).map(([row, list]) => (
          <div className="seatrow" key={row}>
            <span className="rowlabel">{row}</span>

            {list
              .sort((a, b) => a.seat_number - b.seat_number)
              .map((seat) => (
                <button
                  key={seat.id}
                  className={`seat ${seat.status.toLowerCase()}`}
                  onClick={() => onSelect(seat)}
                  title={`${row}${seat.seat_number} · ${seat.status}`}
                >
                  {seat.seat_number}
                </button>
              ))}
          </div>
        ))}
      </div>

      <div className="legend">
        <span>
          <i className="available" />
          Available
        </span>
        <span>
          <i className="held" />
          Held
        </span>
        <span>
          <i className="booked" />
          Booked
        </span>
      </div>
    </div>
  );
}

function EventDetail() {
  const { id } = useParams();

  const [event, setEvent] = useState(null);
  const [selected, setSelected] = useState(null);
  const [refresh, setRefresh] = useState(0);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get(`/events/${id}`)
      .then((response) => setEvent(response.data))
      .catch((error) => setError(errMsg(error)));
  }, [id]);

  const handleSeatUpdate = (update) => {
    setSelected((currentSeat) => {
      if (!currentSeat || currentSeat.id !== update.seat_id) {
        return currentSeat;
      }

      return {
        ...currentSeat,
        status: update.status,
      };
    });
  };

  const action = async (type) => {
    if (!selected) {
      return;
    }

    setBusy(true);
    setMsg('');
    setError('');

    try {
      if (type === 'hold') {
        const response = await api.post(
          `/bookings/events/${id}/seats/${selected.id}/hold`,
        );

        // Update the selected seat immediately so the payment button
        // becomes available without waiting for another API request.
        setSelected((currentSeat) =>
          currentSeat
            ? {
                ...currentSeat,
                status: 'held',
              }
            : currentSeat,
        );

        setMsg(
          `Seat ${selected.row_label}${selected.seat_number} held for ${response.data.expires_in}s.`,
        );
      } else if (type === 'book') {
        const response = await api.post(
          `/bookings/${id}/book-seat/${selected.id}`,
        );

        setSelected((currentSeat) =>
          currentSeat
            ? {
                ...currentSeat,
                status: 'booked',
              }
            : currentSeat,
        );

        setMsg(`Booking confirmed: #${response.data.id}`);
      } else {
        const key = crypto.randomUUID();

        const response = await api.post(
          `/payments/checkout/${selected.id}`,
          {},
          {
            headers: {
              'Idempotency-Key': key,
            },
          },
        );

        window.open(
          response.data.checkout_url,
          '_blank',
          'noopener,noreferrer',
        );

        setMsg('Stripe Checkout opened in a new tab.');
      }

      setRefresh((value) => value + 1);
    } catch (error) {
      setError(errMsg(error));
    } finally {
      setBusy(false);
    }
  };

  if (!event) {
    return <div className="center">{error || 'Loading…'}</div>;
  }

  return (
    <>
      <div className="pagehead">
        <div>
          <p className="eyebrow">EVENT #{event.id}</p>
          <h1>{event.title}</h1>
          <p>{event.description}</p>
        </div>

        <div className="meta">
          <b>{fmtDate(event.event_date)}</b>
          <span>{event.venue?.name}</span>
          <span>
            {event.venue?.address}, {event.venue?.city}
          </span>
        </div>
      </div>

      <div className="detailgrid">
        <div className="card">
          <h2>Live seat map</h2>

          <SeatMap
            eventId={id}
            onSelect={setSelected}
            onSeatUpdate={handleSeatUpdate}
            refresh={refresh}
          />
        </div>

        <aside className="card inspector">
          <h2>Seat inspector</h2>

          {selected ? (
            <>
              <div className="seatbig">
                {selected.row_label}
                {selected.seat_number}
              </div>

              <div className="status">{selected.status}</div>

              <p>Price: ₹{selected.price}</p>

              <div className="stack">
                <button
                  className="btn full"
                  disabled={busy || selected.status !== 'available'}
                  onClick={() => action('hold')}
                >
                  Hold seat
                </button>

                <button
                  className="btn secondary full"
                  disabled={
                    busy || !['available', 'held'].includes(selected.status)
                  }
                  onClick={() => action('book')}
                >
                  Direct book
                </button>

                <button
                  className="btn dark full"
                  disabled={busy || selected.status !== 'held'}
                  onClick={() => action('pay')}
                >
                  Pay with Stripe
                </button>
              </div>
            </>
          ) : (
            <p className="muted">Select a seat to inspect it.</p>
          )}

          {msg && <div className="success">{msg}</div>}
          {error && <div className="error">{error}</div>}
        </aside>
      </div>
    </>
  );
}

function Bookings() {
  const [data, setData] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/bookings/me')
      .then((response) => setData(response.data))
      .catch((error) => setError(errMsg(error)));
  }, []);

  return (
    <>
      <div className="pagehead">
        <div>
          <p className="eyebrow">ACCOUNT</p>
          <h1>My bookings</h1>
        </div>
      </div>

      {error ? (
        <div className="error">{error}</div>
      ) : data.length ? (
        <div className="list">
          {data.map((booking) => (
            <div className="card booking" key={booking.id}>
              <div>
                <b>Booking #{booking.id}</b>
                <span>Event #{booking.event_id}</span>
              </div>

              <div>
                <span className="pill">{booking.status}</span>
                <b>₹{booking.total_amount}</b>
              </div>

              <small>{fmtDate(booking.created_at)}</small>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty">No bookings yet.</div>
      )}
    </>
  );
}

function Profile() {
  const [me, setMe] = useState(null);

  useEffect(() => {
    api.get('/auth/me').then((response) => setMe(response.data));
  }, []);

  return (
    <div className="narrow">
      <p className="eyebrow">ACCOUNT</p>
      <h1>Profile</h1>

      {me && (
        <div className="card profile">
          <div>
            <span>Email</span>
            <b>{me.email}</b>
          </div>

          <div>
            <span>User ID</span>
            <b>{me.id}</b>
          </div>

          <div>
            <span>Role</span>
            <b>{me.role}</b>
          </div>

          <div>
            <span>Active</span>
            <b>{String(me.is_active)}</b>
          </div>
        </div>
      )}
    </div>
  );
}

function Manage() {
  const [venues, setVenues] = useState([]);
  const [events, setEvents] = useState([]);

  const [venue, setVenue] = useState({
    name: '',
    city: '',
    address: '',
  });

  const [event, setEvent] = useState({
    title: '',
    description: '',
    event_date: '',
    venue_id: '',
  });

  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const load = () => {
    api
      .get('/venues/')
      .then((response) => setVenues(response.data))
      .catch(() => {});

    api
      .get('/events/', {
        params: {
          page: 1,
          limit: 50,
        },
      })
      .then((response) => setEvents(response.data))
      .catch(() => {});
  };

  useEffect(load, []);

  const createVenue = async (event) => {
    event.preventDefault();

    try {
      await api.post('/venues/', venue);

      setMsg('Venue created');
      setVenue({
        name: '',
        city: '',
        address: '',
      });

      load();
    } catch (error) {
      setError(errMsg(error));
    }
  };

  const createEvent = async (e) => {
    e.preventDefault();

    try {
      await api.post('/events/', {
        ...event,
        venue_id: Number(event.venue_id),
      });

      setMsg('Event created with 50 seats');

      setEvent({
        title: '',
        description: '',
        event_date: '',
        venue_id: '',
      });

      load();
    } catch (error) {
      setError(errMsg(error));
    }
  };

  return (
    <>
      <div className="pagehead">
        <div>
          <p className="eyebrow">ORGANIZER / ADMIN</p>
          <h1>Manage</h1>
        </div>
      </div>

      {msg && <div className="success">{msg}</div>}
      {error && <div className="error">{error}</div>}

      <div className="managegrid">
        <div className="card">
          <h2>Create venue</h2>

          <form onSubmit={createVenue}>
            <input
              placeholder="Venue name"
              required
              value={venue.name}
              onChange={(event) =>
                setVenue({
                  ...venue,
                  name: event.target.value,
                })
              }
            />

            <input
              placeholder="City"
              required
              value={venue.city}
              onChange={(event) =>
                setVenue({
                  ...venue,
                  city: event.target.value,
                })
              }
            />

            <input
              placeholder="Address"
              required
              value={venue.address}
              onChange={(event) =>
                setVenue({
                  ...venue,
                  address: event.target.value,
                })
              }
            />

            <button className="btn full">Create venue</button>
          </form>
        </div>

        <div className="card">
          <h2>Create event</h2>

          <form onSubmit={createEvent}>
            <input
              placeholder="Title"
              required
              value={event.title}
              onChange={(e) =>
                setEvent({
                  ...event,
                  title: e.target.value,
                })
              }
            />

            <textarea
              placeholder="Description"
              value={event.description}
              onChange={(e) =>
                setEvent({
                  ...event,
                  description: e.target.value,
                })
              }
            />

            <input
              type="datetime-local"
              required
              value={event.event_date}
              onChange={(e) =>
                setEvent({
                  ...event,
                  event_date: e.target.value,
                })
              }
            />

            <select
              required
              value={event.venue_id}
              onChange={(e) =>
                setEvent({
                  ...event,
                  venue_id: e.target.value,
                })
              }
            >
              <option value="">Choose venue</option>

              {venues.map((venue) => (
                <option key={venue.id} value={venue.id}>
                  {venue.name} · {venue.city}
                </option>
              ))}
            </select>

            <button className="btn full">Create event</button>
          </form>
        </div>
      </div>

      <div className="card">
        <h2>Current events</h2>

        {events.map((event) => (
          <div className="mini" key={event.id}>
            <span>
              #{event.id} {event.title}
            </span>
            <span>{event.venue?.name}</span>
          </div>
        ))}
      </div>
    </>
  );
}

function App() {
  return (
    <Shell>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/events" element={<Events />} />
        <Route path="/events/:id" element={<EventDetail />} />
        <Route path="/bookings" element={<Bookings />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/manage" element={<Manage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Shell>
  );
}

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
);
