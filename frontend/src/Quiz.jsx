import { useState, useCallback, useEffect, useRef } from 'react'
import { CorrectBurst } from './Confetti'
import './Quiz.css'

const LETTERS = ['A', 'B', 'C', 'D']
const TIMER_SECONDS = { easy: 30, medium: 20, hard: 15 }

export default function Quiz({ questions, difficulty = 'medium', onFinish }) {
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState([])
  const [selectedOption, setSelectedOption] = useState(null)
  const [showExplanation, setShowExplanation] = useState(false)
  const [animKey, setAnimKey] = useState(0)
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS[difficulty] || 20)
  const [showCorrectBurst, setShowCorrectBurst] = useState(false)
  const timerRef = useRef(null)

  const current = questions[currentIdx]
  const score = answers.filter((a) => a.correct).length
  const progress = ((currentIdx + (selectedOption !== null ? 1 : 0)) / questions.length) * 100
  const maxTime = TIMER_SECONDS[difficulty] || 20
  const timerPercent = (timeLeft / maxTime) * 100

  // Timer countdown
  useEffect(() => {
    if (selectedOption !== null) return // stop timer when answered

    setTimeLeft(maxTime)
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timerRef.current)
  }, [currentIdx, selectedOption, maxTime])

  // Auto-submit when timer hits 0
  useEffect(() => {
    if (timeLeft === 0 && selectedOption === null) {
      // Time's up — mark as incorrect (no selection)
      setSelectedOption(-1)
      setShowExplanation(true)
      setAnswers((prev) => [
        ...prev,
        {
          questionIdx: currentIdx,
          selected: -1,
          correct: false,
        },
      ])
    }
  }, [timeLeft, selectedOption, currentIdx])

  const handleSelect = useCallback((optIdx) => {
    if (selectedOption !== null) return
    clearInterval(timerRef.current)
    setSelectedOption(optIdx)
    setShowExplanation(true)

    const isCorrect = optIdx === current.correct_index
    if (isCorrect) {
      setShowCorrectBurst(true)
      setTimeout(() => setShowCorrectBurst(false), 100)
    }

    setAnswers((prev) => [
      ...prev,
      {
        questionIdx: currentIdx,
        selected: optIdx,
        correct: isCorrect,
      },
    ])
  }, [selectedOption, currentIdx, current])

  const handleNext = useCallback(() => {
    if (currentIdx + 1 >= questions.length) {
      onFinish(answers)
      return
    }
    setCurrentIdx((i) => i + 1)
    setSelectedOption(null)
    setShowExplanation(false)
    setAnimKey((k) => k + 1)
  }, [currentIdx, questions.length, answers, onFinish])

  const getOptionClass = (optIdx) => {
    if (selectedOption === null) return 'option-btn'
    const isCorrect = optIdx === current.correct_index
    const isSelected = optIdx === selectedOption
    let cls = 'option-btn answered'
    if (isSelected && isCorrect) cls += ' correct'
    else if (isSelected && !isCorrect) cls += ' incorrect'
    else if (isCorrect) cls += ' correct'
    return cls
  }

  const getTimerClass = () => {
    if (timerPercent > 50) return 'timer-safe'
    if (timerPercent > 25) return 'timer-warning'
    return 'timer-danger'
  }

  return (
    <div className="quiz-container">
      <CorrectBurst show={showCorrectBurst} />

      <div className="quiz-progress-bar">
        <div className="quiz-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <div className="quiz-header">
        <div className="quiz-counter">
          Question <span>{currentIdx + 1}</span> of {questions.length}
        </div>

        {/* Timer */}
        <div className={`quiz-timer ${getTimerClass()} ${selectedOption !== null ? 'timer-paused' : ''}`} id="quiz-timer">
          <svg className="timer-ring" viewBox="0 0 36 36">
            <circle className="timer-ring-bg" cx="18" cy="18" r="15.5" />
            <circle
              className="timer-ring-fill"
              cx="18" cy="18" r="15.5"
              strokeDasharray={`${timerPercent} 100`}
            />
          </svg>
          <span className="timer-value">{timeLeft}</span>
        </div>

        <div className="quiz-score-live">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {score} correct
        </div>
      </div>

      <div className="question-card" key={animKey}>
        {/* Difficulty badge */}
        <div className={`difficulty-badge diff-badge-${difficulty}`}>
          {difficulty === 'easy' ? '🌱' : difficulty === 'hard' ? '🔥' : '⚡'} {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
        </div>

        <p className="question-text">{current.question}</p>

        <div className="options-list">
          {current.options.map((opt, i) => (
            <button
              key={i}
              className={getOptionClass(i)}
              onClick={() => handleSelect(i)}
              id={`option-${LETTERS[i]}`}
            >
              <span className="option-letter">{LETTERS[i]}</span>
              <span className="option-text">{opt}</span>
              {selectedOption !== null && i === current.correct_index && (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
              {selectedOption === i && i !== current.correct_index && (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--error)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              )}
            </button>
          ))}
        </div>

        {/* Time's up message */}
        {selectedOption === -1 && (
          <div className="times-up-card">
            <span className="times-up-icon">⏰</span>
            <span className="times-up-text">Time's up! The correct answer was <strong>{LETTERS[current.correct_index]}</strong>.</span>
          </div>
        )}

        {showExplanation && (
          <div className="explanation-card">
            <p className="explanation-label">Explanation</p>
            <p className="explanation-text">{current.explanation}</p>
          </div>
        )}
      </div>

      {selectedOption !== null && (
        <div className="quiz-nav">
          <button className="next-btn" onClick={handleNext} id="next-btn">
            {currentIdx + 1 >= questions.length ? 'See Results' : 'Next Question'}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
