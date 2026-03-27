'use client'

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
        </div>
      </div>
    </div>
  )
}
