const variants = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700',
  accent: 'bg-orange text-white hover:brightness-95',
  outline: 'border border-brand-600 text-brand-700 hover:bg-brand-50',
  ghost: 'text-navy-700 hover:bg-brand-50',
}

export default function Button({ variant = 'primary', className = '', ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    />
  )
}
