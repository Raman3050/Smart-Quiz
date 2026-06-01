# ⚡ Smart Quiz — AI-Powered Quiz Generator

Upload any PDF document and let AI generate challenging multiple-choice quiz questions — perfect for exam prep, revision, and self-testing.

## 🏗️ Architecture

```
Smart Quiz/
├── backend/              # FastAPI + Python
│   ├── main.py           # API server with CORS & endpoints
│   ├── pdf_extractor.py  # PDF text extraction (pdfplumber)
│   ├── quiz_generator.py # Gemini AI quiz generation
│   ├── create_demo_pdf.py # Demo PDF generator
│   ├── requirements.txt
│   └── .env              # Your API key (create from .env.example)
│
└── frontend/             # React + Vite
    ├── src/
    │   ├── App.jsx        # Main orchestrator
    │   ├── UploadZone.jsx # Drag-and-drop PDF upload
    │   ├── Quiz.jsx       # Interactive quiz interface
    │   └── Results.jsx    # Score & review screen
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

### 2. Configure your Gemini API Key

```bash
cp .env.example .env
```

Get a free API key at: https://aistudio.google.com/apikey

### 3. Start the Backend

```bash
cd backend
source venv/bin/activate
python main.py
# Server runs at http://localhost:8000
# Swagger docs at http://localhost:8000/docs
```

### 4. Start the Frontend

```bash
cd frontend
npm install
npm run dev
# App runs at http://localhost:5173
```

### 5. Demo PDF

A demo PDF about the East India Company is included for testing:
```bash
cd backend
python create_demo_pdf.py  # Generates demo_document.pdf
```

## 🎯 Features

- **Drag & Drop Upload** — Drop any PDF to get started
- **AI Quiz Generation** — Powered by Google Gemini 2.0 Flash
- **Configurable Questions** — Choose 3, 5, 7, 10, or 15 questions
- **Interactive Quiz UI** — One question at a time with smooth transitions
- **Instant Feedback** — See correct/incorrect immediately with explanations
- **Score Dashboard** — Animated score ring with full review
- **Error Handling** — Graceful messages for unreadable PDFs or API issues
- **Loading States** — Multi-step loading animation while AI generates

## 🔑 API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET`  | `/` | Health check |
| `GET`  | `/health` | Health status |
| `POST` | `/api/generate-quiz` | Upload PDF & generate quiz |

### POST `/api/generate-quiz`

**Parameters:**
- `file` (form-data): PDF file (max 10 MB)
- `num_questions` (query): Number of questions (1-20, default 5)

**Response:**
```json
{
  "filename": "document.pdf",
  "num_questions": 5,
  "questions": [
    {
      "question": "What year was the East India Company founded?",
      "options": ["1598", "1600", "1602", "1610"],
      "correct_index": 1,
      "explanation": "The East India Company was founded in 1600 by royal charter of Queen Elizabeth I."
    }
  ]
}
```
