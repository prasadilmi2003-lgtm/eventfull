import { CalendarCheck, Heart, Ticket } from 'lucide-react'
import { Link } from 'react-router-dom'
import Button from '../../components/ui/Button'
import { StatusBadge } from '../../components/ui/Badge'
import PageHeader from '../../components/ui/PageHeader'
import StatCard from '../../components/ui/StatCard'
import { EmptyState, ErrorState, Spinner } from '../../components/ui/States'
import { useAuth } from '../../context/AuthContext'
import useFetch from '../../hooks/useFetch'
import api from '../../lib/api'
import { formatShort, isPast, money } from '../../utils/format'

export default function AttendeeDashboard() {
  const { user } = useAuth()
  const { data: bookings, loading, error, reload } = useFetch(() => api.get('/bookings/my').then((r) => r.data))

  if (loading) return <Spinner />
  if (error) return <ErrorState message={error} onRetry={reload} />

  const active = bookings.filter((b) => b.status === 'confirmed')
  const upcoming = active.filter((b) => !isPast(b.event.endDate))
  const ticketCount = active.reduce((s, b) => s + b.tickets.length, 0)

  return (
    <>
      <PageHeader title={`Hi, ${user.name.split(' ')[0]}`} subtitle="Here is what is coming up." actions={<Link to="/events"><Button>Find events</Button></Link>} />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={CalendarCheck} label="Upcoming bookings" value={upcoming.length} tone="brand" />
        <StatCard icon={Ticket} label="Tickets" value={ticketCount} tone="pink" />
        <StatCard icon={Heart} label="Saved events" value={user.favorites.length} tone="orange" />
      </div>

      <h2 className="mb-3 mt-8 text-xl font-bold">Your bookings</h2>
      {bookings.length === 0 ? (
        <EmptyState icon={Ticket} title="No bookings yet" text="Find an event you like and register." action={<Link to="/events"><Button>Browse events</Button></Link>} />
      ) : (
        <div className="card overflow-x-auto">
          <table className="table">
            <thead><tr><th>Event</th><th>Date</th><th>Reference</th><th>Total</th><th>Status</th><th><span className="sr-only">Open</span></th></tr></thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b._id}>
                  <td className="font-semibold">{b.event.title}</td>
                  <td>{formatShort(b.event.startDate)}</td>
                  <td className="font-mono text-xs">{b.reference}</td>
                  <td>{money(b.totalAmount)}</td>
                  <td><StatusBadge status={b.status} /></td>
                  <td><Link to={`/attendee/bookings/${b._id}`} className="font-semibold text-brand-600 hover:underline">View</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
