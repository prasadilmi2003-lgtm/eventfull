import { Heart } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { errorMessage } from '../lib/api'

// Heart toggle. Visitors are sent to log in; only attendees can save events.
export default function FavoriteButton({ eventId, className = '' }) {
  const { user, toggleFavorite } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const saved = !!user?.favorites?.includes(eventId)

  const onClick = async (e) => {
    e.preventDefault()
    if (!user) return navigate('/login', { state: { from: location } })
    if (user.role !== 'attendee') return toast.error('Only attendee accounts can save events')
    try {
      await toggleFavorite(eventId)
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  return (
    <button type="button" onClick={onClick} aria-pressed={saved} aria-label={saved ? 'Remove from saved events' : 'Save event'}
      className={`rounded-full bg-white/90 p-2 shadow transition hover:scale-110 ${saved ? 'text-pink' : 'text-navy-700'} ${className}`}>
      <Heart size={16} fill={saved ? 'currentColor' : 'none'} />
    </button>
  )
}
