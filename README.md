# EventEase – Smart Event Management & Registration Platform

MERN stack mini project (EC4307). Attendees discover events and book tickets, organizers create and manage events, admins moderate the platform.

## Structure
```
client/   React + Vite + Tailwind frontend (finished, runs on its own with a built-in mock API)
server/   Express + MongoDB backend (to be built against docs/api-contract.md)
docs/     architecture.md and api-contract.md
```

## Run the frontend
```powershell
cd client
npm install
npm run dev -- --port 5180
```
Open the printed URL. By default (`VITE_USE_MOCK=true`) data is kept in the browser, so everything works without a backend.

Demo accounts (password `Demo@1234`): `attendee@demo.com`, `organizer@demo.com`, `admin@demo.com`.
To reset the demo data, clear the site's localStorage.

## Connect the real backend
See the last section of `docs/api-contract.md`.

## Features
- Public: home, explore with search / filter / sort / pagination, event details, categories, about, contact, sign up, log in, password reset
- Attendee: dashboard, book tickets, digital tickets with QR codes, cancel bookings, saved events, profile
- Organizer: create / edit / delete events with ticket types, submit for approval, cancel, attendee list with CSV export, analytics, QR check-in
- Admin: dashboard, user suspend / reactivate, event approval and moderation, reports
