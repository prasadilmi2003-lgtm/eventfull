import { Briefcase, Cpu, GraduationCap, HeartHandshake, Music, Palette, Trophy, Utensils } from 'lucide-react'
import { ids, photo } from './images'

// `grad` and `badge` are full Tailwind class names so Tailwind can find them at build time.
// `text` colours the small category label on cards; `image` is the category photo.
const make = (slug, name, icon, grad, badge, text) => ({ slug, name, icon, grad, badge, text, image: photo(ids[slug], 600) })

export const categories = [
  make('music', 'Music', Music, 'from-pink to-brand-500', 'music', 'text-pink'),
  make('tech', 'Tech', Cpu, 'from-sky to-brand-600', 'tech', 'text-sky'),
  make('food', 'Food & Drink', Utensils, 'from-orange to-amber', 'food', 'text-orange'),
  make('sports', 'Sports', Trophy, 'from-lime to-teal', 'sports', 'text-green-600'),
  make('arts', 'Arts', Palette, 'from-amber to-pink', 'arts', 'text-orange'),
  make('business', 'Business', Briefcase, 'from-navy-700 to-brand-600', 'paid', 'text-brand-600'),
  make('education', 'Education', GraduationCap, 'from-teal to-sky', 'tech', 'text-teal'),
  make('charity', 'Charity', HeartHandshake, 'from-pink to-orange', 'music', 'text-pink'),
]

export const getCategory = (slug) => categories.find((c) => c.slug === slug) ?? categories[0]
