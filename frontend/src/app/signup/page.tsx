'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import GoogleSignInButton from '@/components/GoogleSignInButton'

export default function SignUpPage() {
  const { register, user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      router.push('/')
    }
  }, [user, authLoading, router])

  if (authLoading || user) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    const result = await register(name, email, password)
    setLoading(false)
    if (result.error) {
      setError(result.error)
    } else {
      router.push('/')
    }
  }



  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">🔍</div>
          <div className="auth-logo-text">AuthentiCheck</div>
        </div>

        <h1 className="auth-title">Create account</h1>
        <p className="auth-subtitle">Sign up to start detecting AI-generated content</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <label className="auth-label">Full Name</label>
          <input
            className="auth-input"
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <label className="auth-label">Email</label>
          <input
            className="auth-input"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <label className="auth-label">Password</label>
          <input
            className="auth-input"
            type="password"
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
          <label className="auth-label">Confirm Password</label>
          <input
            className="auth-input"
            type="password"
            placeholder="Repeat your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? 'Creating account…' : 'Sign Up'}
          </button>
        </form>

        <div className="auth-divider">or</div>

        <GoogleSignInButton disabled={loading} label="Sign up with Google" />

        <div className="auth-footer">
          Already have an account?{' '}
          <Link href="/signin">Sign in</Link>
        </div>
      </div>
    </div>
  )
}
