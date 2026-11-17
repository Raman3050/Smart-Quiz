# ⚡ Smart Quiz — AI-Powered Quiz & Exam Analysis Platform

Upload study materials or previous year question papers, generate and customize quizzes, analyze high-probability exam topics, share quizzes with students, and export detailed results to Excel.

## 🏗️ Architecture

```
Smart Quiz/
├── backend/                  # FastAPI + Python
│   ├── main.py               # API server with CORS & all endpoints
│   ├── database.py           # SQLite persistence (quizzes & submissions)
│   ├── pdf_extractor.py      # PDF text extraction (pdfplumber)
│   ├── quiz_generator.py     # AI quiz question generator
│   ├── paper_analyzer.py     # Multi-paper exam topic & probability analyzer
│   ├── create_demo_pdf.py    # Demo PDF generator
│   ├── requirements.txt      # Python dependencies (includes openpyxl)
│   └── .env                  # API key configuration
│
└── frontend/                 # React + Vite + React Router
    ├── src/
    │   ├── App.jsx            # Main app orchestrator & navigation
    │   ├── UploadZone.jsx     # Drag-and-drop PDF upload for single-doc quiz
    │   ├── PaperAnalyzer.jsx  # Multi-PDF question paper pattern analyzer
    │   ├── ManualQuizCreator.jsx # Manual quiz builder with AI assist
    │   ├── QuizList.jsx       # Saved quizzes dashboard
    │   ├── SharedQuiz.jsx     # Student quiz-taking interface
    │   ├── ResultsDashboard.jsx # Instructor dashboard with Excel export
    │   ├── Quiz.jsx           # Interactive quiz interface (timer, options)
    │   ├── Results.jsx        # Animated score ring & question review
    │   ├── Confetti.jsx       # Celebration effects
    │   └── *.css              # Cosmic theme styling
    ├── index.html
    └── package.json
```

## 🚀 Quick Start

### 1. Set up the Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Configure your Groq API Key

```bash
cp .env.example .env
```
Ensure your `GROQ_API_KEY` is set in `backend/.env`.

### 3. Start the Backend

```bash
cd backend
source venv/bin/activate
python main.py
# Server runs at http://localhost:8001
# Interactive Swagger docs at http://localhost:8001/docs
```

### 4. Start the Frontend

```bash
cd frontend
npm install
npm run dev
# App runs at http://localhost:5173
```

---

## 🎯 Features

### 1. 📑 Previous Years Question Paper Analyzer (Separate Feature)
- Upload **multiple PDF question papers** at once
- Cross-paper text analysis identifies recurring patterns and themes
- Ranks topics by **probability percentage** (high/medium/low priority)
- Shows frequency across papers (e.g. "Appeared in 4 out of 5 papers")
- Includes sample multiple-choice questions for each predicted topic

### 2. ✍️ Manual & Hybrid Quiz Creator
- Build quizzes completely from scratch: custom questions, 4 options, correct answer toggle, and explanations
- **AI Assist option**: Upload a PDF to automatically draft questions, then edit, reorder, or add manual questions alongside them
- Set difficulty levels (Easy, Medium, Hard) and custom quiz titles
- Publishes quiz and provides an instant shareable link

### 3. 🔗 Quiz Sharing & Student Submissions
- Direct shareable student link (`/#/quiz/:quiz_id`)
- Clean student onboarding (Name, optional Email)
- Interactive quiz engine with real-time countdown timer, immediate option feedback, and explanations
- Auto-scores submissions and persists student answers

### 4. 📊 Results Dashboard & Excel (.xlsx) Export
- Instructor dashboard (`/#/quiz/:quiz_id/results`) with key metrics:
  - Total Submissions
  - Average Score
  - Top Score
  - Pass Rate (≥50%)
- Student ranking leaderboard
- **One-click "Download Excel Sheet"**: Generates a formatted `.xlsx` workbook containing:
  - Rank, Student Name, Email, Score, Total, Percentage, Timestamp
  - Per-question correctness breakdown (`✓` / `✗`) for every question

---

## 🔑 API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET`  | `/health` | Health check endpoint |
| `POST` | `/api/generate-quiz` | Upload single PDF & generate quiz |
| `POST` | `/api/analyze-papers` | Upload multiple PDFs & analyze recurring exam topics |
| `POST` | `/api/quizzes` | Save a new quiz (manual or AI-generated) |
| `GET`  | `/api/quizzes` | List all saved quizzes |
| `GET`  | `/api/quizzes/{id}` | Get quiz details and questions by ID |
| `POST` | `/api/quizzes/{id}/submit` | Submit student answers and record score |
| `GET`  | `/api/quizzes/{id}/results` | Get all student submissions for a quiz |
| `GET`  | `/api/quizzes/{id}/results/export` | Download results as formatted Excel (.xlsx) file |
