import io
from fpdf import FPDF
from flask import Flask, request, send_file, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins=["http://127.0.0.1:3000", "http://localhost:3000"])

MARGIN = 20
PAGE_WIDTH = 210
PAGE_HEIGHT = 297
FONTSIZE_TITLE = 18
FONTSIZE_CONTENT = 11
FONTSIZE_FOOTER = 8


class PDF(FPDF):
    def __init__(self):
        super().__init__(unit='mm', format='A4')
        self.set_auto_page_break(auto=True, margin=MARGIN)
        self.set_margins(MARGIN, MARGIN, MARGIN)
        self.set_font('helvetica', '', FONTSIZE_CONTENT)


def parse_markdown_to_text(content):
    """Convert markdown to plain text with formatting."""
    if not content:
        return ""
    
    lines = content.split('\n')
    result = []
    
    for line in lines:
        line = line.strip()
        if not line:
            result.append('')
            continue
        
        if line.startswith('# '):
            result.append(f"\n{line[2:]}\n")
        elif line.startswith('## '):
            result.append(f"\n{line[3:]}\n")
        elif line.startswith('### '):
            result.append(f"\n{line[4:]}\n")
        elif line.startswith('- ') or line.startswith('* '):
            result.append(f"  • {line[2:]}")
        elif line.startswith('```'):
            continue
        else:
            result.append(line)
    
    return '\n'.join(result)


def create_pdf(data):
    """Create PDF from data dict."""
    title = data.get('title', 'Untitled')
    content = data.get('content', '')
    publisher_name = data.get('publisher_name', 'ZetsuGuide')
    
    pdf = PDF()
    pdf.add_page()
    
    left_margin = MARGIN
    right_margin = MARGIN
    content_width = PAGE_WIDTH - left_margin - right_margin
    
    # Title in center - using simple cell without new_x
    pdf.set_font('helvetica', 'B', FONTSIZE_TITLE)
    pdf.set_text_color(30, 30, 30)
    pdf.set_x(left_margin)
    pdf.cell(content_width, 10, title, align='C')
    pdf.ln(12)
    
    # Divider line
    pdf.set_draw_color(100, 100, 100)
    pdf.set_line_width(0.5)
    pdf.line(left_margin, pdf.get_y(), PAGE_WIDTH - right_margin, pdf.get_y())
    pdf.ln(8)
    
    # Content
    pdf.set_font('helvetica', '', FONTSIZE_CONTENT)
    pdf.set_text_color(60, 60, 60)
    
    text = parse_markdown_to_text(content)
    
    pdf.set_xy(left_margin, pdf.get_y())
    pdf.multi_cell(content_width, 6, text, align='L')
    
    pdf.ln(10)
    
    # Footer
    pdf.set_font('helvetica', '', FONTSIZE_FOOTER)
    pdf.set_text_color(150, 150, 150)
    pdf.set_y(-15)
    pdf.cell(content_width / 2, 5, publisher_name, align='L')
    pdf.cell(content_width / 2, 5, 'ZetsuGuide', align='R')
    
    return bytes(pdf.output(dest='S'))


@app.route('/api/generate-pdf', methods=['POST'])
def generate_pdf():
    """Handle PDF generation request."""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        title = data.get('title')
        content = data.get('content')
        
        if not title:
            return jsonify({'error': 'Title is required'}), 400
        
        if not content:
            content = ''
        
        pdf_bytes = create_pdf(data)
        
        return send_file(
            io.BytesIO(pdf_bytes),
            mimetype='application/pdf',
            as_attachment=True,
            download_name=f"{title}.pdf"
        )
    
    except Exception as e:
        import traceback
        return jsonify({'error': str(e), 'trace': traceback.format_exc()}), 500


@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok'})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)