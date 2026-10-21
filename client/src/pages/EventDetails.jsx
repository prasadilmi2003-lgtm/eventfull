import { CalendarDays, Minus, Plus, MapPin, Ticket, User, Users } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import DateChip from '../components/DateChip'
import EventPoster from '../components/EventPoster'
import FavoriteButton from '../components/FavoriteButton'
import Badge, { StatusBadge } from '../components/ui/Badge'
import Button from '../components/ui/Button'
import { ErrorState, Spinner } from '../components/ui/States'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { getCategory } from '../data/categories'
import useFetch from '../hooks/useFetch'
import api, { errorMessage } from '../lib/api'
import { formatDateTime, formatShort, money } from '../utils/format'

const MAX_TICKETS = 10

// Why a ticket type cannot be bought right now ('' = it can). The server re-checks all of this.
function saleNote(t) {
  const now = Date.now()
  if (t.remaining <= 0) return 'Sold out'
  if (t.salesStart && new Date(t.salesStart) > now) return `Sales start ${formatShort(t.salesStart)}`
  if (t.salesEnd && new Date(t.salesEnd) < now) return 'Sales ended'
  return ''
}

export default function EventDetails() {
  const { id } = useParams()
  const { data: event, loading, error, reload } = useFetch(() => api.get(`/events/${id}`).then((r) => r.data), [id])
  const { user } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const [qty, setQty] = useState({})
  const [booking, setBooking] = useState(false)

  if (loading) return <Spinner />
  if (error) return <div className="mx-auto max-w-3xl px-4 py-16"><ErrorState message={error} onRetry={reload} /></div>

  const cat = getCategory(event.category)
  const bookable = event.status === 'published' && new Date(event.endDate) > new Date()
  const totalQty = Object.values(qty).reduce((s, n) => s + n, 0)
  const total = event.ticketTypes.reduce((s, t) => s + t.price * (qty[t._id] ?? 0), 0)

  const change = (t, delta) => {
    const next = Math.min(Math.max((qty[t._id] ?? 0) + delta, 0), t.remaining)
    if (delta > 0 && totalQty >= MAX_TICKETS) return toast.error(`You can book up to ${MAX_TICKETS} tickets at once`)
    setQty({ ...qty, [t._id]: next })
  }

  const book = async () => {
    if (!user) return navigate('/login', { state: { from: location } })
    setBooking(true)
    try {
      const items = Object.entries(qty).filter(([, n]) => n > 0).map(([ticketTypeId, quantity]) => ({ ticketTypeId, quantity }))
      const { data } = await api.post('/bookings', { eventId: event._id, items })
      toast.success(`Booking confirmed! Reference ${data.reference}`)
      navigate(`/attendee/bookings/${data._id}`)
    } catch (err) {
      toast.error(errorMessage(err))
      reload() // availability may have changed
      setQty({})
    } finally {
      setBooking(false)
    }
  }

  const info = (Icon, title, children) => (
    <div className="flex gap-3">
      <span className="h-fit rounded-xl bg-brand-50 p-2.5 text-brand-600"><Icon size={20} /></span>
      <div><p className="text-sm font-semibold">{title}</p><div className="text-sm text-slate-600">{children}</div></div>
    </div>
  )

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="relative overflow-hidden rounded-3xl">
        <EventPoster event={event} className="h-64 sm:h-[26rem]" iconSize={96} />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-navy-900/50 to-transparent" />
        <FavoriteButton eventId={event._id} className="absolute right-4 top-4" />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-8">
          <div className="flex gap-4">
            <DateChip date={event.startDate} className="h-fit !px-4 !py-3" />
            <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge color={cat.badge}>{cat.name}</Badge>
              {event.status !== 'published' && <StatusBadge status={event.status} />}
              {event.isFree && <Badge color="free">Free</Badge>}
            </div>
            <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">{event.title}</h1>
            <p className="mt-1 text-slate-500">Hosted by {event.organizer.name}</p>
            {event.status === 'rejected' && event.rejectionReason && <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">Rejected: {event.rejectionReason}</p>}
            {event.status === 'cancelled' && <p role="alert" className="mt-3 rounded-xl bg-slate-100 p-3 text-sm font-medium">This event has been cancelled.</p>}
            </div>
          </div>

          <div className="card grid gap-5 p-6 sm:grid-cols-2">
            {info(CalendarDays, 'Date and time', <><p>Starts: {formatDateTime(event.startDate)}</p><p>Ends: {formatDateTime(event.endDate)}</p></>)}
            {info(MapPin, 'Location', <><p>{event.venue}</p>{event.address && <p>{event.address}</p>}<p>{event.city}, {event.country}</p></>)}
            {info(User, 'Organizer', <p>{event.organizer.name}</p>)}
            {info(Users, 'Capacity', <p>{event.capacity} people &middot; {event.remaining} tickets left</p>)}
          </div>

          <section>
            <h2 className="mb-3 text-xl font-bold">About this event</h2>
            <p className="whitespace-pre-line leading-relaxed text-slate-700">{event.description}</p>
          </section>
        </div>

        <aside className="card h-fit space-y-4 p-6 lg:sticky lg:top-24">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{event.isFree ? 'Entry' : 'From'}</p>
            <p className="text-3xl font-extrabold text-brand-700">{money(event.minPrice)}</p>
          </div>
          <h2 className="flex items-center gap-2 text-lg font-bold"><Ticket size={18} className="text-brand-600" /> Choose tickets</h2>
          {event.ticketTypes.map((t) => {
            const note = saleNote(t)
            const n = qty[t._id] ?? 0
            return (
              <div key={t._id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{t.name}</p>
                    {t.description && <p className="text-xs text-slate-500">{t.description}</p>}
                  </div>
                  <p className="whitespace-nowrap font-bold text-brand-700">{money(t.price)}</p>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className={`text-xs font-medium ${note ? 'text-red-600' : 'text-slate-500'}`}>{note || `${t.remaining} left`}</span>
                  {bookable && !note && (
                    <div className="flex items-center gap-3">
                      <button aria-label={`Fewer ${t.name} tickets`} onClick={() => change(t, -1)} disabled={n === 0} className="rounded-full border p-1.5 disabled:opacity-40"><Minus size={14} /></button>
                      <span className="w-5 text-center font-semibold" aria-live="polite">{n}</span>
                      <button aria-label={`More ${t.name} tickets`} onClick={() => change(t, 1)} disabled={n >= t.remaining} className="rounded-full border p-1.5 disabled:opacity-40"><Plus size={14} /></button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          {bookable ? (
            <>
              <div className="flex items-center justify-between border-t pt-4">
                <span className="font-medium">Total</span>
                <span className="text-xl font-extrabold">{money(total)}</span>
              </div>
              {total > 0 && <p className="text-xs text-slate-500">Demo checkout: the final price is calculated by the server and no real payment is taken.</p>}
              {user && user.role !== 'attendee' ? (
                <p className="rounded-xl bg-amber/20 p-3 text-sm">Only attendee accounts can book tickets. <Link to="/signup" className="font-semibold underline">Create an attendee account</Link></p>
              ) : (
                <Button className="w-full py-3" disabled={totalQty === 0} loading={booking} onClick={book}>
                  {!user ? 'Log in to register' : total === 0 ? 'Register for free' : 'Book tickets'}
                </Button>
              )}
            </>
          ) : (
            <p className="rounded-xl bg-slate-100 p-3 text-sm font-medium">{event.status === 'published' ? 'This event has ended.' : 'Booking is not open for this event.'}</p>
          )}
        </aside>
      </div>
    </div>
  )
}
