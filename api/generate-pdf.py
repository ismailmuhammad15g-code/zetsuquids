"""ZetsuGuide PDF Generator"""

import io
import os
import re
from fpdf import FPDF
from flask import Flask, request, send_file, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

M = 20
FONT_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "Cairo-Regular.ttf")


def clean_text(text):
    if not text:
        return ""
    text = str(text)
    text = text.replace('\u200b', '')
    text = text.replace('\ufeff', '')
    text = text.replace('\u202c', '')
    text = text.replace('\u202d', '')
    text = text.replace('\u202e', '')
    return text


def create_pdf(data):
    title = data.get('title', 'Untitled')[:80]
    content = data.get('content', '')
    author = data.get('publisher_name', 'ZetsuGuide')[:50]
    
    pdf = FPDF(unit='mm', format='A4')
    pdf.set_auto_page_break(True, 15)
    pdf.add_page()
    
    page_width = pdf.w - 2 * M
    pdf.set_left_margin(M)
    pdf.set_right_margin(M)
    
    if os.path.exists(FONT_PATH):
        try:
            pdf.add_font('Cairo', '', FONT_PATH, uni=True)
            pdf.set_font('Cairo', size=12)
        except:
            pdf.set_font('helvetica', size=12)
    else:
        pdf.set_font('helvetica', size=12)
    
    pdf.set_text_color(30, 30, 30)
    pdf.set_font(size=18)
    pdf.cell(page_width, 12, clean_text(title), align='C')
    pdf.ln(12)
    
    pdf.set_draw_color(150, 150, 150)
    pdf.set_line_width(0.5)
    pdf.line(M, pdf.get_y(), pdf.w - M, pdf.get_y())
    pdf.ln(5)
    
    pdf.set_font(size=10)
    pdf.set_text_color(100, 100, 100)
    pdf.cell(page_width, 5, f"By {clean_text(author)}", align='R')
    pdf.ln(8)
    
    pdf.set_font(size=11)
    pdf.set_text_color(50, 50, 50)
    
    lines = content.split('\n')
    for line in lines:
        line = clean_text(line.strip())
        if not line:
            pdf.ln(4)
            continue
        
        if line.startswith('# '):
            pdf.set_font(size=16)
            pdf.ln(5)
            pdf.cell(0, 8, line[2:], align='L')
            pdf.ln(2)
            pdf.set_font(size=11)
        elif line.startswith('## '):
            pdf.set_font(size=14)
            pdf.ln(3)
            pdf.cell(0, 6, line[3:], align='L')
            pdf.ln(2)
            pdf.set_font(size=11)
        elif line.startswith('### '):
            pdf.set_font(size=12)
            pdf.ln(2)
            pdf.cell(0, 5, line[4:], align='L')
            pdf.ln(2)
            pdf.set_font(size=11)
        elif line.startswith('- ') or line.startswith('* '):
            pdf.set_x(M + 5)
            pdf.cell(5, 5, "•", align='L')
            pdf.set_x(M + 10)
            pdf.cell(page_width - 10, 5, line[2:], align='L')
            pdf.ln(5)
        elif line.startswith('```'):
            pdf.set_font(size=9)
            pdf.set_text_color(100, 100, 100)
            pdf.cell(0, 5, "[Code Block]", align='L')
            pdf.set_font(size=11)
            pdf.set_text_color(50, 50, 50)
            pdf.ln(4)
        else:
            max_chars = int(page_width / 2.5)
            if len(line) > max_chars:
                pdf.multi_cell(page_width, 5, line, align='L')
            else:
                pdf.cell(page_width, 5, line, align='L')
                pdf.ln(5)
    
    pdf.ln(10)
    
    pdf.set_font(size=8)
    pdf.set_text_color(150, 150, 150)
    pdf.set_y(-12)
    pdf.cell(page_width / 2, 4, clean_text(author), align='L')
    pdf.cell(page_width / 2, 4, 'ZetsuGuide', align='R')
    
    return pdf.output(dest='S')


@app.route('/api/generate-pdf', methods=['POST'])
def generate_pdf():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data'}), 400
        title = data.get('title', '').strip()
        if not title:
            return jsonify({'error': 'Title required'}), 400
        
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
        return jsonify({'error': str(e)}), 500


@app.route('/health')
def health(): return jsonify({'s':'ok'})

if __name__=='__main__':
    app.run(host='0.0.0.0', port=5000)