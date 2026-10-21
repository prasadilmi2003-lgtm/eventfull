import { Link } from 'react-router-dom'
import { categories } from '../data/categories'

export default function Categories() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="text-3xl font-extrabold sm:text-4xl">Event categories</h1>
      <p className="mt-1 text-slate-500">Pick a category to see what is on.</p>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {categories.map(({ slug, name, icon: Icon, grad, image }) => (
          <Link key={slug} to={`/events?category=${slug}`} className="group relative isolate flex h-56 flex-col justify-end overflow-hidden rounded-3xl p-5 text-white shadow-card transition hover:-translate-y-1 hover:shadow-xl">
            <img src={image} alt="" loading="lazy" className="absolute inset-0 -z-20 h-full w-full object-cover transition duration-500 group-hover:scale-110" />
            <div className={`absolute inset-0 -z-10 bg-gradient-to-t ${grad} opacity-70 mix-blend-multiply`} />
            <div className="absolute inset-0 -z-10 bg-gradient-to-t from-navy-900/70 to-transparent" />
            <Icon size={28} className="mb-2" />
            <span className="text-2xl font-extrabold">{name}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
