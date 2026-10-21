export const homeFor = (role) => ({ attendee: '/attendee', organizer: '/organizer', admin: '/admin' })[role] ?? '/'
