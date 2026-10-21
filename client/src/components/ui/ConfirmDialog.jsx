import { useEffect } from 'react'
import Button from './Button'

// Modal used before anything destructive (delete, cancel). `children` can hold extra inputs, e.g. a reason.
export default function ConfirmDialog({ open, title, message, confirmLabel = 'Confirm', danger = false, loading = false, onConfirm, onCancel, children }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onCancel()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onCancel])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-navy-900/60 p-4" onClick={onCancel}>
      <div role="dialog" aria-modal="true" aria-label={title} className="card w-full max-w-md space-y-4 p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold">{title}</h2>
        {message && <p className="text-sm text-slate-600">{message}</p>}
        {children}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onCancel}>Keep it</Button>
          <Button variant={danger ? 'danger' : 'primary'} loading={loading} onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  )
}
