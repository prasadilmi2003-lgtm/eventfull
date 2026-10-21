import { Heart } from 'lucide-react'
import { Link } from 'react-router-dom'
import EventCard from '../../components/EventCard'
import Button from '../../components/ui/Button'
import PageHeader from '../../components/ui/PageHeader'
import { EmptyState, ErrorState, Spinner } from '../../components/ui/States'
import { useAuth } from '../../context/AuthContext'
import useFetch from '../../hooks/useFetch'
import api from '../../lib/api'

export default function SavedEvents() {
  const { user } = useAuth()
  // Reload whenever the favourites list changes (e.g. the heart is clicked on a card here).
  const { data: events, loading, error, reload } = useFetch(() => api.get('/favorites').then((r) => r.data), [user.favorites.length])

  return (
    <>
      <PageHeader title="Saved events" subtitle="Events you marked with a heart." />
      {error ? <ErrorState message={error} onRetry={reload} />
        : loading && !events ? <Spinner />
        : !events || events.length === 0 ? <EmptyState icon={Heart} title="Nothing saved yet" text="Tap the heart on any event to keep it here." action={<Link to="/events"><Button>Browse events</Button></Link>} />
        : <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">{events.map((e) => <EventCard key={e._id} event={e} />)}</div>}
    </>
  )
}
