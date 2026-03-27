'use client'

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
          <div className="profile-card">
            <div className="avatar">RK</div>
            <div className="profile-info">
              <div className="profile-name">Rahul Kumar</div>
              <div className="profile-role">Student · Free Plan</div>
            </div>
            <div className="profile-dots">···</div>
          </div>
        </div>
      </aside>
    </>
  )
}
