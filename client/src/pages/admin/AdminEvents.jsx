import { ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { StatusBadge } from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import PageHeader from '../../components/ui/PageHeader'
import { EmptyState, ErrorState, Spinner } from '../../components/ui/States'
import { useToast } from '../../context/ToastContext'
import useFetch from '../../hooks/useFetch'
import api, { errorMessage } from '../../lib/api'
import { formatShort } from '../../utils/format'

const statuses = ['pending', 'published', 'rejected', 'draft', 'cancelled', 'all']

export default function AdminEvents() {
  const toast = useToast()
  const [status, setStatus] = useState('pending')
  const [dialog, setDialog] = useState(null) // { decision, event }
  const [reason, setReason] = useState('')
  const [reasonError, setReasonError] = useState('')
  const [working, setWorking] = useState(false)
  const { data: events, loading, error, reload } = useFetch(() => api.get('/admin/events', { params: { status: status === 'all' ? '' : status } }).then((r) => r.data), [status])

  const open = (decision, event) => { setDialog({ decision, event }); setReason(''); setReasonError('') }

  const submit = async () => {
    if (dialog.decision === 'reject' && reason.trim().length < 5) return setReasonError('Give a reason (at least 5 characters)')
    setWorking(true)
    try {
      await api.patch(`/admin/events/${dialog.event._id}/review`, { decision: dialog.decision, reason })
      toast.success(`Event ${dialog.decision === 'approve' ? 'approved' : dialog.decision === 'reject' ? 'rejected' : 'unpublished'}`)
      setDialog(null)
      reload()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setWorking(false)
    }
  }

  const copy = {
    approve: { title: 'Approve this event?', label: 'Approve', danger: false, text: 'It will be published and visible to everyone.' },
    reject: { title: 'Reject this event?', label: 'Reject', danger: true, text: 'The organizer will see your reason and can fix and resubmit.' },
    unpublish: { title: 'Unpublish this event?', label: 'Unpublish', danger: true, text: 'It returns to draft and disappears from public pages.' },
  }[dialog?.decision]

  return (
    <>
      <PageHeader title="Event moderation" subtitle="Review events before and after they go live." />
      <div className="mb-4 flex gap-2 overflow-x-auto">
        {statuses.map((s) => (
          <button key={s} onClick={() => setStatus(s)} aria-pressed={status === s}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold capitalize ${status === s ? 'bg-brand-600 text-white' : 'bg-white text-navy-700 hover:bg-brand-50'}`}>{s}</button>
        ))}
      </div>

      {error ? <ErrorState message={error} onRetry={reload} />
        : loading && !events ? <Spinner />
        : events.length === 0 ? <EmptyState icon={ShieldCheck} title={`No ${status === 'all' ? '' : status} events`} />
        : (
          <div className="card overflow-x-auto">
            <table className="table">
              <thead><tr><th>Event</th><th>Organizer</th><th>Date</th><th>Status</th><th className="text-right">Actions</th></tr></thead>
              <tbody>
                {events.map((e) => (
                  <tr key={e._id}>
                    <td><Link to={`/events/${e._id}`} className="font-semibold hover:text-brand-600">{e.title}</Link>{e.rejectionReason && <p className="text-xs text-red-600">{e.rejectionReason}</p>}</td>
                    <td>{e.organizer.name}</td>
                    <td className="whitespace-nowrap">{formatShort(e.startDate)}</td>
                    <td><StatusBadge status={e.status} /></td>
                    <td>
                      <div className="flex justify-end gap-2">
                        {e.status === 'pending' && <><Button size="sm" onClick={() => open('approve', e)}>Approve</Button><Button size="sm" variant="danger" onClick={() => open('reject', e)}>Reject</Button></>}
                        {e.status === 'published' && <Button size="sm" variant="outline" onClick={() => open('unpublish', e)}>Unpublish</Button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      <ConfirmDialog open={!!dialog} loading={working} title={copy?.title} message={dialog && `${dialog.event.title}: ${copy.text}`} confirmLabel={copy?.label} danger={copy?.danger}
        onConfirm={submit} onCancel={() => setDialog(null)}>
        {dialog?.decision === 'reject' && (
          <label className="block"><span className="mb-1 block text-sm font-medium">Reason</span>
            <textarea rows={3} className="input" value={reason} onChange={(e) => setReason(e.target.value)} aria-invalid={!!reasonError} />
            {reasonError && <span role="alert" className="mt-1 block text-xs font-medium text-red-600">{reasonError}</span>}
          </label>
        )}
      </ConfirmDialog>
    </>
  )
}
