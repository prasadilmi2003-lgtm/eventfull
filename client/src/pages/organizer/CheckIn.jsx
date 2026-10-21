import { CheckCircle2, ScanLine, XCircle } from 'lucide-react'
import { useRef, useState } from 'react'
import Button from '../../components/ui/Button'
import Field from '../../components/ui/Field'
import PageHeader from '../../components/ui/PageHeader'
import { EmptyState, ErrorState, Spinner } from '../../components/ui/States'
import useFetch from '../../hooks/useFetch'
import api, { errorMessage } from '../../lib/api'
import { formatShort } from '../../utils/format'

// Staff scan (or type) a ticket's QR token. A handheld/phone scanner that "types" into the box works too.
// Validity is decided by the server only.
export default function CheckIn() {
  const { data: events, loading, error, reload } = useFetch(() => api.get('/organizer/events').then((r) => r.data.filter((e) => e.status === 'published')))
  const [eventId, setEventId] = useState('')
  const [token, setToken] = useState('')
  const [checking, setChecking] = useState(false)
  const [result, setResult] = useState(null) // { ok, message }
  const [history, setHistory] = useState([])
  const input = useRef(null)

  if (loading) return <Spinner />
  if (error) return <ErrorState message={error} onRetry={reload} />
  if (!events.length) return <EmptyState icon={ScanLine} title="No published events" text="Check-in is available once an event is published." />

  const selected = eventId || events[0]._id

  const submit = async (e) => {
    e.preventDefault()
    if (!token.trim()) return
    setChecking(true)
    let entry
    try {
      const { data } = await api.post('/tickets/check-in', { eventId: selected, token })
      entry = { ok: true, message: `Welcome, ${data.attendeeName}! (${data.ticketTypeName})`, code: data.code }
    } catch (err) {
      entry = { ok: false, message: errorMessage(err), code: token.trim().slice(0, 12) }
    }
    setResult(entry)
    setHistory((h) => [{ ...entry, at: new Date().toISOString() }, ...h].slice(0, 8))
    setToken('')
    setChecking(false)
    input.current?.focus()
  }

  return (
    <>
      <PageHeader title="QR check-in" subtitle="Scan or enter a ticket code to admit an attendee." />
      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={submit} className="card space-y-4 p-6">
          <Field label="Event">
            <select className="input" value={selected} onChange={(e) => { setEventId(e.target.value); setResult(null) }}>
              {events.map((e) => <option key={e._id} value={e._id}>{e.title}</option>)}
            </select>
          </Field>
          <Field label="Ticket QR token or code" hint="Tip: click here, then scan. Most scanners press Enter for you.">
            <input ref={input} autoFocus className="input font-mono" value={token} onChange={(e) => setToken(e.target.value)} placeholder="TKT-XXXXXX" autoComplete="off" />
          </Field>
          <Button type="submit" loading={checking} className="w-full py-3"><ScanLine size={18} /> Verify &amp; check in</Button>
        </form>

        <div className="space-y-4">
          <div role="status" aria-live="assertive" className={`card flex min-h-32 items-center gap-4 p-6 ${result ? (result.ok ? 'bg-teal/10' : 'bg-red-50') : ''}`}>
            {!result ? <p className="text-slate-500">The result will appear here.</p> : (
              <>
                {result.ok ? <CheckCircle2 size={44} className="shrink-0 text-teal" /> : <XCircle size={44} className="shrink-0 text-red-600" />}
                <div>
                  <p className={`text-xl font-extrabold ${result.ok ? 'text-teal' : 'text-red-600'}`}>{result.ok ? 'Check-in successful' : 'Entry denied'}</p>
                  <p className="text-sm">{result.message}</p>
                </div>
              </>
            )}
          </div>

          {history.length > 0 && (
            <div className="card p-4">
              <h2 className="mb-2 font-bold">Recent scans</h2>
              <ul className="divide-y divide-slate-100 text-sm">
                {history.map((h, i) => (
                  <li key={i} className="flex items-center justify-between gap-3 py-2">
                    <span className="flex items-center gap-2">{h.ok ? <CheckCircle2 size={14} className="text-teal" /> : <XCircle size={14} className="text-red-600" />}<span className="font-mono text-xs">{h.code}</span></span>
                    <span className="text-xs text-slate-500">{formatShort(h.at)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
