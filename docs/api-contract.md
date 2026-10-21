# EventEase API contract

The React client calls exactly these endpoints (all under `/api`). The mock server in
`client/src/mock/adapter.js` implements the same contract, so you can read it as a working example of every rule.

## Conventions
- JSON in, JSON out. **Success** returns the data directly (an object or array, no wrapper). Lists with paging return `{ data, page, pages, total }`.
- **Errors** return `{ message, errors? }` with a proper status. `errors` is an object of field messages, e.g. `{ "email": "This email is already registered" }`. The client shows `errors.<field>` next to the input and `message` as a toast.
- Status codes: 200 OK, 201 Created, 400 validation, 401 not logged in, 403 not allowed / suspended, 404 not found, 409 conflict (sold out, duplicate, wrong state).
- Auth: JWT in an **HTTP-only cookie** set by login/register. The client sends it with `withCredentials: true`. Never put the token in JSON or localStorage.
- IDs are strings (`_id`). Dates are ISO 8601 strings (UTC).
- Roles: `attendee`, `organizer`, `admin`. **Enforce roles and ownership on the server**; the client checks are only for show.
- Never return `passwordHash`. Never trust client prices, totals or statuses: calculate on the server.

## Shapes
```
User    { _id, name, email, role, profileImage, accountStatus: "active"|"suspended", favorites: [eventId], createdAt }
Event   { _id, title, description, category (slug), bannerImage, venue, address, city, country, startDate, endDate,
          capacity, status: "draft"|"pending"|"published"|"rejected"|"cancelled", rejectionReason, featured, createdAt,
          organizer: { _id, name }, ticketTypes: [TicketType],
          minPrice, isFree, soldCount, remaining }              // last four are derived by the server
TicketType { _id, name, description, price, quantity, sold, remaining, salesStart|null, salesEnd|null }
Booking { _id, reference, items: [{ ticketTypeId, name, price, quantity }], totalAmount, currency, status: "confirmed"|"cancelled",
          paymentStatus: "paid"|"not_required", cancelledAt, createdAt,
          event: { _id, title, category, startDate, endDate, venue, city, bannerImage },
          tickets: [{ _id, code, qrToken, ticketTypeName, status: "valid"|"checked_in"|"cancelled", checkedInAt }],
          canCancel }                                            // true until 24h before the event starts
```
Categories (fixed list, the `category` slug): `music tech food sports arts business education charity`.

## Auth
| Method & path | Body | Returns |
|---|---|---|
| POST `/auth/register` | `{ name, email, password, role: "attendee"\|"organizer" }` | 201 `User` + sets cookie. 400 with `errors` (email taken: `errors.email`) |
| POST `/auth/login` | `{ email, password }` | `User` + sets cookie. 401 wrong credentials, 403 suspended |
| POST `/auth/logout` | - | `{ message }`, clears cookie |
| GET `/auth/me` | - | `User` or 401 |
| PATCH `/auth/me` | `{ name, profileImage }` | `User` |
| POST `/auth/forgot-password` | `{ email }` | always 200 `{ message }` (do not reveal if the email exists) |
| POST `/auth/reset-password` | `{ token, password }` | `{ message }` |
| POST `/contact` | `{ name, email, message }` | 201 `{ message }` |

Password rule (client and server): 8+ characters, at least one letter and one number. Hash with bcrypt.

## Events (public)
| GET `/events` | query: `search, category, city, date (YYYY-MM-DD), price (free\|paid), sort (date\|newest\|price_asc\|price_desc), page, limit` | `{ data: [Event], page, pages, total }` |
|---|---|---|
Only `published` events that have not ended. `search` matches title, description, venue, city. `city` matches city or venue. `date` = events happening on that day.

| GET `/events/featured` | - | `[Event]` (up to 6, `featured: true`, published and upcoming) |
|---|---|---|
| GET `/events/:id` | - | `Event`. Non-published events are visible only to their organizer and admins (others get 404). `cancelled` events are visible to everyone |

## Events (organizer CRUD)
| Method & path | Who | Notes |
|---|---|---|
| POST `/events` | organizer | Body: `{ title, category, description, bannerImage, venue, address, city, country, startDate, endDate, capacity, ticketTypes: [{ name, description, price, quantity, salesStart, salesEnd }] }`. Creates a `draft`. 201 `Event` |
| PATCH `/events/:id` | owner or admin | Same body. Ticket types with `_id` are updated, without are created. Quantity may not go below `sold`; a type with sales cannot be removed. Cancelled events: 409 |
| DELETE `/events/:id` | owner or admin | 409 if there are confirmed bookings |
| POST `/events/:id/publish` | owner | `draft`/`rejected` -> `pending` (waits for admin) |
| POST `/events/:id/cancel` | owner or admin | status `cancelled`, cancels all confirmed bookings |
| GET `/organizer/events` | organizer | all own events, any status |
| GET `/organizer/dashboard` | organizer | `{ stats: { totalEvents, published, pending, drafts, ticketsSold, revenue }, recentEvents: [Event] }` |
| GET `/organizer/events/:id/attendees` | owner | `[{ _id, code, attendeeName, attendeeEmail, ticketType, status, checkedInAt, bookingReference }]` |
| GET `/organizer/events/:id/analytics` | owner | `{ event: { _id, title, capacity }, totals: { ticketsSold, revenue, checkedIn, capacityUsed (percent) }, byTicketType: [{ name, sold, quantity, revenue }], byDay: [{ date: "YYYY-MM-DD", tickets }] }` |

Validation (return 400 with `errors`): title 3+ chars; valid category; description 20+ chars; venue and city required; start and end required, end after start; capacity whole number >= 1; `bannerImage` empty or an http(s) URL; at least one ticket type; each ticket type needs a name, price >= 0, whole quantity >= 1, `salesEnd` after `salesStart`; **sum of quantities must not exceed capacity** (`errors.ticketsSummary`). For ticket-row errors the client reads `errors.tickets` as an array aligned with `ticketTypes`.

## Bookings and tickets (attendee unless noted)
| POST `/bookings` | `{ eventId, items: [{ ticketTypeId, quantity }] }` | 201 `Booking` |
|---|---|---|
Server rules: event is `published` and not ended; ticket type belongs to the event and is within its sales window; `quantity <= remaining` (409 otherwise); max 10 tickets per booking; price and total calculated by the server; a free event cannot be registered twice by the same user (409); **inventory must not oversell under concurrent requests** (atomic update such as `findOneAndUpdate({ _id, sold: { $lte: quantity - qty } }, { $inc: { sold: qty } })`, or a transaction). Create one `Ticket` per seat with a unique `code` (e.g. `TKT-8F2K9Q`) and an unguessable `qrToken` (>= 32 random chars, no personal data).

| GET `/bookings/my` | - | `[Booking]`, newest first |
|---|---|---|
| GET `/bookings/:id` | owner or admin | `Booking` (404 for anyone else) |
| POST `/bookings/:id/cancel` | owner | 409 if `canCancel` is false. Marks tickets `cancelled` and **restores inventory** (`sold -= quantity`) |
| GET `/tickets/my` | attendee | `[{ _id, code, qrToken, ticketTypeName, status, checkedInAt, bookingId, bookingReference, event: {...summary} }]` |
| POST `/tickets/check-in` | organizer who owns the event, or admin | Body `{ eventId, token }`. `token` is the `qrToken` or `code`. 404 unknown ticket; 403 other organizer's event; 409 wrong event / cancelled / already checked in (message includes the time). Success returns `{ _id, code, ticketTypeName, status: "checked_in", checkedInAt, attendeeName }` and stores `checkedInAt` and `checkedInBy` |

## Favorites (attendee)
| GET `/favorites` | `[Event]` (published only) |
|---|---|
| POST `/favorites/:eventId` | toggles; returns `{ favorites: [eventId] }` |

## Admin (admin only)
| Method & path | Notes |
|---|---|
| GET `/admin/dashboard` | `{ stats: { users, organizers, attendees, events, pending, bookings, revenue }, pendingEvents: [Event] }` |
| GET `/admin/users?search=&role=` | `[User]` |
| PATCH `/admin/users/:id/status` | `{ accountStatus: "active"\|"suspended" }`. Admins cannot be suspended. A suspended user gets 403 on login and on every later request |
| GET `/admin/events?status=` | `[Event]`, all statuses (omit `status` for all) |
| PATCH `/admin/events/:id/review` | `{ decision: "approve"\|"reject"\|"unpublish", reason }`. approve: `pending` -> `published`. reject: `reason` 5+ chars, `pending` -> `rejected`. unpublish: `published` -> `draft` |
| GET `/admin/reports` | `{ totals: { bookings, tickets, revenue, cancelled }, byCategory: [{ category (display name), tickets, revenue }], topEvents: [{ _id, title, sold, revenue }], usersByRole: [{ role, count }] }` |

## Switching the client to your backend
1. In `client/.env` set `VITE_USE_MOCK=false`.
2. Run your API on **port 5000** (the Vite dev server proxies `/api` to it, so cookies work without extra CORS setup). In production set `VITE_API_URL` to the deployed API and configure CORS with `credentials: true` for the frontend origin.
3. Delete `client/src/mock/` once everything works.

## Suggested collections
`users`, `events` (with `organizer` ref), `tickettypes` (ref `event`) or embedded, `bookings` (refs `attendee`, `event`; items snapshot name and price), `tickets` (refs `booking`, `attendee`, `event`; unique `code` and `qrToken`), `favorites`, `contactmessages`.
