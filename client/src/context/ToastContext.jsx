import { CheckCircle2, XCircle } from 'lucide-react'
import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [items, setItems] = useState([])

  const push = useCallback((type, message) => {
    const id = crypto.randomUUID()
    setItems((list) => [...list, { id, type, message }])
    setTimeout(() => setItems((list) => list.filter((t) => t.id !== id)), 4000)
  }, [])

  const toast = useMemo(() => ({ success: (m) => push('success', m), error: (m) => push('error', m) }), [push])

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed right-4 top-4 z-[100] flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2" role="status" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={`flex items-start gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-card ${t.type === 'success' ? 'bg-teal' : 'bg-red-600'}`}>
            {t.type === 'success' ? <CheckCircle2 size={18} className="mt-0.5 shrink-0" /> : <XCircle size={18} className="mt-0.5 shrink-0" />}
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
