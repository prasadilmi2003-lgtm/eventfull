const colors = {
  free: 'bg-teal/15 text-teal',
  paid: 'bg-brand-100 text-brand-700',
  music: 'bg-pink/15 text-pink',
  tech: 'bg-sky/15 text-sky',
  food: 'bg-orange/15 text-orange',
  sports: 'bg-lime/20 text-lime',
  arts: 'bg-amber/25 text-orange',
}

export default function Badge({ color = 'paid', children }) {
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${colors[color]}`}>{children}</span>
}
