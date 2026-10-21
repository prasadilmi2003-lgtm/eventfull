import { CalendarPlus, QrCode, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import Button from '../components/ui/Button'

const steps = [
  { icon: Search, tone: 'bg-pink/15 text-pink', title: 'Discover', text: 'Search by name, category, date or place and filter by free or paid events.' },
  { icon: QrCode, tone: 'bg-sky/15 text-sky', title: 'Register', text: 'Get your tickets instantly. Each one has its own QR code you can show at the door.' },
  { icon: CalendarPlus, tone: 'bg-orange/15 text-orange', title: 'Organize', text: 'Create events, set ticket types and prices, and track who is coming.' },
]

export default function About() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-4xl font-extrabold">About Event<span className="text-brand-600">Ease</span></h1>
      <p className="mt-4 max-w-3xl text-lg text-slate-600">
        EventEase connects people who organise events with people who want to attend them. It is a university mini project built with the MERN stack
        (MongoDB, Express, React, Node.js) to practise full-stack web development.
      </p>
      <div className="mt-10 grid gap-6 sm:grid-cols-3">
        {steps.map(({ icon: Icon, tone, title, text }) => (
          <div key={title} className="card p-6">
            <span className={`inline-flex rounded-xl p-3 ${tone}`}><Icon size={26} /></span>
            <h2 className="mt-4 text-xl font-bold">{title}</h2>
            <p className="mt-2 text-sm text-slate-600">{text}</p>
          </div>
        ))}
      </div>
      <div className="mt-12"><Link to="/events"><Button>Browse events</Button></Link></div>
    </div>
  )
}
