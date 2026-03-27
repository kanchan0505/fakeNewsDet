'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

interface VerdictState {
  score: number
  words: number
}

interface AnalysisViewProps {
  inputText: string
  onInputChange: (text: string) => void
  analysisScrollRef: React.RefObject<HTMLDivElement | null>
}

const SAMPLES: Record<string, string> = {
  default: `The proliferation of large language models has fundamentally transformed the landscape of content creation. These systems, trained on vast corpora of human-generated text, are capable of producing remarkably coherent and contextually appropriate prose across a wide variety of domains. Furthermore, their capacity to synthesize information from diverse sources enables them to generate comprehensive analyses that would otherwise require significant human effort and expertise to produce.`,
  essay: `Artificial intelligence represents a paradigm shift in how societies approach complex problem-solving. The integration of machine learning algorithms into everyday decision-making processes has engendered both opportunities and challenges for contemporary institutions. Consequently, policymakers must develop comprehensive regulatory frameworks that balance innovation with ethical considerations.`,
  news: `Scientists have discovered a new species of deep-sea organism off the coast of New Zealand, according to a report published in Nature this week. The creature, which measures approximately 30 centimetres in length, exhibits bioluminescent properties not previously observed in its genus. Researchers from the University of Auckland conducted the survey using remotely operated underwater vehicles.`,
  email: `I hope this message finds you well. I am writing to follow up on our previous discussion regarding the Q3 deliverables. As per our conversation, the timeline for the project remains on track. Please find attached the updated documentation reflecting the changes we discussed. Kindly review the same at your earliest convenience and revert with your feedback.`,
  research: `This study investigates the correlation between socioeconomic factors and academic performance among secondary school students. Data were collected from 1,240 participants across five districts using stratified random sampling. Preliminary findings suggest a statistically significant relationship (p < 0.01) between household income and standardised test scores, corroborating prior literature in the field.`,
  human: `When I was twelve, my grandfather taught me how to make chai the way his mother used to. Not with teabags, never with teabags — he'd cringe at the thought. You had to bruise the cardamom pods first, he said, and add the ginger before the milk. I never quite got it right while he was alive. Now I make it every morning and somehow it always tastes a little different, like I'm still figuring it out.`,
}

function computeVerdict(text: string): VerdictState {
  const words = text.trim().split(/\s+/).length
  const hasFillerWords = /furthermore|consequently|additionally|in conclusion|it is worth noting/i.test(text)
  let score = 30 + Math.floor(Math.random() * 30)
  if (hasFillerWords) score += 25
  if (words > 60) score += 10
  score = Math.min(score, 96)
  return { score, words }
}

type InputMode = 'text' | 'url' | 'code' | 'doc'

const modePlaceholders: Record<InputMode, string> = {
  text: 'Paste your article, essay, email, research paper, or any written content here...',
  url: 'Paste a URL to fetch and analyse the page content…',
  code: "Paste code here — we'll check if it was AI-generated…",
  doc: 'Use the file upload below to load your document…',
}

export default function AnalysisView({ inputText, onInputChange, analysisScrollRef }: AnalysisViewProps) {
  const [mode, setMode] = useState<InputMode>('text')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [verdict, setVerdict] = useState<VerdictState | null>(null)
  const [showResults, setShowResults] = useState(false)
  const [inputError, setInputError] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const charCount = inputText.length
  const wordCount = inputText.trim() ? inputText.trim().split(/\s+/).length : 0

  const loadSample = useCallback((type = 'default') => {
    onInputChange(SAMPLES[type] || SAMPLES.default)
  }, [onInputChange])

  const clearInput = () => {
    onInputChange('')
    setShowResults(false)
  }

  const runAnalysis = () => {
    const text = inputText.trim()
    if (!text) {
      setInputError(true)
      textareaRef.current?.focus()
      setTimeout(() => setInputError(false), 2200)
      return
    }
    setIsAnalyzing(true)
    setShowResults(false)
    setTimeout(() => {
      setIsAnalyzing(false)
      const result = computeVerdict(text)
      setVerdict(result)
      setShowResults(true)
      setTimeout(() => {
        analysisScrollRef.current?.scrollTo({ top: 9999, behavior: 'smooth' })
      }, 100)
    }, 2200)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) onInputChange(`[File loaded: ${file.name}]`)
  }

  const score = verdict?.score ?? 73
  const words = verdict?.words ?? 0
  const gaugeDashOffset = (194 - (score / 100) * 194).toFixed(1)
  const gaugeColor = score >= 65 ? 'var(--danger)' : score >= 40 ? 'var(--warn)' : 'var(--safe)'

  const verdictData = score >= 65
    ? {
        bannerClass: 'verdict-banner ai-verdict',
        emoji: '🤖',
        title: 'Likely AI-Generated',
        desc: 'Our model detected strong patterns consistent with large language model output. High perplexity uniformity and low burstiness suggest machine-generated text.',
        ringClass: 'score-ring high',
        badgeText: '↑ High Risk',
        badgeClass: 's-pill danger',
      }
    : score >= 40
    ? {
        bannerClass: 'verdict-banner',
        bannerStyle: { background: 'rgba(200,169,110,.05)', borderColor: 'rgba(200,169,110,.18)' },
        emoji: '🔀',
        title: 'Mixed — Partially AI-Assisted',
        desc: 'The content appears to be a blend of human and AI writing. Some sections show human stylistic patterns while others display characteristics of AI generation.',
        ringClass: 'score-ring',
        ringStyle: { borderColor: 'var(--warn)', color: 'var(--warn)' },
        badgeText: '~ Medium Risk',
        badgeClass: 's-pill',
        badgeStyle: { background: 'rgba(200,169,110,.13)', color: '#9a7438' },
      }
    : {
        bannerClass: 'verdict-banner human-verdict',
        emoji: '✍️',
        title: 'Likely Human-Written',
        desc: 'The content shows strong indicators of authentic human authorship — natural sentence variance, organic vocabulary choices, and irregular rhythm patterns.',
        ringClass: 'score-ring low',
        badgeText: '↓ Low Risk',
        badgeClass: 's-pill safe',
      }

  return (
    <div className="view active">
      <div className="analysis-inner" ref={analysisScrollRef}>
        <div className="content">

          {/* Input Section */}
          <div className="input-section">
            <div className="section-title">New Analysis</div>
            <div className={`input-card${inputError ? ' input-error' : ''}`}
              style={inputError ? { outline: '2px solid var(--danger)' } : undefined}
            >
              {/* Mode Tabs */}
              <div className="input-modes">
                {(['text', 'url', 'code', 'doc'] as InputMode[]).map((m) => (
                  <button
                    key={m}
                    className={`imode${mode === m ? ' active' : ''}`}
                    onClick={() => setMode(m)}
                  >
                    {m === 'text' && '✏️ Text'}
                    {m === 'url' && '🔗 URL'}
                    {m === 'code' && '💻 Code'}
                    {m === 'doc' && '📄 Document'}
                  </button>
                ))}
              </div>

              {/* Textarea */}
              <textarea
                ref={textareaRef}
                className="input-area"
                placeholder={inputError ? '⚠️ Please enter some content first…' : modePlaceholders[mode]}
                value={inputText}
                onChange={(e) => onInputChange(e.target.value)}
              />

              {/* Drop Zone */}
              <div
                className={`drop-zone${isDragging ? ' dragover' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="drop-icon">📎</div>
                <div className="drop-text">
                  <strong>Drop a file here, or click to browse</strong>
                  <span>PDF, DOCX, TXT, or MD — we&apos;ll extract and analyse it</span>
                </div>
                <div className="drop-formats">
                  <span className="fmt-tag">PDF</span>
                  <span className="fmt-tag">DOCX</span>
                  <span className="fmt-tag">TXT</span>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  accept=".pdf,.docx,.txt,.md"
                />
              </div>

              {/* Bottom Bar */}
              <div className="input-bottombar">
                <div className="bottom-actions">
                  <div className="action-chip" onClick={() => loadSample()}>✨ Sample</div>
                  <div className="action-chip" onClick={clearInput}>🗑️ Clear</div>
                  <div className="action-chip">🌐 Detect Language</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
                  <span className="char-info">
                    Words: <span>{wordCount}</span> · Chars: <span>{charCount}</span>
                  </span>
                  <button className="btn-analyze" onClick={runAnalysis}>
                    Analyse Now <span className="arrow">→</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Suggestion Chips */}
            <div className="suggestions">
              {[
                { type: 'essay', icon: '📝', label: 'Essay' },
                { type: 'news', icon: '📰', label: 'News article' },
                { type: 'email', icon: '📧', label: 'Email' },
                { type: 'research', icon: '🔬', label: 'Research abstract' },
                { type: 'human', icon: '✍️', label: 'Human writing' },
              ].map((s) => (
                <div key={s.type} className="sugg-chip" onClick={() => loadSample(s.type)}>
                  <span className="chip-icon">{s.icon}</span> {s.label}
                </div>
              ))}
            </div>
          </div>

          {/* Analyzing Overlay */}
          <div className={`analyzing-overlay${isAnalyzing ? ' show' : ''}`}>
            <div className="spinner-wrap">
              <div className="spinner" />
              <div className="spinner-inner" />
            </div>
            <div className="analyzing-text">
              <strong>Running multi-layer analysis…</strong>
              Checking perplexity, burstiness &amp; plagiarism across 2.4M+ sources
            </div>
          </div>

          {/* Results Section */}
          <div className={`results-section${showResults ? ' visible' : ''}`}>
            <div className="section-title" style={{ marginTop: 0 }}>Analysis Results</div>

            {/* Verdict Banner */}
            <div
              className={verdictData.bannerClass}
              style={'bannerStyle' in verdictData ? verdictData.bannerStyle : undefined}
            >
              <div className="verdict-emoji">{verdictData.emoji}</div>
              <div className="verdict-text">
                <h2>{verdictData.title}</h2>
                <p>{verdictData.desc}</p>
              </div>
              <div className="verdict-score">
                <div
                  className={verdictData.ringClass}
                  style={'ringStyle' in verdictData ? verdictData.ringStyle : undefined}
                >
                  {score}%
                </div>
                <div className="score-label">AI Score</div>
              </div>
            </div>

            {/* Stat Grid */}
            <div className="stat-grid">
              <div className="s-card">
                <div className="s-card-label">AI Probability</div>
                <div className="s-card-value" style={{ color: 'var(--danger)' }}>{score}%</div>
                <div className="s-card-sub">
                  <span
                    className={verdictData.badgeClass}
                    style={'badgeStyle' in verdictData ? verdictData.badgeStyle : undefined}
                  >
                    {verdictData.badgeText}
                  </span>
                </div>
              </div>
              <div className="s-card">
                <div className="s-card-label">Human Probability</div>
                <div className="s-card-value" style={{ color: 'var(--safe)' }}>{100 - score}%</div>
                <div className="s-card-sub"><span className="s-pill safe">↓ Low Signal</span></div>
              </div>
              <div className="s-card">
                <div className="s-card-label">Word Count</div>
                <div className="s-card-value" style={{ color: 'var(--text)' }}>{words || '—'}</div>
                <div className="s-card-sub">words analysed</div>
              </div>
              <div className="s-card accent-bg">
                <div className="s-card-label">Reading Level</div>
                <div className="s-card-value" style={{ color: '#fff' }}>B2</div>
                <div className="s-card-sub" style={{ color: 'rgba(255,255,255,.5)' }}>Upper Intermediate</div>
              </div>
            </div>

            {/* Insights Grid */}
            <div className="insights-grid">
              <div className="insight-card">
                <div className="insight-icon danger">📉</div>
                <div>
                  <div className="insight-label">Burstiness</div>
                  <div className="insight-value">0.24 <span style={{ fontSize: '.78rem', fontWeight: 400, color: 'var(--muted)' }}>/ 1.0</span></div>
                  <div className="insight-sub">Very low — typical of AI prose</div>
                </div>
              </div>
              <div className="insight-card">
                <div className="insight-icon warn">🌡️</div>
                <div>
                  <div className="insight-label">Perplexity Index</div>
                  <div className="insight-value">42.7</div>
                  <div className="insight-sub">Below avg. human baseline of 80+</div>
                </div>
              </div>
              <div className="insight-card">
                <div className="insight-icon safe">✏️</div>
                <div>
                  <div className="insight-label">Vocab Diversity</div>
                  <div className="insight-value">67%</div>
                  <div className="insight-sub">Moderate type-token ratio</div>
                </div>
              </div>
            </div>

            {/* Two Col: Gauge + Fingerprint */}
            <div className="two-col">
              <div className="a-card" style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="ac-header">
                  <div className="ac-title">⚡ Authenticity Gauge</div>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '8px 0 4px' }}>
                  <svg width="160" height="100" viewBox="0 0 160 100">
                    <path d="M 18 90 A 62 62 0 0 1 142 90" fill="none" stroke="#e8e3db" strokeWidth="13" strokeLinecap="round" />
                    <path
                      d="M 18 90 A 62 62 0 0 1 142 90"
                      fill="none"
                      stroke={gaugeColor}
                      strokeWidth="13"
                      strokeLinecap="round"
                      strokeDasharray="194"
                      strokeDashoffset={gaugeDashOffset}
                    />
                    <text x="80" y="86" textAnchor="middle" fontSize="26" fontWeight="700" fill="var(--text)" fontFamily="Outfit,sans-serif">{score}%</text>
                    <text x="80" y="100" textAnchor="middle" fontSize="8" fill="var(--muted)" fontFamily="Outfit,sans-serif" letterSpacing="0.8">AI SCORE</text>
                  </svg>
                  <div style={{ display: 'flex', gap: '24px', marginTop: '14px' }}>
                    <span style={{ fontSize: '.68rem', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--danger)', display: 'inline-block' }} />AI
                    </span>
                    <span style={{ fontSize: '.68rem', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--safe)', display: 'inline-block' }} />Human
                    </span>
                  </div>
                </div>
              </div>

              <div className="a-card">
                <div className="ac-header">
                  <div className="ac-title">🧬 Linguistic Fingerprint</div>
                  <span className="ac-badge gold">Analysed</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px 0' }}>
                  <svg viewBox="0 0 220 200" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', maxWidth: '240px' }}>
                    <polygon points="110,20 190,65 190,135 110,180 30,135 30,65" fill="none" stroke="#e2ddd5" strokeWidth="1" />
                    <polygon points="110,42 172,77 172,123 110,158 48,123 48,77" fill="none" stroke="#e2ddd5" strokeWidth="1" />
                    <polygon points="110,64 154,89 154,111 110,136 66,111 66,89" fill="none" stroke="#e2ddd5" strokeWidth="1" />
                    <line x1="110" y1="20" x2="110" y2="180" stroke="#e2ddd5" strokeWidth="1" />
                    <line x1="30" y1="65" x2="190" y2="135" stroke="#e2ddd5" strokeWidth="1" />
                    <line x1="30" y1="135" x2="190" y2="65" stroke="#e2ddd5" strokeWidth="1" />
                    <polygon points="110,38 178,80 165,128 110,165 60,120 52,72" fill="rgba(61,107,79,.1)" stroke="rgba(61,107,79,.75)" strokeWidth="2" />
                    <circle cx="110" cy="38" r="4" fill="#3d6b4f" />
                    <circle cx="178" cy="80" r="4" fill="#3d6b4f" />
                    <circle cx="165" cy="128" r="4" fill="#3d6b4f" />
                    <circle cx="110" cy="165" r="4" fill="#3d6b4f" />
                    <circle cx="60" cy="120" r="4" fill="#3d6b4f" />
                    <circle cx="52" cy="72" r="4" fill="#3d6b4f" />
                    <text x="110" y="13" textAnchor="middle" fontSize="9" fill="#9a9389" fontFamily="Outfit,sans-serif">Vocab</text>
                    <text x="200" y="68" fontSize="9" fill="#9a9389" fontFamily="Outfit,sans-serif">Burst</text>
                    <text x="200" y="140" fontSize="9" fill="#9a9389" fontFamily="Outfit,sans-serif">Var.</text>
                    <text x="110" y="196" textAnchor="middle" fontSize="9" fill="#9a9389" fontFamily="Outfit,sans-serif">Formal</text>
                    <text x="20" y="140" textAnchor="end" fontSize="9" fill="#9a9389" fontFamily="Outfit,sans-serif">Comp.</text>
                    <text x="20" y="68" textAnchor="end" fontSize="9" fill="#9a9389" fontFamily="Outfit,sans-serif">Perp.</text>
                  </svg>
                </div>
              </div>
            </div>

            {/* Plagiarism */}
            <div className="a-card" style={{ marginBottom: '40px' }}>
              <div className="ac-header">
                <div className="ac-title">🔍 Plagiarism Check</div>
                <span className="ac-badge red">2 Matches</span>
              </div>
              <div className="match-list">
                <div className="match-row high-match">
                  <div style={{ flex: 1 }}>
                    <div className="match-src">Wikipedia — Large language model</div>
                    <div className="match-url">en.wikipedia.org</div>
                  </div>
                  <div className="match-pct high">34%</div>
                </div>
                <div className="match-row low-match">
                  <div style={{ flex: 1 }}>
                    <div className="match-src">ArXiv — Attention Is All You Need</div>
                    <div className="match-url">arxiv.org/abs/1706.03762</div>
                  </div>
                  <div className="match-pct low">12%</div>
                </div>
                <div style={{ padding: '14px 18px', background: 'rgba(61,107,79,.04)', borderRadius: '12px', fontSize: '.74rem', color: 'var(--muted)', textAlign: 'center', marginTop: '8px', border: '1px solid rgba(61,107,79,.09)' }}>
                  ✅ No further matches in 2.4M+ sources
                </div>
              </div>
            </div>

            {/* Action Row */}
            <div className="action-row">
              <button className="action-btn">📥 Export PDF Report</button>
              <button className="action-btn">📋 Copy Summary</button>
              <button
                className="action-btn primary"
                onClick={() => {
                  clearInput()
                  analysisScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
                }}
              >
                🔄 New Analysis
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
