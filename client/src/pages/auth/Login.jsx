import { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import Button from '../../components/ui/Button'
import Field from '../../components/ui/Field'
import { useAuth } from '../../context/AuthContext'
import { errorMessage, fieldErrors } from '../../lib/api'
import { homeFor } from '../../utils/roles'
import { email, hasErrors, required } from '../../utils/validate'
import AuthCard from './AuthCard'

const demo = [
  ['Attendee', 'attendee@demo.com'],
  ['Organizer', 'organizer@demo.com'],
  ['Admin', 'admin@demo.com'],
]

export default function Login() {
  const { user, login } = useAuth()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(false)

  // Once logged in, go back to the page the visitor came from, or to their dashboard.
  const from = location.state?.from
  if (user) return <Navigate to={from ? `${from.pathname}${from.search}` : homeFor(user.role)} replace />

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    const found = { email: email(form.email), password: required(form.password, 'Password') }
    setErrors(found)
    setFormError('')
    if (hasErrors(found)) return
    setLoading(true)
    try {
      await login(form)
    } catch (err) {
      setErrors(fieldErrors(err))
      setFormError(errorMessage(err))
      setLoading(false)
    }
  }

  return (
    <AuthCard title="Welcome back" subtitle="Log in to manage your tickets and events.">
      <form onSubmit={submit} noValidate className="space-y-4">
        {formError && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">{formError}</p>}
        <Field label="Email" error={errors.email}><input type="email" autoComplete="email" className="input" value={form.email} onChange={set('email')} aria-invalid={!!errors.email} /></Field>
        <Field label="Password" error={errors.password}><input type="password" autoComplete="current-password" className="input" value={form.password} onChange={set('password')} aria-invalid={!!errors.password} /></Field>
        <div className="text-right text-sm"><Link to="/forgot-password" className="font-medium text-brand-600 hover:underline">Forgot password?</Link></div>
        <Button type="submit" loading={loading} className="w-full py-3">Log in</Button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">New here? <Link to="/signup" className="font-semibold text-brand-600 hover:underline">Create an account</Link></p>

      {import.meta.env.DEV && (
        <div className="mt-6 rounded-xl bg-brand-50 p-4 text-sm">
          <p className="font-semibold text-brand-900">Demo accounts (Quick login)</p>
          <p className="text-xs text-slate-500">Click to autofill. Password: Demo@1234</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {demo.map(([label, mail]) => (
              <Button key={mail} size="sm" variant="outline" onClick={() => setForm({ email: mail, password: 'Demo@1234' })}>{label}</Button>
            ))}
          </div>
        </div>
      )}
    </AuthCard>
  )
}
