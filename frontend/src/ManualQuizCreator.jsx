import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import './ManualQuizCreator.css'

const API_BASE = import.meta.env.VITE_API_BASE || ''
const LETTERS = ['A', 'B', 'C', 'D']

const DIFFICULTIES = [
  { key: 'easy', label: 'Easy', icon: '🌱' },
  { key: 'medium', label: 'Medium', icon: '⚡' },
  { key: 'hard', label: 'Hard', icon: '🔥' },
]

export default function ManualQuizCreator() {
  const [title, setTitle] = useState('')
  const [difficulty, setDifficulty] = useState('medium')
  const [questions, setQuestions] = useState([
    {
      question: '',
      options: ['', '', '', ''],
      correct_index: 0,
      explanation: '',
    },
  ])

  // AI Import State
  const [showAiModal, setShowAiModal] = useState(false)
  const [aiFile, setAiFile] = useState(null)
  const [aiNumQuestions, setAiNumQuestions] = useState(5)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState(null)
  const aiInputRef = useRef(null)

  // Saving State
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [savedQuiz, setSavedQuiz] = useState(null)
  const [copied, setCopied] = useState(false)

  // Question editing handlers
  const handleQuestionChange = (index, value) => {
    setQuestions((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], question: value }
      return updated
    })
  }

  const handleOptionChange = (qIndex, optIndex, value) => {
    setQuestions((prev) => {
      const updated = [...prev]
      const newOpts = [...updated[qIndex].options]
      newOpts[optIndex] = value
      updated[qIndex] = { ...updated[qIndex], options: newOpts }
      return updated
    })
  }

  const handleCorrectIndexChange = (qIndex, optIndex) => {
    setQuestions((prev) => {
      const updated = [...prev]
      updated[qIndex] = { ...updated[qIndex], correct_index: optIndex }
      return updated
    })
  }

  const handleExplanationChange = (qIndex, value) => {
    setQuestions((prev) => {
      const updated = [...prev]
      updated[qIndex] = { ...updated[qIndex], explanation: value }
      return updated
    })
  }

  const handleAddQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        question: '',
        options: ['', '', '', ''],
        correct_index: 0,
        explanation: '',
      },
    ])
  }

  const handleRemoveQuestion = (index) => {
    if (questions.length <= 1) {
      alert('A quiz must have at least one question.')
      return
    }
    setQuestions((prev) => prev.filter((_, i) => i !== index))
  }

  // AI Generation to append/populate questions
  const handleAiGenerate = async () => {
    if (!aiFile) {
      setAiError('Please select a PDF document first.')
      return
    }
    setAiLoading(true)
    setAiError(null)

    const formData = new FormData()
    formData.append('file', aiFile)

    try {
      const res = await fetch(
        `${API_BASE}/api/generate-quiz?num_questions=${aiNumQuestions}&difficulty=${difficulty}`,
        { method: 'POST', body: formData }
      )
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail || `Server error (${res.status})`)
      }
      const data = await res.json()
      if (data.questions && data.questions.length > 0) {
        // If current questions list is just 1 empty question, replace it
        if (
          questions.length === 1 &&
          !questions[0].question.trim() &&
          questions[0].options.every((o) => !o.trim())
        ) {
          setQuestions(data.questions)
        } else {
          setQuestions((prev) => [...prev, ...data.questions])
        }
        if (!title.trim()) {
          const cleanName = aiFile.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')
          setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1) + ' Quiz')
        }
        setShowAiModal(false)
        setAiFile(null)
      } else {
        throw new Error('No questions generated. Please try again.')
      }
    } catch (err) {
      setAiError(err.message || 'AI generation failed.')
    } finally {
      setAiLoading(false)
    }
  }

  // Save Quiz
  const handleSaveQuiz = async (e) => {
    e.preventDefault()
    setSaveError(null)

    if (!title.trim()) {
      setSaveError('Please enter a title for the quiz.')
      return
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      if (!q.question.trim()) {
        setSaveError(`Question ${i + 1} cannot be empty.`)
        return
      }
      for (let j = 0; j < 4; j++) {
        if (!q.options[j] || !q.options[j].trim()) {
          setSaveError(`Question ${i + 1}, Option ${LETTERS[j]} cannot be empty.`)
          return
        }
      }
    }

    setSaving(true)

    try {
      const res = await fetch(`${API_BASE}/api/quizzes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          difficulty,
          questions,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail || `Failed to save quiz (${res.status})`)
      }

      const data = await res.json()
      setSavedQuiz(data)
    } catch (err) {
      setSaveError(err.message || 'Something went wrong while saving the quiz.')
    } finally {
      setSaving(false)
    }
  }

  const getShareUrl = () => {
    if (!savedQuiz) return ''
    const origin = window.location.origin
    const pathname = window.location.pathname.replace(/\/$/, '')
    return `${origin}${pathname}/#/quiz/${savedQuiz.quiz_id}`
  }

  const handleCopyLink = () => {
    const url = getShareUrl()
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const resetForm = () => {
    setTitle('')
    setDifficulty('medium')
    setQuestions([
      {
        question: '',
        options: ['', '', '', ''],
        correct_index: 0,
        explanation: '',
      },
    ])
    setSavedQuiz(null)
    setSaveError(null)
  }

  if (savedQuiz) {
    const shareUrl = getShareUrl()
    return (
      <div className="creator-container">
        <div className="saved-success-box">
          <div className="success-icon-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 className="saved-title">Quiz Published!</h1>
          <p className="saved-subtitle">
            "{savedQuiz.title}" has been saved with {savedQuiz.num_questions} questions.
            Share this link with students or colleagues to let them take the quiz.
          </p>

          <div className="share-link-box">
            <input type="text" readOnly value={shareUrl} className="share-link-input" />
            <button className="copy-btn" onClick={handleCopyLink}>
              {copied ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>
                  Copy Link
                </>
              )}
            </button>
          </div>

          <div className="success-actions">
            <Link to={`/quiz/${savedQuiz.quiz_id}`} className="generate-btn" style={{ textDecoration: 'none' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              Take Quiz
            </Link>
            <Link to={`/quiz/${savedQuiz.quiz_id}/results`} className="new-quiz-btn" style={{ textDecoration: 'none' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
              </svg>
              View Results Dashboard
            </Link>
            <button className="new-quiz-btn" onClick={resetForm}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Create Another
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="creator-container">
      <div className="hero-section">
        <h1 className="hero-title">
          Create & Customize <span className="gradient-text">Quiz</span>
        </h1>
        <p className="hero-subtitle">
          Build custom quizzes manually, import and edit AI-generated questions from PDF, or combine both to craft the perfect test.
        </p>
      </div>

      {/* AI Assistant Banner */}
      <div className="ai-assist-box">
        <div className="ai-assist-info">
          <span className="ai-assist-icon">✨</span>
          <div>
            <div className="ai-assist-title">Want AI to draft questions for you first?</div>
            <div className="ai-assist-desc">Upload a PDF to pre-populate questions, which you can freely edit, reorder, or add to.</div>
          </div>
        </div>
        <button
          type="button"
          className="ai-assist-btn"
          onClick={() => setShowAiModal(true)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
          Import from PDF with AI
        </button>
      </div>

      {/* AI Import Modal / Inline Form */}
      {showAiModal && (
        <div className="creator-section-card" style={{ marginBottom: 24, borderColor: 'var(--border-accent)' }}>
          <div className="section-heading">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Generate Questions from Document
          </div>

          <div className="form-group">
            <label className="form-label">Select PDF Document</label>
            <input
              type="file"
              ref={aiInputRef}
              accept=".pdf"
              onChange={(e) => setAiFile(e.target.files[0])}
              className="form-input"
            />
            {aiFile && (
              <p style={{ fontSize: '0.82rem', color: 'var(--accent-secondary)', marginTop: 6 }}>
                Selected: {aiFile.name} ({(aiFile.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Number of Questions to Generate</label>
            <div className="question-count-options" style={{ justifyContent: 'flex-start' }}>
              {[3, 5, 7, 10].map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`count-option ${aiNumQuestions === n ? 'active' : ''}`}
                  onClick={() => setAiNumQuestions(n)}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {aiError && (
            <div className="error-banner" style={{ marginBottom: 16 }}>
              <div className="error-content">
                <p className="error-title">AI Generation Error</p>
                <p className="error-message">{aiError}</p>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 12 }}>
            <button
              type="button"
              className="generate-btn"
              onClick={handleAiGenerate}
              disabled={aiLoading || !aiFile}
            >
              {aiLoading ? 'Generating Questions...' : 'Generate & Add Questions'}
            </button>
            <button
              type="button"
              className="new-quiz-btn"
              onClick={() => {
                setShowAiModal(false)
                setAiFile(null)
                setAiError(null)
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Main Creator Form */}
      <form onSubmit={handleSaveQuiz} className="creator-form">
        <div className="creator-section-card">
          <div className="section-heading">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            Quiz Details
          </div>

          <div className="form-group">
            <label className="form-label">Quiz Title *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Modern Indian History - Chapter 4 Quiz"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Difficulty Level</label>
            <div className="difficulty-options" style={{ justifyContent: 'flex-start' }}>
              {DIFFICULTIES.map((d) => (
                <button
                  key={d.key}
                  type="button"
                  className={`difficulty-option ${difficulty === d.key ? 'active' : ''} diff-${d.key}`}
                  onClick={() => setDifficulty(d.key)}
                  style={{ minWidth: 100, padding: '10px 16px' }}
                >
                  <span className="diff-icon">{d.icon}</span>
                  <span className="diff-label">{d.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Questions List */}
        <div className="questions-section">
          <div className="questions-header">
            <h2 className="section-heading" style={{ margin: 0 }}>
              Questions ({questions.length})
            </h2>
          </div>

          {questions.map((q, qIndex) => (
            <div className="question-card-editor" key={qIndex}>
              <div className="question-card-top">
                <span className="question-number-badge">Question {qIndex + 1}</span>
                {questions.length > 1 && (
                  <button
                    type="button"
                    className="question-delete-btn"
                    onClick={() => handleRemoveQuestion(qIndex)}
                    title="Remove this question"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                    </svg>
                  </button>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Question Text *</label>
                <textarea
                  className="form-textarea"
                  placeholder="Enter the question statement..."
                  value={q.question}
                  onChange={(e) => handleQuestionChange(qIndex, e.target.value)}
                  required
                />
              </div>

              <div className="options-editor-grid">
                <label className="form-label" style={{ marginBottom: 4 }}>
                  Options (Click the letter to set as Correct Answer) *
                </label>
                {q.options.map((opt, optIndex) => (
                  <div className="option-edit-row" key={optIndex}>
                    <button
                      type="button"
                      className={`option-radio-btn ${q.correct_index === optIndex ? 'is-correct' : ''}`}
                      onClick={() => handleCorrectIndexChange(qIndex, optIndex)}
                      title={`Click to mark Option ${LETTERS[optIndex]} as correct`}
                    >
                      {LETTERS[optIndex]}
                    </button>
                    <input
                      type="text"
                      className="form-input"
                      placeholder={`Option ${LETTERS[optIndex]}`}
                      value={opt}
                      onChange={(e) => handleOptionChange(qIndex, optIndex, e.target.value)}
                      required
                    />
                    {q.correct_index === optIndex && (
                      <span style={{ fontSize: '0.78rem', color: 'var(--success)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        ✓ Correct
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Explanation (shown to student after answering)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Why is this answer correct? (Optional)"
                  value={q.explanation || ''}
                  onChange={(e) => handleExplanationChange(qIndex, e.target.value)}
                />
              </div>
            </div>
          ))}

          <button
            type="button"
            className="add-question-btn"
            onClick={handleAddQuestion}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Another Question
          </button>
        </div>

        {saveError && (
          <div className="error-banner">
            <svg className="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div className="error-content">
              <p className="error-title">Cannot Save Quiz</p>
              <p className="error-message">{saveError}</p>
            </div>
          </div>
        )}

        <div className="creator-actions">
          <button
            type="submit"
            className="generate-btn"
            disabled={saving}
          >
            {saving ? (
              <>
                <svg className="spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" opacity="0.25" /><path d="M12 2a10 10 0 0110 10" style={{ animation: 'spin 1s linear infinite', transformOrigin: 'center' }} /></svg>
                Saving & Publishing...
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" />
                </svg>
                Save & Publish Quiz
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
