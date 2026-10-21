import { useState } from 'react'
import { getCategory } from '../data/categories'
import { isHttpUrl } from '../utils/format'

// Picture order: the event's own banner, then its category photo, then a gradient with the category icon.
export default function EventPoster({ event, className = 'h-44', iconSize = 56 }) {
  const cat = getCategory(event.category)
  const sources = [isHttpUrl(event.bannerImage) && event.bannerImage, cat.image].filter(Boolean)
  const [failed, setFailed] = useState(0)
  const Icon = cat.icon

  if (failed < sources.length) {
    return <img key={sources[failed]} src={sources[failed]} alt="" loading="lazy" onError={() => setFailed((n) => n + 1)} className={`w-full object-cover ${className}`} />
  }
  return (
    <div className={`flex w-full items-center justify-center bg-gradient-to-br ${cat.grad} ${className}`}>
      <Icon size={iconSize} className="text-white/80" aria-hidden="true" />
    </div>
  )
}
