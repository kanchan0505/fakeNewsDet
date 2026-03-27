'use client'

import { ReactNode } from 'react'
import { AuthProvider } from '@/context/AuthContext'
import { GoogleOAuthProvider } from '@react-oauth/google'

export default function Providers({ children }: { children: ReactNode }) {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
  const content = <AuthProvider>{children}</AuthProvider>

  if (googleClientId) {
    return (
      <GoogleOAuthProvider clientId={googleClientId}>
        {content}
      </GoogleOAuthProvider>
    )
  }

  return content
}
