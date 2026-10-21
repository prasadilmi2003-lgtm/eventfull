// Stock photos from Unsplash (free to use). Needs an internet connection; if a photo fails to load the
// UI falls back to the category photo and then to a coloured gradient (see EventPoster).
export const photo = (id, width = 800) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width}&q=70`

export const ids = {
  // categories
  music: '1540039155733-5bb30b53aa14',
  tech: '1505373877841-8d25f7d46678',
  food: '1555939594-58d7cb561ad1',
  sports: '1517836357463-d25dfeac3438',
  arts: '1460661419201-fd4cecdf8a8b',
  business: '1511578314322-379afb476865',
  education: '1524178232363-1fb2b075b655',
  charity: '1559027615-cd4628902d4a',
  // page photos
  hero: '1514525253161-7a46d19cd819',
  organizer: '1556761175-5973dc0f32e7',
  auth: '1492684223066-81342ee5ff30',
  // sample events
  concert: '1470229722913-7c0e2dbbafd3',
  openMic: '1475721027785-f74eccf877e2',
  coding: '1498050108023-c5249f4df085',
  streetFood: '1504674900247-0877df9cc836',
  run: '1461896836934-ffe607ba8211',
  gallery: '1578301978693-85fa9c0320b9',
  pitch: '1531058020387-3be344556be6',
  students: '1523580494863-6f3031224c94',
  band: '1429962714451-bb934ecdc4ec',
  jazz: '1415201364774-f6f0bb35f28f',
}
