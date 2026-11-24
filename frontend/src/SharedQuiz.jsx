import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import Quiz from './Quiz'
import Results from './Results'
import Confetti from './Confetti'
import './SharedQuiz.css'

import { API_BASE } from './apiConfig'

export default function SharedQuiz() {
  const { quizId } = useParams()
  const [quiz, setQuiz] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Student State
  const [studentName, setStudentName] = useState('')
  const [studentEmail, setStudentEmail] = useState('')
  const [started, setStarted] = useState(false)

  // Quiz progress / results
  const [answers, setAnswers] = useState([])
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submissionResult, setSubmissionResult] = useState(null)
  const [confettiTrigger, setConfettiTrigger] = useState(0)

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setLoading(true)
        const res = await fetch(`${API_BASE}/api/quizzes/${quizId}`)
        if (!res.ok) {
          if (res.status === 404) throw new Error('Quiz not found. Please check the link.')
          throw new Error('Failed to load quiz.')
        }
        const data = await res.json()
        setQuiz(data)
      } catch (err) {
        setError(err.message || 'Error loading quiz')
      } finally {
        setLoading(false)
      }
    }
    fetchQuiz()
  }, [quizId])

  const handleStart = (e) => {
    e.preventDefault()
    if (!studentName.trim()) {
      alert('Please enter your name to start the quiz.')
      return
    }
    setStarted(true)
  }

  const handleQuizFinish = useCallback(
    async (finalAnswers) => {
      setAnswers(finalAnswers)
      setSubmitted(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })

      // Calculate score for celebration
      const score = finalAnswers.filter((a) => a.correct).length
      const pct = (score / (quiz?.questions?.length || 1)) * 100
      if (pct >= 50) {
        setTimeout(() => setConfettiTrigger((t) => t + 1), 500)
      }

      // Submit results to backend
      setSubmitting(true)
      try {
        const payloadAnswers = finalAnswers.map((a) => ({
          question_index: a.questionIdx,
          selected_option: a.selected,
        }))

        const res = await fetch(`${API_BASE}/api/quizzes/${quizId}/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            student_name: studentName.trim(),
            student_email: studentEmail.trim() || null,
            answers: payloadAnswers,
          }),
        })

        if (res.ok) {
          const resultData = await res.json()
          setSubmissionResult(resultData)
        }
      } catch (err) {
        console.error('Failed to submit score to server:', err)
      } finally {
        setSubmitting(false)
      }
    },
    [quiz, quizId, studentName, studentEmail]
  )

  const handleRetry = () => {
    setAnswers([])
    setSubmitted(false)
  }

  if (loading) {
    return (
      <div className="shared-quiz-container">
        <div className="loading-overlay">
          <div className="loading-brain">
            <span className="loading-brain-icon">⚡</span>
            <div className="loading-ring" />
          </div>
          <h2 className="loading-title">Loading Quiz</h2>
          <p className="loading-subtitle">Preparing questions...</p>
        </div>
      </div>
    )
  }

  if (error || !quiz) {
    return (
      <div className="shared-quiz-container">
        <div className="error-banner" style={{ maxWidth: 540, margin: '40px auto' }}>
          <div className="error-content">
            <p className="error-title">Cannot Access Quiz</p>
            <p className="error-message">{error || 'Quiz not found.'}</p>
          </div>
        </div>
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Link to="/" className="new-quiz-btn" style={{ textDecoration: 'none' }}>
            Go to Smart Quiz Home
          </Link>
        </div>
      </div>
    )
  }

  // Step 1: Student Name Entry
  if (!started) {
    return (
      <div className="shared-quiz-container">
        <div className="student-entry-card">
          <div className="student-entry-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </div>

          <h1 className="student-quiz-title">{quiz.title}</h1>
          <div className="student-quiz-meta">
            <span className={`difficulty-badge diff-badge-${quiz.difficulty || 'medium'}`} style={{ margin: 0 }}>
              {quiz.difficulty || 'medium'}
            </span>
            <span>•</span>
            <span>{quiz.questions?.length || 0} Questions</span>
          </div>

          <form onSubmit={handleStart} className="student-form">
            <div className="form-group" style={{ marginBottom: 12 }}>
              <label className="form-label">Your Full Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Alex Johnson"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="form-group" style={{ marginBottom: 20 }}>
              <label className="form-label">Email Address (Optional)</label>
              <input
                type="email"
                className="form-input"
                placeholder="e.g. alex@example.com"
                value={studentEmail}
                onChange={(e) => setStudentEmail(e.target.value)}
              />
            </div>

            <button type="submit" className="generate-btn" style={{ width: '100%', justifyContent: 'center' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              Start Quiz
            </button>
          </form>
        </div>
      </div>
    )
  }

  // Step 3: Finished / Results Screen
  if (submitted) {
    return (
      <div className="shared-quiz-container">
        <Confetti trigger={confettiTrigger} type="celebration" />

        {submissionResult && (
          <div className="submission-success-banner">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span>
              Recorded for instructor! Score: <strong>{submissionResult.score}/{submissionResult.total}</strong> ({submissionResult.percentage}%)
            </span>
          </div>
        )}

        <Results
          questions={quiz.questions}
          answers={answers}
          onRetry={handleRetry}
          onNewQuiz={() => {
            setStarted(false)
            setSubmitted(false)
            setAnswers([])
          }}
        />

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Link to={`/quiz/${quizId}/results`} style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textDecoration: 'underline' }}>
            View Instructor Results Dashboard for this quiz →
          </Link>
        </div>
      </div>
    )
  }

  // Step 2: Taking the Quiz
  return (
    <div className="shared-quiz-container">
      <Quiz
        questions={quiz.questions}
        difficulty={quiz.difficulty || 'medium'}
        onFinish={handleQuizFinish}
      />
    </div>
  )
}
