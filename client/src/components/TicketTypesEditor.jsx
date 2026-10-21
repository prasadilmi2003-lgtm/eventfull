import { Plus, Trash2 } from 'lucide-react'
import Button from './ui/Button'
import Field from './ui/Field'

export const newTicket = () => ({ _key: crypto.randomUUID(), name: '', description: '', price: '0', quantity: '', salesStart: '', salesEnd: '', sold: 0 })

// Edits the list of ticket types (General, Student, VIP...) inside the event form.
// Rows that already have sales cannot be removed and their quantity cannot drop below `sold`.
export default function TicketTypesEditor({ value, onChange, errors = [], summaryError }) {
  const update = (i, key, v) => onChange(value.map((t, idx) => (idx === i ? { ...t, [key]: v } : t)))

  return (
    <fieldset className="space-y-4">
      <legend className="mb-1 text-lg font-bold">Ticket types</legend>
      <p className="text-sm text-slate-500">Set the price to 0 for a free ticket.</p>
      {value.map((t, i) => {
        const err = errors[i] ?? {}
        return (
          <div key={t._id ?? t._key} className="rounded-xl border border-slate-200 p-4">
            <div className="grid gap-3 sm:grid-cols-4">
              <Field label="Name" error={err.name} className="sm:col-span-2"><input className="input" placeholder="e.g. General Admission" value={t.name} onChange={(e) => update(i, 'name', e.target.value)} aria-invalid={!!err.name} /></Field>
              <Field label="Price (LKR)" error={err.price}><input type="number" min="0" className="input" value={t.price} onChange={(e) => update(i, 'price', e.target.value)} aria-invalid={!!err.price} /></Field>
              <Field label="Quantity" error={err.quantity} hint={t.sold ? `${t.sold} sold` : undefined}><input type="number" min={t.sold || 1} className="input" value={t.quantity} onChange={(e) => update(i, 'quantity', e.target.value)} aria-invalid={!!err.quantity} /></Field>
              <Field label="Description (optional)" className="sm:col-span-4"><input className="input" value={t.description} onChange={(e) => update(i, 'description', e.target.value)} /></Field>
              <Field label="Sales start (optional)"><input type="datetime-local" className="input" value={t.salesStart} onChange={(e) => update(i, 'salesStart', e.target.value)} /></Field>
              <Field label="Sales end (optional)" error={err.salesEnd}><input type="datetime-local" className="input" value={t.salesEnd} onChange={(e) => update(i, 'salesEnd', e.target.value)} aria-invalid={!!err.salesEnd} /></Field>
              <div className="flex items-end sm:col-span-2 sm:justify-end">
                <Button variant="ghost" size="sm" disabled={value.length === 1 || t.sold > 0} onClick={() => onChange(value.filter((_, idx) => idx !== i))}><Trash2 size={14} /> Remove</Button>
              </div>
            </div>
          </div>
        )
      })}
      {summaryError && <p role="alert" className="text-sm font-medium text-red-600">{summaryError}</p>}
      <Button variant="outline" size="sm" onClick={() => onChange([...value, newTicket()])}><Plus size={14} /> Add ticket type</Button>
    </fieldset>
  )
}
