// MOCK DATABASE (development only). Lives in the browser's localStorage so the frontend works
// without a backend. Set VITE_USE_MOCK=false to talk to the real Express API instead.
import { ids, photo } from '../data/images'

// Seed passwords are plain text on purpose: this is fake data, the real backend must hash them.

const KEY = 'eventease_mock_db_v2'
const DAY = 86400000

export class HttpError extends Error {
  constructor(status, message, errors) {
    super(message)
    this.status = status
    this.errors = errors
  }
}

export const uid = () => crypto.randomUUID().replace(/-/g, '').slice(0, 24)
const isoIn = (days, hour = 18) => {
  const d = new Date()
  d.setDate(d.getDate() + days)
  d.setHours(hour, 0, 0, 0)
  return d.toISOString()
}

let cache

export function save(db) {
  try {
    localStorage.setItem(KEY, JSON.stringify(db))
  } catch {
    /* storage unavailable: the in-memory copy still works for this tab */
  }
}

export function load() {
  if (cache) return cache
  try {
    cache = JSON.parse(localStorage.getItem(KEY))
  } catch {
    cache = null
  }
  if (!cache) {
    cache = seed()
    save(cache)
  }
  return cache
}

// ---- Booking rules (same rules the real backend must enforce) ----

export function createBooking(db, user, eventId, items, at = new Date()) {
  const ev = db.events.find((e) => e._id === eventId)
  if (!ev || ev.status !== 'published') throw new HttpError(404, 'Event not found or not open for booking')
  if (new Date(ev.endDate) < at) throw new HttpError(400, 'This event has already ended')
  if (!Array.isArray(items) || !items.length) throw new HttpError(400, 'Select at least one ticket')

  const lines = items.map((it) => {
    const tt = ev.ticketTypes.find((t) => t._id === it.ticketTypeId)
    const qty = Number(it.quantity)
    if (!tt) throw new HttpError(400, 'Invalid ticket type')
    if (!Number.isInteger(qty) || qty < 1) throw new HttpError(400, 'Invalid quantity')
    if (tt.salesStart && new Date(tt.salesStart) > at) throw new HttpError(400, `${tt.name} is not on sale yet`)
    if (tt.salesEnd && new Date(tt.salesEnd) < at) throw new HttpError(400, `Sales have ended for ${tt.name}`)
    if (tt.quantity - tt.sold < qty) throw new HttpError(409, `Only ${Math.max(tt.quantity - tt.sold, 0)} left for ${tt.name}`)
    return { tt, qty }
  })
  const count = lines.reduce((s, l) => s + l.qty, 0)
  if (count > 10) throw new HttpError(400, 'You can book at most 10 tickets at once')

  // Price is always calculated here, never taken from the client.
  const totalAmount = lines.reduce((s, l) => s + l.tt.price * l.qty, 0)
  const alreadyRegistered = db.bookings.some((b) => b.attendeeId === user._id && b.eventId === eventId && b.status === 'confirmed' && b.totalAmount === 0)
  if (totalAmount === 0 && alreadyRegistered) throw new HttpError(409, 'You are already registered for this event')

  const booking = {
    _id: uid(),
    reference: `EE-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    attendeeId: user._id,
    eventId,
    items: lines.map((l) => ({ ticketTypeId: l.tt._id, name: l.tt.name, price: l.tt.price, quantity: l.qty })),
    totalAmount,
    currency: 'LKR',
    status: 'confirmed',
    paymentStatus: totalAmount === 0 ? 'not_required' : 'paid',
    cancelledAt: null,
    createdAt: at.toISOString(),
  }
  db.bookings.push(booking)
  for (const l of lines) {
    l.tt.sold += l.qty
    for (let i = 0; i < l.qty; i++) {
      db.tickets.push({
        _id: uid(),
        bookingId: booking._id,
        attendeeId: user._id,
        eventId,
        ticketTypeId: l.tt._id,
        ticketTypeName: l.tt.name,
        code: `TKT-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        qrToken: uid() + uid(), // opaque, unguessable: carries no personal data
        status: 'valid',
        checkedInAt: null,
        checkedInBy: null,
      })
    }
  }
  return booking
}

export function cancelBooking(db, booking) {
  const ev = db.events.find((e) => e._id === booking.eventId)
  for (const it of booking.items) {
    const tt = ev?.ticketTypes.find((t) => t._id === it.ticketTypeId)
    if (tt) tt.sold = Math.max(tt.sold - it.quantity, 0) // give the seats back
  }
  db.tickets.filter((t) => t.bookingId === booking._id).forEach((t) => (t.status = 'cancelled'))
  booking.status = 'cancelled'
  booking.cancelledAt = new Date().toISOString()
}

// ---- Seed data ----

function seed() {
  const db = { users: [], events: [], bookings: [], tickets: [], messages: [] }
  const user = (name, email, role, extra = {}) => {
    const u = { _id: uid(), name, email, password: 'Demo@1234', role, profileImage: '', accountStatus: 'active', favorites: [], createdAt: isoIn(-30), ...extra }
    db.users.push(u)
    return u
  }
  user('Platform Admin', 'admin@demo.com', 'admin')
  const org1 = user('Pulse Events', 'organizer@demo.com', 'organizer')
  const org2 = user('DevLanka', 'organizer2@demo.com', 'organizer')
  const att = user('Demo Attendee', 'attendee@demo.com', 'attendee')
  const att2 = user('Kasun Silva', 'kasun@demo.com', 'attendee')
  const att3 = user('Nadeesha Fernando', 'nadeesha@demo.com', 'attendee')
  user('Suspended Sample', 'suspended@demo.com', 'attendee', { accountStatus: 'suspended' })

  const tt = (name, price, quantity, description = '') => ({ _id: uid(), name, description, price, quantity, sold: 0, salesStart: null, salesEnd: null })
  const ev = (o) => {
    const e = { _id: uid(), bannerImage: '', address: '', country: 'Sri Lanka', status: 'published', rejectionReason: '', featured: false, createdAt: isoIn(-20), ...o }
    db.events.push(e)
    return e
  }

  const e0 = ev({ title: 'Open Mic Night', bannerImage: photo(ids.openMic), description: 'An easy-going evening of live music, poetry and stand-up from local performers.', category: 'music', organizerId: org1._id, venue: 'The Cellar Bar', address: '4 Park Lane', city: 'Colombo', startDate: isoIn(-10, 19), endDate: isoIn(-10, 22), capacity: 80, ticketTypes: [tt('Entry', 0, 80)] })
  const e1 = ev({ title: 'Neon Nights Live Concert', bannerImage: photo(ids.concert), description: 'A huge open-air night of live bands, light shows and good vibes. Gates open at 5 PM.', category: 'music', organizerId: org1._id, venue: 'Open Air Arena', address: '12 Stadium Road', city: 'Colombo', startDate: isoIn(18, 18), endDate: isoIn(18, 23), capacity: 500, featured: true, ticketTypes: [tt('General Admission', 3500, 300, 'Standing area'), tt('VIP', 8000, 50, 'Front zone with lounge access'), tt('Student', 2500, 100, 'Valid student ID required at the gate')] })
  const e2 = ev({ title: 'CodeCamp: Web Dev Bootcamp', bannerImage: photo(ids.coding), description: 'A full-day, hands-on bootcamp covering HTML, CSS, JavaScript and React for beginners.', category: 'tech', organizerId: org2._id, venue: 'Tech Hub', address: '88 Hill Street', city: 'Kandy', startDate: isoIn(10, 9), endDate: isoIn(10, 17), capacity: 120, featured: true, ticketTypes: [tt('Free Registration', 0, 120, 'Lunch not included')] })
  const e3 = ev({ title: 'Street Food Carnival', bannerImage: photo(ids.streetFood), description: 'Dozens of street food stalls, cooking demos and live music inside the historic Galle Fort.', category: 'food', organizerId: org1._id, venue: 'Fort Grounds', address: 'Fort Road', city: 'Galle', startDate: isoIn(25, 11), endDate: isoIn(25, 21), capacity: 800, featured: true, ticketTypes: [tt('Entry Pass', 500, 800, 'Includes 2 tasting coupons')] })
  const e4 = ev({ title: 'Charity 10K Fun Run', bannerImage: photo(ids.run), description: 'Run or walk 10 kilometres along the coast to raise funds for local children\'s education.', category: 'sports', organizerId: org2._id, venue: 'Galle Face Green', address: 'Galle Road', city: 'Colombo', startDate: isoIn(32, 6), endDate: isoIn(32, 10), capacity: 1000, ticketTypes: [tt('Runner', 0, 1000, 'T-shirt collected on race day')] })
  const e5 = ev({ title: 'Modern Art Exhibition', bannerImage: photo(ids.gallery), description: 'Paintings, sculpture and installations from twenty emerging Sri Lankan artists.', category: 'arts', organizerId: org1._id, venue: 'City Gallery', address: '21 Art Avenue', city: 'Colombo', startDate: isoIn(40, 10), endDate: isoIn(40, 18), capacity: 200, ticketTypes: [tt('Standard', 800, 150), tt('Guided Tour', 1500, 50, 'Includes a curator-led tour')] })
  ev({ title: 'Startup Pitch Night', bannerImage: photo(ids.pitch), description: 'Ten early-stage startups pitch to a panel of investors, followed by networking.', category: 'business', organizerId: org2._id, venue: 'Innovation Centre', address: '5 Tech Park', city: 'Colombo', startDate: isoIn(45, 17), endDate: isoIn(45, 21), capacity: 150, ticketTypes: [tt('Attendee', 1500, 130), tt('Investor Pass', 4000, 20)] })
  ev({ title: 'AI for Students Workshop', bannerImage: photo(ids.students), description: 'Learn how to use AI tools responsibly for study, research and building small projects.', category: 'education', organizerId: org2._id, venue: 'University Hall', address: 'Campus Road', city: 'Jaffna', startDate: isoIn(52, 14), endDate: isoIn(52, 17), capacity: 200, ticketTypes: [tt('Student Entry', 0, 200)] })
  ev({ title: 'Acoustic Evenings', bannerImage: photo(ids.band), description: 'Sunset acoustic sets by the beach with fresh seafood and cold drinks.', category: 'music', organizerId: org1._id, venue: 'Beach Cafe', address: 'Lewis Place', city: 'Negombo', startDate: isoIn(60, 19), endDate: isoIn(60, 22), capacity: 100, ticketTypes: [tt('Table for Two', 2400, 30), tt('Standing', 1200, 70)] })
  ev({ title: 'Beach Clean-up Drive', description: 'Join volunteers for a morning clean-up of Unawatuna beach. Gloves and bags provided.', category: 'charity', organizerId: org2._id, venue: 'Unawatuna Beach', address: 'Beach Road', city: 'Galle', startDate: isoIn(20, 7), endDate: isoIn(20, 11), capacity: 150, status: 'pending', ticketTypes: [tt('Volunteer', 0, 150)] })
  ev({ title: 'Jazz Under the Stars', bannerImage: photo(ids.jazz), description: 'An outdoor jazz evening with a seven-piece band and a rooftop view of the city.', category: 'music', organizerId: org1._id, venue: 'Skyline Terrace', address: '9 Tower Road', city: 'Colombo', startDate: isoIn(70, 19), endDate: isoIn(70, 23), capacity: 120, status: 'draft', ticketTypes: [tt('Standard', 4500, 120)] })

  // Some history so dashboards, tickets and charts are not empty.
  const at = (daysAgo) => new Date(Date.now() - daysAgo * DAY)
  const book = (u, e, n, qty, daysAgo) => createBooking(db, u, e._id, [{ ticketTypeId: e.ticketTypes[n]._id, quantity: qty }], at(daysAgo))
  book(att, e0, 0, 1, 15)
  book(att, e1, 0, 2, 6)
  book(att, e2, 0, 1, 4)
  book(att2, e2, 0, 1, 5)
  book(att2, e1, 1, 1, 3)
  book(att2, e1, 2, 2, 2)
  book(att2, e3, 0, 3, 1)
  book(att3, e1, 0, 4, 1)
  book(att3, e5, 0, 2, 1)
  book(att3, e2, 0, 1, 2)
  book(att3, e4, 0, 1, 3)
  const scanned = db.tickets.find((t) => t.eventId === e2._id && t.attendeeId === att2._id)
  Object.assign(scanned, { status: 'checked_in', checkedInAt: at(0).toISOString(), checkedInBy: org2._id })
  att.favorites = [e3._id, e5._id]
  return db
}
