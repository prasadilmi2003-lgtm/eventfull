const tones = {
  brand: 'bg-brand-100 text-brand-600',
  pink: 'bg-pink/15 text-pink',
  orange: 'bg-orange/15 text-orange',
  teal: 'bg-teal/15 text-teal',
  sky: 'bg-sky/15 text-sky',
  amber: 'bg-amber/25 text-orange',
}

export default function StatCard({ icon: Icon, label, value, tone = 'brand' }) {
  return (
    <div className="card flex items-center gap-4 p-5">
      <span className={`rounded-xl p-3 ${tones[tone]}`}><Icon size={24} /></span>
      <div>
        <p className="text-2xl font-extrabold leading-tight">{value}</p>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    </div>
  )
}
