import { CalendarDays, Download, MapPin } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { formatShort } from '../utils/format'
import EventPoster from './EventPoster'
import { StatusBadge } from './ui/Badge'
import Button from './ui/Button'

// One digital ticket. The QR holds only the opaque qrToken; the server decides if it is valid at check-in.
export default function TicketCard({ ticket }) {
  const card = useRef(null)
  const inactive = ticket.status !== 'valid'

  // Prints only this ticket (see @media print in index.css): "Save as PDF" in the print dialog gives a PDF.
  const download = () => {
    card.current.classList.add('printing')
    window.print()
    card.current.classList.remove('printing')
  }

  return (
    <article ref={card} className="card overflow-hidden">
      <div className="relative">
        <EventPoster event={ticket.event} className="h-28" />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-700/90 to-brand-500/50" />
        <p className="absolute left-5 top-4 text-lg font-extrabold text-white">EventEase</p>
        <span className="absolute right-4 top-4 rounded-full bg-white"><StatusBadge status={ticket.status} /></span>
      </div>
      <div className="grid gap-4 p-5 sm:grid-cols-[1fr_auto]">
        <div className="space-y-2">
          <h3 className="text-lg font-bold"><Link className="hover:text-brand-600" to={`/events/${ticket.event._id}`}>{ticket.event.title}</Link></h3>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">{ticket.ticketTypeName}</p>
          <p className="flex items-center gap-2 text-sm text-slate-500"><CalendarDays size={15} /> {formatShort(ticket.event.startDate)}</p>
          <p className="flex items-center gap-2 text-sm text-slate-500"><MapPin size={15} /> {ticket.event.venue}, {ticket.event.city}</p>
          <p className="pt-1 text-[10px] uppercase text-slate-400">Ticket code</p>
          <p className="-mt-1 font-mono text-sm font-bold tracking-wider">{ticket.code}</p>
          {ticket.bookingId && <Link to={`/attendee/bookings/${ticket.bookingId}`} className="text-xs font-semibold text-brand-600 hover:underline">Booking {ticket.bookingReference}</Link>}
        </div>
        <div className={`flex flex-col items-center gap-3 ${inactive ? 'opacity-40' : ''}`}>
          <QRCodeSVG value={ticket.qrToken} size={128} aria-label={`QR code for ticket ${ticket.code}`} />
        </div>
      </div>
      <div className="border-t border-dashed border-slate-300 p-3 print:hidden">
        <Button variant="outline" size="sm" className="w-full" disabled={inactive} onClick={download}><Download size={14} /> Download ticket</Button>
      </div>
    </article>
  )
}
