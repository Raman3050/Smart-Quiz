import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import './QuizList.css'

import { API_BASE } from './apiConfig'

export default function QuizList() {
  const [quizzes, setQuizzes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [copiedId, setCopiedId] = useState(null)

  const fetchQuizzes = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${API_BASE}/api/quizzes`)
      if (!res.ok) throw new Error('Failed to fetch quizzes')
      const data = await res.json()
      setQuizzes(data.quizzes || [])
    } catch (err) {
      setError(err.message || 'Error loading quizzes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchQuizzes()
  }, [])

  const handleCopyLink = (quizId) => {
    const origin = window.location.origin
    const pathname = window.location.pathname.replace(/\/$/, '')
    const url = `${origin}${pathname}/#/quiz/${quizId}`
    navigator.clipboard.writeText(url)
    setCopiedId(quizId)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const formatDate = (isoString) => {
    if (!isoString) return ''
    try {
      const d = new Date(isoString)
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    } catch {
      return isoString
    }
  }

  if (loading) {
    return (
      <div className="quiz-list-container">
        <div className="loading-overlay">
          <div className="loading-brain">
            <span className="loading-brain-icon">📚</span>
            <div className="loading-ring" />
          </div>
          <h2 className="loading-title">Loading Saved Quizzes</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="quiz-list-container">
      <div className="quiz-list-header">
        <div>
          <h1 className="hero-title" style={{ textAlign: 'left', marginBottom: 6 }}>
            Saved <span className="gradient-text">Quizzes</span>
          </h1>
          <p className="hero-subtitle" style={{ textAlign: 'left', margin: 0 }}>
            Browse published quizzes, share links with students, and review live results.
          </p>
        </div>
        <Link to="/create" className="generate-btn" style={{ textDecoration: 'none' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Create New Quiz
        </Link>
      </div>

      {error && (
        <div className="error-banner">
          <div className="error-content">
            <p className="error-title">Error Loading Quizzes</p>
            <p className="error-message">{error}</p>
          </div>
        </div>
      )}

      {quizzes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📝</div>
          <h3 className="empty-title">No Quizzes Saved Yet</h3>
          <p className="empty-desc">
            You haven't created or published any quizzes yet. Use the Create Quiz tool or AI Quiz generator to publish your first one!
          </p>
          <Link to="/create" className="generate-btn" style={{ textDecoration: 'none' }}>
            Create Your First Quiz
          </Link>
        </div>
      ) : (
        <div className="quiz-grid">
          {quizzes.map((quiz) => (
            <div className="quiz-card" key={quiz.id}>
              <div className="quiz-card-top">
                <h3 className="quiz-card-title">{quiz.title}</h3>
                <span className={`difficulty-badge diff-badge-${quiz.difficulty || 'medium'}`} style={{ margin: 0 }}>
                  {quiz.difficulty || 'medium'}
                </span>
              </div>

              <div className="quiz-card-meta">
                <span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                  {formatDate(quiz.created_at)}
                </span>
                <span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                  {quiz.num_questions} questions
                </span>
              </div>

              <div className="quiz-card-actions">
                <Link to={`/quiz/${quiz.id}`} className="quiz-btn-primary">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                  Take Quiz
                </Link>

                <Link to={`/quiz/${quiz.id}/results`} className="quiz-btn-secondary">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>
                  Results
                </Link>

                <button
                  type="button"
                  className="quiz-btn-secondary"
                  onClick={() => handleCopyLink(quiz.id)}
                  title="Copy share link for students"
                >
                  {copiedId === quiz.id ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>
                      Share
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
