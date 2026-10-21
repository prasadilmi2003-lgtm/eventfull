import { Ticket } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import TicketCard from '../../components/TicketCard'
import Button from '../../components/ui/Button'
import PageHeader from '../../components/ui/PageHeader'
import { EmptyState, ErrorState, Spinner } from '../../components/ui/States'
import useFetch from '../../hooks/useFetch'
import api from '../../lib/api'
import { isPast } from '../../utils/format'

export default function MyTickets() {
  const [tab, setTab] = useState('upcoming')
  const { data: tickets, loading, error, reload } = useFetch(() => api.get('/tickets/my').then((r) => r.data))

  if (loading) return <Spinner />
  if (error) return <ErrorState message={error} onRetry={reload} />

  const list = tickets.filter((t) => (tab === 'past') === isPast(t.event.endDate))

  return (
    <>
      <PageHeader title="My tickets" subtitle="Show the QR code at the entrance." />
      <div className="mb-6 inline-flex rounded-full bg-white p-1 shadow-card" role="tablist">
        {['upcoming', 'past'].map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
            className={`rounded-full px-5 py-2 text-sm font-semibold capitalize ${tab === t ? 'bg-brand-600 text-white' : 'text-navy-700'}`}>{t}</button>
        ))}
      </div>
      {list.length === 0 ? (
        <EmptyState icon={Ticket} title={`No ${tab} tickets`} action={tab === 'upcoming' && <Link to="/events"><Button>Browse events</Button></Link>} />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">{list.map((t) => <TicketCard key={t._id} ticket={t} />)}</div>
      )}
    </>
  )
}
