# ⚡ Smart Quiz — AI-Powered Quiz & Exam Analysis Platform

Upload study materials or previous year question papers, generate and customize quizzes, analyze high-probability exam topics, share quizzes with students, and export detailed results to Excel.

🌐 **Live Demo:** [https://smart-quiz-3r6yyol4r-ramanbajaj0305-7924s-projects.vercel.app/](https://smart-quiz-3r6yyol4r-ramanbajaj0305-7924s-projects.vercel.app/)

---

## 🏗️ Architecture

```
Smart Quiz/
├── api/                      # Vercel Serverless Function entry point
│   ├── index.py              # Exposes FastAPI app to @vercel/python
│   └── requirements.txt      # Python dependencies for serverless runtime
│
├── backend/                  # FastAPI + Python (Core backend logic)
│   ├── main.py               # API server with CORS & endpoints
│   ├── database.py           # SQLite persistence (quizzes & submissions)
│   ├── pdf_extractor.py      # PDF text extraction (pdfplumber)
│   ├── quiz_generator.py     # AI quiz question generator (Groq API)
│   ├── paper_analyzer.py     # Multi-paper exam topic & probability analyzer
│   ├── create_demo_pdf.py    # Demo PDF generator
│   ├── requirements.txt      # Local Python dependencies
│   └── .env.example          # Environment variables template
│
├── frontend/                 # React + Vite + React Router
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
└── vercel.json               # Vercel deployment & routing configuration
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

## ☁️ Deployment on Vercel

The project is configured for single-project deployment on Vercel using `vercel.json`:
- **Frontend:** Built statically using Vite (`frontend/dist`)
- **Backend:** Deployed as a Python serverless function (`api/index.py`) routing all `/api/*` traffic to FastAPI

### Deployment Steps:
1. Push your repository to GitHub:
   ```bash
   git push origin main
   ```
2. Import the project into **[Vercel](https://vercel.com)** (Choose **"Other"** as the Framework Preset).
3. Add the following **Environment Variables** in the Vercel dashboard (**Settings → Environment Variables**):
   - `GROQ_API_KEY`: Your Groq API key
   - `GROQ_MODEL`: `openai/gpt-oss-120b` (or preferred model)
4. Click **Deploy**.

> ⚠️ **Note on SQLite on Serverless:** Vercel functions run in an ephemeral container environment with a temporary `/tmp` filesystem. For permanent persistence across cold starts in production, consider integrating an external database such as Turso, Supabase, or Vercel Postgres.

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
