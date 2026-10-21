import { CalendarDays, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getCategory } from '../data/categories'
import { formatShort, money } from '../utils/format'
import DateChip from './DateChip'
import EventPoster from './EventPoster'
import FavoriteButton from './FavoriteButton'
import { StatusBadge } from './ui/Badge'

export default function EventCard({ event }) {
  const cat = getCategory(event.category)

  return (
    <article className="card group relative overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      <Link to={`/events/${event._id}`} className="block">
        <div className="relative overflow-hidden">
          <EventPoster event={event} className="h-44 transition duration-500 group-hover:scale-105" />
          <DateChip date={event.startDate} className="absolute bottom-3 left-3" />
        </div>
        <div className="space-y-1.5 p-4">
          <h3 className="line-clamp-1 text-lg font-bold group-hover:text-brand-600">{event.title}</h3>
          <p className="flex items-center gap-1.5 text-sm text-slate-500"><CalendarDays size={14} /> {formatShort(event.startDate)}</p>
          <p className="flex items-center gap-1.5 text-sm text-slate-500"><MapPin size={14} /> <span className="line-clamp-1">{event.venue}, {event.city}</span></p>
          <div className="flex items-end justify-between pt-1">
            <span className={`text-xs font-bold uppercase tracking-wide ${cat.text}`}>{cat.name}</span>
            {event.status === 'cancelled' ? <StatusBadge status="cancelled" /> : (
              <span className="text-right">
                {!event.isFree && <span className="block text-[10px] uppercase leading-none text-slate-400">From</span>}
                <span className={`text-lg font-extrabold leading-tight ${event.isFree ? 'text-teal' : 'text-brand-700'}`}>{event.isFree ? 'Free' : money(event.minPrice)}</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400">by {event.organizer?.name}</p>
        </div>
      </Link>
      <FavoriteButton eventId={event._id} className="absolute right-3 top-3" />
    </article>
  )
}
