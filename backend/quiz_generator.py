"""
AI Quiz Generator Module
Uses the Groq API (Llama 3.3 70B) to generate structured quiz questions from text content.
Fast inference, generous free tier (14,400 requests/day).
"""

import json
import os
from groq import Groq
from dotenv import load_dotenv

SYSTEM_PROMPT = """You are an expert quiz master and educator specializing in competitive exam preparation.

Your task is to analyze the provided text and generate high-quality multiple-choice quiz questions.

STRICT RULES:
1. Generate exactly the number of questions requested (default: 5).
2. Questions should test logical reasoning, comprehension, and critical thinking — not just rote memorization.
3. Each question must have exactly 4 options (A, B, C, D).
4. Only ONE option should be correct.
5. The incorrect options (distractors) should be plausible to prevent easy elimination.
6. Provide a clear, concise explanation for why the correct answer is right.
7. Questions should cover different sections/topics of the provided text for variety.

OUTPUT FORMAT — You must return ONLY a valid JSON array, with no extra text, no markdown fences, no commentary. Each element in the array must be an object with exactly these keys:

[
  {
    "question": "The question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_index": 0,
    "explanation": "Brief explanation of why this answer is correct."
  }
]

Where correct_index is 0-based (0=A, 1=B, 2=C, 3=D).

IMPORTANT: Return ONLY the JSON array. No preamble, no closing remarks, no markdown code fences."""


DIFFICULTY_INSTRUCTIONS = {
    "easy": (
        "DIFFICULTY: EASY\n"
        "- Ask straightforward factual recall questions.\n"
        "- Distractors should be clearly different from the correct answer.\n"
        "- Focus on main ideas and obvious facts from the text.\n"
        "- Questions should be answerable by someone who read the text once."
    ),
    "medium": (
        "DIFFICULTY: MEDIUM\n"
        "- Ask questions that require understanding and connecting ideas.\n"
        "- Include some inference-based questions.\n"
        "- Distractors should be plausible but distinguishable with careful thought.\n"
        "- Mix factual recall with comprehension and application questions."
    ),
    "hard": (
        "DIFFICULTY: HARD\n"
        "- Ask questions requiring deep analysis, critical thinking, and inference.\n"
        "- Distractors should be highly plausible and require careful reasoning to eliminate.\n"
        "- Include questions about implications, comparisons, and logical conclusions.\n"
        "- Test the ability to synthesize information from multiple parts of the text."
    ),
}


def generate_quiz(text: str, num_questions: int = 5, difficulty: str = "medium") -> list[dict]:
    """
    Generate quiz questions from the provided text using Groq AI (Llama 3.3 70B).
    
    Args:
        text: The extracted text content from a document.
        num_questions: Number of questions to generate (default: 5).
        difficulty: Question difficulty level — 'easy', 'medium', or 'hard'.
        
    Returns:
        List of question dictionaries.
        
    Raises:
        RuntimeError: If the AI fails to generate valid quiz data.
    """
    # Load API key fresh each call
    load_dotenv()
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError(
            "Groq API key not found. Please set GROQ_API_KEY in backend/.env"
        )

    client = Groq(api_key=api_key)

    # Truncate very long texts to stay within token limits
    max_chars = 25000
    if len(text) > max_chars:
        text = text[:max_chars] + "\n\n[Text truncated for processing...]"

    diff_instruction = DIFFICULTY_INSTRUCTIONS.get(difficulty, DIFFICULTY_INSTRUCTIONS["medium"])

    user_prompt = (
        f"{diff_instruction}\n\n"
        f"Generate exactly {num_questions} multiple-choice quiz questions "
        f"based on the following text:\n\n---\n{text}\n---\n\n"
        f"Remember: Output ONLY the JSON array, nothing else."
    )

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.7,
            max_tokens=4096,
            response_format={"type": "json_object"},
        )

        raw_text = response.choices[0].message.content.strip()

        # Strip markdown code fences if the model adds them
        if raw_text.startswith("```"):
            lines = raw_text.split("\n")
            lines = [l for l in lines if not l.strip().startswith("```")]
            raw_text = "\n".join(lines).strip()

        parsed = json.loads(raw_text)

        # Handle case where model wraps array in an object like {"questions": [...]}
        if isinstance(parsed, dict):
            # Find the first list value in the dict
            for key, val in parsed.items():
                if isinstance(val, list):
                    parsed = val
                    break
            else:
                raise ValueError("Response JSON object contains no question array.")

        questions = parsed

        # Validate structure
        if not isinstance(questions, list):
            raise ValueError("Response is not a JSON array.")

        for i, q in enumerate(questions):
            required_keys = {"question", "options", "correct_index", "explanation"}
            missing = required_keys - set(q.keys())
            if missing:
                raise ValueError(f"Question {i + 1} is missing keys: {missing}")
            if not isinstance(q["options"], list) or len(q["options"]) != 4:
                raise ValueError(f"Question {i + 1} must have exactly 4 options.")
            if not isinstance(q["correct_index"], int) or q["correct_index"] not in range(4):
                raise ValueError(f"Question {i + 1} has an invalid correct_index.")

        return questions

    except json.JSONDecodeError as e:
        raise RuntimeError(
            f"The AI returned invalid JSON. This is a temporary issue — please try again. "
            f"Details: {str(e)}"
        )
    except Exception as e:
        if isinstance(e, RuntimeError):
            raise
        raise RuntimeError(f"Quiz generation failed: {str(e)}")
