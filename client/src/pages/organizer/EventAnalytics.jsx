import { ArrowLeft, CircleDollarSign, Gauge, ScanLine, Ticket } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import PageHeader from '../../components/ui/PageHeader'
import StatCard from '../../components/ui/StatCard'
import { ErrorState, Spinner } from '../../components/ui/States'
import useFetch from '../../hooks/useFetch'
import api from '../../lib/api'
import { formatDate, lkr } from '../../utils/format'

const colors = ['bg-brand-600', 'bg-pink', 'bg-orange', 'bg-teal', 'bg-sky', 'bg-amber']

export default function EventAnalytics() {
  const { id } = useParams()
  const { data, loading, error, reload } = useFetch(() => api.get(`/organizer/events/${id}/analytics`).then((r) => r.data), [id])

  if (loading) return <Spinner />
  if (error) return <ErrorState message={error} onRetry={reload} />

  const { event, totals, byTicketType, byDay } = data
  const peak = Math.max(...byDay.map((d) => d.tickets), 1)

  return (
    <>
      <Link to="/organizer/events" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:underline"><ArrowLeft size={14} /> Back to events</Link>
      <PageHeader title="Event analytics" subtitle={event.title} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Ticket} label="Tickets sold" value={totals.ticketsSold} tone="brand" />
        <StatCard icon={CircleDollarSign} label="Revenue" value={lkr(totals.revenue)} tone="orange" />
        <StatCard icon={Gauge} label="Capacity used" value={`${totals.capacityUsed}%`} tone="pink" />
        <StatCard icon={ScanLine} label="Checked in" value={`${totals.checkedIn} / ${totals.ticketsSold}`} tone="teal" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <section className="card p-6">
          <h2 className="mb-4 text-lg font-bold">Sales by ticket type</h2>
          <ul className="space-y-4">
            {byTicketType.map((t, i) => (
              <li key={t.name}>
                <div className="mb-1 flex justify-between text-sm"><span className="font-semibold">{t.name}</span><span className="text-slate-500">{t.sold} / {t.quantity} &middot; {lkr(t.revenue)}</span></div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-100" role="img" aria-label={`${t.name}: ${t.sold} of ${t.quantity} sold`}>
                  <div className={`h-full rounded-full ${colors[i % colors.length]}`} style={{ width: `${Math.min((t.sold / t.quantity) * 100, 100)}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="card p-6">
          <h2 className="mb-4 text-lg font-bold">Registrations per day</h2>
          {byDay.length === 0 ? <p className="text-sm text-slate-500">No registrations yet.</p> : (
            <div className="flex h-48 items-end gap-2" role="img" aria-label="Bar chart of tickets registered per day">
              {byDay.map((d, i) => (
                <div key={d.date} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                  <span className="text-xs font-semibold">{d.tickets}</span>
                  <div className={`w-full rounded-t-lg ${colors[i % colors.length]}`} style={{ height: `${(d.tickets / peak) * 100}%`, minHeight: 4 }} />
                  <span className="text-[10px] text-slate-500">{formatDate(d.date).slice(0, 6)}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  )
}
