import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import './ResultsDashboard.css'

const API_BASE = 'http://localhost:8001'

export default function ResultsDashboard() {
  const { quizId } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)

  const fetchResults = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${API_BASE}/api/quizzes/${quizId}/results`)
      if (!res.ok) {
        if (res.status === 404) throw new Error('Quiz not found.')
        throw new Error('Failed to load quiz results.')
      }
      const json = await res.json()
      setData(json)
    } catch (err) {
      setError(err.message || 'Error loading results')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchResults()
  }, [quizId])

  const getShareUrl = () => {
    const origin = window.location.origin
    const pathname = window.location.pathname.replace(/\/$/, '')
    return `${origin}${pathname}/#/quiz/${quizId}`
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(getShareUrl())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadExcel = () => {
    window.open(`${API_BASE}/api/quizzes/${quizId}/results/export`, '_blank')
  }

  const formatDate = (isoString) => {
    if (!isoString) return '—'
    try {
      const d = new Date(isoString)
      return d.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return isoString
    }
  }

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-overlay">
          <div className="loading-brain">
            <span className="loading-brain-icon">📊</span>
            <div className="loading-ring" />
          </div>
          <h2 className="loading-title">Loading Quiz Results</h2>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="dashboard-container">
        <div className="error-banner" style={{ maxWidth: 540, margin: '40px auto' }}>
          <div className="error-content">
            <p className="error-title">Cannot Load Results</p>
            <p className="error-message">{error || 'Unable to retrieve quiz records.'}</p>
          </div>
        </div>
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <Link to="/quizzes" className="new-quiz-btn" style={{ textDecoration: 'none' }}>
            Back to Saved Quizzes
          </Link>
        </div>
      </div>
    )
  }

  const results = data.results || []
  // Sort by score descending
  const sortedResults = [...results].sort((a, b) => (b.score || 0) - (a.score || 0))

  const totalSubmissions = results.length
  const avgScore =
    totalSubmissions > 0
      ? (results.reduce((acc, r) => acc + (r.score || 0), 0) / totalSubmissions).toFixed(1)
      : '0'
  const highestScore =
    totalSubmissions > 0 ? Math.max(...results.map((r) => r.score || 0)) : 0
  const passCount = results.filter((r) => (r.percentage || 0) >= 50).length
  const passRate =
    totalSubmissions > 0 ? Math.round((passCount / totalSubmissions) * 100) : 0

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="dashboard-title-wrap">
          <Link to="/quizzes" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
            All Quizzes
          </Link>
          <h1 className="hero-title" style={{ textAlign: 'left', marginBottom: 4 }}>
            {data.title}
          </h1>
          <p className="hero-subtitle" style={{ textAlign: 'left', margin: 0 }}>
            Student Performance Dashboard & Analytics
          </p>
        </div>

        <div className="dashboard-actions-group">
          <button
            type="button"
            className="excel-export-btn"
            onClick={handleDownloadExcel}
            title="Download full results as an Excel (.xlsx) spreadsheet"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download Excel Sheet
          </button>

          <button
            type="button"
            className="new-quiz-btn"
            onClick={handleCopyLink}
            title="Copy student quiz link"
          >
            {copied ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                Link Copied!
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>
                Share Quiz
              </>
            )}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="dashboard-stats-grid">
        <div className="dashboard-stat-card">
          <div className="stat-num purple">{totalSubmissions}</div>
          <div className="stat-label-text">Total Submissions</div>
        </div>
        <div className="dashboard-stat-card">
          <div className="stat-num cyan">{avgScore}</div>
          <div className="stat-label-text">Average Score</div>
        </div>
        <div className="dashboard-stat-card">
          <div className="stat-num green">{highestScore}</div>
          <div className="stat-label-text">Top Score</div>
        </div>
        <div className="dashboard-stat-card">
          <div className="stat-num amber">{passRate}%</div>
          <div className="stat-label-text">Pass Rate (≥50%)</div>
        </div>
      </div>

      {/* Results Table */}
      <div className="table-card">
        <div className="table-header-bar">
          <div className="table-title">Student Submissions ({totalSubmissions})</div>
          <button
            type="button"
            className="quiz-btn-secondary"
            onClick={fetchResults}
            title="Refresh submissions"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" /></svg>
            Refresh
          </button>
        </div>

        {totalSubmissions === 0 ? (
          <div className="empty-state" style={{ border: 'none', background: 'transparent' }}>
            <div className="empty-icon">⏳</div>
            <h3 className="empty-title">No Submissions Yet</h3>
            <p className="empty-desc">
              Share the quiz link with students. Once they submit their answers, their scores and question breakdowns will appear here in real time.
            </p>
            <button type="button" className="generate-btn" onClick={handleCopyLink}>
              {copied ? 'Link Copied to Clipboard!' : 'Copy Student Quiz Link'}
            </button>
          </div>
        ) : (
          <div className="table-scroll-wrapper">
            <table className="results-table">
              <thead>
                <tr>
                  <th style={{ width: 60, textAlign: 'center' }}>Rank</th>
                  <th>Student Name</th>
                  <th>Email</th>
                  <th>Score</th>
                  <th>Percentage</th>
                  <th>Submitted At</th>
                </tr>
              </thead>
              <tbody>
                {sortedResults.map((sub, idx) => {
                  const pct = sub.percentage || 0
                  const pctClass = pct >= 80 ? 'pct-high' : pct >= 50 ? 'pct-med' : 'pct-low'
                  return (
                    <tr key={idx}>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`rank-badge ${idx < 3 ? `rank-${idx + 1}` : ''}`}>
                          {idx + 1}
                        </span>
                      </td>
                      <td className="student-name-cell">{sub.student_name}</td>
                      <td>{sub.student_email || '—'}</td>
                      <td>
                        <strong>{sub.score}</strong> / {sub.total}
                      </td>
                      <td>
                        <span className={`pct-badge ${pctClass}`}>{pct}%</span>
                      </td>
                      <td>{formatDate(sub.submitted_at)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
