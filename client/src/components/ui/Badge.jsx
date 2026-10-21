const colors = {
  free: 'bg-teal/15 text-teal',
  paid: 'bg-brand-100 text-brand-700',
  music: 'bg-pink/15 text-pink',
  tech: 'bg-sky/15 text-sky',
  food: 'bg-orange/15 text-orange',
  sports: 'bg-lime/20 text-green-700',
  arts: 'bg-amber/25 text-orange',
  // statuses
  draft: 'bg-slate-200 text-slate-600',
  pending: 'bg-amber/25 text-orange',
  published: 'bg-teal/15 text-teal',
  rejected: 'bg-red-100 text-red-600',
  cancelled: 'bg-slate-200 text-slate-500',
  confirmed: 'bg-teal/15 text-teal',
  valid: 'bg-teal/15 text-teal',
  checked_in: 'bg-sky/15 text-sky',
  active: 'bg-teal/15 text-teal',
  suspended: 'bg-red-100 text-red-600',
  not_required: 'bg-slate-100 text-slate-500',
  admin: 'bg-navy-700 text-white',
  organizer: 'bg-brand-100 text-brand-700',
  attendee: 'bg-sky/15 text-sky',
}

export default function Badge({ color = 'paid', children }) {
  return <span className={`inline-block whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold capitalize ${colors[color] ?? colors.paid}`}>{children}</span>
}

// Shows a status word ("checked_in" -> "checked in") in the matching colour.
export function StatusBadge({ status }) {
  return <Badge color={status}>{String(status).replace('_', ' ')}</Badge>
}
