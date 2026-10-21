# Architecture

Browser (React + Vite + Tailwind) --/api (Axios, cookie)--> Express API --Mongoose--> MongoDB Atlas

client/src
  components/ui      reusable atoms (Button, Badge, later Input, Modal)
  components/layout  Navbar, Footer, role layouts
  pages              one file per route
  context            AuthContext (Phase 5)
  lib/api.js         the single Axios instance
server/src
  models  schemas | controllers  request logic | routes  URL -> controller
  middleware  auth, roles, errors, validation | config  DB + env | utils  helpers

Rule: routes -> controllers -> models. The client never talks to the DB.
