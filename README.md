# EventEase – Full-Stack Event Management & Registration Platform

A production-grade, responsive event management and ticketing platform inspired by Eventbrite. Built with the MERN stack (MongoDB, Express, React, Node.js) with secure HTTP-only cookie JWT authentication, atomic ticket inventory reservation, QR code check-in, organizer analytics, and admin moderation.

---

## 🚀 Tech Stack

- **Frontend:** React 19, Vite, Tailwind CSS v4, Lucide Icons, Axios, QRCode.react, React Router v7
- **Backend:** Node.js, Express 5, Mongoose 9, MongoDB
- **Authentication:** JWT stored in secure HTTP-only cookies (`eventease_token`), Bcryptjs password hashing (12 rounds)
- **Validation:** Zod schema validation & Mongoose model constraints
- **Security:** Helmet headers, CORS credentials whitelist, atomic inventory locking against overselling, role-based authorization

---

## 📁 Project Structure

```text
Eventfull/
├── client/                     # React + Vite frontend
│   ├── src/
│   │   ├── components/         # Reusable UI atoms, layouts, cards, dialogs
│   │   ├── context/            # AuthContext (session) & ToastContext
│   │   ├── data/               # Categories metadata, images
│   │   ├── hooks/              # useFetch hook
│   │   ├── lib/api.js          # Shared Axios instance with credentials
│   │   ├── pages/              # Routes: Public, Attendee, Organizer, Admin, Auth
│   │   └── utils/              # Formatting, roles, validators
│   └── .env                    # VITE_USE_MOCK=false (connected to real backend)
├── server/                     # Express + MongoDB backend
│   ├── src/
│   │   ├── config/database.js  # Mongoose MongoDB connection
│   │   ├── controllers/        # Request handlers (auth, events, organizer, bookings, admin, contact, reviews, notifications)
│   │   ├── middleware/         # protect, authorize, optionalAuth, errorHandler
│   │   ├── models/             # User, Event, Booking, Ticket, ContactMessage, Review, Notification
│   │   ├── routes/             # Express API routes
│   │   └── utils/              # Presenters, seed script, test suite
│   └── package.json            # Scripts: dev, start, seed, test
└── docs/                       # Architecture & API specifications
```

---

## ⚡ Quickstart Guide (PowerShell)

### 1. Backend Setup & Seeding

Open a PowerShell terminal:
```powershell
cd server
npm install
npm run seed     # Seeds MongoDB with realistic events, tickets, and demo users
npm run dev      # Starts Express server on http://localhost:5000
```

### 2. Frontend Setup

Open a second PowerShell terminal:
```powershell
cd client
npm install
npm run dev      # Starts Vite dev server (proxies /api to http://localhost:5000)
```
Open **`http://localhost:5173`** in your browser.

---

## 🔑 Demo Accounts

The database comes pre-seeded with accounts for all roles (Password: `Demo@1234`):

| Role | Email | Capabilities |
|---|---|---|
| **Attendee** | `attendee@demo.com` | Browse events, book tickets, view QR tickets, save favorites, cancel bookings |
| **Organizer** | `organizer@demo.com` | Create/edit events, track sales, QR ticket check-in, attendee list, analytics |
| **Organizer 2** | `organizer2@demo.com` | Manage tech bootcamp events |
| **Administrator** | `admin@demo.com` | Platform overview, event moderation (approve/reject/unpublish), user suspend/reactivate, sales reports |

*(You can also register a new account on the Signup page or click the quick-login buttons on the Login page).*

---

## 🧪 Automated Testing

To run the complete automated test suite verifying all 49 core endpoints and security checks:
```powershell
cd server
npm test
```
The test suite verifies:
- Health checks & database persistence
- Registration, duplicate rejection, and password requirements
- Login, session cookies, and suspended account blocking
- User profiles & password recovery
- Event discovery, category filters, dates, and search
- Organizer draft creation, updates, and submission
- Admin moderation decisions (approve, reject with reason, unpublish)
- Atomic ticket inventory locking (zero overselling under concurrency)
- Unique booking references (`EE-XXXXXX`) and ticket QR tokens
- Digital ticket verification & duplicate check-in rejection
- Booking cancellation with automatic inventory restoration
- Favorites toggle and contact form submission

---

## 📖 API Reference Summary

| Group | Method & Path | Access | Description |
|---|---|---|---|
| **Auth** | `POST /api/auth/register` | Public | Register new user + set HTTP-only cookie |
| | `POST /api/auth/login` | Public | Login with email & password + set cookie |
| | `POST /api/auth/logout` | Public | Clears auth cookie |
| | `GET /api/auth/me` | User | Get current logged-in user profile |
| | `PATCH /api/auth/me` | User | Update name and profile image |
| | `POST /api/auth/forgot-password` | Public | Initiate password reset link |
| | `POST /api/auth/reset-password` | Public | Reset password with token |
| **Events** | `GET /api/events/featured` | Public | Get featured upcoming events |
| | `GET /api/events` | Public | Explore with filters, search, sort, pagination |
| | `GET /api/events/:id` | Public / Owner | Get event details |
| | `POST /api/events` | Organizer / Admin | Create draft event with ticket types |
| | `PATCH /api/events/:id` | Organizer / Admin | Update event details & ticket quantities |
| | `DELETE /api/events/:id` | Organizer / Admin | Delete event (blocked if bookings exist) |
| | `POST /api/events/:id/publish` | Organizer / Admin | Submit draft/rejected event for admin review |
| | `POST /api/events/:id/cancel` | Organizer / Admin | Cancel event and its active bookings |
| **Organizer**| `GET /api/organizer/events` | Organizer / Admin | List all organizer's events |
| | `GET /api/organizer/dashboard` | Organizer / Admin | Organizer summary stats & recent events |
| | `GET /api/organizer/events/:id/attendees` | Organizer / Admin | List attendee bookings for event |
| | `GET /api/organizer/events/:id/analytics` | Organizer / Admin | Sales by ticket type and daily breakdown |
| **Bookings** | `POST /api/bookings` | Attendee / Admin | Atomic booking reservation + QR ticket creation |
| | `GET /api/bookings/my` | Attendee | List attendee's bookings |
| | `GET /api/bookings/:id` | Attendee / Admin | View single booking details |
| | `POST /api/bookings/:id/cancel` | Attendee | Cancel booking & restore ticket inventory |
| **Tickets** | `GET /api/tickets/my` | Attendee | List digital tickets with QR tokens |
| | `POST /api/tickets/check-in` | Organizer / Admin | Scan QR token/code to admit attendee |
| **Favorites**| `GET /api/favorites` | Attendee | List saved events |
| | `POST /api/favorites/:id` | Attendee | Toggle event in favorites list |
| **Admin** | `GET /api/admin/dashboard` | Admin | Overall user, event, booking, and revenue stats |
| | `GET /api/admin/users` | Admin | List users with search & role filters |
| | `PATCH /api/admin/users/:id/status` | Admin | Suspend or reactivate user accounts |
| | `GET /api/admin/events` | Admin | List events across all statuses for moderation |
| | `PATCH /api/admin/events/:id/review`| Admin | Approve, reject, or unpublish events |
| | `GET /api/admin/reports` | Admin | Platform revenue, category analysis & top events |
| **Contact** | `POST /api/contact` | Public | Submit inquiry message |
| **Reviews** | `GET /api/reviews/:eventId` | Public | Get reviews & ratings for an event |
| | `POST /api/reviews/:eventId`| Attendee | Post rating and review (verified attendees only) |
