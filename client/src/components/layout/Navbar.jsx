import { LayoutDashboard, LogOut, Menu, Ticket, X } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { homeFor } from '../../utils/roles'
import Button from '../ui/Button'

const links = [
  { to: '/events', label: 'Find Events' },
  { to: '/categories', label: 'Categories' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false) // mobile menu
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    setOpen(false)
    await logout()
    navigate('/')
  }
  const createTo = user?.role === 'organizer' ? '/organizer/events/new' : '/signup?role=organizer'

  return (
    <header className="glass sticky top-0 z-50 border-x-0 border-t-0">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3" aria-label="Main">
        <Link to="/" className="flex items-center gap-2 text-2xl font-extrabold">
          <span className="rounded-lg bg-brand-600 p-1.5 text-white"><Ticket size={20} /></span>
          <span>Event<span className="text-brand-600">Ease</span></span>
        </Link>

        <ul className="hidden items-center gap-6 md:flex">
          {links.map((l) => (
            <li key={l.to}>
              <NavLink to={l.to} className={({ isActive }) => `text-sm font-medium hover:text-brand-600 ${isActive ? 'text-brand-600' : 'text-navy-700'}`}>{l.label}</NavLink>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-2 md:flex">
          {user?.role !== 'admin' && user?.role !== 'attendee' && <Link to={createTo}><Button variant="accent" size="sm">Create an Event</Button></Link>}
          {user ? (
            <>
              <Link to={homeFor(user.role)}><Button variant="outline" size="sm"><LayoutDashboard size={14} /> Dashboard</Button></Link>
              <Button variant="ghost" size="sm" onClick={handleLogout}><LogOut size={14} /> Log out</Button>
            </>
          ) : (
            <>
              <Link to="/login"><Button variant="ghost">Log in</Button></Link>
              <Link to="/signup"><Button>Sign up</Button></Link>
            </>
          )}
        </div>

        <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Toggle menu" aria-expanded={open}>
          {open ? <X /> : <Menu />}
        </button>
      </nav>

      {open && (
        <div className="space-y-1 border-t border-slate-100 px-4 pb-4 md:hidden">
          {links.map((l) => (
            <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2 font-medium hover:bg-brand-50">{l.label}</Link>
          ))}
          {user ? (
            <>
              <Link to={homeFor(user.role)} onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2 font-medium hover:bg-brand-50">Dashboard</Link>
              <button onClick={handleLogout} className="block w-full rounded-lg px-3 py-2 text-left font-medium hover:bg-brand-50">Log out</button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2 font-medium hover:bg-brand-50">Log in</Link>
              <Link to="/signup" onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2 font-medium hover:bg-brand-50">Sign up</Link>
            </>
          )}
        </div>
      )}
    </header>
  )
}
