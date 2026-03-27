'use client'

import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'

interface TopbarProps {
  activeView: 'home' | 'analysis'
  checksCount: number
  onMenuClick: () => void
  onShowHome: () => void
  onShowAnalysis: () => void
}

export default function Topbar({
  activeView,
  checksCount,
  onMenuClick,
  onShowHome,
  onShowAnalysis,
}: TopbarProps) {
  const { user, logout } = useAuth()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [imgError, setImgError] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const initials = user
    ? user.name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : ''

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    if (dropdownOpen) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [dropdownOpen])

  return (
    <div className="topbar">
      <div className="topbar-left">
        <button className="menu-btn" onClick={onMenuClick}>☰</button>
        <div className="topbar-brand">
          <div className="topbar-logo-icon">🔍</div>
          <div className="topbar-title">
            <h1>AuthentiCheck</h1>
            <p>AI &amp; Plagiarism Detector</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div className="topbar-nav">
          <div
            className={`nav-tab${activeView === 'home' ? ' active' : ''}`}
            onClick={onShowHome}
          >
            Home
          </div>
          <div
            className={`nav-tab${activeView === 'analysis' ? ' active' : ''}`}
            onClick={onShowAnalysis}
          >
            Analyse
          </div>
        </div>
        <div className="topbar-right">
          <div className="topbar-stat">
            <div className="ts-num">{checksCount}</div>
            <div className="ts-lbl">Today</div>
          </div>
          <div className="topbar-stat">
            <div className="ts-num" style={{ color: 'var(--danger)' }}>8</div>
            <div className="ts-lbl">AI Found</div>
          </div>
          {user ? (
            <div className="topbar-user-menu" ref={dropdownRef}>
              <button
                className="topbar-avatar"
                onClick={() => setDropdownOpen((o) => !o)}
                title={user.name}
              >
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
              </button>
              {dropdownOpen && (
                <div className="topbar-dropdown">
                  <div className="topbar-dropdown-header">
                    <div className="topbar-dropdown-name">{user.name}</div>
                    <div className="topbar-dropdown-email">{user.email}</div>
                  </div>
                  <div className="topbar-dropdown-divider" />
                  <button
                    className="topbar-dropdown-item"
                    onClick={() => { logout(); setDropdownOpen(false) }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                      <polyline points="16 17 21 12 16 7"/>
                      <line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/signin">
              <button className="topbar-login-btn">Sign In</button>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
