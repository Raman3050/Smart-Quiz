"""
Generate a sample PDF for demo purposes.
Run: python create_demo_pdf.py
"""

try:
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
    from reportlab.lib.units import inch
    HAS_REPORTLAB = True
except ImportError:
    HAS_REPORTLAB = False

DEMO_TEXT = """
The Rise and Fall of the East India Company: A Study in Corporate Power

Chapter 1: Origins of Global Trade

The British East India Company, founded in 1600 by royal charter of Queen Elizabeth I, began as a modest trading venture seeking to profit from the lucrative spice trade with Asia. Initially capitalized at just £72,000 — roughly £14 million in today's money — it was one of the world's first joint-stock companies, a revolutionary financial innovation that allowed investors to pool capital while limiting individual risk.

The company's early years were marked by fierce competition with the Dutch East India Company (VOC), which had been established in 1602 with significantly greater capital. The Dutch dominated the Spice Islands (modern-day Indonesia), forcing the British to pivot their focus toward the Indian subcontinent. This strategic redirection would prove to be one of the most consequential business decisions in world history.

Chapter 2: The Transformation from Trader to Ruler

By the mid-18th century, the East India Company had undergone a remarkable transformation. What began as a commercial enterprise gradually evolved into a quasi-governmental entity that administered vast territories, maintained its own army, and collected taxes from millions of subjects.

The Battle of Plassey in 1757 marked a pivotal turning point. Robert Clive's victory over the Nawab of Bengal, achieved partly through bribery and diplomatic manipulation, gave the Company effective control over one of India's wealthiest provinces. The subsequent grant of Diwani (tax collection rights) in 1765 by the Mughal Emperor transformed the Company from a trading body into a territorial power.

This unprecedented accumulation of corporate power raises profound questions about the relationship between commerce and governance. Can a profit-driven entity ever be trusted to govern fairly? The Company's record suggests not: famines, exploitation, and the systematic destruction of local industries became hallmarks of its rule.

Chapter 3: Economic Impact and the Drain Theory

Indian economist Dadabhai Naoroji first articulated the "Drain Theory" in 1867, arguing that British colonial rule was systematically transferring wealth from India to Britain with no equivalent return. Modern estimates suggest that approximately $45 trillion was extracted from India between 1765 and 1938 (adjusted for present values).

The destruction of India's textile industry provides a stark example. India had been the world's largest producer of fine cotton textiles, accounting for roughly 25% of global manufacturing output in 1750. By 1900, this share had fallen to less than 2%, as British policies deliberately favored Manchester's mills over Indian weavers.

The Company also introduced the permanent settlement system in Bengal (1793), which created a new class of landlords (zamindars) with little incentive to invest in agricultural improvement. This system contributed to recurring famines, the most devastating being the Great Bengal Famine of 1770, which killed an estimated 10 million people — roughly one-third of Bengal's population.

Chapter 4: Lessons for Modern Corporate Governance

The story of the East India Company offers several critical lessons for contemporary discussions about corporate power and regulation:

1. The Danger of Regulatory Capture: The Company repeatedly manipulated Parliament and the Crown to maintain its privileges, demonstrating how large corporations can subvert democratic oversight.

2. The Moral Hazard of Limited Liability: While limited liability encouraged investment, it also insulated shareholders from the consequences of corporate decisions that affected millions of lives.

3. The Importance of Stakeholder Theory: The Company's singular focus on shareholder returns, to the exclusion of all other stakeholders, produced catastrophic outcomes for the societies it governed.

4. Corporate Monopolies and Market Distortion: The Company's monopoly privileges allowed it to manipulate prices, destroy competitors, and extract rents that far exceeded what a competitive market would have allowed.

5. The Need for Transparency: The Company's accounting practices were deliberately opaque, making it nearly impossible for outsiders to assess the true costs and benefits of its operations.

These lessons remain remarkably relevant in an era of tech giants, multinational corporations, and ongoing debates about the proper scope of corporate influence in democratic societies.
"""


def create_pdf():
    if HAS_REPORTLAB:
        doc = SimpleDocTemplate(
            "demo_document.pdf",
            pagesize=A4,
            rightMargin=72,
            leftMargin=72,
            topMargin=72,
            bottomMargin=72,
        )

        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CustomTitle', parent=styles['Title'], fontSize=18, spaceAfter=20
        )
        body_style = ParagraphStyle(
            'CustomBody', parent=styles['Normal'], fontSize=11, leading=16, spaceAfter=10
        )

        story = []
        for paragraph in DEMO_TEXT.strip().split('\n\n'):
            p = paragraph.strip()
            if not p:
                continue
            if p.startswith('Chapter') or p.startswith('The Rise'):
                story.append(Paragraph(p, title_style))
            else:
                story.append(Paragraph(p, body_style))
            story.append(Spacer(1, 0.15 * inch))

        doc.build(story)
        print("✅ Created demo_document.pdf successfully!")
    else:
        # Fallback: create a simple text file renamed to PDF (for testing extraction)
        print("⚠️  reportlab not installed. Creating a plain-text demo file instead.")
        print("   Install reportlab: pip install reportlab")
        with open("demo_document.txt", "w") as f:
            f.write(DEMO_TEXT)
        print("✅ Created demo_document.txt — copy its content for testing via Swagger UI.")


if __name__ == "__main__":
    create_pdf()
