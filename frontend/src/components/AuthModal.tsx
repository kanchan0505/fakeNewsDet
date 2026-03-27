'use client'

import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'
import GoogleSignInButton from './GoogleSignInButton'

interface AuthModalProps {
  onClose: () => void
  onSuccess?: () => void
}

export default function AuthModal({ onClose, onSuccess }: AuthModalProps) {
  const { login, googleLogin } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await login(email, password)
    setLoading(false)
    if (result.error) {
      setError(result.error)
    } else {
      onSuccess?.()
      onClose()
    }
  }

  const handleGoogleSuccess = async (accessToken: string) => {
    setError('')
    setLoading(true)
    const result = await googleLogin(accessToken)
    setLoading(false)
    if (result.error) {
      setError(result.error)
    } else {
      onSuccess?.()
      onClose()
    }
  }

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <button className="auth-modal-close" onClick={onClose}>✕</button>

        <div className="auth-logo">
          <div className="auth-logo-icon">🔍</div>
          <div className="auth-logo-text">AuthentiCheck</div>
        </div>

        <h2 className="auth-title">Sign in to continue</h2>
        <p className="auth-subtitle">Authenticate to run your analysis</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <input
            className="auth-input"
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="auth-input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div className="auth-divider">or</div>

        {googleClientId && (
          <GoogleSignInButton
            onSuccess={handleGoogleSuccess}
            onError={() => setError('Google sign-in failed')}
            disabled={loading}
          />
        )}

        <div className="auth-footer">
          Don&apos;t have an account?{' '}
          <Link href="/signup" onClick={onClose}>Sign up</Link>
        </div>
      </div>
    </div>
  )
}
