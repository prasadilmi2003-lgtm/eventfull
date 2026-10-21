import { Mail, MapPin, Phone } from 'lucide-react'
import { Link } from 'react-router-dom'

const columns = [
  { title: 'Explore', links: [['/events', 'Find Events'], ['/categories', 'Categories']] },
  { title: 'Organizers', links: [['/signup', 'Create an Event'], ['/login', 'Organizer Login']] },
  { title: 'Company', links: [['/about', 'About'], ['/contact', 'Contact']] },
]

const year = new Date().getFullYear()

export default function Footer() {
  return (
    <footer className="bg-navy-900 text-slate-300">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-2xl font-extrabold text-white">Event<span className="text-amber">Ease</span></p>
          <p className="mt-3 text-sm">Discover events. Create memories.</p>
        </div>
        {columns.map((c) => (
          <div key={c.title}>
            <h4 className="mb-3 font-semibold text-white">{c.title}</h4>
            <ul className="space-y-2 text-sm">
              {c.links.map(([to, label]) => <li key={label}><Link to={to} className="hover:text-white">{label}</Link></li>)}
            </ul>
          </div>
        ))}
      </div>
      <div className="mx-auto flex max-w-7xl flex-wrap gap-x-8 gap-y-2 border-t border-white/10 px-4 py-5 text-sm">
        <span className="flex items-center gap-2"><Mail size={14} /> hello@eventease.example</span>
        <span className="flex items-center gap-2"><Phone size={14} /> +94 11 000 0000</span>
        <span className="flex items-center gap-2"><MapPin size={14} /> Colombo, Sri Lanka</span>
        <span className="sm:ml-auto">© {year} EventEase (university project)</span>
      </div>
    </footer>
  )
}
