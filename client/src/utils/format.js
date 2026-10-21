const dateTime = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })
const dateOnly = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
const short = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })

export const formatDateTime = (v) => (v ? dateTime.format(new Date(v)) : '-')
export const formatDate = (v) => (v ? dateOnly.format(new Date(v)) : '-')
export const formatShort = (v) => (v ? short.format(new Date(v)) : '-')

export const money = (n, currency = 'LKR') => (Number(n) === 0 ? 'Free' : `${currency} ${Number(n).toLocaleString()}`)

// <input type="datetime-local"> needs "YYYY-MM-DDTHH:mm" in local time.
export const toInputDateTime = (v) => {
  if (!v) return ''
  const d = new Date(v)
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

// Only http(s) image URLs are rendered (blocks javascript: and data: URLs).
export const isHttpUrl = (v) => {
  try {
    return ['http:', 'https:'].includes(new URL(v).protocol)
  } catch {
    return false
  }
}

// Plain amount (0 stays 'LKR 0'); use money() for ticket prices where 0 means Free.
export const lkr = (n) => `LKR ${Number(n).toLocaleString()}`

export const isPast = (v) => new Date(v) < new Date()
