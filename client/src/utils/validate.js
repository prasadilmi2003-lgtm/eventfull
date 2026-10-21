import { isHttpUrl } from './format'

// Each validator returns an error message, or '' when the value is fine.
export const required = (v, label) => (String(v ?? '').trim() ? '' : `${label} is required`)
export const email = (v) => (/^\S+@\S+\.\S+$/.test(String(v ?? '').trim()) ? '' : 'Enter a valid email address')
export const password = (v) =>
  String(v ?? '').length >= 8 && /[A-Za-z]/.test(v) && /\d/.test(v) ? '' : 'Password needs 8+ characters, a letter and a number'

export const hasErrors = (errs) => Object.values(errs).some(Boolean)

// Used by the event form AND by the mock server, so both sides apply the same rules.
export function validateEvent(f) {
  const e = {}
  const num = (v) => (v === '' || v == null ? NaN : Number(v))
  if (String(f.title ?? '').trim().length < 3) e.title = 'Title must be at least 3 characters'
  if (!f.category) e.category = 'Choose a category'
  if (String(f.description ?? '').trim().length < 20) e.description = 'Description must be at least 20 characters'
  if (!String(f.venue ?? '').trim()) e.venue = 'Venue is required'
  if (!String(f.city ?? '').trim()) e.city = 'City is required'
  if (!f.startDate) e.startDate = 'Start date is required'
  if (!f.endDate) e.endDate = 'End date is required'
  else if (f.startDate && new Date(f.endDate) <= new Date(f.startDate)) e.endDate = 'End must be after the start'
  if (!Number.isInteger(num(f.capacity)) || num(f.capacity) < 1) e.capacity = 'Capacity must be a whole number, at least 1'
  if (f.bannerImage && !isHttpUrl(f.bannerImage)) e.bannerImage = 'Enter a valid http(s) image URL'

  const types = f.ticketTypes ?? []
  const rows = types.map((t) => {
    const r = {}
    if (!String(t.name ?? '').trim()) r.name = 'Name required'
    if (!(num(t.price) >= 0)) r.price = 'Price must be 0 or more'
    if (!Number.isInteger(num(t.quantity)) || num(t.quantity) < 1) r.quantity = 'Quantity must be at least 1'
    if (t.salesStart && t.salesEnd && new Date(t.salesEnd) <= new Date(t.salesStart)) r.salesEnd = 'Must be after sales start'
    return r
  })
  if (rows.some((r) => Object.keys(r).length)) e.tickets = rows

  const total = types.reduce((s, t) => s + (Number(t.quantity) || 0), 0)
  if (!types.length) e.ticketsSummary = 'Add at least one ticket type'
  else if (total > num(f.capacity)) e.ticketsSummary = `Ticket quantities (${total}) exceed capacity (${f.capacity})`
  return e
}
