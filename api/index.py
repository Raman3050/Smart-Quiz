"""Vercel Serverless Entry Point — exposes the FastAPI ASGI app."""

import sys
from pathlib import Path

# Add the backend directory to the Python path so all imports resolve
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from main import app  # noqa: E402
