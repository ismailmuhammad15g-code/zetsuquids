import { jsPDF } from "jspdf";

const MARGIN = 20;
const FONTSIZE_TITLE = 16;
const FONTSIZE_CONTENT = 10;
const FONTSIZE_FOOTER = 8;
const LINE_HEIGHT = 5;

function parseMarkdownToText(content) {
  if (!content) return "";
  
  const lines = content.split('\n');
  const result = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      result.push('');
      continue;
    }
    
    if (trimmed.startsWith('# ')) {
      result.push(`\n${trimmed.slice(2)}\n`);
    } else if (trimmed.startsWith('## ')) {
      result.push(`\n${trimmed.slice(3)}\n`);
    } else if (trimmed.startsWith('### ')) {
      result.push(`\n${trimmed.slice(4)}\n`);
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      result.push(`  • ${trimmed.slice(2)}`);
    } else if (trimmed.startsWith('```')) {
      continue;
    } else {
      result.push(trimmed);
    }
  }
  
  return result.join('\n');
}

function createPDF(data) {
  const title = data.title || 'Untitled';
  const content = data.content || '';
  const publisherName = data.publisher_name || 'ZetsuGuide';
  
  console.log('[PDF] Creating jsPDF document...');
  console.log('[PDF] Title:', title);
  console.log('[PDF] Content length:', content?.length || 0);
  
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - MARGIN * 2;
  const pageContentHeight = pageHeight - MARGIN * 2;
  
  let y = MARGIN;
  
  // Title
  doc.setFont('helvetica', 'bold', FONTSIZE_TITLE);
  doc.setTextColor(30, 30, 30);
  doc.text(title, pageWidth / 2, y, { align: 'center' });
  y += FONTSIZE_TITLE / 2 + 3;
  
  // Divider line
  doc.setDrawColor(100, 100, 100);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, y, pageWidth - MARGIN, y);
  y += 5;
  
  // Content
  doc.setFont('helvetica', '', FONTSIZE_CONTENT);
  doc.setTextColor(60, 60, 60);
  
  const text = parseMarkdownToText(content);
  const lines = doc.splitTextToSize(text, contentWidth);
  console.log('[PDF] Lines to render:', lines.length);
  
  for (const line of lines) {
    if (y + LINE_HEIGHT > pageContentHeight) {
      doc.addPage();
      y = MARGIN;
    }
    
    if (line === '\n') {
      y += LINE_HEIGHT;
    } else {
      doc.text(line, MARGIN, y);
      y += LINE_HEIGHT;
    }
  }
  
  y = pageHeight - 15;
  
  // Footer
  doc.setFont('helvetica', '', FONTSIZE_FOOTER);
  doc.setTextColor(150, 150, 150);
  doc.text(publisherName, MARGIN, y);
  doc.text('ZetsuGuide', pageWidth - MARGIN, y, { align: 'right' });
  
  console.log('[PDF] Document created successfully');
  return doc;
}

export default async function handler(req, res) {
  console.log('[PDF Handler] Request received');
  console.log('[PDF Handler] Body:', req.body);
  
  try {
    const data = req.body;
    
    if (!data) {
      console.log('[PDF Handler] No data provided');
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'No data provided' }));
      return;
    }
    
    const title = data.title;
    
    if (!title) {
      console.log('[PDF Handler] No title provided');
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Title is required' }));
      return;
    }
    
    const content = data.content || '';
    const publisherName = data.publisher_name || 'ZetsuGuide';
    
    console.log('[PDF Handler] Creating PDF for:', title);
    
    const doc = createPDF({ title, content, publisher_name: publisherName });
    
    // Get the PDF as a Uint8Array
    const pdfArray = doc.output('uint8array');
    console.log('[PDF Handler] PDF size:', pdfArray.length);
    
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${title}.pdf"`);
    res.setHeader('Content-Length', pdfArray.length);
    res.end(Buffer.from(pdfArray));
    
    console.log('[PDF Handler] Response sent');
    
  } catch (error) {
    console.error('[PDF Handler] Error:', error);
    console.error('[PDF Handler] Stack:', error.stack);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: error.message }));
  }
}