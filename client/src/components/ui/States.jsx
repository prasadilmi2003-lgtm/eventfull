import { AlertTriangle, Inbox, Loader2 } from 'lucide-react'
import Button from './Button'

export const Spinner = () => (
  <div className="flex justify-center py-16 text-brand-600" role="status" aria-label="Loading">
    <Loader2 className="animate-spin" size={32} />
  </div>
)

export function CardGridSkeleton({ count = 8, className = 'sm:grid-cols-2 lg:grid-cols-4' }) {
  return (
    <div className={`grid gap-6 ${className}`} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="card animate-pulse overflow-hidden">
          <div className="h-40 bg-slate-200" />
          <div className="space-y-3 p-4">
            <div className="h-4 w-1/3 rounded bg-slate-200" />
            <div className="h-5 w-3/4 rounded bg-slate-200" />
            <div className="h-4 w-1/2 rounded bg-slate-200" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function EmptyState({ icon: Icon = Inbox, title, text, action }) {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-14 text-center">
      <span className="rounded-full bg-brand-50 p-4 text-brand-600"><Icon size={28} /></span>
      <h3 className="text-lg font-bold">{title}</h3>
      {text && <p className="max-w-md text-sm text-slate-500">{text}</p>}
      {action}
    </div>
  )
}

export function ErrorState({ message, onRetry }) {
  return (
    <div role="alert" className="card flex flex-col items-center gap-3 px-6 py-14 text-center">
      <span className="rounded-full bg-red-100 p-4 text-red-600"><AlertTriangle size={28} /></span>
      <h3 className="text-lg font-bold">Something went wrong</h3>
      <p className="max-w-md text-sm text-slate-500">{message}</p>
      {onRetry && <Button variant="outline" onClick={onRetry}>Try again</Button>}
    </div>
  )
}
