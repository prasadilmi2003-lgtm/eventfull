import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Button from '../../components/ui/Button'
import Field from '../../components/ui/Field'
import api, { errorMessage, fieldErrors } from '../../lib/api'
import { hasErrors, password as passwordRule } from '../../utils/validate'
import AuthCard from './AuthCard'

// The reset link in the email looks like /reset-password?token=...
export default function ResetPassword() {
  const [params] = useSearchParams()
  const token = params.get('token')
  const [form, setForm] = useState({ password: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    const found = { password: passwordRule(form.password), confirm: form.confirm !== form.password ? 'Passwords do not match' : '' }
    setErrors(found)
    if (hasErrors(found)) return
    setLoading(true)
    try {
      await api.post('/auth/reset-password', { token, password: form.password })
      setDone(true)
    } catch (err) {
      setErrors({ form: errorMessage(err), ...fieldErrors(err) })
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return <AuthCard title="Invalid link"><p className="text-sm">This reset link is missing its token. <Link to="/forgot-password" className="font-semibold text-brand-600 hover:underline">Request a new one</Link>.</p></AuthCard>
  }

  return (
    <AuthCard title="Choose a new password">
      {done ? (
        <p className="text-sm">Your password has been updated. <Link to="/login" className="font-semibold text-brand-600 hover:underline">Log in</Link></p>
      ) : (
        <form onSubmit={submit} noValidate className="space-y-4">
          {errors.form && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">{errors.form}</p>}
          <Field label="New password" error={errors.password}><input type="password" autoComplete="new-password" className="input" value={form.password} onChange={set('password')} aria-invalid={!!errors.password} /></Field>
          <Field label="Confirm new password" error={errors.confirm}><input type="password" autoComplete="new-password" className="input" value={form.confirm} onChange={set('confirm')} aria-invalid={!!errors.confirm} /></Field>
          <Button type="submit" loading={loading} className="w-full py-3">Update password</Button>
        </form>
      )}
    </AuthCard>
  )
}
