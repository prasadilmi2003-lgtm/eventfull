import { Ban, CircleDollarSign, Ticket } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import StatCard from '../../components/ui/StatCard'
import { ErrorState, Spinner } from '../../components/ui/States'
import useFetch from '../../hooks/useFetch'
import api from '../../lib/api'
import { lkr } from '../../utils/format'

const colors = ['bg-pink', 'bg-sky', 'bg-orange', 'bg-lime', 'bg-amber', 'bg-brand-600', 'bg-teal', 'bg-navy-700']

export default function AdminReports() {
  const { data, loading, error, reload } = useFetch(() => api.get('/admin/reports').then((r) => r.data))

  if (loading) return <Spinner />
  if (error) return <ErrorState message={error} onRetry={reload} />
  const { totals, byCategory, topEvents, usersByRole } = data
  const peak = Math.max(...byCategory.map((c) => c.tickets), 1)

  return (
    <>
      <PageHeader title="Platform reports" subtitle="Sales and activity across all events." />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={Ticket} label={`Tickets sold (${totals.bookings} bookings)`} value={totals.tickets} tone="brand" />
        <StatCard icon={CircleDollarSign} label="Revenue" value={lkr(totals.revenue)} tone="orange" />
        <StatCard icon={Ban} label="Cancelled bookings" value={totals.cancelled} tone="pink" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <section className="card p-6">
          <h2 className="mb-4 text-lg font-bold">Tickets by category</h2>
          <ul className="space-y-3">
            {byCategory.map((c, i) => (
              <li key={c.category}>
                <div className="mb-1 flex justify-between text-sm"><span className="font-semibold">{c.category}</span><span className="text-slate-500">{c.tickets} ticket{c.tickets === 1 ? '' : 's'} &middot; {lkr(c.revenue)}</span></div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-100" role="img" aria-label={`${c.category}: ${c.tickets} tickets`}>
                  <div className={`h-full rounded-full ${colors[i % colors.length]}`} style={{ width: `${(c.tickets / peak) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </section>

        <div className="space-y-6">
          <section className="card overflow-x-auto p-6">
            <h2 className="mb-3 text-lg font-bold">Top events</h2>
            <table className="table">
              <thead><tr><th>Event</th><th>Sold</th><th>Revenue</th></tr></thead>
              <tbody>{topEvents.map((e) => <tr key={e._id}><td className="font-semibold">{e.title}</td><td>{e.sold}</td><td>{lkr(e.revenue)}</td></tr>)}</tbody>
            </table>
          </section>
          <section className="card p-6">
            <h2 className="mb-3 text-lg font-bold">Users by role</h2>
            <ul className="flex flex-wrap gap-6">
              {usersByRole.map((r) => <li key={r.role}><p className="text-3xl font-extrabold">{r.count}</p><p className="text-sm capitalize text-slate-500">{r.role}s</p></li>)}
            </ul>
          </section>
        </div>
      </div>
    </>
  )
}
