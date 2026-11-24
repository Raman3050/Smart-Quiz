# ⚡ Smart Quiz — AI-Powered Quiz & Exam Analysis Platform

Upload study materials or previous year question papers, generate and customize quizzes, analyze high-probability exam topics, share quizzes with students, and export detailed results to Excel.

🌐 **Live Demo:** [smart-quiz-seven.vercel.app](https://smart-quiz-seven.vercel.app)

---

## 🏗️ Architecture

```
Smart Quiz/
├── backend/                  # FastAPI + Python → Deployed on Railway
│   ├── main.py               # API server with CORS & endpoints
│   ├── database.py           # SQLite persistence (quizzes & submissions)
│   ├── pdf_extractor.py      # PDF text extraction (pdfplumber)
│   ├── quiz_generator.py     # AI quiz question generator (Groq API)
│   ├── paper_analyzer.py     # Multi-paper exam topic & probability analyzer
│   ├── create_demo_pdf.py    # Demo PDF generator
│   ├── requirements.txt      # Python dependencies
│   ├── Procfile              # Railway start command
│   ├── railway.toml          # Railway deployment config
│   └── .env.example          # Environment variables template
│
├── frontend/                 # React + Vite + React Router → Deployed on Vercel
│   ├── src/
│   │   ├── App.jsx            # Main app orchestrator & navigation
│   │   ├── UploadZone.jsx     # Drag-and-drop PDF upload for single-doc quiz
│   │   ├── PaperAnalyzer.jsx  # Multi-PDF question paper pattern analyzer
│   │   ├── ManualQuizCreator.jsx # Manual quiz builder with AI assist
│   │   ├── QuizList.jsx       # Saved quizzes dashboard
│   │   ├── SharedQuiz.jsx     # Student quiz-taking interface
│   │   ├── ResultsDashboard.jsx # Instructor dashboard with Excel export
│   │   ├── Quiz.jsx           # Interactive quiz interface (timer, options)
│   │   ├── Results.jsx        # Animated score ring & question review
│   │   ├── Confetti.jsx       # Celebration effects
│   │   └── *.css              # Cosmic theme styling
│   ├── index.html
│   └── package.json
│
└── vercel.json               # Vercel config (frontend-only)
```

---

## 🚀 Quick Start (Local Development)

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
Set your `GROQ_API_KEY` in `backend/.env`:
```env
GROQ_API_KEY=gsk_your_key_here
GROQ_MODEL=openai/gpt-oss-120b
```

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

## ☁️ Deployment

The project uses a split deployment:
- **Frontend** → [Vercel](https://vercel.com) (static hosting, instant global CDN)
- **Backend** → [Railway](https://railway.com) (always-on server, no cold starts)

### Backend — Deploy on Railway

1. Go to [railway.com](https://railway.com) and sign in with GitHub.
2. Click **"New Project" → "Deploy from GitHub Repo"** and select this repository.
3. Set the **Root Directory** to `backend` in the service settings.
4. Add these **Environment Variables** in the Railway dashboard:

   | Variable | Value |
   |----------|-------|
   | `GROQ_API_KEY` | Your Groq API key |
   | `GROQ_MODEL` | `openai/gpt-oss-120b` |

5. Railway auto-detects Python + `requirements.txt` and deploys. The `railway.toml` and `Procfile` are already configured.
6. Go to **Settings → Networking → Generate Domain** to get your public URL (e.g. `https://smart-quiz-backend-production.up.railway.app`).

### Frontend — Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and import the same GitHub repository.
2. Choose **"Other"** as the Framework Preset.
3. Add this **Environment Variable**:

   | Variable | Value |
   |----------|-------|
   | `VITE_API_BASE` | Your Railway backend URL (e.g. `https://smart-quiz-backend-production.up.railway.app`) |

4. Click **Deploy**.

> **Note:** The frontend reads `VITE_API_BASE` at build time. If you change the Railway URL, trigger a redeployment on Vercel.

---

## 🎯 Features

### 1. 📑 Previous Years Question Paper Analyzer
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
