import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="text-7xl font-extrabold text-brand-600">404</p>
      <p className="mt-3 text-lg">This page doesn&apos;t exist.</p>
      <Link to="/" className="mt-6 inline-block font-semibold text-brand-600 hover:underline">Back to home</Link>
    </div>
  )
}
