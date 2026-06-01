"""
Smart Quiz — FastAPI Backend
Handles PDF uploads, text extraction, and AI-powered quiz generation.
"""

from enum import Enum
from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pdf_extractor import extract_text_from_pdf
from quiz_generator import generate_quiz

app = FastAPI(
    title="Smart Quiz API",
    description="Upload a PDF and get AI-generated quiz questions for competitive exam prep.",
    version="1.0.0",
)

# --- CORS Configuration ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "http://127.0.0.1:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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
    difficulty: str = Query(default="medium", regex="^(easy|medium|hard)$", description="Question difficulty level"),
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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
