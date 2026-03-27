'use client'

import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'

interface SidebarProps {
  isOpen: boolean
  activeView: 'home' | 'analysis'
  onClose: () => void
  onShowHome: () => void
  onShowAnalysis: () => void
  onLoadHistory: (text: string) => void
}

const historyItems = [
  {
    type: 'ai' as const,
    title: 'AI Detected — Essay',
    preview: '"The rapid advancement of AI..."',
    time: 'Today, 11:42 PM',
    text: 'The rapid advancement of artificial intelligence has fundamentally changed how we interact with technology...',
  },
  {
    type: 'human' as const,
    title: 'Human — Personal Blog',
    preview: '"When I first moved to..."',
    time: 'Yesterday, 4:15 PM',
    text: 'When I first moved to the city three years ago, I had no idea what I was getting myself into...',
  },
  {
    type: 'mix' as const,
    title: 'Mixed — Research Paper',
    preview: '"Climate change represents..."',
    time: 'Mar 25, 2:30 PM',
    text: 'Climate change represents one of the defining challenges of our era...',
  },
  {
    type: 'ai' as const,
    title: 'AI Detected — Report',
    preview: '"The financial projections..."',
    time: 'Mar 24, 9:00 AM',
    text: '',
  },
]

export default function Sidebar({
  isOpen,
  activeView,
  onClose,
  onShowHome,
  onShowAnalysis,
  onLoadHistory,
}: SidebarProps) {
  const { user, logout } = useAuth()
  const [imgError, setImgError] = useState(false)

  const initials = user
    ? user.name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : ''

  return (
    <>
      <div
        className={`sidebar-overlay${isOpen ? ' open' : ''}`}
        onClick={onClose}
      />
      <aside className={`sidebar${isOpen ? ' open' : ''}`}>
        <div className="sidebar-head">
          <div className="logo-mark">
            <div className="logo-icon">🔍</div>
            <div className="logo-name">
              Authenti<span>Check</span>
            </div>
          </div>
          <button className="sidebar-close" onClick={onClose}>✕</button>
        </div>

        <div className="sidebar-scroll">
          <div className="sidebar-section">
            <div className="sidebar-section-label">Menu</div>
            <div
              className={`nav-item${activeView === 'home' ? ' active' : ''}`}
              onClick={() => { onShowHome(); onClose() }}
            >
              <span className="ni-icon">🏠</span> Home
            </div>
            <div
              className={`nav-item${activeView === 'analysis' ? ' active' : ''}`}
              onClick={() => { onShowAnalysis(); onClose() }}
            >
              <span className="ni-icon">🔬</span> New Analysis
            </div>
            <div className="nav-item" onClick={onClose}>
              <span className="ni-icon">📊</span> Analytics{' '}
              <span className="ni-badge">New</span>
            </div>
            <div className="nav-item" onClick={onClose}>
              <span className="ni-icon">⭐</span> Saved Results
            </div>
            <div className="nav-item" onClick={onClose}>
              <span className="ni-icon">⚙️</span> Settings
            </div>
          </div>

          <div className="sidebar-section">
            <div className="sidebar-section-label">Recent Checks</div>
            {historyItems.map((item, i) => (
              <div
                key={i}
                className="history-entry"
                onClick={() => {
                  if (item.text) onLoadHistory(item.text)
                  onShowAnalysis()
                  onClose()
                }}
              >
                <div className={`he-dot ${item.type}`} />
                <div className="he-text">
                  <strong>{item.title}</strong>
                  {item.preview}
                  <div className="he-time">{item.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="sidebar-bottom">
          {user ? (
            <div className="profile-card">
              <div className="avatar">
                {user.avatar_url && !imgError ? (
                  <img
                    src={user.avatar_url}
                    alt={user.name}
                    onError={() => setImgError(true)}
                    style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  initials
                )}
              </div>
              <div className="profile-info">
                <div className="profile-name">{user.name}</div>
                <div className="profile-role">{user.email}</div>
              </div>
              <button
                className="profile-logout-btn"
                onClick={logout}
                title="Sign out"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
              </button>
            </div>
          ) : (
            <Link href="/signin" onClick={onClose} style={{ textDecoration: 'none' }}>
              <div className="sidebar-login-btn">
                <span>🔐</span> Sign In
              </div>
            </Link>
          )}
        </div>
      </aside>
    </>
  )
}
