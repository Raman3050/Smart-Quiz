import { useState, useRef, useCallback } from 'react'
import './UploadZone.css'

const QUESTION_COUNTS = [3, 5, 7, 10, 15]
const DIFFICULTIES = [
  { key: 'easy', label: 'Easy', icon: '🌱', desc: 'Factual recall' },
  { key: 'medium', label: 'Medium', icon: '⚡', desc: 'Comprehension' },
  { key: 'hard', label: 'Hard', icon: '🔥', desc: 'Critical thinking' },
]

export default function UploadZone({ onGenerate, isLoading }) {
  const [file, setFile] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [numQuestions, setNumQuestions] = useState(5)
  const [difficulty, setDifficulty] = useState('medium')
  const inputRef = useRef(null)

  const handleFile = useCallback((f) => {
    if (f && f.type === 'application/pdf') {
      setFile(f)
    } else {
      alert('Please select a valid PDF file.')
    }
  }, [])

  const onDrop = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    handleFile(f)
  }, [handleFile])

  const onDragOver = useCallback((e) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const onDragLeave = useCallback(() => setDragOver(false), [])

  const onFileChange = useCallback((e) => {
    handleFile(e.target.files[0])
  }, [handleFile])

  const removeFile = useCallback(() => {
    setFile(null)
    if (inputRef.current) inputRef.current.value = ''
  }, [])

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / 1048576).toFixed(1) + ' MB'
  }

  const handleSubmit = () => {
    if (file && !isLoading) {
      onGenerate(file, numQuestions, difficulty)
    }
  }

  return (
    <div className="upload-zone-wrapper">
      <div
        className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => !file && inputRef.current?.click()}
        id="upload-zone"
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          onChange={onFileChange}
          style={{ display: 'none' }}
          id="file-input"
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
            {file ? 'File Ready' : 'Drop your PDF here'}
          </h2>
          <p className="upload-subtitle">
            {file
              ? 'Choose the number of questions and hit generate!'
              : 'Upload any document — study notes, textbook chapters, research papers'}
          </p>

          {!file && (
            <>
              <div className="upload-divider"><span>or</span></div>
              <button className="upload-btn" type="button" id="browse-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
                </svg>
                Browse Files
              </button>
              <p className="upload-constraints">PDF only · Max 10 MB</p>
            </>
          )}

          {file && (
            <>
              <div className="selected-file">
                <div className="file-icon-wrap">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                </div>
                <div className="file-details">
                  <div className="file-name">{file.name}</div>
                  <div className="file-size">{formatSize(file.size)}</div>
                </div>
                <button className="file-remove-btn" onClick={(e) => { e.stopPropagation(); removeFile() }} id="remove-file-btn">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <div className="question-count-section">
                <p className="question-count-label">Number of Questions</p>
                <div className="question-count-options">
                  {QUESTION_COUNTS.map((n) => (
                    <button
                      key={n}
                      className={`count-option ${numQuestions === n ? 'active' : ''}`}
                      onClick={(e) => { e.stopPropagation(); setNumQuestions(n) }}
                      id={`count-${n}`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div className="difficulty-section">
                <p className="question-count-label">Difficulty Level</p>
                <div className="difficulty-options">
                  {DIFFICULTIES.map((d) => (
                    <button
                      key={d.key}
                      className={`difficulty-option ${difficulty === d.key ? 'active' : ''} diff-${d.key}`}
                      onClick={(e) => { e.stopPropagation(); setDifficulty(d.key) }}
                      id={`diff-${d.key}`}
                    >
                      <span className="diff-icon">{d.icon}</span>
                      <span className="diff-label">{d.label}</span>
                      <span className="diff-desc">{d.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="generate-section">
                <button
                  className="generate-btn"
                  onClick={(e) => { e.stopPropagation(); handleSubmit() }}
                  disabled={isLoading}
                  id="generate-btn"
                >
                  {isLoading ? (
                    <>
                      <svg className="spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" opacity="0.25" /><path d="M12 2a10 10 0 0110 10" style={{ animation: 'spin 1s linear infinite', transformOrigin: 'center' }} /></svg>
                      Generating...
                    </>
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                      </svg>
                      Generate Quiz
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
