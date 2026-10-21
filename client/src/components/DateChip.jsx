const month = new Intl.DateTimeFormat('en-GB', { month: 'short' })

// Small "AUG 20" calendar tile.
export default function DateChip({ date, className = '' }) {
  const d = new Date(date)
  return (
    <div className={`rounded-xl bg-white px-3 py-1.5 text-center shadow-card ${className}`} aria-hidden="true">
      <span className="block text-[11px] font-bold uppercase leading-tight text-brand-600">{month.format(d)}</span>
      <span className="block text-xl font-extrabold leading-none text-navy-900">{d.getDate()}</span>
    </div>
  )
}
