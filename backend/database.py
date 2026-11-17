"""
Smart Quiz — SQLite Database Module
Manages quiz persistence and student submission tracking.
"""

import json
import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path

# Use /tmp on Vercel (serverless filesystem is read-only except /tmp)
import os

if os.environ.get("VERCEL"):
    DB_PATH = Path("/tmp/smart_quiz.db")
else:
    DB_PATH = Path(__file__).parent / "smart_quiz.db"


def _get_connection() -> sqlite3.Connection:
    """Return a connection with row_factory set to sqlite3.Row."""
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db() -> None:
    """Create the quizzes and submissions tables if they don't already exist."""
    conn = _get_connection()
    try:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS quizzes (
                id          TEXT PRIMARY KEY,
                title       TEXT NOT NULL,
                difficulty  TEXT DEFAULT 'medium',
                created_at  TEXT,
                questions_json TEXT
            );

            CREATE TABLE IF NOT EXISTS submissions (
                id            TEXT PRIMARY KEY,
                quiz_id       TEXT REFERENCES quizzes(id),
                student_name  TEXT NOT NULL,
                student_email TEXT,
                answers_json  TEXT,
                score         INTEGER,
                total         INTEGER,
                submitted_at  TEXT
            );
            """
        )
        conn.commit()
    finally:
        conn.close()


def save_quiz(title: str, difficulty: str, questions: list) -> str:
    """
    Persist a new quiz and return its generated UUID.

    Args:
        title: Human-readable quiz title.
        difficulty: One of 'easy', 'medium', 'hard'.
        questions: List of question dicts (serialised as JSON).

    Returns:
        The new quiz's UUID string.
    """
    quiz_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc).isoformat()
    conn = _get_connection()
    try:
        conn.execute(
            "INSERT INTO quizzes (id, title, difficulty, created_at, questions_json) "
            "VALUES (?, ?, ?, ?, ?)",
            (quiz_id, title, difficulty, created_at, json.dumps(questions)),
        )
        conn.commit()
    finally:
        conn.close()
    return quiz_id


def get_quiz(quiz_id: str) -> dict | None:
    """
    Fetch a single quiz by ID.

    Returns:
        A dict with quiz fields (questions already parsed), or None if not found.
    """
    conn = _get_connection()
    try:
        row = conn.execute("SELECT * FROM quizzes WHERE id = ?", (quiz_id,)).fetchone()
        if row is None:
            return None
        return {
            "id": row["id"],
            "title": row["title"],
            "difficulty": row["difficulty"],
            "created_at": row["created_at"],
            "questions": json.loads(row["questions_json"]) if row["questions_json"] else [],
        }
    finally:
        conn.close()


def list_quizzes() -> list[dict]:
    """Return all quizzes (without full question bodies) ordered newest first."""
    conn = _get_connection()
    try:
        rows = conn.execute(
            "SELECT id, title, difficulty, created_at, questions_json FROM quizzes ORDER BY created_at DESC"
        ).fetchall()
        results = []
        for row in rows:
            questions = json.loads(row["questions_json"]) if row["questions_json"] else []
            results.append(
                {
                    "id": row["id"],
                    "title": row["title"],
                    "difficulty": row["difficulty"],
                    "created_at": row["created_at"],
                    "num_questions": len(questions),
                }
            )
        return results
    finally:
        conn.close()


def save_submission(
    quiz_id: str,
    student_name: str,
    student_email: str | None,
    answers: list,
    score: int,
    total: int,
) -> str:
    """
    Record a student's quiz submission and return the submission UUID.
    """
    submission_id = str(uuid.uuid4())
    submitted_at = datetime.now(timezone.utc).isoformat()
    conn = _get_connection()
    try:
        conn.execute(
            "INSERT INTO submissions (id, quiz_id, student_name, student_email, answers_json, score, total, submitted_at) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (
                submission_id,
                quiz_id,
                student_name,
                student_email,
                json.dumps(answers),
                score,
                total,
                submitted_at,
            ),
        )
        conn.commit()
    finally:
        conn.close()
    return submission_id


def get_submissions(quiz_id: str) -> list[dict]:
    """Return all submissions for a given quiz, newest first."""
    conn = _get_connection()
    try:
        rows = conn.execute(
            "SELECT * FROM submissions WHERE quiz_id = ? ORDER BY submitted_at DESC",
            (quiz_id,),
        ).fetchall()
        return [
            {
                "id": row["id"],
                "quiz_id": row["quiz_id"],
                "student_name": row["student_name"],
                "student_email": row["student_email"],
                "answers": json.loads(row["answers_json"]) if row["answers_json"] else [],
                "score": row["score"],
                "total": row["total"],
                "submitted_at": row["submitted_at"],
            }
            for row in rows
        ]
    finally:
        conn.close()
