import { ids, photo } from '../../data/images'

// Two-column card shared by Login, Sign up, Forgot and Reset password: photo on the left (large screens), form on the right.
export default function AuthCard({ title, subtitle, children }) {
  return (
    <div className="px-4 py-10">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-3xl bg-white shadow-card lg:grid-cols-2">
        <div className="relative isolate hidden lg:block">
          <img src={photo(ids.auth, 900)} alt="" className="absolute inset-0 -z-20 h-full w-full object-cover" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-t from-brand-700/90 via-brand-600/40 to-transparent" />
          <div className="flex h-full min-h-[28rem] flex-col justify-end p-8 text-white">
            <p className="text-3xl font-extrabold leading-tight">Discover Events.<br />Create Memories.</p>
            <p className="mt-2 text-sm text-white/90">Book tickets, organise events and keep every QR ticket in one place.</p>
          </div>
        </div>
        <div className="p-6 sm:p-10">
          <h1 className="text-2xl font-extrabold">{title}</h1>
          {subtitle && <p className="mb-6 mt-1 text-sm text-slate-500">{subtitle}</p>}
          {children}
        </div>
      </div>
    </div>
  )
}
