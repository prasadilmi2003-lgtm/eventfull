import { ArrowRight, Heart, ShieldCheck, Sparkles, Ticket } from 'lucide-react'
import { Link } from 'react-router-dom'
import EventCard from '../components/EventCard'
import SearchBar from '../components/SearchBar'
import Button from '../components/ui/Button'
import { CardGridSkeleton, ErrorState } from '../components/ui/States'
import { useAuth } from '../context/AuthContext'
import { categories } from '../data/categories'
import { ids, photo } from '../data/images'
import useFetch from '../hooks/useFetch'
import api from '../lib/api'

function Section({ title, link, children }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-6 flex items-end justify-between">
        <h2 className="text-2xl font-bold sm:text-3xl">{title}</h2>
        {link && <Link to={link} className="flex items-center gap-1 text-sm font-semibold text-brand-600 hover:underline">View all <ArrowRight size={16} /></Link>}
      </div>
      {children}
    </section>
  )
}

const perks = [
  { icon: Sparkles, label: 'Free & paid events', tone: 'bg-brand-100 text-brand-600' },
  { icon: Ticket, label: 'Instant QR tickets', tone: 'bg-pink/15 text-pink' },
  { icon: Heart, label: 'Save your favourites', tone: 'bg-orange/15 text-orange' },
  { icon: ShieldCheck, label: 'Secure booking', tone: 'bg-teal/15 text-teal' },
]
const grid = 'grid gap-6 sm:grid-cols-2 lg:grid-cols-4'

export default function Home() {
  const { user } = useAuth()
  const { data, loading, error, reload } = useFetch(async () => {
    const [featured, upcoming, free] = await Promise.all([
      api.get('/events/featured'),
      api.get('/events', { params: { limit: 8, sort: 'date' } }),
      api.get('/events', { params: { limit: 4, price: 'free' } }),
    ])
    return { featured: featured.data.slice(0, 4), upcoming: upcoming.data.data, free: free.data.data }
  })

  const cards = (list, className = grid) => (list.length ? <div className={className}>{list.map((e) => <EventCard key={e._id} event={e} />)}</div> : <p className="text-slate-500">No events to show yet.</p>)
  const body = (render) => (error ? <ErrorState message={error} onRetry={reload} /> : loading ? <CardGridSkeleton count={4} /> : render(data))

  return (
    <>
      {/* Hero: photo on the right, soft white fade on the left so the text stays readable */}
      <div className="relative isolate overflow-hidden">
        <img src={photo(ids.hero, 1600)} alt="" className="absolute inset-0 -z-20 h-full w-full object-cover" />
        <div className="absolute inset-0 -z-10 bg-white/85 lg:bg-gradient-to-r lg:from-white lg:via-white/85 lg:to-white/0" />
        <div className="mx-auto max-w-7xl px-4 pb-14 pt-16 sm:pt-24">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-600 shadow-card"><Sparkles size={14} /> Live your moments</p>
          <h1 className="mt-5 max-w-2xl text-5xl font-extrabold leading-[1.05] sm:text-6xl">
            Discover Events.<br /><span className="bg-gradient-to-r from-brand-600 via-pink to-orange bg-clip-text text-transparent">Create Memories.</span>
          </h1>
          <p className="mt-5 max-w-lg text-lg text-slate-600">Find the best events around you: concerts, workshops, meetups and food festivals.</p>
          <div className="mt-8 max-w-5xl"><SearchBar /></div>
          <ul className="mt-6 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
            {perks.map(({ icon: Icon, label, tone }) => (
              <li key={label} className="glass flex items-center gap-3 rounded-2xl p-3">
                <span className={`rounded-xl p-2 ${tone}`}><Icon size={18} /></span>
                <span className="text-xs font-semibold leading-tight">{label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <Section title="Popular categories" link="/categories">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
          {categories.map(({ slug, name, icon: Icon, grad, image }) => (
            <Link key={slug} to={`/events?category=${slug}`} className="card group overflow-hidden transition hover:-translate-y-1 hover:shadow-xl">
              <div className="relative h-28 overflow-hidden">
                <img src={image} alt="" loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />
                <span className={`absolute bottom-2 left-2 rounded-xl bg-gradient-to-br p-2 text-white shadow ${grad}`}><Icon size={16} /></span>
              </div>
              <p className="p-3 text-sm font-bold">{name}</p>
            </Link>
          ))}
        </div>
      </Section>

      <Section title="Featured events" link="/events">{body((d) => cards(d.featured, d.featured.length === 3 ? 'grid gap-6 md:grid-cols-3' : grid))}</Section>
      <Section title="Upcoming events" link="/events">{body((d) => cards(d.upcoming))}</Section>

      {/* "Recommended" is a simple rule for now (free events). Personal recommendations would need booking history. */}
      <Section title="Recommended for you" link="/events?price=free">{body((d) => cards(d.free))}</Section>

      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="relative isolate overflow-hidden rounded-3xl p-8 sm:p-14">
          <img src={photo(ids.organizer, 1400)} alt="" loading="lazy" className="absolute inset-0 -z-20 h-full w-full object-cover" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-brand-700/95 via-brand-600/80 to-pink/40" />
          <h2 className="max-w-md text-3xl font-extrabold text-white sm:text-4xl">Are you an organizer?</h2>
          <p className="mt-3 max-w-md text-white/90">Create and manage events, reach a wider audience and track every registration from one dashboard.</p>
          <Link to={user?.role === 'organizer' ? '/organizer/events/new' : '/signup?role=organizer'} className="mt-6 inline-block"><Button variant="light">Create an Event <ArrowRight size={16} /></Button></Link>
        </div>
      </section>
    </>
  )
}
