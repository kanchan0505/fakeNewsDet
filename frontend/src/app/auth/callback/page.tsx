'use client'


import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

function AuthCallbackInner() {
  const { setTokenAndFetchUser } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'error'>('loading')

  useEffect(() => {
    const token = searchParams.get('token')
    const error = searchParams.get('error')

    if (error || !token) {
      // Avoid setState directly: use microtask
      Promise.resolve().then(() => setStatus('error'))
      setTimeout(() => router.replace('/signin?error=google_failed'), 2000)
      return
    }

    setTokenAndFetchUser(token).then(() => {
      router.replace('/')
    })
  }, [searchParams, setTokenAndFetchUser, router])

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        {status === 'loading' ? (
          <>
            <div className="auth-logo">
              <div className="auth-logo-icon">🔍</div>
              <div className="auth-logo-text">AuthentiCheck</div>
            </div>
            <p className="auth-subtitle">Signing you in with Google…</p>
          </>
        ) : (
          <>
            <p className="auth-error">Google sign-in failed. Redirecting…</p>
          </>
        )}
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense>
      <AuthCallbackInner />
    </Suspense>
  )
}
