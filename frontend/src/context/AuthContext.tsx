'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'

const API_BASE = process.env.NEXT_PUBLIC_API_URL

export interface User {
  id: number
  name: string
  email: string
  avatar_url: string | null
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ error?: string }>
  register: (name: string, email: string, password: string) => Promise<{ error?: string }>
  startGoogleLogin: () => void
  setTokenAndFetchUser: (token: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => ({}),
  register: async () => ({}),
  startGoogleLogin: () => {},
  setTokenAndFetchUser: async () => {},
  logout: () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token && API_BASE) {
      fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          if (res.ok) return res.json()
          throw new Error('Invalid token')
        })
        .then((data) => setUser(data))
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) return { error: data.detail || 'Login failed' }
      localStorage.setItem('token', data.access_token)
      setUser(data.user)
      return {}
    } catch {
      return { error: 'Network error. Please try again.' }
    }
  }, [])

  const register = useCallback(async (name: string, email: string, password: string) => {
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })
      const data = await res.json()
      if (!res.ok) return { error: data.detail || 'Registration failed' }
      localStorage.setItem('token', data.access_token)
      setUser(data.user)
      return {}
    } catch {
      return { error: 'Network error. Please try again.' }
    }
  }, [])

  const startGoogleLogin = useCallback(() => {
    window.location.href = `${API_BASE}/auth/google`
  }, [])

  const setTokenAndFetchUser = useCallback(async (token: string) => {
    localStorage.setItem('token', token)
    if (!API_BASE) return
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setUser(data)
      } else {
        localStorage.removeItem('token')
      }
    } catch {
      localStorage.removeItem('token')
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, startGoogleLogin, setTokenAndFetchUser, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
