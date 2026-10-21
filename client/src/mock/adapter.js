// MOCK API SERVER (development only). An Axios adapter that answers /api requests from the mock
// database instead of the network. It follows docs/api-contract.md, the same contract the real
// Express backend must implement. Delete this folder once the real backend is connected.
import { AxiosError } from 'axios'
import { categories } from '../data/categories'
import { email as emailRule, password as passwordRule, validateEvent } from '../utils/validate'
import { HttpError, cancelBooking, createBooking, load, save, uid } from './db'

const SESSION = 'eventease_mock_session'
const DAY = 86400000
const delay = (ms) => new Promise((r) => setTimeout(r, ms))
const sum = (list, fn) => list.reduce((s, x) => s + fn(x), 0)

// ---- tiny router ----
const routes = []
const route = (method, path, handler) =>
  routes.push({ method, re: new RegExp(`^${path.replace(/:(\w+)/g, '(?<$1>[^/]+)')}$`), handler })

// ---- guards ----
function need(ctx, ...roles) {
  const u = ctx.user
  if (!u) throw new HttpError(401, 'Please log in to continue')
  if (u.accountStatus === 'suspended') throw new HttpError(403, 'Your account is suspended')
  if (roles.length && !roles.includes(u.role)) throw new HttpError(403, 'You do not have permission to do this')
  return u
}
function findEvent(ctx) {
  const e = ctx.db.events.find((x) => x._id === ctx.params.id)
  if (!e) throw new HttpError(404, 'Event not found')
  return e
}
// Organizers may only touch their own events; admins may touch any.
function ownedEvent(ctx) {
  const u = need(ctx, 'organizer', 'admin')
  const e = findEvent(ctx)
  if (u.role !== 'admin' && e.organizerId !== u._id) throw new HttpError(403, 'You can only manage your own events')
  return e
}

// ---- presenters (what the API returns) ----
const publicUser = ({ password: _password, ...u }) => u // never send the password back

function presentEvent(db, e) {
  const org = db.users.find((u) => u._id === e.organizerId)
  const { organizerId: _owner, ...rest } = e
  const ticketTypes = e.ticketTypes.map((t) => ({ ...t, remaining: Math.max(t.quantity - t.sold, 0) }))
  const prices = ticketTypes.map((t) => t.price)
  return {
    ...rest,
    ticketTypes,
    organizer: { _id: org?._id, name: org?.name ?? 'Unknown' },
    minPrice: prices.length ? Math.min(...prices) : 0,
    isFree: prices.length > 0 && prices.every((p) => p === 0),
    soldCount: sum(ticketTypes, (t) => t.sold),
    remaining: sum(ticketTypes, (t) => t.remaining),
  }
}
const eventSummary = (e) => ({ _id: e._id, title: e.title, category: e.category, startDate: e.startDate, endDate: e.endDate, venue: e.venue, city: e.city, bannerImage: e.bannerImage })
const ticketView = (t) => ({ _id: t._id, code: t.code, qrToken: t.qrToken, ticketTypeName: t.ticketTypeName, status: t.status, checkedInAt: t.checkedInAt })

function presentBooking(db, b) {
  const e = db.events.find((x) => x._id === b.eventId)
  const { attendeeId: _a, eventId: _e, ...rest } = b
  return {
    ...rest,
    event: eventSummary(e),
    tickets: db.tickets.filter((t) => t.bookingId === b._id).map(ticketView),
    canCancel: b.status === 'confirmed' && new Date(e.startDate) - Date.now() > DAY, // policy: until 24h before start
  }
}

const confirmedBookings = (db, eventId) => db.bookings.filter((b) => b.status === 'confirmed' && (!eventId || b.eventId === eventId))

// ======================= AUTH =======================
route('post', '/auth/register', (ctx) => {
  const { name = '', email = '', password = '', role = 'attendee' } = ctx.body
  const errors = {}
  if (name.trim().length < 2) errors.name = 'Name must be at least 2 characters'
  if (emailRule(email)) errors.email = emailRule(email)
  if (passwordRule(password)) errors.password = passwordRule(password)
  if (!['attendee', 'organizer'].includes(role)) errors.role = 'Choose attendee or organizer'
  if (!errors.email && ctx.db.users.some((u) => u.email === email.trim().toLowerCase())) errors.email = 'This email is already registered'
  if (Object.keys(errors).length) throw new HttpError(400, 'Validation failed', errors)
  const u = { _id: uid(), name: name.trim(), email: email.trim().toLowerCase(), password, role, profileImage: '', accountStatus: 'active', favorites: [], createdAt: new Date().toISOString() }
  ctx.db.users.push(u)
  localStorage.setItem(SESSION, u._id)
  ctx.status = 201
  return publicUser(u)
})

route('post', '/auth/login', (ctx) => {
  const u = ctx.db.users.find((x) => x.email === String(ctx.body.email ?? '').trim().toLowerCase())
  if (!u || u.password !== ctx.body.password) throw new HttpError(401, 'Incorrect email or password')
  if (u.accountStatus === 'suspended') throw new HttpError(403, 'Your account is suspended. Contact support.')
  localStorage.setItem(SESSION, u._id)
  return publicUser(u)
})

route('post', '/auth/logout', () => {
  localStorage.removeItem(SESSION)
  return { message: 'Logged out' }
})
route('get', '/auth/me', (ctx) => publicUser(need(ctx)))
route('patch', '/auth/me', (ctx) => {
  const u = need(ctx)
  const { name = u.name, profileImage = u.profileImage } = ctx.body
  if (String(name).trim().length < 2) throw new HttpError(400, 'Validation failed', { name: 'Name must be at least 2 characters' })
  u.name = String(name).trim()
  u.profileImage = profileImage
  return publicUser(u)
})
// Always succeeds so attackers cannot learn which emails exist.
route('post', '/auth/forgot-password', () => ({ message: 'If that email exists, a reset link has been sent.' }))
route('post', '/auth/reset-password', (ctx) => {
  if (passwordRule(ctx.body.password)) throw new HttpError(400, 'Validation failed', { password: passwordRule(ctx.body.password) })
  return { message: 'Password updated. You can log in now.' }
})

route('post', '/contact', (ctx) => {
  const { name = '', email = '', message = '' } = ctx.body
  const errors = {}
  if (!name.trim()) errors.name = 'Name is required'
  if (emailRule(email)) errors.email = emailRule(email)
  if (message.trim().length < 10) errors.message = 'Message must be at least 10 characters'
  if (Object.keys(errors).length) throw new HttpError(400, 'Validation failed', errors)
  ctx.db.messages.push({ _id: uid(), name, email, message, createdAt: new Date().toISOString() })
  ctx.status = 201
  return { message: 'Thanks! We will get back to you soon.' }
})

// ======================= EVENTS (public) =======================
route('get', '/events/featured', (ctx) => {
  const live = ctx.db.events.filter((e) => e.status === 'published' && new Date(e.endDate) >= Date.now())
  const picks = live.filter((e) => e.featured)
  return (picks.length ? picks : live).slice(0, 6).map((e) => presentEvent(ctx.db, e))
})

route('get', '/events', (ctx) => {
  const { search = '', category = '', city = '', date = '', price = '', sort = 'date', page = 1, limit = 9 } = ctx.query
  let list = ctx.db.events.filter((e) => e.status === 'published' && new Date(e.endDate) >= Date.now())
  const s = String(search).trim().toLowerCase()
  if (s) list = list.filter((e) => `${e.title} ${e.description} ${e.venue} ${e.city}`.toLowerCase().includes(s))
  if (category) list = list.filter((e) => e.category === category)
  if (city) list = list.filter((e) => `${e.city} ${e.venue}`.toLowerCase().includes(String(city).trim().toLowerCase()))
  if (date) {
    const from = new Date(`${date}T00:00:00`)
    const to = new Date(`${date}T23:59:59`)
    list = list.filter((e) => new Date(e.startDate) <= to && new Date(e.endDate) >= from)
  }
  let items = list.map((e) => presentEvent(ctx.db, e))
  if (price === 'free') items = items.filter((e) => e.isFree)
  if (price === 'paid') items = items.filter((e) => !e.isFree)
  const sorters = {
    date: (a, b) => a.startDate.localeCompare(b.startDate),
    newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
    price_asc: (a, b) => a.minPrice - b.minPrice,
    price_desc: (a, b) => b.minPrice - a.minPrice,
  }
  items.sort(sorters[sort] ?? sorters.date)
  const lim = Math.min(Math.max(Number(limit) || 9, 1), 50)
  const pages = Math.max(Math.ceil(items.length / lim), 1)
  const p = Math.min(Math.max(Number(page) || 1, 1), pages)
  return { data: items.slice((p - 1) * lim, p * lim), page: p, pages, total: items.length }
})

route('get', '/events/:id', (ctx) => {
  const e = findEvent(ctx)
  const u = ctx.user
  const canSee = e.status === 'published' || e.status === 'cancelled' || (u && (u.role === 'admin' || u._id === e.organizerId))
  if (!canSee) throw new HttpError(404, 'Event not found')
  return presentEvent(ctx.db, e)
})

// ======================= EVENTS (organizer CRUD) =======================
function applyTicketTypes(e, incoming) {
  const result = incoming.map((t) => {
    const old = e.ticketTypes?.find((x) => x._id === t._id)
    const quantity = Number(t.quantity)
    if (old && quantity < old.sold) throw new HttpError(400, 'Validation failed', { ticketsSummary: `${old.name}: ${old.sold} already sold, quantity cannot go below that` })
    return { _id: old?._id ?? uid(), name: t.name.trim(), description: t.description ?? '', price: Number(t.price), quantity, sold: old?.sold ?? 0, salesStart: t.salesStart || null, salesEnd: t.salesEnd || null }
  })
  const removed = (e.ticketTypes ?? []).find((o) => o.sold > 0 && !result.some((r) => r._id === o._id))
  if (removed) throw new HttpError(400, 'Validation failed', { ticketsSummary: `${removed.name} has sales and cannot be removed` })
  return result
}
function writeEvent(e, b) {
  Object.assign(e, {
    title: b.title.trim(), description: b.description.trim(), category: b.category, bannerImage: b.bannerImage?.trim() ?? '',
    venue: b.venue.trim(), address: b.address?.trim() ?? '', city: b.city.trim(), country: b.country?.trim() || 'Sri Lanka',
    startDate: new Date(b.startDate).toISOString(), endDate: new Date(b.endDate).toISOString(), capacity: Number(b.capacity),
    ticketTypes: applyTicketTypes(e, b.ticketTypes),
  })
}
function checkEvent(body) {
  const errors = validateEvent(body)
  if (!categories.some((c) => c.slug === body.category)) errors.category = 'Choose a valid category'
  if (Object.keys(errors).length) throw new HttpError(400, 'Validation failed', errors)
}

route('post', '/events', (ctx) => {
  const u = need(ctx, 'organizer')
  checkEvent(ctx.body)
  const e = { _id: uid(), organizerId: u._id, status: 'draft', rejectionReason: '', featured: false, createdAt: new Date().toISOString(), ticketTypes: [] }
  writeEvent(e, ctx.body)
  ctx.db.events.push(e)
  ctx.status = 201
  return presentEvent(ctx.db, e)
})

route('patch', '/events/:id', (ctx) => {
  const e = ownedEvent(ctx)
  if (e.status === 'cancelled') throw new HttpError(409, 'A cancelled event cannot be edited')
  checkEvent(ctx.body)
  writeEvent(e, ctx.body)
  return presentEvent(ctx.db, e)
})

route('delete', '/events/:id', (ctx) => {
  const e = ownedEvent(ctx)
  if (confirmedBookings(ctx.db, e._id).length) throw new HttpError(409, 'This event has bookings. Cancel the event instead of deleting it.')
  ctx.db.events = ctx.db.events.filter((x) => x._id !== e._id)
  ctx.db.bookings = ctx.db.bookings.filter((b) => b.eventId !== e._id)
  ctx.db.tickets = ctx.db.tickets.filter((t) => t.eventId !== e._id)
  ctx.db.users.forEach((u) => (u.favorites = u.favorites.filter((f) => f !== e._id)))
  return { message: 'Event deleted' }
})

// draft/rejected -> pending (waits for admin approval)
route('post', '/events/:id/publish', (ctx) => {
  const e = ownedEvent(ctx)
  if (!['draft', 'rejected'].includes(e.status)) throw new HttpError(409, 'Only draft or rejected events can be submitted')
  e.status = 'pending'
  e.rejectionReason = ''
  return presentEvent(ctx.db, e)
})

route('post', '/events/:id/cancel', (ctx) => {
  const e = ownedEvent(ctx)
  if (e.status === 'cancelled') throw new HttpError(409, 'Event is already cancelled')
  e.status = 'cancelled'
  confirmedBookings(ctx.db, e._id).forEach((b) => cancelBooking(ctx.db, b))
  return presentEvent(ctx.db, e)
})

// ======================= ORGANIZER =======================
route('get', '/organizer/events', (ctx) => {
  const u = need(ctx, 'organizer')
  return ctx.db.events.filter((e) => e.organizerId === u._id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((e) => presentEvent(ctx.db, e))
})

route('get', '/organizer/dashboard', (ctx) => {
  const u = need(ctx, 'organizer')
  const mine = ctx.db.events.filter((e) => e.organizerId === u._id)
  const ids = new Set(mine.map((e) => e._id))
  const bookings = confirmedBookings(ctx.db).filter((b) => ids.has(b.eventId))
  return {
    stats: {
      totalEvents: mine.length,
      published: mine.filter((e) => e.status === 'published').length,
      pending: mine.filter((e) => e.status === 'pending').length,
      drafts: mine.filter((e) => e.status === 'draft').length,
      ticketsSold: sum(bookings, (b) => sum(b.items, (i) => i.quantity)),
      revenue: sum(bookings, (b) => b.totalAmount),
    },
    recentEvents: mine.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5).map((e) => presentEvent(ctx.db, e)),
  }
})

route('get', '/organizer/events/:id/attendees', (ctx) => {
  const e = ownedEvent(ctx)
  return ctx.db.tickets.filter((t) => t.eventId === e._id).map((t) => {
    const a = ctx.db.users.find((u) => u._id === t.attendeeId)
    const b = ctx.db.bookings.find((x) => x._id === t.bookingId)
    return { _id: t._id, code: t.code, attendeeName: a?.name, attendeeEmail: a?.email, ticketType: t.ticketTypeName, status: t.status, checkedInAt: t.checkedInAt, bookingReference: b?.reference }
  })
})

route('get', '/organizer/events/:id/analytics', (ctx) => {
  const e = ownedEvent(ctx)
  const bookings = confirmedBookings(ctx.db, e._id)
  const live = ctx.db.tickets.filter((t) => t.eventId === e._id && t.status !== 'cancelled')
  const byDay = {}
  bookings.forEach((b) => {
    const d = b.createdAt.slice(0, 10)
    byDay[d] = (byDay[d] ?? 0) + sum(b.items, (i) => i.quantity)
  })
  const ticketsSold = live.length
  return {
    event: { _id: e._id, title: e.title, capacity: e.capacity },
    totals: { ticketsSold, revenue: sum(bookings, (b) => b.totalAmount), checkedIn: live.filter((t) => t.status === 'checked_in').length, capacityUsed: e.capacity ? Math.round((ticketsSold / e.capacity) * 100) : 0 },
    byTicketType: e.ticketTypes.map((t) => ({ name: t.name, sold: t.sold, quantity: t.quantity, revenue: t.sold * t.price })),
    byDay: Object.entries(byDay).sort(([a], [b]) => a.localeCompare(b)).map(([date, tickets]) => ({ date, tickets })),
  }
})

// ======================= BOOKINGS & TICKETS =======================
route('post', '/bookings', (ctx) => {
  const u = need(ctx, 'attendee')
  const booking = createBooking(ctx.db, u, ctx.body.eventId, ctx.body.items)
  ctx.status = 201
  return presentBooking(ctx.db, booking)
})

route('get', '/bookings/my', (ctx) => {
  const u = need(ctx, 'attendee')
  return ctx.db.bookings.filter((b) => b.attendeeId === u._id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((b) => presentBooking(ctx.db, b))
})

route('get', '/bookings/:id', (ctx) => {
  const u = need(ctx)
  const b = ctx.db.bookings.find((x) => x._id === ctx.params.id)
  if (!b || (b.attendeeId !== u._id && u.role !== 'admin')) throw new HttpError(404, 'Booking not found')
  return presentBooking(ctx.db, b)
})

route('post', '/bookings/:id/cancel', (ctx) => {
  const u = need(ctx, 'attendee')
  const b = ctx.db.bookings.find((x) => x._id === ctx.params.id && x.attendeeId === u._id)
  if (!b) throw new HttpError(404, 'Booking not found')
  if (!presentBooking(ctx.db, b).canCancel) throw new HttpError(409, 'This booking can no longer be cancelled (cancellation closes 24 hours before the event)')
  cancelBooking(ctx.db, b)
  return presentBooking(ctx.db, b)
})

route('get', '/tickets/my', (ctx) => {
  const u = need(ctx, 'attendee')
  return ctx.db.tickets.filter((t) => t.attendeeId === u._id).map((t) => {
    const e = ctx.db.events.find((x) => x._id === t.eventId)
    const b = ctx.db.bookings.find((x) => x._id === t.bookingId)
    return { ...ticketView(t), bookingId: b._id, bookingReference: b.reference, event: eventSummary(e) }
  }).sort((a, b) => a.event.startDate.localeCompare(b.event.startDate))
})

// The server decides if a ticket is valid. Decoding a QR code alone proves nothing.
route('post', '/tickets/check-in', (ctx) => {
  const u = need(ctx, 'organizer', 'admin')
  const token = String(ctx.body.token ?? '').trim()
  if (!token) throw new HttpError(400, 'Enter a ticket code')
  const t = ctx.db.tickets.find((x) => x.qrToken === token || x.code === token.toUpperCase())
  if (!t) throw new HttpError(404, 'Invalid ticket: not found')
  const e = ctx.db.events.find((x) => x._id === t.eventId)
  if (u.role !== 'admin' && e.organizerId !== u._id) throw new HttpError(403, 'This ticket belongs to an event you do not manage')
  if (t.eventId !== ctx.body.eventId) throw new HttpError(409, `Wrong event: this ticket is for "${e.title}"`)
  if (t.status === 'cancelled') throw new HttpError(409, 'Ticket was cancelled')
  const who = ctx.db.users.find((x) => x._id === t.attendeeId)?.name
  if (t.status === 'checked_in') throw new HttpError(409, `Already checked in at ${new Date(t.checkedInAt).toLocaleString()}`)
  Object.assign(t, { status: 'checked_in', checkedInAt: new Date().toISOString(), checkedInBy: u._id })
  return { ...ticketView(t), attendeeName: who }
})

// ======================= FAVORITES =======================
route('get', '/favorites', (ctx) => {
  const u = need(ctx, 'attendee')
  return ctx.db.events.filter((e) => u.favorites.includes(e._id) && e.status === 'published').map((e) => presentEvent(ctx.db, e))
})
route('post', '/favorites/:id', (ctx) => {
  const u = need(ctx, 'attendee')
  findEvent(ctx)
  u.favorites = u.favorites.includes(ctx.params.id) ? u.favorites.filter((f) => f !== ctx.params.id) : [...u.favorites, ctx.params.id]
  return { favorites: u.favorites }
})

// ======================= ADMIN =======================
route('get', '/admin/dashboard', (ctx) => {
  need(ctx, 'admin')
  const b = confirmedBookings(ctx.db)
  return {
    stats: {
      users: ctx.db.users.length,
      organizers: ctx.db.users.filter((u) => u.role === 'organizer').length,
      attendees: ctx.db.users.filter((u) => u.role === 'attendee').length,
      events: ctx.db.events.length,
      pending: ctx.db.events.filter((e) => e.status === 'pending').length,
      bookings: b.length,
      revenue: sum(b, (x) => x.totalAmount),
    },
    pendingEvents: ctx.db.events.filter((e) => e.status === 'pending').map((e) => presentEvent(ctx.db, e)),
  }
})

route('get', '/admin/users', (ctx) => {
  need(ctx, 'admin')
  const { search = '', role = '' } = ctx.query
  const s = String(search).trim().toLowerCase()
  return ctx.db.users
    .filter((u) => (!role || u.role === role) && (!s || `${u.name} ${u.email}`.toLowerCase().includes(s)))
    .map(publicUser)
})

route('patch', '/admin/users/:id/status', (ctx) => {
  const admin = need(ctx, 'admin')
  const u = ctx.db.users.find((x) => x._id === ctx.params.id)
  if (!u) throw new HttpError(404, 'User not found')
  if (u._id === admin._id || u.role === 'admin') throw new HttpError(403, 'Admin accounts cannot be suspended')
  if (!['active', 'suspended'].includes(ctx.body.accountStatus)) throw new HttpError(400, 'Invalid status')
  u.accountStatus = ctx.body.accountStatus
  return publicUser(u)
})

route('get', '/admin/events', (ctx) => {
  need(ctx, 'admin')
  const { status = '' } = ctx.query
  return ctx.db.events.filter((e) => !status || e.status === status).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((e) => presentEvent(ctx.db, e))
})

route('patch', '/admin/events/:id/review', (ctx) => {
  need(ctx, 'admin')
  const e = findEvent(ctx)
  const { decision, reason = '' } = ctx.body
  if (decision === 'approve') {
    if (e.status !== 'pending') throw new HttpError(409, 'Only pending events can be approved')
    e.status = 'published'
    e.rejectionReason = ''
  } else if (decision === 'reject') {
    if (reason.trim().length < 5) throw new HttpError(400, 'Validation failed', { reason: 'Give a reason (at least 5 characters)' })
    e.status = 'rejected'
    e.rejectionReason = reason.trim()
  } else if (decision === 'unpublish') {
    if (e.status !== 'published') throw new HttpError(409, 'Only published events can be unpublished')
    e.status = 'draft'
  } else throw new HttpError(400, 'Invalid decision')
  return presentEvent(ctx.db, e)
})

route('get', '/admin/reports', (ctx) => {
  need(ctx, 'admin')
  const b = confirmedBookings(ctx.db)
  const byCategory = categories.map((c) => {
    const ids = new Set(ctx.db.events.filter((e) => e.category === c.slug).map((e) => e._id))
    const rows = b.filter((x) => ids.has(x.eventId))
    return { category: c.name, tickets: sum(rows, (x) => sum(x.items, (i) => i.quantity)), revenue: sum(rows, (x) => x.totalAmount) }
  })
  const topEvents = ctx.db.events
    .map((e) => ({ _id: e._id, title: e.title, sold: sum(e.ticketTypes, (t) => t.sold), revenue: sum(e.ticketTypes, (t) => t.sold * t.price) }))
    .sort((x, y) => y.sold - x.sold).slice(0, 5)
  return {
    totals: { bookings: b.length, tickets: sum(byCategory, (c) => c.tickets), revenue: sum(b, (x) => x.totalAmount), cancelled: ctx.db.bookings.length - b.length },
    byCategory,
    topEvents,
    usersByRole: ['attendee', 'organizer', 'admin'].map((role) => ({ role, count: ctx.db.users.filter((u) => u.role === role).length })),
  }
})

// ======================= ADAPTER =======================
export default async function mockAdapter(config) {
  await delay(200)
  const db = load()
  const method = config.method.toLowerCase()
  const path = config.url.split('?')[0].replace(/^\/api/, '')
  const body = typeof config.data === 'string' ? JSON.parse(config.data || '{}') : config.data ?? {}
  const user = db.users.find((u) => u._id === localStorage.getItem(SESSION)) ?? null
  const ctx = { db, user, body, query: config.params ?? {}, params: {}, status: 200 }
  const response = (status, data) => ({ data, status, statusText: String(status), headers: {}, config, request: {} })

  try {
    const r = routes.find((x) => x.method === method && x.re.test(path))
    if (!r) throw new HttpError(404, 'Route not found')
    ctx.params = path.match(r.re).groups ?? {}
    const data = r.handler(ctx)
    save(db)
    return response(ctx.status, data)
  } catch (err) {
    if (!(err instanceof HttpError)) throw err
    throw new AxiosError(err.message, 'ERR_BAD_REQUEST', config, {}, response(err.status, { message: err.message, errors: err.errors }))
  }
}
