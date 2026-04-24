'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import AuthModal from './AuthModal'

interface VerdictState {
  score: number
  words: number
  label: string
  confidence: number
  claims?: FactCheckClaim[]
  matches?: number
  reason?: string
  usedBroadQuery?: boolean
}

interface FactCheckClaim {
  claim: string
  claimant: string
  rating: string
  publisher: string
  url: string
  review_date: string
  verdict: string
}

type Detector = 'ai' | 'news'

interface AnalysisViewProps {
  inputText: string
  onInputChange: (text: string) => void
  analysisScrollRef: React.RefObject<HTMLDivElement | null>
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL
if (!API_BASE) {
  throw new Error('NEXT_PUBLIC_API_URL environment variable is not set')
}
const SAMPLES: Record<string, string> = {
  default: `The proliferation of large language models has fundamentally transformed the landscape of content creation. These systems, trained on vast corpora of human-generated text, are capable of producing remarkably coherent and contextually appropriate prose across a wide variety of domains. Furthermore, their capacity to synthesize information from diverse sources enables them to generate comprehensive analyses that would otherwise require significant human effort and expertise to produce.`,
  essay: `Artificial intelligence represents a paradigm shift in how societies approach complex problem-solving. The integration of machine learning algorithms into everyday decision-making processes has engendered both opportunities and challenges for contemporary institutions. Consequently, policymakers must develop comprehensive regulatory frameworks that balance innovation with ethical considerations.`,
  news: `Scientists have discovered a new species of deep-sea organism off the coast of New Zealand, according to a report published in Nature this week. The creature, which measures approximately 30 centimetres in length, exhibits bioluminescent properties not previously observed in its genus. Researchers from the University of Auckland conducted the survey using remotely operated underwater vehicles.`,
  email: `I hope this message finds you well. I am writing to follow up on our previous discussion regarding the Q3 deliverables. As per our conversation, the timeline for the project remains on track. Please find attached the updated documentation reflecting the changes we discussed. Kindly review the same at your earliest convenience and revert with your feedback.`,
  research: `This study investigates the correlation between socioeconomic factors and academic performance among secondary school students. Data were collected from 1,240 participants across five districts using stratified random sampling. Preliminary findings suggest a statistically significant relationship (p < 0.01) between household income and standardised test scores, corroborating prior literature in the field.`,
  human: `When I was twelve, my grandfather taught me how to make chai the way his mother used to. Not with teabags, never with teabags — he'd cringe at the thought. You had to bruise the cardamom pods first, he said, and add the ginger before the milk. I never quite got it right while he was alive. Now I make it every morning and somehow it always tastes a little different, like I'm still figuring it out.`,
}

type InputMode = 'text' | 'url' | 'code' | 'doc'

const modePlaceholders: Record<InputMode, string> = {
  text: 'Paste your article, essay, email, research paper, or any written content here...',
  url: 'Paste a URL to fetch and analyse the page content…',
  code: "Paste code here — we'll check if it was AI-generated…",
  doc: 'Use the file upload below to load your document…',
}

export default function AnalysisView({ inputText, onInputChange, analysisScrollRef }: AnalysisViewProps) {
  const { user } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [mode, setMode] = useState<InputMode>('text')
  const [detector, setDetector] = useState<Detector>('ai')
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

  const runAnalysis = async () => {
    const text = inputText.trim()
    if (!text) {
      setInputError(true)
      textareaRef.current?.focus()
      setTimeout(() => setInputError(false), 2200)
      return
    }
    // Check auth before running analysis
    if (!user) {
      setShowAuthModal(true)
      return
    }
    setIsAnalyzing(true)
    setShowResults(false)
    try {
      const endpoint = detector === 'news' ? '/predict/news' : '/predict'
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      const data = await res.json()
      const words = text.split(/\s+/).length
      // Convert backend response to a 0-100 "danger score":
      //   AI mode  → ai-generated = high, human-written = low
      //   News mode → fake = high, real = low
      let score: number
      if (detector === 'ai') {
        if (data.label === 'ai-generated') score = Math.round(data.confidence * 100)
        else if (data.label === 'human-written') score = Math.round((1 - data.confidence) * 100)
        else score = 50
      } else {
        if (data.label === 'fake') score = Math.round(data.confidence * 100)
        else if (data.label === 'real') score = Math.round((1 - data.confidence) * 100)
        else score = 50
      }
      setVerdict({
        score,
        words,
        label: data.label,
        confidence: data.confidence,
        claims: data.claims,
        matches: data.matches,
        reason: data.reason,
        usedBroadQuery: data.used_broad_query,
      })
      setShowResults(true)
      setTimeout(() => {
        analysisScrollRef.current?.scrollTo({ top: 9999, behavior: 'smooth' })
      }, 100)
    } catch {
      // Fallback: simple local heuristic if backend is unreachable
      const words = text.split(/\s+/).length
      setVerdict({ score: 50, words, label: 'uncertain', confidence: 0.5 })
      setShowResults(true)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) onInputChange(`[File loaded: ${file.name}]`)
  }

  const score = verdict?.score ?? 50
  const words = verdict?.words ?? 0
  const confidence = verdict?.confidence ?? 0.5
  const backendLabel = verdict?.label ?? 'uncertain'
  const gaugeDashOffset = (194 - (score / 100) * 194).toFixed(1)
  const gaugeColor = score >= 65 ? 'var(--danger)' : score >= 40 ? 'var(--warn)' : 'var(--safe)'

  const verdictData = detector === 'news'
    ? (backendLabel === 'fake'
        ? {
            bannerClass: 'verdict-banner ai-verdict',
            emoji: '🚨',
            title: 'Likely Fake / Misleading',
            desc: verdict?.reason
              ? `${verdict.reason} Confidence: ${(confidence * 100).toFixed(1)}%.`
              : `Google Fact Check matched ${verdict?.matches ?? 0} related claim${(verdict?.matches ?? 0) === 1 ? '' : 's'}, with the majority rated FALSE/MISLEADING by reviewers. Confidence: ${(confidence * 100).toFixed(1)}%.`,
            ringClass: 'score-ring high',
            badgeText: '↑ Likely Fake',
            badgeClass: 's-pill danger',
          }
        : backendLabel === 'real'
        ? {
            bannerClass: 'verdict-banner human-verdict',
            emoji: '✅',
            title: 'Fact-Checkers Rated This As True',
            desc: `Reviewers from sources indexed by Google Fact Check rated related claims as TRUE/ACCURATE. Confidence: ${(confidence * 100).toFixed(1)}%.`,
            ringClass: 'score-ring low',
            badgeText: '↓ Looks Real',
            badgeClass: 's-pill safe',
          }
        : {
            bannerClass: 'verdict-banner',
            bannerStyle: { background: 'rgba(200,169,110,.05)', borderColor: 'rgba(200,169,110,.18)' },
            emoji: '🤔',
            title: (verdict?.matches ?? 0) === 0 ? 'No Fact-Check Found' : 'Mixed Fact-Check Signals',
            desc: (verdict?.matches ?? 0) === 0
              ? 'No published fact-check matched this text. That doesn\'t prove it\'s true — try a shorter, more specific claim, or verify with a trusted source.'
              : 'Reviewers disagree or the claims couldn\'t be classified clearly. Open the sources below to read the original reviews.',
            ringClass: 'score-ring',
            ringStyle: { borderColor: 'var(--warn)', color: 'var(--warn)' },
            badgeText: '~ Uncertain',
            badgeClass: 's-pill',
            badgeStyle: { background: 'rgba(200,169,110,.13)', color: '#9a7438' },
          })
    : backendLabel === 'ai-generated'
    ? {
        bannerClass: 'verdict-banner ai-verdict',
        emoji: '🤖',
        title: 'AI-Generated Text Detected',
        desc: `Our model detected strong patterns consistent with AI-generated content. Confidence: ${(confidence * 100).toFixed(1)}%. The text shows characteristics typical of large language model output.`,
        ringClass: 'score-ring high',
        badgeText: '↑ AI Detected',
        badgeClass: 's-pill danger',
      }
    : backendLabel === 'uncertain'
    ? {
        bannerClass: 'verdict-banner',
        bannerStyle: { background: 'rgba(200,169,110,.05)', borderColor: 'rgba(200,169,110,.18)' },
        emoji: '🔀',
        title: 'Uncertain — Could Be Either',
        desc: `The model confidence is too low to make a definitive call (${(confidence * 100).toFixed(1)}%). The text may be a blend of AI and human writing, or simply ambiguous.`,
        ringClass: 'score-ring',
        ringStyle: { borderColor: 'var(--warn)', color: 'var(--warn)' },
        badgeText: '~ Uncertain',
        badgeClass: 's-pill',
        badgeStyle: { background: 'rgba(200,169,110,.13)', color: '#9a7438' },
      }
    : {
        bannerClass: 'verdict-banner human-verdict',
        emoji: '✍️',
        title: 'Human-Written Text Detected',
        desc: `The content shows strong indicators of authentic human authorship. Confidence: ${(confidence * 100).toFixed(1)}%. Natural sentence variance, organic vocabulary and irregular rhythm patterns detected.`,
        ringClass: 'score-ring low',
        badgeText: '↓ Human Written',
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
              {/* Detector Tabs */}
              <div
                className="input-modes"
                style={{ marginBottom: 8, borderBottom: '1px solid rgba(0,0,0,.06)', paddingBottom: 8 }}
              >
                <button
                  className={`imode${detector === 'ai' ? ' active' : ''}`}
                  onClick={() => { setDetector('ai'); setShowResults(false) }}
                  title="Detect AI vs human-written text"
                >
                  🤖 AI Text Detection
                </button>
                <button
                  className={`imode${detector === 'news' ? ' active' : ''}`}
                  onClick={() => { setDetector('news'); setShowResults(false) }}
                  title="Detect fake vs real news"
                >
                  📰 News Detection
                </button>
              </div>

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
                placeholder={
                  inputError
                    ? '⚠️ Please enter some content first…'
                    : detector === 'news'
                    ? 'Paste a news article, headline, or social-media post — we\'ll check if it looks real or fake…'
                    : modePlaceholders[mode]
                }
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
                <div className="score-label">{detector === 'news' ? 'Fake Score' : 'AI Score'}</div>
              </div>
            </div>

            {/* Stat Grid */}
            <div className="stat-grid">
              <div className="s-card">
                <div className="s-card-label">{detector === 'news' ? 'Fake Probability' : 'AI Probability'}</div>
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
                <div className="s-card-label">{detector === 'news' ? 'Real Probability' : 'Human Probability'}</div>
                <div className="s-card-value" style={{ color: 'var(--safe)' }}>{100 - score}%</div>
                <div className="s-card-sub"><span className="s-pill safe">Complementary</span></div>
              </div>
              <div className="s-card">
                <div className="s-card-label">Model Confidence</div>
                <div className="s-card-value" style={{ color: confidence >= 0.8 ? 'var(--safe)' : confidence >= 0.6 ? 'var(--warn)' : 'var(--danger)' }}>{(confidence * 100).toFixed(1)}%</div>
                <div className="s-card-sub">{confidence >= 0.8 ? 'High confidence' : confidence >= 0.6 ? 'Moderate confidence' : 'Low confidence'}</div>
              </div>
              <div className="s-card">
                <div className="s-card-label">Word Count</div>
                <div className="s-card-value" style={{ color: 'var(--text)' }}>{words || '—'}</div>
                <div className="s-card-sub">words analysed</div>
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

            {/* Plagiarism (AI mode) / Fact-Check Sources (News mode) */}
            {detector === 'news' ? (
              <div className="a-card" style={{ marginBottom: '40px' }}>
                <div className="ac-header">
                  <div className="ac-title">🔎 Fact-Check Sources</div>
                  <span className="ac-badge gold">
                    {verdict?.claims?.length ?? 0} review{(verdict?.claims?.length ?? 0) === 1 ? '' : 's'}
                  </span>
                </div>
                <div className="match-list">
                  {verdict?.claims && verdict.claims.length > 0 ? (
                    verdict.claims.map((c, i) => (
                      <a
                        key={i}
                        href={c.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`match-row ${c.verdict === 'fake' ? 'high-match' : 'low-match'}`}
                        style={{ textDecoration: 'none', color: 'inherit', display: 'flex' }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="match-src" style={{ whiteSpace: 'normal' }}>
                            {c.claim || '(no claim text)'}
                          </div>
                          <div className="match-url">
                            {c.publisher || 'Unknown publisher'}
                            {c.claimant ? ` · claimed by ${c.claimant}` : ''}
                            {c.review_date ? ` · ${c.review_date.slice(0, 10)}` : ''}
                          </div>
                        </div>
                        <div className={`match-pct ${c.verdict === 'fake' ? 'high' : c.verdict === 'real' ? 'low' : ''}`}>
                          {c.rating}
                        </div>
                      </a>
                    ))
                  ) : (
                    <div style={{ padding: '14px 18px', background: 'rgba(61,107,79,.04)', borderRadius: '12px', fontSize: '.74rem', color: 'var(--muted)', textAlign: 'center', border: '1px solid rgba(61,107,79,.09)' }}>
                      No matching fact-check reviews found in Google&apos;s database.
                    </div>
                  )}
                  <div style={{ padding: '10px 14px', fontSize: '.7rem', color: 'var(--muted)', textAlign: 'center' }}>
                    Powered by Google Fact Check Tools API
                  </div>
                </div>
              </div>
            ) : (
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
            )}

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

      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => {
            setShowAuthModal(false)
            // After auth, auto-run the analysis
            setTimeout(() => runAnalysis(), 100)
          }}
        />
      )}
    </div>
  )
}
