import { UserX } from 'lucide-react'
import { useState } from 'react'
import Badge, { StatusBadge } from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import PageHeader from '../../components/ui/PageHeader'
import { EmptyState, ErrorState, Spinner } from '../../components/ui/States'
import { useToast } from '../../context/ToastContext'
import useFetch from '../../hooks/useFetch'
import api, { errorMessage } from '../../lib/api'
import { formatDate } from '../../utils/format'

export default function AdminUsers() {
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [target, setTarget] = useState(null) // user awaiting confirmation
  const [working, setWorking] = useState(false)
  const { data: users, loading, error, reload } = useFetch(() => api.get('/admin/users', { params: { search, role } }).then((r) => r.data), [search, role])

  const toggle = async () => {
    const next = target.accountStatus === 'active' ? 'suspended' : 'active'
    setWorking(true)
    try {
      await api.patch(`/admin/users/${target._id}/status`, { accountStatus: next })
      toast.success(`${target.name} is now ${next}`)
      reload()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setWorking(false)
      setTarget(null)
    }
  }

  return (
    <>
      <PageHeader title="User management" subtitle="Suspend or reactivate attendee and organizer accounts." />
      <div className="mb-4 flex flex-wrap gap-3">
        <input className="input max-w-xs" placeholder="Search name or email" aria-label="Search users" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="input max-w-[11rem]" aria-label="Filter by role" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="">All roles</option><option value="attendee">Attendees</option><option value="organizer">Organizers</option><option value="admin">Admins</option>
        </select>
      </div>

      {error ? <ErrorState message={error} onRetry={reload} />
        : loading && !users ? <Spinner />
        : users.length === 0 ? <EmptyState icon={UserX} title="No users found" />
        : (
          <div className="card overflow-x-auto">
            <table className="table">
              <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th>Status</th><th className="text-right">Action</th></tr></thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id}>
                    <td className="font-semibold">{u.name}</td>
                    <td>{u.email}</td>
                    <td><Badge color={u.role}>{u.role}</Badge></td>
                    <td className="whitespace-nowrap">{formatDate(u.createdAt)}</td>
                    <td><StatusBadge status={u.accountStatus} /></td>
                    <td className="text-right">
                      {u.role !== 'admin' && (
                        <Button size="sm" variant={u.accountStatus === 'active' ? 'danger' : 'outline'} onClick={() => setTarget(u)}>
                          {u.accountStatus === 'active' ? 'Suspend' : 'Reactivate'}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      <ConfirmDialog open={!!target} loading={working} danger={target?.accountStatus === 'active'}
        title={target?.accountStatus === 'active' ? 'Suspend this account?' : 'Reactivate this account?'}
        message={target && (target.accountStatus === 'active' ? `${target.name} will not be able to log in or book tickets.` : `${target.name} will be able to use EventEase again.`)}
        confirmLabel={target?.accountStatus === 'active' ? 'Suspend' : 'Reactivate'} onConfirm={toggle} onCancel={() => setTarget(null)} />
    </>
  )
}
