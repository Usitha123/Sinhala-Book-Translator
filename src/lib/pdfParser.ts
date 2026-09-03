import * as pdfjsLib from 'pdfjs-dist';
import { PdfExtractionResult, ExtractedPage } from '../types';

// Configure worker safely
try {
  if (typeof window !== 'undefined') {
    // Use worker from unpkg or cdnjs corresponding to pdfjs version
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || '4.10.38'}/build/pdf.worker.min.mjs`;
  }
} catch (e) {
  console.warn('PDF Worker setup warning:', e);
}

export async function parsePdfFile(file: File): Promise<PdfExtractionResult> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    useSystemFonts: true,
  });

  const pdf = await loadingTask.promise;
  const totalPages = pdf.numPages;
  const pages: ExtractedPage[] = [];
  let totalChars = 0;

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    
    // Process text items with position awareness
    let lastY: number | null = null;
    let pageText = '';
    const headings: string[] = [];

    textContent.items.forEach((item: any) => {
      const str = item.str || '';
      if (!str.trim()) return;

      // Newline detection based on vertical coordinate changes
      if (lastY !== null && Math.abs(item.transform[5] - lastY) > 8) {
        pageText += '\n';
      } else if (pageText.length > 0 && !pageText.endsWith(' ') && !pageText.endsWith('\n')) {
        pageText += ' ';
      }

      pageText += str;
      lastY = item.transform[5];

      // Simple heading heuristic
      if (
        (str.length > 3 && str.length < 80) &&
        (/^(Chapter|Section|Part|Introduction|Conclusion|Chapter\s+\d+|[A-Z0-9\s]{4,})$/i.test(str.trim()) ||
         item.height > 14)
      ) {
        headings.push(str.trim());
      }
    });

    const cleanedText = cleanExtractedText(pageText);
    const wordCount = cleanedText.trim() ? cleanedText.trim().split(/\s+/).length : 0;
    totalChars += cleanedText.length;

    pages.push({
      pageNumber: pageNum,
      text: cleanedText,
      wordCount,
      headings: Array.from(new Set(headings)),
    });
  }

  // Scanned detection heuristic: if average chars per page is very low (< 30 characters)
  const avgChars = totalPages > 0 ? totalChars / totalPages : 0;
  const isScanned = avgChars < 30 && totalPages > 0;

  return {
    totalPages,
    isScanned,
    pages,
    fileName: file.name,
    fileSizeBytes: file.size,
    titleEstimate: pages[0]?.headings[0] || file.name.replace(/\.pdf$/i, ''),
  };
}

function cleanExtractedText(raw: string): string {
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

/**
 * Splits page text into manageable chunks if the page contains high word count (> 600 words)
 * to avoid hitting Gemini per-request latency or token limits.
 */
export function chunkPageContent(pageText: string, maxWordsPerChunk: number = 550): string[] {
  if (!pageText || !pageText.trim()) {
    return [''];
  }

  const paragraphs = pageText.split(/\n\s*\n/);
  const chunks: string[] = [];
  let currentChunk = '';
  let currentWordCount = 0;

  for (const para of paragraphs) {
    const paraWords = para.trim().split(/\s+/).length;

    if (currentWordCount + paraWords > maxWordsPerChunk && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = para;
      currentWordCount = paraWords;
    } else {
      if (currentChunk.length > 0) {
        currentChunk += '\n\n' + para;
      } else {
        currentChunk = para;
      }
      currentWordCount += paraWords;
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks.length > 0 ? chunks : [pageText];
}
