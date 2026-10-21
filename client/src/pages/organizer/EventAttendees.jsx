import { ArrowLeft, Download, Users } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { StatusBadge } from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import PageHeader from '../../components/ui/PageHeader'
import { EmptyState, ErrorState, Spinner } from '../../components/ui/States'
import useFetch from '../../hooks/useFetch'
import api from '../../lib/api'
import { formatShort } from '../../utils/format'

// Quote every cell and neutralise spreadsheet formulas (=, +, -, @) so a malicious name cannot run in Excel.
const cell = (v) => {
  let s = String(v ?? '')
  if (/^[=+\-@]/.test(s)) s = `'${s}`
  return `"${s.replace(/"/g, '""')}"`
}

function downloadCsv(title, rows) {
  const head = ['Ticket code', 'Name', 'Email', 'Ticket type', 'Status', 'Checked in at', 'Booking ref']
  const lines = rows.map((r) => [r.code, r.attendeeName, r.attendeeEmail, r.ticketType, r.status, r.checkedInAt ?? '', r.bookingReference])
  const csv = [head, ...lines].map((l) => l.map(cell).join(',')).join('\r\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  a.download = `${title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-attendees.csv`
  a.click()
  URL.revokeObjectURL(a.href)
}

export default function EventAttendees() {
  const { id } = useParams()
  const [search, setSearch] = useState('')
  const { data, loading, error, reload } = useFetch(async () => {
    const [event, attendees] = await Promise.all([api.get(`/events/${id}`), api.get(`/organizer/events/${id}/attendees`)])
    return { event: event.data, attendees: attendees.data }
  }, [id])

  if (loading) return <Spinner />
  if (error) return <ErrorState message={error} onRetry={reload} />

  const { event, attendees } = data
  const s = search.trim().toLowerCase()
  const rows = attendees.filter((a) => !s || `${a.attendeeName} ${a.attendeeEmail} ${a.code}`.toLowerCase().includes(s))
  const active = attendees.filter((a) => a.status !== 'cancelled')

  return (
    <>
      <Link to="/organizer/events" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:underline"><ArrowLeft size={14} /> Back to events</Link>
      <PageHeader title="Attendees" subtitle={`${event.title}: ${active.length} active tickets, ${active.filter((a) => a.status === 'checked_in').length} checked in`}
        actions={<Button variant="outline" disabled={!attendees.length} onClick={() => downloadCsv(event.title, attendees)}><Download size={16} /> Export CSV</Button>} />

      <input className="input mb-4 max-w-sm" placeholder="Search name, email or ticket code" aria-label="Search attendees" value={search} onChange={(e) => setSearch(e.target.value)} />

      {rows.length === 0 ? (
        <EmptyState icon={Users} title={attendees.length ? 'No attendees match your search' : 'No registrations yet'} />
      ) : (
        <div className="card overflow-x-auto">
          <table className="table">
            <thead><tr><th>Name</th><th>Email</th><th>Ticket</th><th>Code</th><th>Status</th><th>Checked in</th></tr></thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a._id}>
                  <td className="font-semibold">{a.attendeeName}</td>
                  <td>{a.attendeeEmail}</td>
                  <td>{a.ticketType}</td>
                  <td className="font-mono text-xs">{a.code}</td>
                  <td><StatusBadge status={a.status} /></td>
                  <td className="whitespace-nowrap">{a.checkedInAt ? formatShort(a.checkedInAt) : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
