import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import TicketCard from '../../components/TicketCard'
import Button from '../../components/ui/Button'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { StatusBadge } from '../../components/ui/Badge'
import PageHeader from '../../components/ui/PageHeader'
import { ErrorState, Spinner } from '../../components/ui/States'
import { useToast } from '../../context/ToastContext'
import useFetch from '../../hooks/useFetch'
import api, { errorMessage } from '../../lib/api'
import { formatDateTime, money } from '../../utils/format'

export default function BookingDetails() {
  const { id } = useParams()
  const toast = useToast()
  const { data: booking, loading, error, reload } = useFetch(() => api.get(`/bookings/${id}`).then((r) => r.data), [id])
  const [confirming, setConfirming] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  if (loading) return <Spinner />
  if (error) return <ErrorState message={error} onRetry={reload} />

  const cancel = async () => {
    setCancelling(true)
    try {
      await api.post(`/bookings/${id}/cancel`)
      toast.success('Booking cancelled')
      setConfirming(false)
      reload()
    } catch (err) {
      toast.error(errorMessage(err))
      setConfirming(false)
    } finally {
      setCancelling(false)
    }
  }

  return (
    <>
      <Link to="/attendee" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:underline"><ArrowLeft size={14} /> Back to dashboard</Link>
      <PageHeader title={`Booking ${booking.reference}`} subtitle={`Booked on ${formatDateTime(booking.createdAt)}`}
        actions={booking.canCancel && <Button variant="danger" onClick={() => setConfirming(true)}>Cancel booking</Button>} />

      <section className="card space-y-4 p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Link to={`/events/${booking.event._id}`} className="text-xl font-bold hover:text-brand-600">{booking.event.title}</Link>
          <div className="flex gap-2"><StatusBadge status={booking.status} /><StatusBadge status={booking.paymentStatus} /></div>
        </div>
        <p className="text-sm text-slate-600">{formatDateTime(booking.event.startDate)} &middot; {booking.event.venue}, {booking.event.city}</p>
        <div className="overflow-x-auto">
          <table className="table">
            <thead><tr><th>Ticket</th><th>Price</th><th>Qty</th><th className="text-right">Subtotal</th></tr></thead>
            <tbody>
              {booking.items.map((i) => (
                <tr key={i.ticketTypeId}><td>{i.name}</td><td>{money(i.price)}</td><td>{i.quantity}</td><td className="text-right">{money(i.price * i.quantity)}</td></tr>
              ))}
              <tr><td colSpan={3} className="text-right font-bold">Total</td><td className="text-right font-bold">{money(booking.totalAmount)}</td></tr>
            </tbody>
          </table>
        </div>
        {booking.status === 'confirmed' && !booking.canCancel && <p className="text-xs text-slate-500">Cancellation closes 24 hours before the event starts.</p>}
      </section>

      <h2 className="mb-3 mt-8 text-xl font-bold">Tickets</h2>
      <div className="grid gap-4 xl:grid-cols-2">
        {booking.tickets.map((t) => <TicketCard key={t._id} ticket={{ ...t, event: booking.event }} />)}
      </div>

      <ConfirmDialog open={confirming} danger loading={cancelling} title="Cancel this booking?" confirmLabel="Yes, cancel booking"
        message="Your tickets will stop working and the seats will be released. This cannot be undone." onConfirm={cancel} onCancel={() => setConfirming(false)} />
    </>
  )
}
