import { BarChart3, CalendarDays, Heart, LayoutDashboard, LogOut, ScanLine, ShieldCheck, Ticket, User, Users } from 'lucide-react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Badge from '../ui/Badge'
import Button from '../ui/Button'

const nav = {
  attendee: [
    { to: '/attendee', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/attendee/tickets', label: 'My Tickets', icon: Ticket },
    { to: '/attendee/saved', label: 'Saved Events', icon: Heart },
    { to: '/profile', label: 'Profile', icon: User },
  ],
  organizer: [
    { to: '/organizer', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/organizer/events', label: 'Manage Events', icon: CalendarDays },
    { to: '/organizer/checkin', label: 'QR Check-in', icon: ScanLine },
    { to: '/profile', label: 'Profile', icon: User },
  ],
  admin: [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/events', label: 'Event Moderation', icon: ShieldCheck },
    { to: '/admin/reports', label: 'Reports', icon: BarChart3 },
    { to: '/profile', label: 'Profile', icon: User },
  ],
}

// Shared shell for every logged-in page: top bar + role-specific sidebar (a scrolling tab row on phones).
export default function DashboardLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen">
      <header className="glass sticky top-0 z-40 border-x-0 border-t-0">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2 text-xl font-extrabold">
            <span className="rounded-lg bg-brand-600 p-1.5 text-white"><Ticket size={18} /></span>
            <span>Event<span className="text-brand-600">Ease</span></span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm font-medium sm:block">{user.name}</span>
            <Badge color={user.role}>{user.role}</Badge>
            <Button variant="ghost" size="sm" onClick={handleLogout}><LogOut size={14} /> Log out</Button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 md:flex-row">
        <nav className="flex gap-2 overflow-x-auto md:w-56 md:shrink-0 md:flex-col" aria-label="Dashboard">
          {nav[user.role].map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) => `flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition ${isActive ? 'bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-card' : 'glass text-navy-700 hover:bg-brand-50'}`}>
              <Icon size={18} /> {label}
            </NavLink>
          ))}
        </nav>
        <main className="min-w-0 flex-1"><Outlet /></main>
      </div>
    </div>
  )
}
