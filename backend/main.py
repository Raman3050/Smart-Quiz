"""
Smart Quiz — FastAPI Backend
Handles PDF uploads, text extraction, AI-powered quiz generation,
paper analysis, quiz persistence, student submissions, and results export.
"""

import io
import json
from typing import List, Optional

from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from pdf_extractor import extract_text_from_pdf
from quiz_generator import generate_quiz
from database import init_db, save_quiz, get_quiz, list_quizzes, save_submission, get_submissions
from paper_analyzer import analyze_papers

app = FastAPI(
    title="Smart Quiz API",
    description="Upload a PDF and get AI-generated quiz questions for competitive exam prep.",
    version="1.0.0",
)

# --- CORS Configuration ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Pydantic Models ---

class QuestionModel(BaseModel):
    question: str
    options: List[str]
    correct_index: int
    explanation: Optional[str] = None


class SaveQuizRequest(BaseModel):
    title: str
    difficulty: str = "medium"
    questions: List[dict]


class AnswerItem(BaseModel):
    question_index: int
    selected_option: int


class SubmitQuizRequest(BaseModel):
    student_name: str
    student_email: Optional[str] = None
    answers: List[AnswerItem]


# --- Startup ---

@app.on_event("startup")
async def startup_event():
    """Initialise the database on application startup."""
    init_db()


# --- Phase 1: Health Check ---

@app.get("/", tags=["Health"])
async def root():
    """Health-check endpoint."""
    return {"status": "ok", "message": "Smart Quiz API is running 🚀"}


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "healthy"}


# --- Phase 3: Upload & Generate ---

@app.post("/api/generate-quiz", tags=["Quiz"])
async def generate_quiz_endpoint(
    file: UploadFile = File(...),
    num_questions: int = Query(default=5, ge=1, le=20, description="Number of questions to generate"),
    difficulty: str = Query(default="medium", pattern="^(easy|medium|hard)$", description="Question difficulty level"),
):
    """
    Upload a PDF file and receive AI-generated quiz questions.

    - **file**: A PDF document to extract content from.
    - **num_questions**: Number of quiz questions to generate (1-20, default 5).
    - **difficulty**: Difficulty level — easy, medium, or hard.
    """
    # Validate file type
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are accepted. Please upload a .pdf file.",
        )

    # Read file contents
    try:
        contents = await file.read()
    except Exception:
        raise HTTPException(status_code=400, detail="Failed to read the uploaded file.")

    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")

    # Cap file size at 10 MB
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="File too large. Maximum size is 10 MB.",
        )

    # Step 1: Extract text
    try:
        text = extract_text_from_pdf(contents)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    # Step 2: Generate quiz via AI
    try:
        questions = generate_quiz(text, num_questions=num_questions, difficulty=difficulty)
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=str(e))

    return {
        "filename": file.filename,
        "num_questions": len(questions),
        "questions": questions,
    }


# --- Paper Analysis ---

@app.post("/api/analyze-papers", tags=["Paper Analysis"])
async def analyze_papers_endpoint(
    files: List[UploadFile] = File(...),
    num_topics: int = Query(default=10, ge=1, le=30, description="Number of topics to identify"),
):
    """
    Upload multiple PDF question papers and get high-probability topic analysis.
    """
    if not files:
        raise HTTPException(status_code=400, detail="At least one PDF file is required.")

    filenames: List[str] = []
    texts: List[str] = []

    for f in files:
        if not f.filename.lower().endswith(".pdf"):
            raise HTTPException(
                status_code=400,
                detail=f"Only PDF files are accepted. '{f.filename}' is not a PDF.",
            )

        try:
            contents = await f.read()
        except Exception:
            raise HTTPException(status_code=400, detail=f"Failed to read file: {f.filename}")

        if len(contents) == 0:
            raise HTTPException(status_code=400, detail=f"File '{f.filename}' is empty.")

        if len(contents) > 10 * 1024 * 1024:
            raise HTTPException(
                status_code=400,
                detail=f"File '{f.filename}' is too large. Maximum size is 10 MB.",
            )

        try:
            text = extract_text_from_pdf(contents)
        except ValueError as e:
            raise HTTPException(status_code=422, detail=f"Error processing '{f.filename}': {str(e)}")

        filenames.append(f.filename)
        texts.append(text)

    try:
        topics = analyze_papers(texts, num_topics=num_topics)
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=str(e))

    return {
        "filenames": filenames,
        "num_files": len(filenames),
        "topics": topics,
    }


# --- Quiz CRUD ---

@app.post("/api/quizzes", tags=["Quizzes"])
async def create_quiz(payload: SaveQuizRequest):
    """Save a generated quiz to the database for sharing."""
    quiz_id = save_quiz(payload.title, payload.difficulty, payload.questions)
    quiz = get_quiz(quiz_id)
    return {
        "quiz_id": quiz["id"],
        "title": quiz["title"],
        "difficulty": quiz["difficulty"],
        "created_at": quiz["created_at"],
        "num_questions": len(quiz["questions"]),
        "share_url": f"/quiz/{quiz['id']}",
    }


@app.get("/api/quizzes", tags=["Quizzes"])
async def get_all_quizzes():
    """List all saved quizzes."""
    return {"quizzes": list_quizzes()}


@app.get("/api/quizzes/{quiz_id}", tags=["Quizzes"])
async def get_quiz_by_id(quiz_id: str):
    """Retrieve a single quiz by ID."""
    quiz = get_quiz(quiz_id)
    if quiz is None:
        raise HTTPException(status_code=404, detail="Quiz not found.")
    return {
        "quiz_id": quiz["id"],
        "title": quiz["title"],
        "difficulty": quiz["difficulty"],
        "created_at": quiz["created_at"],
        "questions": quiz["questions"],
    }


# --- Submissions ---

@app.post("/api/quizzes/{quiz_id}/submit", tags=["Submissions"])
async def submit_quiz(quiz_id: str, payload: SubmitQuizRequest):
    """Submit answers for a quiz and get a score."""
    quiz = get_quiz(quiz_id)
    if quiz is None:
        raise HTTPException(status_code=404, detail="Quiz not found.")

    questions = quiz["questions"]
    total = len(questions)
    score = 0

    for answer in payload.answers:
        idx = answer.question_index
        if 0 <= idx < total:
            correct_index = questions[idx].get("correct_index")
            if answer.selected_option == correct_index:
                score += 1

    submission_id = save_submission(
        quiz_id=quiz_id,
        student_name=payload.student_name,
        student_email=payload.student_email,
        answers=[a.model_dump() for a in payload.answers],
        score=score,
        total=total,
    )

    percentage = round((score / total) * 100, 1) if total > 0 else 0.0

    return {
        "submission_id": submission_id,
        "student_name": payload.student_name,
        "score": score,
        "total": total,
        "percentage": percentage,
    }


# --- Results ---

@app.get("/api/quizzes/{quiz_id}/results", tags=["Results"])
async def get_quiz_results(quiz_id: str):
    """Get all submissions / results for a quiz."""
    quiz = get_quiz(quiz_id)
    if quiz is None:
        raise HTTPException(status_code=404, detail="Quiz not found.")

    submissions = get_submissions(quiz_id)
    results = []
    for s in submissions:
        total = s["total"] if s["total"] else 0
        score = s["score"] if s["score"] else 0
        percentage = round((score / total) * 100, 1) if total > 0 else 0.0
        results.append({
            "student_name": s["student_name"],
            "student_email": s["student_email"],
            "score": score,
            "total": total,
            "percentage": percentage,
            "submitted_at": s["submitted_at"],
        })

    return {
        "quiz_id": quiz_id,
        "title": quiz["title"],
        "total_submissions": len(results),
        "results": results,
    }


@app.get("/api/quizzes/{quiz_id}/results/export", tags=["Results"])
async def export_quiz_results(quiz_id: str):
    """Export quiz results as an Excel (.xlsx) file."""
    from openpyxl import Workbook
    from openpyxl.styles import Font, Alignment, PatternFill

    quiz = get_quiz(quiz_id)
    if quiz is None:
        raise HTTPException(status_code=404, detail="Quiz not found.")

    submissions = get_submissions(quiz_id)
    questions = quiz["questions"]
    num_questions = len(questions)

    wb = Workbook()
    ws = wb.active
    ws.title = "Results"

    # Header row
    headers = ["Rank", "Student Name", "Email", "Score", "Total", "Percentage", "Submitted At"]
    for qi in range(num_questions):
        headers.append(f"Q{qi + 1}")

    header_font = Font(bold=True, color="FFFFFF")
    header_fill = PatternFill(start_color="4472C4", end_color="4472C4", fill_type="solid")

    for col_idx, header in enumerate(headers, 1):
        cell = ws.cell(row=1, column=col_idx, value=header)
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = Alignment(horizontal="center")

    # Sort submissions by score descending for ranking
    sorted_submissions = sorted(submissions, key=lambda x: x["score"] if x["score"] else 0, reverse=True)

    for rank, s in enumerate(sorted_submissions, 1):
        total = s["total"] if s["total"] else 0
        score = s["score"] if s["score"] else 0
        percentage = round((score / total) * 100, 1) if total > 0 else 0.0

        row_data = [
            rank,
            s["student_name"],
            s["student_email"] or "",
            score,
            total,
            f"{percentage}%",
            s["submitted_at"] or "",
        ]

        # Determine per-question correctness
        answers = s.get("answers", [])
        answer_map = {}
        for ans in answers:
            if isinstance(ans, dict):
                answer_map[ans.get("question_index")] = ans.get("selected_option")

        for qi in range(num_questions):
            selected = answer_map.get(qi)
            if selected is not None and qi < len(questions):
                correct = questions[qi].get("correct_index")
                row_data.append("✓" if selected == correct else "✗")
            else:
                row_data.append("—")

        for col_idx, value in enumerate(row_data, 1):
            ws.cell(row=rank + 1, column=col_idx, value=value)

    # Auto-adjust column widths
    for col in ws.columns:
        max_length = 0
        col_letter = col[0].column_letter
        for cell in col:
            try:
                if cell.value:
                    max_length = max(max_length, len(str(cell.value)))
            except Exception:
                pass
        ws.column_dimensions[col_letter].width = min(max_length + 3, 40)

    # Save to bytes
    output = io.BytesIO()
    wb.save(output)
    output.seek(0)

    safe_title = quiz["title"].replace(" ", "_").replace("/", "_")
    filename = f"{safe_title}_results.xlsx"

    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
