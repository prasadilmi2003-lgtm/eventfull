import { CalendarDays, CircleDollarSign, Clock, Ticket, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import Button from '../../components/ui/Button'
import PageHeader from '../../components/ui/PageHeader'
import StatCard from '../../components/ui/StatCard'
import { ErrorState, Spinner } from '../../components/ui/States'
import useFetch from '../../hooks/useFetch'
import api from '../../lib/api'
import { formatShort, lkr } from '../../utils/format'

export default function AdminDashboard() {
  const { data, loading, error, reload } = useFetch(() => api.get('/admin/dashboard').then((r) => r.data))

  if (loading) return <Spinner />
  if (error) return <ErrorState message={error} onRetry={reload} />
  const { stats, pendingEvents } = data

  return (
    <>
      <PageHeader title="Admin dashboard" subtitle="Platform overview." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard icon={Users} label={`Users (${stats.organizers} organizers)`} value={stats.users} tone="brand" />
        <StatCard icon={CalendarDays} label="Events" value={stats.events} tone="pink" />
        <StatCard icon={Clock} label="Awaiting approval" value={stats.pending} tone="amber" />
        <StatCard icon={Ticket} label="Bookings" value={stats.bookings} tone="sky" />
        <StatCard icon={CircleDollarSign} label="Revenue" value={lkr(stats.revenue)} tone="orange" />
      </div>

      <div className="mb-3 mt-8 flex items-center justify-between">
        <h2 className="text-xl font-bold">Waiting for review</h2>
        <Link to="/admin/events"><Button variant="outline" size="sm">Open moderation</Button></Link>
      </div>
      {pendingEvents.length === 0 ? <p className="card p-6 text-sm text-slate-500">Nothing is waiting for review.</p> : (
        <div className="card overflow-x-auto">
          <table className="table">
            <thead><tr><th>Event</th><th>Organizer</th><th>Date</th></tr></thead>
            <tbody>{pendingEvents.map((e) => <tr key={e._id}><td className="font-semibold">{e.title}</td><td>{e.organizer.name}</td><td>{formatShort(e.startDate)}</td></tr>)}</tbody>
          </table>
        </div>
      )}
    </>
  )
}
