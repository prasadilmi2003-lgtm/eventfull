import { MailCheck } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../../components/ui/Button'
import Field from '../../components/ui/Field'
import api, { errorMessage } from '../../lib/api'
import { email as emailRule } from '../../utils/validate'
import AuthCard from './AuthCard'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    const found = emailRule(email)
    setError(found)
    if (found) return
    setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email })
      setSent(true)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthCard title="Forgot password?" subtitle="Enter your email and we will send you a reset link.">
      {sent ? (
        <div className="space-y-3 text-center">
          <MailCheck className="mx-auto text-teal" size={40} />
          <p className="text-sm">If an account exists for <strong>{email}</strong>, a reset link is on its way.</p>
          <Link to="/login" className="font-semibold text-brand-600 hover:underline">Back to log in</Link>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="space-y-4">
          <Field label="Email" error={error}><input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!error} /></Field>
          <Button type="submit" loading={loading} className="w-full py-3">Send reset link</Button>
          <p className="text-center text-sm"><Link to="/login" className="font-medium text-brand-600 hover:underline">Back to log in</Link></p>
        </form>
      )}
    </AuthCard>
  )
}
