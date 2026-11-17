"""
Vercel Serverless Entry Point
Exposes the FastAPI app for Vercel's Python runtime.
"""

import sys
from pathlib import Path

# Add the backend directory to the Python path so all imports resolve
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from main import app  # noqa: E402

# Vercel looks for an `app` variable — the FastAPI instance is already named `app`
# in main.py, so re-exporting it here is all that's needed.
