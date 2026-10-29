import axios from 'axios'
import mockAdapter from '../mock/adapter'

// One shared Axios instance. withCredentials sends the HTTP-only auth cookie set by the real backend.
const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL ?? ''}/api`,
  withCredentials: true,
})

// The mock API is opt-in (VITE_USE_MOCK=true) so a production build can never ship it by accident.
if (import.meta.env.VITE_USE_MOCK === 'true') api.defaults.adapter = mockAdapter

export const errorMessage = (err) => err.response?.data?.message || err.message || 'Something went wrong'
// Field-level errors from the server: { errors: { email: 'Already registered' } }
export const fieldErrors = (err) => err.response?.data?.errors ?? {}

export default api
