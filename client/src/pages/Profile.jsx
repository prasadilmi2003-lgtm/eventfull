import { useState } from 'react'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Field from '../components/ui/Field'
import PageHeader from '../components/ui/PageHeader'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { errorMessage, fieldErrors } from '../lib/api'
import { formatDate, isHttpUrl } from '../utils/format'

export default function Profile() {
  const { user, updateProfile } = useAuth()
  const toast = useToast()
  const [form, setForm] = useState({ name: user.name, profileImage: user.profileImage ?? '' })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    const found = {
      name: form.name.trim().length < 2 ? 'Name must be at least 2 characters' : '',
      profileImage: form.profileImage && !isHttpUrl(form.profileImage) ? 'Enter a valid http(s) image URL' : '',
    }
    setErrors(found)
    if (found.name || found.profileImage) return
    setSaving(true)
    try {
      await updateProfile(form)
      toast.success('Profile updated')
    } catch (err) {
      setErrors(fieldErrors(err))
      toast.error(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PageHeader title="Profile settings" />
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="card flex flex-col items-center gap-3 p-6 text-center">
          {user.profileImage && isHttpUrl(user.profileImage)
            ? <img src={user.profileImage} alt="" className="h-24 w-24 rounded-full object-cover" />
            : <span className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-pink text-4xl font-extrabold text-white">{user.name[0]}</span>}
          <p className="text-lg font-bold">{user.name}</p>
          <Badge color={user.role}>{user.role}</Badge>
          <p className="text-xs text-slate-500">Member since {formatDate(user.createdAt)}</p>
        </div>
        <form onSubmit={submit} noValidate className="card space-y-4 p-6">
          <Field label="Full name" error={errors.name}><input className="input" value={form.name} onChange={set('name')} aria-invalid={!!errors.name} /></Field>
          <Field label="Email" hint="Your email cannot be changed here."><input className="input" value={user.email} disabled /></Field>
          <Field label="Profile image URL (optional)" error={errors.profileImage}><input className="input" placeholder="https://..." value={form.profileImage} onChange={set('profileImage')} aria-invalid={!!errors.profileImage} /></Field>
          <Button type="submit" loading={saving}>Save changes</Button>
        </form>
      </div>
    </>
  )
}
