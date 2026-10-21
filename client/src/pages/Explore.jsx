import { MapPin, Search, SearchX } from 'lucide-react'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import EventRow from '../components/EventRow'
import Button from '../components/ui/Button'
import Pagination from '../components/ui/Pagination'
import { EmptyState, ErrorState, Spinner } from '../components/ui/States'
import { categories } from '../data/categories'
import useFetch from '../hooks/useFetch'
import api from '../lib/api'

const FILTERS = ['search', 'category', 'city', 'date', 'price']

// Explore + Search Results in one page: every filter lives in the URL (?search=&category=&city=&date=&price=&sort=&page=),
// so results can be shared, bookmarked and reached from the home page search bar.
export default function Explore() {
  const [params, setParams] = useSearchParams()
  // key= restarts the text boxes from the URL whenever it changes (Clear, or a search from the home page)
  return <ExploreBody key={params.toString()} params={params} setParams={setParams} />
}

function Radio({ name, checked, onChange, children }) {
  return (
    <label className={`flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition hover:bg-brand-50 ${checked ? 'font-semibold text-brand-700' : 'text-slate-600'}`}>
      <input type="radio" name={name} checked={checked} onChange={onChange} className="accent-brand-600" />
      {children}
    </label>
  )
}

function ExploreBody({ params, setParams }) {
  const current = Object.fromEntries(params)
  const [form, setForm] = useState({ search: params.get('search') ?? '', city: params.get('city') ?? '' })
  const today = new Date().toLocaleDateString('en-CA') // YYYY-MM-DD in local time

  const apply = (changes) => {
    const next = new URLSearchParams(params)
    Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)))
    if (!('page' in changes)) next.delete('page') // any filter change goes back to page 1
    setParams(next)
  }

  const { data, loading, error, reload } = useFetch(
    () => api.get('/events', { params: { ...current, limit: 8 } }).then((r) => r.data),
    [params.toString()],
  )

  const hasFilters = [...FILTERS, 'sort'].some((k) => params.get(k))

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-extrabold sm:text-4xl">{current.search ? <>Results for &ldquo;{current.search}&rdquo;</> : 'Explore Events'}</h1>
      <p className="mt-1 text-slate-500">Find events that match your interests</p>

      <form onSubmit={(e) => { e.preventDefault(); apply(form) }} role="search" className="glass mt-6 grid gap-3 rounded-2xl p-3 sm:grid-cols-[2fr_1fr_auto]">
        <label className="flex items-center gap-2 rounded-xl bg-white px-3 py-2.5"><Search size={18} className="text-brand-600" />
          <input aria-label="Event name" className="w-full bg-transparent text-sm outline-none" placeholder="Search events..." value={form.search} onChange={(e) => setForm({ ...form, search: e.target.value })} />
        </label>
        <label className="flex items-center gap-2 rounded-xl bg-white px-3 py-2.5"><MapPin size={18} className="text-teal" />
          <input aria-label="Location" className="w-full bg-transparent text-sm outline-none" placeholder="City or venue" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
        </label>
        <Button type="submit"><Search size={16} /> Search</Button>
      </form>

      <div className="mt-6 grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="card h-fit space-y-5 p-5 lg:sticky lg:top-24" aria-label="Filters">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">Filters</h2>
            {hasFilters && <button onClick={() => setParams({})} className="text-xs font-semibold text-brand-600 hover:underline">Clear all</button>}
          </div>
          <fieldset>
            <legend className="mb-1 text-sm font-bold">Category</legend>
            <Radio name="category" checked={!current.category} onChange={() => apply({ category: '' })}>All categories</Radio>
            {categories.map((c) => (
              <Radio key={c.slug} name="category" checked={current.category === c.slug} onChange={() => apply({ category: c.slug })}>
                <c.icon size={14} className={c.text} /> {c.name}
              </Radio>
            ))}
          </fieldset>
          <fieldset>
            <legend className="mb-1 text-sm font-bold">Date</legend>
            <Radio name="date" checked={!current.date} onChange={() => apply({ date: '' })}>Any date</Radio>
            <Radio name="date" checked={current.date === today} onChange={() => apply({ date: today })}>Today</Radio>
            <input type="date" aria-label="Pick a date" className="input mt-2" value={current.date ?? ''} onChange={(e) => apply({ date: e.target.value })} />
          </fieldset>
          <fieldset>
            <legend className="mb-1 text-sm font-bold">Price</legend>
            <Radio name="price" checked={!current.price} onChange={() => apply({ price: '' })}>Any price</Radio>
            <Radio name="price" checked={current.price === 'free'} onChange={() => apply({ price: 'free' })}>Free</Radio>
            <Radio name="price" checked={current.price === 'paid'} onChange={() => apply({ price: 'paid' })}>Paid</Radio>
          </fieldset>
        </aside>

        <section aria-live="polite">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold">{loading ? 'Searching...' : data ? `${data.total} event${data.total === 1 ? '' : 's'} found` : ''}</p>
            <label className="flex items-center gap-2 text-sm text-slate-500">Sort by
              <select className="input !w-auto !py-1.5" value={current.sort ?? 'date'} onChange={(e) => apply({ sort: e.target.value })}>
                <option value="date">Date (soonest)</option><option value="newest">Newest listed</option>
                <option value="price_asc">Price: low to high</option><option value="price_desc">Price: high to low</option>
              </select>
            </label>
          </div>

          {error ? <ErrorState message={error} onRetry={reload} />
            : loading && !data ? <Spinner />
            : data.data.length === 0 ? (
              <EmptyState icon={SearchX} title="No events match your search" text="Try different keywords or remove some filters." action={hasFilters && <Button onClick={() => setParams({})}>Clear filters</Button>} />
            ) : (
              <>
                <div className="space-y-4">{data.data.map((e) => <EventRow key={e._id} event={e} />)}</div>
                <Pagination page={data.page} pages={data.pages} onChange={(p) => apply({ page: p > 1 ? String(p) : '' })} />
              </>
            )}
          <p className="mt-10 text-center text-sm text-slate-500">Organising something? <Link to="/signup?role=organizer" className="font-semibold text-brand-600 hover:underline">Create an event</Link></p>
        </section>
      </div>
    </div>
  )
}
