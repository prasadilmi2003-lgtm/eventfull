import { Loader2 } from 'lucide-react'

const variants = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700',
  accent: 'bg-orange text-white hover:brightness-95',
  outline: 'border border-brand-600 text-brand-700 hover:bg-brand-50',
  ghost: 'text-navy-700 hover:bg-brand-50',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  light: 'bg-white text-brand-700 hover:bg-white/90',
}
const sizes = { md: 'px-5 py-2.5 text-sm', sm: 'px-3 py-1.5 text-xs' }

export default function Button({ variant = 'primary', size = 'md', loading = false, type = 'button', className = '', disabled, children, ...props }) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-full font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  )
}
