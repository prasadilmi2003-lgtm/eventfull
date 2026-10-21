import { CalendarPlus, Ticket } from 'lucide-react'
import { useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import Button from '../../components/ui/Button'
import Field from '../../components/ui/Field'
import { useAuth } from '../../context/AuthContext'
import { errorMessage, fieldErrors } from '../../lib/api'
import { homeFor } from '../../utils/roles'
import { email, hasErrors, password, required } from '../../utils/validate'
import AuthCard from './AuthCard'

const roles = [
  { value: 'attendee', label: 'Attendee', text: 'Find events and book tickets', icon: Ticket },
  { value: 'organizer', label: 'Organizer', text: 'Create and manage events', icon: CalendarPlus },
]

export default function Signup() {
  const { user, register } = useAuth()
  const [params] = useSearchParams()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', role: params.get('role') === 'organizer' ? 'organizer' : 'attendee' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(false)

  if (user) return <Navigate to={homeFor(user.role)} replace />
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    const found = {
      name: form.name.trim().length < 2 ? 'Name must be at least 2 characters' : '',
      email: email(form.email),
      password: password(form.password),
      confirm: form.confirm !== form.password ? 'Passwords do not match' : required(form.confirm, 'Confirm password'),
    }
    setErrors(found)
    setFormError('')
    if (hasErrors(found)) return
    setLoading(true)
    try {
      await register({ name: form.name, email: form.email, password: form.password, role: form.role })
    } catch (err) {
      setErrors(fieldErrors(err))
      setFormError(errorMessage(err))
      setLoading(false)
    }
  }

  return (
    <AuthCard title="Create your account" subtitle="Join EventEase in less than a minute.">
      <form onSubmit={submit} noValidate className="space-y-4">
        {formError && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">{formError}</p>}
        <fieldset>
          <legend className="mb-1 text-sm font-medium">I want to</legend>
          <div className="grid grid-cols-2 gap-3">
            {roles.map(({ value, label, text, icon: Icon }) => (
              <label key={value} className={`cursor-pointer rounded-xl border-2 p-3 text-center transition ${form.role === value ? 'border-brand-600 bg-brand-50' : 'border-slate-200 hover:border-brand-200'}`}>
                <input type="radio" name="role" value={value} checked={form.role === value} onChange={set('role')} className="sr-only" />
                <Icon className="mx-auto text-brand-600" size={22} />
                <span className="mt-1 block text-sm font-bold">{label}</span>
                <span className="block text-xs text-slate-500">{text}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <Field label="Full name" error={errors.name}><input autoComplete="name" className="input" value={form.name} onChange={set('name')} aria-invalid={!!errors.name} /></Field>
        <Field label="Email" error={errors.email}><input type="email" autoComplete="email" className="input" value={form.email} onChange={set('email')} aria-invalid={!!errors.email} /></Field>
        <Field label="Password" error={errors.password} hint="At least 8 characters with a letter and a number"><input type="password" autoComplete="new-password" className="input" value={form.password} onChange={set('password')} aria-invalid={!!errors.password} /></Field>
        <Field label="Confirm password" error={errors.confirm}><input type="password" autoComplete="new-password" className="input" value={form.confirm} onChange={set('confirm')} aria-invalid={!!errors.confirm} /></Field>
        <Button type="submit" loading={loading} className="w-full py-3">Create account</Button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">Already have an account? <Link to="/login" className="font-semibold text-brand-600 hover:underline">Log in</Link></p>
    </AuthCard>
  )
}
