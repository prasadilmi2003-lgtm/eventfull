import axios from 'axios'

// One shared Axios instance; withCredentials sends the HTTP-only auth cookie (Phase 5).
const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL ?? ''}/api`,
  withCredentials: true,
})

export default api
