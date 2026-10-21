import { BarChart3, Ban, CalendarPlus, Pencil, Send, Trash2, Users } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../../components/ui/Button'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { StatusBadge } from '../../components/ui/Badge'
import PageHeader from '../../components/ui/PageHeader'
import { EmptyState, ErrorState, Spinner } from '../../components/ui/States'
import { useToast } from '../../context/ToastContext'
import useFetch from '../../hooks/useFetch'
import api, { errorMessage } from '../../lib/api'
import { formatShort } from '../../utils/format'

const statuses = ['all', 'draft', 'pending', 'published', 'rejected', 'cancelled']

// What each confirm dialog says and calls.
const actions = {
  submit: { title: 'Submit for approval?', confirm: 'Submit', danger: false, text: 'An admin will review it before it goes live.', call: (id) => api.post(`/events/${id}/publish`), done: 'Submitted for approval' },
  cancel: { title: 'Cancel this event?', confirm: 'Cancel event', danger: true, text: 'The event is closed and every booking is cancelled. This cannot be undone.', call: (id) => api.post(`/events/${id}/cancel`), done: 'Event cancelled' },
  delete: { title: 'Delete this event?', confirm: 'Delete', danger: true, text: 'The event and its ticket types are removed permanently.', call: (id) => api.delete(`/events/${id}`), done: 'Event deleted' },
}

export default function ManageEvents() {
  const toast = useToast()
  const { data: events, loading, error, reload } = useFetch(() => api.get('/organizer/events').then((r) => r.data))
  const [filter, setFilter] = useState('all')
  const [pending, setPending] = useState(null) // { type, event }
  const [working, setWorking] = useState(false)

  if (loading && !events) return <Spinner />
  if (error) return <ErrorState message={error} onRetry={reload} />

  const run = async () => {
    const { type, event } = pending
    setWorking(true)
    try {
      await actions[type].call(event._id)
      toast.success(actions[type].done)
      reload()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setWorking(false)
      setPending(null)
    }
  }

  const list = events.filter((e) => filter === 'all' || e.status === filter)
  const icon = 'rounded-lg p-2 text-slate-600 hover:bg-brand-50 hover:text-brand-600'
  const act = pending && actions[pending.type]

  return (
    <>
      <PageHeader title="Manage events" subtitle="Create, edit, publish and track your events."
        actions={<Link to="/organizer/events/new"><Button variant="accent"><CalendarPlus size={16} /> Create event</Button></Link>} />

      <div className="mb-4 flex gap-2 overflow-x-auto">
        {statuses.map((s) => (
          <button key={s} onClick={() => setFilter(s)} aria-pressed={filter === s}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold capitalize ${filter === s ? 'bg-brand-600 text-white' : 'bg-white text-navy-700 hover:bg-brand-50'}`}>{s}</button>
        ))}
      </div>

      {list.length === 0 ? (
        <EmptyState icon={CalendarPlus} title={events.length ? 'No events with this status' : 'No events yet'} action={!events.length && <Link to="/organizer/events/new"><Button>Create your first event</Button></Link>} />
      ) : (
        <div className="card overflow-x-auto">
          <table className="table">
            <thead><tr><th>Event</th><th>Date</th><th>Status</th><th>Sold</th><th className="text-right">Actions</th></tr></thead>
            <tbody>
              {list.map((e) => {
                const locked = e.status === 'cancelled'
                return (
                  <tr key={e._id}>
                    <td>
                      <Link to={`/events/${e._id}`} className="font-semibold hover:text-brand-600">{e.title}</Link>
                      {e.status === 'rejected' && e.rejectionReason && <p className="text-xs text-red-600">Rejected: {e.rejectionReason}</p>}
                    </td>
                    <td className="whitespace-nowrap">{formatShort(e.startDate)}</td>
                    <td><StatusBadge status={e.status} /></td>
                    <td className="whitespace-nowrap">{e.soldCount} / {e.capacity}</td>
                    <td>
                      <div className="flex justify-end gap-1">
                        {!locked && <Link to={`/organizer/events/${e._id}/edit`} className={icon} aria-label={`Edit ${e.title}`} title="Edit"><Pencil size={16} /></Link>}
                        <Link to={`/organizer/events/${e._id}/attendees`} className={icon} aria-label={`Attendees of ${e.title}`} title="Attendees"><Users size={16} /></Link>
                        <Link to={`/organizer/events/${e._id}/analytics`} className={icon} aria-label={`Analytics for ${e.title}`} title="Analytics"><BarChart3 size={16} /></Link>
                        {['draft', 'rejected'].includes(e.status) && <button className={icon} aria-label={`Submit ${e.title} for approval`} title="Submit for approval" onClick={() => setPending({ type: 'submit', event: e })}><Send size={16} /></button>}
                        {['published', 'pending'].includes(e.status) && <button className={icon} aria-label={`Cancel ${e.title}`} title="Cancel event" onClick={() => setPending({ type: 'cancel', event: e })}><Ban size={16} /></button>}
                        {e.soldCount === 0 && <button className={`${icon} hover:!text-red-600`} aria-label={`Delete ${e.title}`} title="Delete" onClick={() => setPending({ type: 'delete', event: e })}><Trash2 size={16} /></button>}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog open={!!pending} title={act?.title} message={pending && `${pending.event.title}: ${act.text}`} confirmLabel={act?.confirm} danger={act?.danger}
        loading={working} onConfirm={run} onCancel={() => setPending(null)} />
    </>
  )
}
