import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import TicketTypesEditor, { newTicket } from '../../components/TicketTypesEditor'
import Button from '../../components/ui/Button'
import Field from '../../components/ui/Field'
import PageHeader from '../../components/ui/PageHeader'
import { ErrorState, Spinner } from '../../components/ui/States'
import { useToast } from '../../context/ToastContext'
import { categories } from '../../data/categories'
import useFetch from '../../hooks/useFetch'
import api, { errorMessage, fieldErrors } from '../../lib/api'
import { toInputDateTime } from '../../utils/format'
import { hasErrors, validateEvent } from '../../utils/validate'

const blank = { title: '', category: '', description: '', bannerImage: '', venue: '', address: '', city: '', country: 'Sri Lanka', startDate: '', endDate: '', capacity: '', ticketTypes: [newTicket()] }

// API shape -> form shape (dates become local "datetime-local" strings, numbers become strings)
const toForm = (e) => ({
  ...blank, ...e,
  startDate: toInputDateTime(e.startDate), endDate: toInputDateTime(e.endDate), capacity: String(e.capacity),
  ticketTypes: e.ticketTypes.map((t) => ({ ...t, price: String(t.price), quantity: String(t.quantity), salesStart: toInputDateTime(t.salesStart), salesEnd: toInputDateTime(t.salesEnd) })),
})
// Form shape -> API body. Only the fields the server accepts are sent.
const iso = (v) => (v ? new Date(v).toISOString() : null)
const toBody = (f) => ({
  title: f.title.trim(), category: f.category, description: f.description.trim(), bannerImage: f.bannerImage.trim(),
  venue: f.venue.trim(), address: f.address.trim(), city: f.city.trim(), country: f.country.trim(),
  startDate: iso(f.startDate), endDate: iso(f.endDate), capacity: Number(f.capacity),
  ticketTypes: f.ticketTypes.map((t) => ({ _id: t._id, name: t.name.trim(), description: t.description, price: Number(t.price), quantity: Number(t.quantity), salesStart: iso(t.salesStart), salesEnd: iso(t.salesEnd) })),
})

// Create (/organizer/events/new) and Edit (/organizer/events/:id/edit) share this page.
export default function EventForm() {
  const { id } = useParams()
  const { data, loading, error, reload } = useFetch(() => (id ? api.get(`/events/${id}`).then((r) => r.data) : Promise.resolve(null)), [id])

  if (loading) return <Spinner />
  if (error) return <ErrorState message={error} onRetry={reload} />
  return <Body key={id ?? 'new'} existing={data} />
}

function Body({ existing }) {
  const navigate = useNavigate()
  const toast = useToast()
  const [form, setForm] = useState(existing ? toForm(existing) : blank)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState('') // '' | 'draft' | 'submit'
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  // Drafts and rejected events can be (re)submitted; live events can only be edited.
  const canSubmit = !existing || ['draft', 'rejected'].includes(existing.status)

  const save = async (mode) => {
    const found = validateEvent(form)
    setErrors(found)
    if (hasErrors(found)) return toast.error('Please fix the highlighted fields')
    setSaving(mode)
    try {
      const body = toBody(form)
      const { data } = existing ? await api.patch(`/events/${existing._id}`, body) : await api.post('/events', body)
      if (mode === 'submit') await api.post(`/events/${data._id}/publish`)
      toast.success(mode === 'submit' ? 'Saved and submitted for approval' : existing ? 'Event updated' : 'Draft saved')
      navigate('/organizer/events')
    } catch (err) {
      setErrors(fieldErrors(err))
      toast.error(errorMessage(err))
    } finally {
      setSaving('')
    }
  }

  const text = (key, label, props = {}) => (
    <Field label={label} error={errors[key]} className={props.className}>
      <input className="input" value={form[key]} onChange={set(key)} aria-invalid={!!errors[key]} {...props} />
    </Field>
  )

  return (
    <>
      <PageHeader title={existing ? 'Edit event' : 'Create event'} subtitle={existing ? `Status: ${existing.status}` : 'Fill in the details, then save a draft or submit for approval.'} />
      <form noValidate onSubmit={(e) => { e.preventDefault(); save('draft') }} className="space-y-6">
        <section className="card space-y-4 p-6">
          <h2 className="text-lg font-bold">Basics</h2>
          {text('title', 'Event title', { placeholder: 'e.g. Neon Nights Live Concert' })}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Category" error={errors.category}>
              <select className="input" value={form.category} onChange={set('category')} aria-invalid={!!errors.category}>
                <option value="">Choose...</option>
                {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
              </select>
            </Field>
            {text('bannerImage', 'Banner image URL (optional)', { placeholder: 'https://...' })}
          </div>
          <Field label="Description" error={errors.description} hint="At least 20 characters"><textarea rows={5} className="input" value={form.description} onChange={set('description')} aria-invalid={!!errors.description} /></Field>
        </section>

        <section className="card space-y-4 p-6">
          <h2 className="text-lg font-bold">When and where</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Starts" error={errors.startDate}><input type="datetime-local" className="input" value={form.startDate} onChange={set('startDate')} aria-invalid={!!errors.startDate} /></Field>
            <Field label="Ends" error={errors.endDate}><input type="datetime-local" className="input" value={form.endDate} onChange={set('endDate')} aria-invalid={!!errors.endDate} /></Field>
            {text('venue', 'Venue')}
            {text('address', 'Address (optional)')}
            {text('city', 'City')}
            {text('country', 'Country')}
            {text('capacity', 'Total capacity', { type: 'number', min: 1 })}
          </div>
        </section>

        <section className="card p-6">
          <TicketTypesEditor value={form.ticketTypes} onChange={(ticketTypes) => setForm({ ...form, ticketTypes })} errors={errors.tickets} summaryError={errors.ticketsSummary} />
        </section>

        <div className="flex flex-wrap gap-3">
          <Button type="submit" variant={canSubmit ? 'outline' : 'primary'} loading={saving === 'draft'} disabled={!!saving}>{existing ? 'Save changes' : 'Save as draft'}</Button>
          {canSubmit && <Button loading={saving === 'submit'} disabled={!!saving} onClick={() => save('submit')}>Save &amp; submit for approval</Button>}
          <Button variant="ghost" onClick={() => navigate('/organizer/events')}>Cancel</Button>
        </div>
      </form>
    </>
  )
}
