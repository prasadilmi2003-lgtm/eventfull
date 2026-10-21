import { CalendarDays, MapPin, Ticket } from 'lucide-react'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'

const swatches = ['bg-brand-600', 'bg-navy-900', 'bg-pink', 'bg-orange', 'bg-amber', 'bg-teal', 'bg-sky', 'bg-lime']

// Temporary page: proves Tailwind tokens + components work. Replaced by the Home page in Phase 2.
export default function DesignSystem() {
  return (
    <main className="mx-auto max-w-5xl space-y-10 p-6">
      <h1 className="text-4xl font-extrabold">Event<span className="text-brand-600">Ease</span> design system</h1>

      <section className="flex flex-wrap gap-3">
        {swatches.map((c) => <div key={c} className={`h-14 w-14 rounded-xl ${c}`} title={c} />)}
      </section>

      <section className="flex flex-wrap gap-3">
        <Button>Get Tickets</Button>
        <Button variant="accent"><Ticket size={16} /> Create an Event</Button>
        <Button variant="outline">Explore</Button>
        <Button variant="ghost">Cancel</Button>
      </section>

      <section className="flex flex-wrap gap-2">
        <Badge color="free">Free</Badge><Badge>Rs. 1,500</Badge><Badge color="music">Music</Badge>
        <Badge color="tech">Tech</Badge><Badge color="food">Food</Badge><Badge color="sports">Sports</Badge><Badge color="arts">Arts</Badge>
      </section>

      <article className="max-w-sm overflow-hidden rounded-card bg-white shadow-card">
        <div className="h-40 bg-gradient-to-br from-brand-500 via-pink to-orange" />
        <div className="space-y-2 p-4">
          <Badge color="music">Music</Badge>
          <h3 className="text-lg font-bold">Sample Event Card</h3>
          <p className="flex items-center gap-2 text-sm text-slate-500"><CalendarDays size={16} /> Sat, 15 Nov · 6:00 PM</p>
          <p className="flex items-center gap-2 text-sm text-slate-500"><MapPin size={16} /> Colombo (sample data)</p>
        </div>
      </article>
    </main>
  )
}
