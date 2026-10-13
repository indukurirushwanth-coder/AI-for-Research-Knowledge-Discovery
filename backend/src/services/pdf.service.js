import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

export const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500 MB limit
export const CHUNK_SIZE_CHARS = 500;           // ~80-100 words per chunk // Focused chunks for precise grounding
export const CHUNK_OVERLAP_CHARS = 120;        // Boundary overlap context

/**
 * Validate that uploaded buffer is a valid PDF
 */
export function validatePdfBuffer(buffer, originalname) {
  if (!buffer || buffer.length === 0) {
    throw new Error(`File "${originalname}" is empty (0 bytes).`);
  }

  if (buffer.length > MAX_FILE_SIZE) {
    throw new Error(`File "${originalname}" exceeds the 10 MB limit (${(buffer.length / (1024 * 1024)).toFixed(1)} MB).`);
  }

  // Check magic bytes: PDFs must start with '%PDF-'
  const magic = buffer.subarray(0, 5).toString('ascii');
  if (magic !== '%PDF-') {
    throw new Error(`File "${originalname}" is not a valid PDF document (missing %PDF- header).`);
  }
}

/**
 * Extract selectable text page by page from PDF buffer using pdfjs-dist
 */
export async function extractPdfPages(buffer) {
  const data = new Uint8Array(buffer);
  const loadingTask = pdfjsLib.getDocument({
    data,
    useSystemFonts: true,
    disableFontFace: true
  });

  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;
  const pages = [];

  for (let i = 1; i <= numPages; i++) {
    const page = await pdfDoc.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map(item => item.str)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    pages.push({
      pageNumber: i,
      text: pageText
    });
  }

  const totalText = pages.map(p => p.text).join(' ').trim();

  // Strip scanner watermarks (e.g. "Scanned by CamScanner", "CamScanner", "Scanner App")
  const genuineContent = totalText
    .replace(/scanned\s+by\s+camscanner/gi, '')
    .replace(/camscanner/gi, '')
    .replace(/scanned\s+with\s+[a-z0-9]+/gi, '')
    .trim();

  // Average genuine characters per page
  const avgCharsPerPage = numPages > 0 ? genuineContent.length / numPages : 0;

  // A genuine readable document page has at least 30-50 characters.
  // If genuine content across all pages is < 50 chars or avg per page < 15 chars, it is an image/photo scan.
  const isScannedOrEmpty = genuineContent.length < 50 || avgCharsPerPage < 15;

  return {
    pageCount: numPages,
    pages,
    totalTextLength: totalText.length,
    genuineTextLength: genuineContent.length,
    isScannedOrEmpty
  };
}

/**
 * Split text into semantic chunks with overlap
 */
export function chunkPageText(text, pageNumber, startingIndex = 0) {
  const chunks = [];
  if (!text || text.trim().length === 0) {
    return chunks;
  }

  if (text.length <= CHUNK_SIZE_CHARS) {
    chunks.push({
      page_number: pageNumber,
      chunk_index: startingIndex,
      chunk_text: text.trim(),
      token_count: Math.ceil(text.trim().split(/\s+/).length * 1.3)
    });
    return chunks;
  }

  // Split into sentences / paragraphs
  const sentences = text.match(/[^.!?]+[.!?]+(\s+|$)|[^.!?]+$/g) || [text];
  let currentChunk = '';
  let chunkIdx = startingIndex;

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i];

    if ((currentChunk + sentence).length > CHUNK_SIZE_CHARS && currentChunk.length > 0) {
      chunks.push({
        page_number: pageNumber,
        chunk_index: chunkIdx++,
        chunk_text: currentChunk.trim(),
        token_count: Math.ceil(currentChunk.trim().split(/\s+/).length * 1.3)
      });

      // Word-based overlap: take last N words instead of N characters (prevents splitting words in half)
  const currentWords = currentChunk.split(/\s+/);
  const overlapWordCount = Math.min(CHUNK_OVERLAP_CHARS, currentWords.length);
  const overlapWords = currentWords.slice(-overlapWordCount);
  const overlapTail = overlapWords.join(' ');
  currentChunk = overlapTail + ' ' + sentence;
    } else {
      currentChunk += sentence;
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push({
      page_number: pageNumber,
      chunk_index: chunkIdx++,
      chunk_text: currentChunk.trim(),
      token_count: Math.ceil(currentChunk.trim().split(/\s+/).length * 1.3)
    });
  }

  return chunks;
}

/**
 * Full PDF Processing Pipeline
 */
export async function processPdf(buffer, originalname) {
  validatePdfBuffer(buffer, originalname);

  const extraction = await extractPdfPages(buffer);

  if (extraction.isScannedOrEmpty) {
    return {
      pageCount: extraction.pageCount,
      chunks: [],
      status: 'scanned_ocr_required',
      statusMessage: 'This document consists of camera photos or scanned images (e.g. CamScanner) with no selectable text. Scanned PDFs require OCR preprocessing. ResearchLens AI cannot search text inside flattened images.'
    };
  }

  const allChunks = [];
  let chunkIndex = 0;

  for (const page of extraction.pages) {
    const pageChunks = chunkPageText(page.text, page.pageNumber, chunkIndex);
    chunkIndex += pageChunks.length;
    allChunks.push(...pageChunks);
  }

  return {
    pageCount: extraction.pageCount,
    chunks: allChunks,
    status: 'processed',
    statusMessage: null
  };
}

export default {
  MAX_FILE_SIZE,
  validatePdfBuffer,
  extractPdfPages,
  chunkPageText,
  processPdf
};
