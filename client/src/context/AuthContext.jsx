import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import api from '../lib/api'

const AuthContext = createContext(null)

// Holds the logged-in user for the whole app. The real session lives in an HTTP-only cookie;
// this state only mirrors what GET /auth/me returns.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/auth/me')
      .then((r) => setUser(r.data?.user || r.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (credentials) => {
    const { data } = await api.post('/auth/login', credentials)
    const u = data?.user || data
    setUser(u)
    return u
  }, [])

  const register = useCallback(async (details) => {
    const { data } = await api.post('/auth/register', details)
    const u = data?.user || data
    setUser(u)
    return u
  }, [])

  const logout = useCallback(async () => {
    await api.post('/auth/logout').catch(() => {})
    setUser(null)
  }, [])

  const updateProfile = useCallback(async (changes) => {
    const { data } = await api.patch('/auth/me', changes)
    setUser(data)
    return data
  }, [])

  const toggleFavorite = useCallback(async (eventId) => {
    const { data } = await api.post(`/favorites/${eventId}`)
    setUser((u) => ({ ...u, favorites: data.favorites }))
  }, [])

  const value = useMemo(
    () => ({ user, loading, login, register, logout, updateProfile, toggleFavorite }),
    [user, loading, login, register, logout, updateProfile, toggleFavorite],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
