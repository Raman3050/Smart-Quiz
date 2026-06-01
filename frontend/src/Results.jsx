import { useEffect, useState } from 'react'
import './Results.css'

const LETTERS = ['A', 'B', 'C', 'D']

export default function Results({ questions, answers, onRetry, onNewQuiz }) {
  const [ringOffset, setRingOffset] = useState(440)
  const total = questions.length
  const correct = answers.filter((a) => a.correct).length
  const incorrect = total - correct
  const pct = Math.round((correct / total) * 100)

  const circumference = 2 * Math.PI * 70
  const target = circumference - (circumference * pct) / 100

  useEffect(() => {
    const t = setTimeout(() => setRingOffset(target), 200)
    return () => clearTimeout(t)
  }, [target])

  const getEmoji = () => {
    if (pct === 100) return '🏆'
    if (pct >= 80) return '🌟'
    if (pct >= 60) return '💪'
    if (pct >= 40) return '📚'
    return '🔄'
  }

  const getTitle = () => {
    if (pct === 100) return 'Perfect Score!'
    if (pct >= 80) return 'Excellent Work!'
    if (pct >= 60) return 'Good Job!'
    if (pct >= 40) return 'Keep Practicing!'
    return 'Room to Grow!'
  }

  const getRingColor = () => {
    if (pct >= 80) return 'url(#greenGrad)'
    if (pct >= 50) return 'url(#blueGrad)'
    return 'url(#redGrad)'
  }

  return (
    <div className="results-container">
      <div className="results-hero">
        <div className="results-emoji">{getEmoji()}</div>
        <h1 className="results-title">{getTitle()}</h1>
        <p className="results-subtitle">
          You scored {correct} out of {total} questions correctly
        </p>

        <div className="score-ring-container">
          <div className="score-ring">
            <svg viewBox="0 0 160 160">
              <defs>
                <linearGradient id="greenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
                <linearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
                <linearGradient id="redGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ef4444" />
                  <stop offset="100%" stopColor="#f59e0b" />
                </linearGradient>
              </defs>
              <circle className="score-ring-bg" cx="80" cy="80" r="70" />
              <circle
                className="score-ring-fill"
                cx="80" cy="80" r="70"
                stroke={getRingColor()}
                strokeDasharray={circumference}
                strokeDashoffset={ringOffset}
              />
            </svg>
            <div className="score-ring-text">
              <span className="score-value">{pct}%</span>
              <span className="score-label">Score</span>
            </div>
          </div>
        </div>

        <div className="results-stats">
          <div className="stat-card">
            <div className="stat-value correct">{correct}</div>
            <div className="stat-label">Correct</div>
          </div>
          <div className="stat-card">
            <div className="stat-value incorrect">{incorrect}</div>
            <div className="stat-label">Incorrect</div>
          </div>
          <div className="stat-card">
            <div className="stat-value total">{total}</div>
            <div className="stat-label">Total</div>
          </div>
        </div>
      </div>

      <div className="review-section">
        <h2 className="review-title">Review Your Answers</h2>
        <div className="review-list">
          {questions.map((q, qIdx) => {
            const userAnswer = answers.find((a) => a.questionIdx === qIdx)
            const isCorrect = userAnswer?.correct
            return (
              <div className="review-card" key={qIdx}>
                <div className="review-card-header">
                  <div className={`review-status-icon ${isCorrect ? 'correct' : 'incorrect'}`}>
                    {isCorrect ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    )}
                  </div>
                  <span className="review-question-num">Question {qIdx + 1}</span>
                </div>
                <p className="review-question-text">{q.question}</p>
                <div className="review-answers">
                  {q.options.map((opt, oIdx) => {
                    let cls = 'review-answer'
                    const isPick = userAnswer?.selected === oIdx
                    const isRight = oIdx === q.correct_index
                    if (isPick) cls += ' your-pick'
                    if (isRight) cls += ' correct-answer'
                    return (
                      <div className={cls} key={oIdx}>
                        <span className="review-answer-letter">{LETTERS[oIdx]}</span>
                        <span>{opt}</span>
                        {isPick && !isRight && <span className="review-answer-tag yours">Your Pick</span>}
                        {isRight && <span className="review-answer-tag correct">Correct</span>}
                      </div>
                    )
                  })}
                </div>
                <div className="review-explanation">{q.explanation}</div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="results-actions">
        <button className="retry-btn" onClick={onRetry} id="retry-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
          </svg>
          Retry Same Quiz
        </button>
        <button className="new-quiz-btn" onClick={onNewQuiz} id="new-quiz-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Upload New PDF
        </button>
      </div>
    </div>
  )
}
