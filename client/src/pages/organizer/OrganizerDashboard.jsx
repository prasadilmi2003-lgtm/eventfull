import { CalendarDays, CheckCircle2, CircleDollarSign, Ticket } from 'lucide-react'
import { Link } from 'react-router-dom'
import Button from '../../components/ui/Button'
import { StatusBadge } from '../../components/ui/Badge'
import PageHeader from '../../components/ui/PageHeader'
import StatCard from '../../components/ui/StatCard'
import { EmptyState, ErrorState, Spinner } from '../../components/ui/States'
import useFetch from '../../hooks/useFetch'
import api from '../../lib/api'
import { formatShort, lkr } from '../../utils/format'

export default function OrganizerDashboard() {
  const { data, loading, error, reload } = useFetch(() => api.get('/organizer/dashboard').then((r) => r.data))

  if (loading) return <Spinner />
  if (error) return <ErrorState message={error} onRetry={reload} />
  const { stats, recentEvents } = data

  return (
    <>
      <PageHeader title="Organizer dashboard" subtitle="Your events at a glance."
        actions={<Link to="/organizer/events/new"><Button variant="accent">Create event</Button></Link>} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={CalendarDays} label="Total events" value={stats.totalEvents} tone="brand" />
        <StatCard icon={CheckCircle2} label={`Published (${stats.pending} pending)`} value={stats.published} tone="teal" />
        <StatCard icon={Ticket} label="Tickets sold" value={stats.ticketsSold} tone="pink" />
        <StatCard icon={CircleDollarSign} label="Revenue" value={lkr(stats.revenue)} tone="orange" />
      </div>

      <h2 className="mb-3 mt-8 text-xl font-bold">Recent events</h2>
      {recentEvents.length === 0 ? (
        <EmptyState icon={CalendarDays} title="You have no events yet" text="Create your first event and submit it for approval." action={<Link to="/organizer/events/new"><Button>Create event</Button></Link>} />
      ) : (
        <div className="card overflow-x-auto">
          <table className="table">
            <thead><tr><th>Event</th><th>Date</th><th>Status</th><th>Sold</th><th><span className="sr-only">Manage</span></th></tr></thead>
            <tbody>
              {recentEvents.map((e) => (
                <tr key={e._id}>
                  <td className="font-semibold">{e.title}</td>
                  <td>{formatShort(e.startDate)}</td>
                  <td><StatusBadge status={e.status} /></td>
                  <td>{e.soldCount} / {e.capacity}</td>
                  <td><Link to={`/organizer/events/${e._id}/analytics`} className="font-semibold text-brand-600 hover:underline">Analytics</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
