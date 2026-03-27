'use client'

interface HomeViewProps {
  checksCount: number
  onShowAnalysis: () => void
  onLoadSample: (type?: string) => void
}

const featureCards = [
  {
    icon: '🤖',
    tag: 'AI Detection',
    title: 'Detect AI-Generated Content',
    desc: 'Identify text created by GPT, Claude, Gemini and other LLMs using perplexity and burstiness analysis.',
    cta: 'Analyse text →',
  },
  {
    icon: '🔍',
    tag: 'Plagiarism',
    title: 'Plagiarism Check Across Millions',
    desc: 'Cross-reference against academic papers, news, Wikipedia and 2.4M+ web sources instantly.',
    cta: 'Check now →',
  },
  {
    icon: '🧬',
    tag: 'Fingerprint',
    title: 'Linguistic Fingerprinting',
    desc: 'Deep analysis of vocabulary diversity, sentence variance, formality and stylistic patterns unique to each writer.',
    cta: 'Explore →',
  },
]

export default function HomeView({ checksCount, onShowAnalysis, onLoadSample }: HomeViewProps) {
  return (
    <div className="view active">
      <div className="home-inner">
        <div className="home-bg">
          {/* Hero */}
          <div className="home-hero">
            <div className="hero-text">
              <div className="hero-greeting">Authenticity Intelligence</div>
              <h1 className="hero-headline">
                Know What&apos;s <em>Real,</em>
                <br />Know What&apos;s Not.
              </h1>
              <p className="hero-sub">
                Multi-layer linguistic analysis detects AI-generated content and
                plagiarism with precision — results in under 3 seconds.
              </p>
              <div className="hero-cta">
                <button className="btn-primary" onClick={onShowAnalysis}>
                  Start Analysing →
                </button>
                <button
                  className="btn-ghost"
                  onClick={() => { onShowAnalysis(); setTimeout(() => onLoadSample(), 50) }}
                >
                  Try Sample Text
                </button>
              </div>
            </div>
            <div className="hero-mascot">
              <div className="mascot-bubble">
                Paste text &amp; I&apos;ll know instantly <span>✨</span>
              </div>
              <div className="mascot-face">🔍</div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="home-stats-bar">
            <div className="hstat">
              <div className="hstat-num accent">2.4M+</div>
              <div className="hstat-lbl">Sources Checked</div>
            </div>
            <div className="hstat">
              <div className="hstat-num">98.7%</div>
              <div className="hstat-lbl">Detection Accuracy</div>
            </div>
            <div className="hstat">
              <div className="hstat-num danger">{checksCount}</div>
              <div className="hstat-lbl">Checks Today</div>
            </div>
            <div className="hstat">
              <div className="hstat-num gold">&lt;3s</div>
              <div className="hstat-lbl">Analysis Time</div>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="home-cards">
            {featureCards.map((card) => (
              <div key={card.tag} className="home-card" onClick={onShowAnalysis}>
                <span className="home-card-icon">{card.icon}</span>
                <span className="home-card-tag">{card.tag}</span>
                <h3>{card.title}</h3>
                <p>{card.desc}</p>
                <div className="home-card-arrow">{card.cta}</div>
              </div>
            ))}
          </div>

          {/* Quick Bar */}
          <div className="home-quickbar">
            <div className="home-quickbar-text">
              <h4>Ready to check something?</h4>
              <p>Paste an essay, article, email, or research abstract — results in under 3 seconds.</p>
            </div>
            <div className="home-quick-chips">
              <div
                className="quick-chip"
                onClick={() => { onShowAnalysis(); setTimeout(() => onLoadSample('essay'), 50) }}
              >
                📝 Essay
              </div>
              <div
                className="quick-chip"
                onClick={() => { onShowAnalysis(); setTimeout(() => onLoadSample('research'), 50) }}
              >
                🔬 Research
              </div>
              <div
                className="quick-chip"
                onClick={() => { onShowAnalysis(); setTimeout(() => onLoadSample('news'), 50) }}
              >
                📰 Article
              </div>
              <div className="quick-chip cta" onClick={onShowAnalysis}>
                Start →
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
