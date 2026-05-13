"""
Helper utilities for PDF generation, voice synthesis, and trend graphs
"""
import os
import uuid
from datetime import datetime, timedelta
from typing import Optional, Tuple
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from gtts import gTTS
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
from io import BytesIO
import base64
import re

_ASSET_NAME = re.compile(r"^[A-Za-z0-9._-]+\.(pdf|mp3|png)$", re.IGNORECASE)


def safe_asset_path(directory: str, filename: str) -> Tuple[str, str]:
    """
    Resolve a path inside directory only (prevents path traversal).
    Returns (full_path, basename).
    """
    base = os.path.basename(str(filename).strip())
    if not base or not _ASSET_NAME.match(base):
        raise ValueError("Invalid filename")
    root = os.path.realpath(directory)
    os.makedirs(root, exist_ok=True)
    full = os.path.realpath(os.path.join(root, base))
    if not full.startswith(root + os.sep) and full != root:
        raise ValueError("Invalid file path")
    return full, base


def cleanup_old_generated_files(
    max_age_hours: int = 24,
    subdirs: Tuple[str, ...] = ("reports", "audio", "graphs"),
) -> int:
    """Delete files older than max_age_hours in generated asset folders. Returns count removed."""
    cutoff = datetime.now() - timedelta(hours=max_age_hours)
    removed = 0
    for d in subdirs:
        if not os.path.isdir(d):
            continue
        for name in os.listdir(d):
            path = os.path.join(d, name)
            if not os.path.isfile(path):
                continue
            try:
                mtime = datetime.fromtimestamp(os.path.getmtime(path))
                if mtime < cutoff:
                    os.remove(path)
                    removed += 1
            except OSError:
                continue
    return removed


def generate_pdf_report(content: str, title: str = "Daily News Report", output_path: Optional[str] = None) -> str:
    """Generate a PDF report from text content"""
    if output_path is None:
        output_path = f"reports/news_report_{uuid.uuid4().hex}.pdf"
    
    # Create directory if it doesn't exist
    os.makedirs(os.path.dirname(output_path) if os.path.dirname(output_path) else "reports", exist_ok=True)
    
    doc = SimpleDocTemplate(output_path, pagesize=A4)
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor='#1a1a1a',
        spaceAfter=30,
        alignment=TA_CENTER
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=16,
        textColor='#2563eb',
        spaceAfter=12,
        spaceBefore=12
    )
    
    # Build PDF content
    story = []
    story.append(Paragraph(title, title_style))
    story.append(Spacer(1, 0.2*inch))
    story.append(Paragraph(f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", styles['Normal']))
    story.append(Spacer(1, 0.3*inch))
    
    # Split content into paragraphs
    paragraphs = content.split('\n\n')
    for para in paragraphs:
        if para.strip():
            if para.startswith('#') or para.startswith('##'):
                # Heading
                text = para.lstrip('#').strip()
                story.append(Paragraph(text, heading_style))
            else:
                story.append(Paragraph(para, styles['Normal']))
            story.append(Spacer(1, 0.1*inch))
    
    doc.build(story)
    return output_path

def generate_voice_summary(text: str, language: str = "en", output_path: Optional[str] = None) -> str:
    """Generate MP3 voice summary from text"""
    if output_path is None:
        output_path = f"audio/voice_summary_{uuid.uuid4().hex}.mp3"
    
    # Create directory if it doesn't exist
    os.makedirs(os.path.dirname(output_path) if os.path.dirname(output_path) else "audio", exist_ok=True)
    
    # Language mapping
    lang_map = {
        "english": "en",
        "urdu": "ur",
        "bilingual": "ur",  # SRS: Urdu audio for bilingual; caller passes Urdu script
        "en": "en",
        "ur": "ur",
    }

    lang_code = lang_map.get((language or "english").lower(), "en")
    snippet = (text or "")[:5000]
    if not snippet.strip():
        raise ValueError("No text available for voice synthesis")
    try:
        tts = gTTS(text=snippet, lang=lang_code, slow=False)
        tts.save(output_path)
    except Exception as e:
        raise RuntimeError(f"gTTS audio generation failed: {e}") from e

    return output_path

def generate_trend_graph(data: dict, output_path: Optional[str] = None) -> str:
    """Generate a trend graph from data"""
    if output_path is None:
        output_path = f"graphs/trend_graph_{uuid.uuid4().hex}.png"
    
    # Create directory if it doesn't exist
    os.makedirs(os.path.dirname(output_path) if os.path.dirname(output_path) else "graphs", exist_ok=True)
    
    plt.figure(figsize=(12, 6))
    
    # Example: Plot trend data
    if isinstance(data, dict) and 'dates' in data and 'values' in data:
        dates = [datetime.strptime(d, '%Y-%m-%d') for d in data['dates']]
        plt.plot(dates, data['values'], marker='o', linewidth=2, markersize=8)
        plt.gcf().autofmt_xdate()
        plt.xlabel('Date')
        plt.ylabel('Trend Value')
        plt.title('News Trend Analysis')
        plt.grid(True, alpha=0.3)
    else:
        # Default example graph
        plt.plot([1, 2, 3, 4, 5], [10, 15, 13, 17, 20], marker='o')
        plt.xlabel('Time')
        plt.ylabel('Trend')
        plt.title('News Trend Analysis')
        plt.grid(True, alpha=0.3)
    
    plt.tight_layout()
    plt.savefig(output_path, dpi=300, bbox_inches='tight')
    plt.close()
    
    return output_path

def get_base64_image(image_path: str) -> str:
    """Convert image to base64 string"""
    with open(image_path, 'rb') as img_file:
        return base64.b64encode(img_file.read()).decode('utf-8')






