"""
Paper Analyzer Module
Analyzes multiple question papers (as extracted text) to identify
high-probability topics using AI (Groq).
"""

import json
import logging
import os
from groq import Groq
from dotenv import load_dotenv

logger = logging.getLogger("uvicorn.error")

SYSTEM_PROMPT = """You are an expert academic analyst specializing in exam pattern analysis and prediction.

Your task is to analyze multiple question papers provided by the user and identify the most frequently
occurring topics and themes across them.

STRICT RULES:
1. Identify the exact number of topics requested by the user.
2. Rank topics by how frequently they appear across the papers.
3. Estimate the probability (0-100%) of each topic appearing in a future exam based on historical frequency.
4. Assign an importance level: "high", "medium", or "low".
5. Provide 2-3 sample multiple-choice questions for each topic.
6. Each sample question must have exactly 4 options and a correct_index (0-based).

OUTPUT FORMAT — Return a valid JSON object:
{
  "topics": [
    {
      "topic": "Topic Name",
      "probability": 85,
      "frequency": "Appeared in 4 out of 5 papers",
      "importance": "high",
      "sample_questions": [
        {
          "question": "Sample question text?",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correct_index": 0
        }
      ]
    }
  ]
}

Do not include markdown code fences or conversational text."""

# Supported Groq chat models in priority order (same as quiz_generator)
DEFAULT_MODELS = [
    "openai/gpt-oss-120b",
    "qwen/qwen3.8-27b",
    "openai/gpt-oss-20b",
]


def analyze_papers(texts: list[str], num_topics: int = 10) -> list[dict]:
    """
    Analyze multiple question-paper texts and return high-probability topics.

    Args:
        texts: List of extracted text strings, one per PDF.
        num_topics: Number of topics to identify.

    Returns:
        List of topic dicts with keys: topic, probability, frequency,
        importance, sample_questions.

    Raises:
        RuntimeError: If the AI fails to produce valid analysis.
    """
    load_dotenv()
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError(
            "Groq API key not found. Please set GROQ_API_KEY in backend/.env"
        )

    client = Groq(api_key=api_key)

    # Build candidate model list
    env_model = os.getenv("GROQ_MODEL")
    candidate_models: list[str] = []
    if env_model:
        candidate_models.append(env_model)
    for model in DEFAULT_MODELS:
        if model not in candidate_models:
            candidate_models.append(model)

    # Prepare combined text of all papers
    combined_parts: list[str] = []
    for idx, text in enumerate(texts, 1):
        # Truncate individual papers to stay within token limits
        max_per_paper = 15000
        truncated = text[:max_per_paper] + ("\n[Text truncated...]" if len(text) > max_per_paper else "")
        combined_parts.append(f"=== PAPER {idx} ===\n{truncated}")

    combined_text = "\n\n".join(combined_parts)

    user_prompt = (
        f"Analyze the following {len(texts)} question papers and identify the top {num_topics} "
        f"most important and frequently recurring topics.\n\n"
        f"{combined_text}\n\n"
        f"Remember: Output a JSON object with a 'topics' array containing exactly {num_topics} topics."
    )

    last_error = None
    response_content = None

    for model_name in candidate_models:
        try:
            logger.info(f"Attempting paper analysis with model: {model_name}")
            response = client.chat.completions.create(
                model=model_name,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.7,
                max_tokens=4096,
                response_format={"type": "json_object"},
            )
            response_content = response.choices[0].message.content.strip()
            if response_content:
                logger.info(f"Successfully analysed papers using {model_name}")
                break
        except Exception as e:
            logger.warning(f"Model {model_name} failed: {e}. Trying next fallback...")
            last_error = e

    if not response_content:
        raise RuntimeError(f"Paper analysis failed: {str(last_error)}")

    # Parse and validate the response
    try:
        raw_text = response_content

        # Strip markdown code fences if present
        if raw_text.startswith("```"):
            lines = raw_text.split("\n")
            lines = [l for l in lines if not l.strip().startswith("```")]
            raw_text = "\n".join(lines).strip()

        parsed = json.loads(raw_text)

        # Extract topics array
        if isinstance(parsed, dict):
            if "topics" in parsed and isinstance(parsed["topics"], list):
                topics = parsed["topics"]
            else:
                # Find the first list value
                topics = None
                for val in parsed.values():
                    if isinstance(val, list):
                        topics = val
                        break
                if topics is None:
                    raise ValueError("Response JSON contains no topics array.")
        elif isinstance(parsed, list):
            topics = parsed
        else:
            raise ValueError("Unexpected JSON structure in response.")

        # Validate structure of each topic
        for i, t in enumerate(topics):
            if "topic" not in t:
                raise ValueError(f"Topic {i + 1} is missing 'topic' field.")
            # Ensure defaults
            t.setdefault("probability", 0)
            t.setdefault("frequency", "Unknown")
            t.setdefault("importance", "medium")
            t.setdefault("sample_questions", [])

            # Validate sample questions
            for j, sq in enumerate(t["sample_questions"]):
                if "question" not in sq:
                    raise ValueError(f"Topic {i + 1}, sample question {j + 1} missing 'question'.")
                sq.setdefault("options", [])
                sq.setdefault("correct_index", 0)

        return topics

    except json.JSONDecodeError as e:
        raise RuntimeError(
            f"The AI returned invalid JSON. This is a temporary issue — please try again. "
            f"Details: {str(e)}"
        )
    except Exception as e:
        if isinstance(e, RuntimeError):
            raise
        raise RuntimeError(f"Paper analysis failed: {str(e)}")
