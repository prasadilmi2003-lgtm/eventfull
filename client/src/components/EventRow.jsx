import { MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getCategory } from '../data/categories'
import { formatShort, money } from '../utils/format'
import DateChip from './DateChip'
import EventPoster from './EventPoster'
import FavoriteButton from './FavoriteButton'
import Badge from './ui/Badge'

// Horizontal result row used on the Explore page.
export default function EventRow({ event }) {
  const cat = getCategory(event.category)
  return (
    <article className="card group relative flex gap-4 p-3 transition hover:shadow-xl">
      <Link to={`/events/${event._id}`} className="flex min-w-0 flex-1 gap-4">
        <div className="relative w-28 shrink-0 overflow-hidden rounded-xl sm:w-40">
          <EventPoster event={event} className="h-full min-h-28 transition duration-500 group-hover:scale-105" />
          <DateChip date={event.startDate} className="absolute left-2 top-2 !px-2 !py-1" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-between py-1">
          <div>
            <h3 className="line-clamp-1 text-lg font-bold group-hover:text-brand-600">{event.title}</h3>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500"><MapPin size={14} /> <span className="line-clamp-1">{event.venue}, {event.city}</span></p>
            <p className="text-xs text-slate-400">{formatShort(event.startDate)} &middot; by {event.organizer?.name}</p>
          </div>
          <div className="mt-2 flex items-end justify-between gap-2">
            <Badge color={cat.badge}>{cat.name}</Badge>
            <span className={`text-lg font-extrabold ${event.isFree ? 'text-teal' : 'text-brand-700'}`}>{event.isFree ? 'Free' : money(event.minPrice)}</span>
          </div>
        </div>
      </Link>
      <FavoriteButton eventId={event._id} className="absolute right-3 top-3 hidden sm:block" />
    </article>
  )
}
