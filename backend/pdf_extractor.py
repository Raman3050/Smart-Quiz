"""
PDF Text Extraction Module
Extracts text content from uploaded PDF files using pdfplumber.
"""

import pdfplumber
import io


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """
    Extract all text content from a PDF file.
    
    Args:
        file_bytes: Raw bytes of the PDF file.
        
    Returns:
        Concatenated text from all pages.
        
    Raises:
        ValueError: If the PDF is empty or unreadable.
    """
    text_parts = []

    try:
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            if len(pdf.pages) == 0:
                raise ValueError("The uploaded PDF has no pages.")

            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(page_text.strip())

    except Exception as e:
        if "password" in str(e).lower() or "encrypt" in str(e).lower():
            raise ValueError("This PDF is password-protected and cannot be processed.")
        if isinstance(e, ValueError):
            raise
        raise ValueError(f"Failed to read the PDF file: {str(e)}")

    full_text = "\n\n".join(text_parts)

    if not full_text.strip():
        raise ValueError(
            "No readable text found in the PDF. "
            "The file may contain only images or scanned content."
        )

    return full_text
