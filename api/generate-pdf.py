"""ZetsuGuide PDF Generator - with full Arabic RTL & shaping support"""

import io
import os
from fpdf import FPDF
from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
import arabic_reshaper
from bidi.algorithm import get_display

app = Flask(__name__)
CORS(app)

M = 20
FONT_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "Cairo-Regular.ttf")


def fix_arabic(text):
    """Fix Arabic text: reshape letters and apply bidi algorithm"""
    if not text:
        return ""
    try:
        # Step 1: Connect Arabic letters (reshaping)
        reshaped_text = arabic_reshaper.reshape(text)
        # Step 2: Apply bidirectional algorithm for RTL display
        bidi_text = get_display(reshaped_text)
        return bidi_text
    except Exception as e:
        # If reshaping fails, return original text
        return text


def has_arabic(text):
    """Check if text contains Arabic characters"""
    if not text:
        return False
    try:
        for char in text:
            code = ord(char)
            if 0x0600 <= code <= 0x06FF or 0x0750 <= code <= 0x077F:
                return True
        return False
    except:
        return False


def clean_text(text):
    """Clean problematic characters"""
    if not text:
        return ""
    text = str(text)
    text = text.replace('\u200b', '')  # Zero width space
    text = text.replace('\ufeff', '')   # BOM
    text = text.replace('\u202c', '')    # Pop directional formatting
    text = text.replace('\u202d', '')    # Left-to-right override
    text = text.replace('\u202e', '')    # Right-to-left override
    return text


def process_line(line):
    """Process a single line - fix Arabic if needed"""
    cleaned = clean_text(line)
    if has_arabic(cleaned):
        return fix_arabic(cleaned)
    return cleaned


def create_pdf(data):
    """Create PDF with proper Arabic RTL support"""
    title = data.get('title', 'Untitled')[:80]
    content = data.get('content', '')
    author = data.get('publisher_name', 'ZetsuGuide')[:50]
    
    pdf = FPDF(unit='mm', format='A4')
    pdf.set_auto_page_break(True, 15)
    pdf.add_page()
    
    page_width = pdf.w - 2 * M
    pdf.set_left_margin(M)
    pdf.set_right_margin(M)
    
    # Load Arabic font
    font_loaded = False
    if os.path.exists(FONT_PATH):
        try:
            pdf.add_font('Cairo', '', FONT_PATH, uni=True)
            pdf.set_font('Cairo', size=12)
            font_loaded = True
        except Exception as e:
            print(f"Font error: {e}")
            pdf.set_font('helvetica', size=12)
    else:
        print(f"Font not found: {FONT_PATH}")
        pdf.set_font('helvetica', size=12)
    
    # Title - fix Arabic if present
    fixed_title = process_line(title)
    
    pdf.set_text_color(30, 30, 30)
    pdf.set_font(size=18)
    pdf.cell(page_width, 12, fixed_title, align='C')
    pdf.ln(12)
    
    # Divider line
    pdf.set_draw_color(150, 150, 150)
    pdf.set_line_width(0.5)
    pdf.line(M, pdf.get_y(), pdf.w - M, pdf.get_y())
    pdf.ln(5)
    
    # Author - fix Arabic if present
    fixed_author = process_line(author)
    
    pdf.set_font(size=10)
    pdf.set_text_color(100, 100, 100)
    pdf.cell(page_width, 5, f"By {fixed_author}", align='R')
    pdf.ln(8)
    
    pdf.set_font(size=11)
    pdf.set_text_color(50, 50, 50)
    
    # Process content line by line
    lines = content.split('\n')
    for line in lines:
        line = line.strip()
        if not line:
            pdf.ln(4)
            continue
        
        # Process each line - fix Arabic
        fixed_line = process_line(line)
        
        if fixed_line.startswith('# '):
            # H1 - largest heading
            pdf.set_font(size=16)
            pdf.ln(5)
            pdf.multi_cell(page_width, 8, fixed_line[2:], align='R')
            pdf.set_font(size=11)
        elif fixed_line.startswith('## '):
            # H2 - medium heading
            pdf.set_font(size=14)
            pdf.ln(3)
            pdf.multi_cell(page_width, 6, fixed_line[3:], align='R')
            pdf.set_font(size=11)
        elif fixed_line.startswith('### '):
            # H3 - small heading
            pdf.set_font(size=12)
            pdf.ln(2)
            pdf.multi_cell(page_width, 5, fixed_line[4:], align='R')
            pdf.set_font(size=11)
        elif fixed_line.startswith('- ') or fixed_line.startswith('* '):
            # Bullet point
            pdf.cell(5, 5, "•", align='L')
            pdf.multi_cell(page_width - 5, 5, fixed_line[2:], align='R')
            pdf.ln(2)
        elif fixed_line.startswith('```'):
            # Code block marker
            pdf.set_font(size=9)
            pdf.set_text_color(100, 100, 100)
            pdf.cell(0, 5, "[Code Block]", align='L')
            pdf.set_font(size=11)
            pdf.set_text_color(50, 50, 50)
            pdf.ln(4)
        else:
            # Regular paragraph
            # For Arabic: use right-aligned multi_cell
            # For English: use left-aligned multi_cell
            if has_arabic(line):
                pdf.multi_cell(page_width, 5, fixed_line, align='R')
            else:
                pdf.multi_cell(page_width, 5, fixed_line, align='L')
            pdf.ln(2)
    
    pdf.ln(10)
    
    # Footer
    pdf.set_font(size=8)
    pdf.set_text_color(150, 150, 150)
    pdf.set_y(-12)
    fixed_author_footer = process_line(author)
    pdf.cell(page_width / 2, 4, fixed_author_footer, align='L')
    pdf.cell(page_width / 2, 4, 'ZetsuGuide', align='R')
    
    return pdf.output(dest='S')


@app.route('/api/generate-pdf', methods=['POST'])
def generate_pdf():
    """API endpoint to generate PDF"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        title = data.get('title', '').strip()
        if not title:
            return jsonify({'error': 'Title is required'}), 400
        
        pdf_bytes = create_pdf({
            'title': title,
            'content': data.get('content', ''),
            'publisher_name': data.get('publisher_name', 'ZetsuGuide')
        })
        
        return send_file(
            io.BytesIO(pdf_bytes),
            mimetype='application/pdf',
            as_attachment=True,
            download_name=f"{title[:40]}.pdf"
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@app.route('/health')
def health():
    """Health check endpoint"""
    return jsonify({'status': 'ok'})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)