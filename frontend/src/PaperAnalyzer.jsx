import { useState, useRef, useCallback } from 'react'
import './PaperAnalyzer.css'

import { API_BASE } from './apiConfig'
const TOPIC_COUNTS = [5, 10, 15, 20]
const LETTERS = ['A', 'B', 'C', 'D']

export default function PaperAnalyzer() {
  const [files, setFiles] = useState([])
  const [dragOver, setDragOver] = useState(false)
  const [numTopics, setNumTopics] = useState(10)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)
  const [expandedIdx, setExpandedIdx] = useState(null)
  const inputRef = useRef(null)

  const addFiles = useCallback((fileList) => {
    const pdfs = Array.from(fileList).filter((f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'))
    if (pdfs.length === 0) return
    setFiles((prev) => {
      const existing = new Set(prev.map((f) => f.name + f.size))
      const unique = pdfs.filter((f) => !existing.has(f.name + f.size))
      return [...prev, ...unique]
    })
  }, [])

  const removeFile = useCallback((idx) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx))
  }, [])

  const onDrop = useCallback(
    (e) => {
      e.preventDefault()
      setDragOver(false)
      addFiles(e.dataTransfer.files)
    },
    [addFiles]
  )

  const onDragOver = useCallback((e) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const onDragLeave = useCallback(() => setDragOver(false), [])

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / 1048576).toFixed(1) + ' MB'
  }

  const handleAnalyze = async () => {
    if (files.length === 0 || loading) return
    setError(null)
    setLoading(true)
    setResults(null)

    const formData = new FormData()
    files.forEach((f) => formData.append('files', f))

    try {
      const res = await fetch(
        `${API_BASE}/api/analyze-papers?num_topics=${numTopics}`,
        { method: 'POST', body: formData }
      )
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail || `Server error (${res.status})`)
      }
      const data = await res.json()
      setResults(data)
    } catch (err) {
      setError(err.message || 'Analysis failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getProbColor = (prob) => {
    if (prob >= 70) return 'prob-high'
    if (prob >= 40) return 'prob-medium'
    return 'prob-low'
  }

  if (loading) {
    return (
      <div className="analyzer-container">
        <div className="loading-overlay">
          <div className="loading-brain">
            <span className="loading-brain-icon">🧠</span>
            <div className="loading-ring" />
            <div className="loading-ring-2" />
          </div>
          <h2 className="loading-title">Analyzing Question Papers</h2>
          <p className="loading-subtitle">
            Extracting recurring questions, matching topic frequencies, and calculating probability weights...
          </p>
        </div>
      </div>
    )
  }

  if (results) {
    const topics = results.topics || []
    return (
      <div className="analyzer-container">
        <div className="analyzer-results-header">
          <h1 className="analyzer-results-title">
            <span className="gradient-text">Pattern Analysis Complete</span>
          </h1>
          <p className="analyzer-results-subtitle">
            Identified {topics.length} highest-probability topics across {files.length} paper{files.length !== 1 ? 's' : ''}
          </p>
          <button className="analyzer-back-btn" onClick={() => { setResults(null); setFiles([]) }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
            </svg>
            Analyze Another Set
          </button>
        </div>

        <div className="topics-list">
          {topics.map((topic, idx) => (
            <div className="topic-card" key={idx} style={{ animationDelay: `${idx * 60}ms` }}>
              <div className="topic-card-main">
                <div className="topic-rank">#{idx + 1}</div>
                <div className="topic-info">
                  <h3 className="topic-name">{topic.topic || topic.name}</h3>
                  <div className="topic-prob-bar-track">
                    <div
                      className={`topic-prob-bar-fill ${getProbColor(topic.probability)}`}
                      style={{ width: `${Math.min(100, Math.max(0, topic.probability))}%` }}
                    />
                  </div>
                  <div className="topic-meta">
                    <span className={`topic-prob-value ${getProbColor(topic.probability)}`}>
                      {topic.probability}% Probability
                    </span>
                    {topic.frequency && (
                      <span className="topic-badge freq">{topic.frequency}</span>
                    )}
                    {topic.importance && (
                      <span className="topic-badge importance">{topic.importance.toUpperCase()} PRIORITY</span>
                    )}
                  </div>
                </div>
                {topic.sample_questions && topic.sample_questions.length > 0 && (
                  <button
                    className={`topic-expand-btn ${expandedIdx === idx ? 'expanded' : ''}`}
                    onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
                    title={expandedIdx === idx ? 'Collapse sample questions' : 'View sample questions'}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                )}
              </div>

              {expandedIdx === idx && topic.sample_questions && topic.sample_questions.length > 0 && (
                <div className="topic-questions">
                  <p className="topic-questions-label">Sample Exam Questions for this Topic</p>
                  <div className="topic-questions-list">
                    {topic.sample_questions.map((q, qi) => {
                      if (typeof q === 'string') {
                        return (
                          <div className="sample-question-card" key={qi}>
                            <p className="sample-q-text">{q}</p>
                          </div>
                        )
                      }
                      return (
                        <div className="sample-question-card" key={qi}>
                          <p className="sample-q-text">{q.question}</p>
                          {Array.isArray(q.options) && q.options.length > 0 && (
                            <div className="sample-q-options">
                              {q.options.map((opt, oi) => (
                                <div
                                  key={oi}
                                  className={`sample-q-opt ${oi === q.correct_index ? 'correct-opt' : ''}`}
                                >
                                  <strong>{LETTERS[oi] || oi + 1}.</strong> {opt}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="analyzer-container">
      <div className="hero-section">
        <h1 className="hero-title">
          Previous Years <span className="gradient-text">Paper Analyzer</span>
        </h1>
        <p className="hero-subtitle">
          Upload question papers from multiple years or test series. Our AI analyzes recurring question patterns,
          identifies high-yield topics, and ranks them by probability of appearing in your upcoming exams.
        </p>
      </div>

      <div
        className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          multiple
          onChange={(e) => {
            addFiles(e.target.files)
            e.target.value = ''
          }}
          style={{ display: 'none' }}
        />
        <div className="upload-zone-content">
          <div className="upload-icon-container">
            <svg className="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          <h2 className="upload-title">
            {files.length > 0 ? `${files.length} paper${files.length !== 1 ? 's' : ''} selected` : 'Drop your Question Papers here'}
          </h2>
          <p className="upload-subtitle">
            {files.length > 0 ? 'Drop more papers or click to add' : 'Upload 2 or more previous year question papers for cross-analysis'}
          </p>
          {files.length === 0 && (
            <>
              <div className="upload-divider"><span>or</span></div>
              <button className="upload-btn" type="button">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
                </svg>
                Browse Question Papers
              </button>
              <p className="upload-constraints">PDF only · Upload multiple files at once</p>
            </>
          )}
        </div>
      </div>

      {files.length > 0 && (
        <div className="analyzer-files-list">
          {files.map((f, idx) => (
            <div className="analyzer-file-item" key={f.name + f.size + idx}>
              <div className="file-icon-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <div className="file-details">
                <div className="file-name">{f.name}</div>
                <div className="file-size">{formatSize(f.size)}</div>
              </div>
              <button
                className="file-remove-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  removeFile(idx)
                }}
                title="Remove paper"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {files.length > 0 && (
        <div className="analyzer-options">
          <div className="question-count-section" style={{ opacity: 1 }}>
            <p className="question-count-label">Target Number of Top Topics</p>
            <div className="question-count-options">
              {TOPIC_COUNTS.map((n) => (
                <button
                  key={n}
                  className={`count-option ${numTopics === n ? 'active' : ''}`}
                  onClick={() => setNumTopics(n)}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="error-banner" style={{ marginTop: 24 }}>
              <svg className="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <div className="error-content">
                <p className="error-title">Analysis Failed</p>
                <p className="error-message">{error}</p>
              </div>
            </div>
          )}

          <div className="generate-section" style={{ opacity: 1, marginTop: 28 }}>
            <button className="generate-btn" onClick={handleAnalyze} disabled={loading}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              Analyze Previous Year Papers
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
