import { useState } from 'react'
import Button from '../components/ui/Button'
import Field from '../components/ui/Field'
import { useToast } from '../context/ToastContext'
import api, { errorMessage, fieldErrors } from '../lib/api'
import { email, hasErrors, required } from '../utils/validate'

export default function Contact() {
  const toast = useToast()
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [errors, setErrors] = useState({})
  const [sending, setSending] = useState(false)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    const found = {
      name: required(form.name, 'Name'),
      email: email(form.email),
      message: form.message.trim().length < 10 ? 'Message must be at least 10 characters' : '',
    }
    setErrors(found)
    if (hasErrors(found)) return
    setSending(true)
    try {
      await api.post('/contact', form)
      toast.success('Message sent. We will get back to you soon.')
      setForm({ name: '', email: '', message: '' })
    } catch (err) {
      setErrors(fieldErrors(err))
      toast.error(errorMessage(err))
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-4xl font-extrabold">Contact us</h1>
      <p className="mt-2 text-slate-600">Questions about an event or your account? Send us a message.</p>
      <form onSubmit={submit} noValidate className="card mt-8 space-y-4 p-6">
        <Field label="Your name" error={errors.name}><input className="input" value={form.name} onChange={set('name')} aria-invalid={!!errors.name} /></Field>
        <Field label="Email" error={errors.email}><input type="email" className="input" value={form.email} onChange={set('email')} aria-invalid={!!errors.email} /></Field>
        <Field label="Message" error={errors.message}><textarea rows={5} className="input" value={form.message} onChange={set('message')} aria-invalid={!!errors.message} /></Field>
        <Button type="submit" loading={sending}>Send message</Button>
      </form>
    </div>
  )
}
