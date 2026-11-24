import { useState, useCallback, useEffect } from 'react'
import { Routes, Route, NavLink } from 'react-router-dom'
import UploadZone from './UploadZone'
import Quiz from './Quiz'
import Results from './Results'
import Confetti from './Confetti'
import PaperAnalyzer from './PaperAnalyzer'
import ManualQuizCreator from './ManualQuizCreator'
import QuizList from './QuizList'
import SharedQuiz from './SharedQuiz'
import ResultsDashboard from './ResultsDashboard'
import './App.css'

import { API_BASE } from './apiConfig'

const LOADING_STEPS = [
  { label: 'Uploading PDF...', duration: 1500 },
  { label: 'Extracting text content...', duration: 3000 },
  { label: 'AI is generating questions...', duration: 0 },
]

function HomePage() {
  const [screen, setScreen] = useState('upload') // upload | loading | quiz | results
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState([])
  const [error, setError] = useState(null)
  const [loadingStep, setLoadingStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [difficulty, setDifficulty] = useState('medium')
  const [confettiTrigger, setConfettiTrigger] = useState(0)

  // Animate loading steps
  useEffect(() => {
    if (screen !== 'loading') return
    if (loadingStep >= LOADING_STEPS.length - 1) return
    const dur = LOADING_STEPS[loadingStep].duration
    if (dur === 0) return
    const t = setTimeout(() => setLoadingStep((s) => s + 1), dur)
    return () => clearTimeout(t)
  }, [screen, loadingStep])

  const handleGenerate = useCallback(async (file, numQuestions, diff) => {
    setError(null)
    setIsLoading(true)
    setScreen('loading')
    setLoadingStep(0)
    setDifficulty(diff)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch(
        `${API_BASE}/api/generate-quiz?num_questions=${numQuestions}&difficulty=${diff}`,
        { method: 'POST', body: formData }
      )

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail || `Server error (${res.status})`)
      }

      const data = await res.json()

      if (!data.questions || data.questions.length === 0) {
        throw new Error('No questions were generated. Try a different PDF.')
      }

      setQuestions(data.questions)
      setScreen('quiz')
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
      setScreen('upload')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleQuizFinish = useCallback((ans) => {
    setAnswers(ans)
    setScreen('results')
    window.scrollTo({ top: 0, behavior: 'smooth' })
    const score = ans.filter(a => a.correct).length
    const pct = (score / questions.length) * 100
    if (pct >= 50) {
      setTimeout(() => setConfettiTrigger(t => t + 1), 500)
    }
  }, [questions])

  const handleRetry = useCallback(() => {
    setAnswers([])
    setScreen('quiz')
  }, [])

  const handleNewQuiz = useCallback(() => {
    setQuestions([])
    setAnswers([])
    setError(null)
    setScreen('upload')
  }, [])

  return (
    <>
      {/* Error Banner */}
      {error && (
        <div className="error-banner" id="error-banner">
          <svg className="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <div className="error-content">
            <p className="error-title">Something went wrong</p>
            <p className="error-message">{error}</p>
          </div>
          <button className="error-dismiss" onClick={() => setError(null)} id="dismiss-error">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      {/* Upload Screen */}
      {screen === 'upload' && (
        <>
          <div className="hero-section">
            <h1 className="hero-title">
              Turn any PDF into a{' '}
              <span className="gradient-text">Smart Quiz</span>
            </h1>
            <p className="hero-subtitle">
              Upload your study material and let AI generate challenging multiple-choice
              questions — perfect for exam prep, revision, and self-testing.
            </p>
          </div>
          <UploadZone onGenerate={handleGenerate} isLoading={isLoading} />
        </>
      )}

      {/* Loading Screen */}
      {screen === 'loading' && (
        <div className="loading-overlay" id="loading-screen">
          <div className="loading-brain">
            <span className="loading-brain-icon">🧠</span>
            <div className="loading-ring" />
            <div className="loading-ring-2" />
          </div>
          <h2 className="loading-title">Generating Your Quiz</h2>
          <p className="loading-subtitle">Our AI is analyzing your document...</p>
          <div className="loading-steps">
            {LOADING_STEPS.map((step, i) => (
              <div
                key={i}
                className={`loading-step ${i === loadingStep ? 'active' : ''} ${i < loadingStep ? 'done' : ''}`}
              >
                <span className="loading-step-icon">
                  {i < loadingStep ? '✓' : i === loadingStep ? '●' : '○'}
                </span>
                {step.label}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quiz Screen */}
      {screen === 'quiz' && (
        <Quiz questions={questions} difficulty={difficulty} onFinish={handleQuizFinish} />
      )}

      {/* Results Screen */}
      {screen === 'results' && (
        <>
          <Confetti trigger={confettiTrigger} type="celebration" />
          <Results
            questions={questions}
            answers={answers}
            onRetry={handleRetry}
            onNewQuiz={handleNewQuiz}
          />
        </>
      )}
    </>
  )
}

export default function App() {
  return (
    <div className="app-wrapper">
      <nav className="navbar">
        <div className="nav-brand">
          <div className="nav-logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>
          <span className="nav-title">Smart Quiz</span>
        </div>
        <div className="nav-tabs">
          <NavLink to="/" end className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            AI Quiz
          </NavLink>
          <NavLink to="/analyze" className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" /><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
            </svg>
            Paper Analyzer
          </NavLink>
          <NavLink to="/create" className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Create Quiz
          </NavLink>
          <NavLink to="/quizzes" className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
            </svg>
            My Quizzes
          </NavLink>
        </div>
        <span className="nav-badge">AI Powered</span>
      </nav>

      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/analyze" element={<PaperAnalyzer />} />
          <Route path="/create" element={<ManualQuizCreator />} />
          <Route path="/quizzes" element={<QuizList />} />
          <Route path="/quiz/:quizId" element={<SharedQuiz />} />
          <Route path="/quiz/:quizId/results" element={<ResultsDashboard />} />
        </Routes>
      </main>
    </div>
  )
}
