import { Calendar, MapPin, Search, Tag } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { categories } from '../data/categories'
import Button from './ui/Button'

const field = 'flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5'
const input = 'w-full bg-transparent text-sm text-navy-900 outline-none placeholder:text-slate-400'

// Sends the filters to /events as a query string (?search=...&category=...). The Explore page reads it.
export default function SearchBar() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ search: '', category: '', date: '', city: '' })
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  const submit = (e) => {
    e.preventDefault()
    const params = new URLSearchParams(Object.entries(form).filter(([, v]) => v))
    navigate(`/events?${params}`)
  }

  return (
    <form onSubmit={submit} role="search" className="grid gap-3 rounded-2xl bg-white p-3 shadow-card sm:grid-cols-2 lg:grid-cols-[2fr_1.2fr_1.2fr_1.5fr_auto]">
      <label className={field}><Search size={18} className="text-brand-600" /><input aria-label="Event name" className={input} placeholder="Event name" value={form.search} onChange={set('search')} /></label>
      <label className={field}><Tag size={18} className="text-pink" />
        <select aria-label="Category" className={input} value={form.category} onChange={set('category')}>
          <option value="">All categories</option>
          {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
        </select>
      </label>
      <label className={field}><Calendar size={18} className="text-orange" /><input aria-label="Date" type="date" className={input} value={form.date} onChange={set('date')} /></label>
      <label className={field}><MapPin size={18} className="text-teal" /><input aria-label="Location" className={input} placeholder="Location" value={form.city} onChange={set('city')} /></label>
      <Button type="submit" className="py-3">Search</Button>
    </form>
  )
}
