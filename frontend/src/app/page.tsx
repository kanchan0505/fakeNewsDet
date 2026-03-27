'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'
import Topbar from '@/components/Topbar'
import HomeView from '@/components/HomeView'
import AnalysisView from '@/components/AnalysisView'

const SAMPLES: Record<string, string> = {
  default: `The proliferation of large language models has fundamentally transformed the landscape of content creation. These systems, trained on vast corpora of human-generated text, are capable of producing remarkably coherent and contextually appropriate prose across a wide variety of domains. Furthermore, their capacity to synthesize information from diverse sources enables them to generate comprehensive analyses that would otherwise require significant human effort and expertise to produce.`,
  essay: `Artificial intelligence represents a paradigm shift in how societies approach complex problem-solving. The integration of machine learning algorithms into everyday decision-making processes has engendered both opportunities and challenges for contemporary institutions. Consequently, policymakers must develop comprehensive regulatory frameworks that balance innovation with ethical considerations.`,
  news: `Scientists have discovered a new species of deep-sea organism off the coast of New Zealand, according to a report published in Nature this week. The creature, which measures approximately 30 centimetres in length, exhibits bioluminescent properties not previously observed in its genus. Researchers from the University of Auckland conducted the survey using remotely operated underwater vehicles.`,
  email: `I hope this message finds you well. I am writing to follow up on our previous discussion regarding the Q3 deliverables. As per our conversation, the timeline for the project remains on track. Please find attached the updated documentation reflecting the changes we discussed. Kindly review the same at your earliest convenience and revert with your feedback.`,
  research: `This study investigates the correlation between socioeconomic factors and academic performance among secondary school students. Data were collected from 1,240 participants across five districts using stratified random sampling. Preliminary findings suggest a statistically significant relationship (p < 0.01) between household income and standardised test scores, corroborating prior literature in the field.`,
  human: `When I was twelve, my grandfather taught me how to make chai the way his mother used to. Not with teabags, never with teabags — he'd cringe at the thought. You had to bruise the cardamom pods first, he said, and add the ginger before the milk. I never quite got it right while he was alive. Now I make it every morning and somehow it always tastes a little different, like I'm still figuring it out.`,
}

export default function HomePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeView, setActiveView] = useState<'home' | 'analysis'>('home')
  const [inputText, setInputText] = useState('')
  const [checksCount, setChecksCount] = useState(24)
  const analysisScrollRef = useRef<HTMLDivElement>(null)

  // Close sidebar on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSidebarOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  const showHome = useCallback(() => setActiveView('home'), [])
  const showAnalysis = useCallback(() => setActiveView('analysis'), [])

  const loadSample = useCallback((type = 'default') => {
    setInputText(SAMPLES[type] || SAMPLES.default)
  }, [])

  const handleLoadHistory = useCallback((text: string) => {
    setInputText(text)
  }, [])

  // Listen for analysis completion to increment counter
  const handleInputChange = useCallback((text: string) => {
    setInputText(text)
  }, [])

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar
        isOpen={sidebarOpen}
        activeView={activeView}
        onClose={() => setSidebarOpen(false)}
        onShowHome={showHome}
        onShowAnalysis={showAnalysis}
        onLoadHistory={handleLoadHistory}
      />

      <div className="main">
        <Topbar
          activeView={activeView}
          checksCount={checksCount}
          onMenuClick={() => setSidebarOpen(true)}
          onShowHome={showHome}
          onShowAnalysis={showAnalysis}
        />

        <div className="content-scroll">
          {activeView === 'home' ? (
            <HomeView
              checksCount={checksCount}
              onShowAnalysis={showAnalysis}
              onLoadSample={loadSample}
            />
          ) : (
            <AnalysisView
              inputText={inputText}
              onInputChange={handleInputChange}
              analysisScrollRef={analysisScrollRef}
            />
          )}
        </div>
      </div>
    </div>
  )
}
