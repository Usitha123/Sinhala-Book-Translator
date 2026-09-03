import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Copy, 
  Check, 
  Download, 
  BookOpen, 
  Maximize2, 
  Minimize2,
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import { TranslationJob, TranslationPage } from '../types';

interface ReaderViewProps {
  job: TranslationJob | null;
  pages: TranslationPage[];
  onBackToDashboard: () => void;
  onExportPdf: (job: TranslationJob) => void;
  isExportingPdf: boolean;
}

export const ReaderView: React.FC<ReaderViewProps> = ({
  job,
  pages,
  onBackToDashboard,
  onExportPdf,
  isExportingPdf,
}) => {
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg' | 'xl'>('base');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedSection, setCopiedSection] = useState<'en' | 'si' | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Sort pages by page number
  const sortedPages = useMemo(() => {
    return [...pages].sort((a, b) => a.pageNumber - b.pageNumber);
  }, [pages]);

  // Search matches
  const filteredPages = useMemo(() => {
    if (!searchQuery.trim()) return sortedPages;
    const q = searchQuery.toLowerCase();
    return sortedPages.filter(
      p => p.originalText.toLowerCase().includes(q) || p.translatedSinhala.toLowerCase().includes(q)
    );
  }, [sortedPages, searchQuery]);

  const activePage = filteredPages[currentPageIndex] || sortedPages[0] || null;

  const handleCopy = (text: string, type: 'en' | 'si') => {
    navigator.clipboard.writeText(text);
    setCopiedSection(type);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  if (!job || sortedPages.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-100">
          <BookOpen className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-slate-800">No Translated Book Selected</h2>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          Translate a PDF book first or select a completed book from your translation history.
        </p>
        <button
          onClick={onBackToDashboard}
          className="px-6 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors cursor-pointer"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  const fontSizeClass = {
    sm: 'text-xs leading-relaxed',
    base: 'text-sm leading-relaxed',
    lg: 'text-base leading-loose',
    xl: 'text-lg leading-loose',
  }[fontSize];

  return (
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4 animate-fade-in text-slate-800 dark:text-slate-100 transition-colors ${isFullscreen ? 'fixed inset-0 z-50 bg-[#f8fafc] dark:bg-slate-950 p-6 overflow-y-auto max-w-none' : ''}`}>
      
      {/* Top Controls Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToDashboard}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-base font-bold tracking-tight text-slate-800 dark:text-slate-100 truncate max-w-md" title={job.originalFileName}>
              {job.originalFileName}
            </h2>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              Bilingual Side-by-Side Edition • Page {activePage?.pageNumber || 1} of {job.totalPages}
            </p>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          
          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search text / සිංහල සොයන්න..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPageIndex(0);
              }}
              className="pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs w-48 sm:w-56 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Font size picker */}
          <div className="flex items-center bg-slate-50 dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700">
            {(['sm', 'base', 'lg', 'xl'] as const).map((size) => (
              <button
                key={size}
                onClick={() => setFontSize(size)}
                className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                  fontSize === size 
                    ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-2xs' 
                    : 'text-slate-400 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                {size === 'sm' ? 'A-' : size === 'base' ? 'A' : size === 'lg' ? 'A+' : 'A++'}
              </button>
            ))}
          </div>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            title="Toggle Fullscreen Reader"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Download PDF */}
          <button
            onClick={() => onExportPdf(job)}
            disabled={isExportingPdf}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export Sinhala PDF</span>
          </button>

        </div>

      </div>

      {/* Page Navigation Bar */}
      <div className="flex items-center justify-between py-2.5 px-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs transition-colors">
        <button
          onClick={() => setCurrentPageIndex((prev) => Math.max(0, prev - 1))}
          disabled={currentPageIndex === 0}
          className="flex items-center gap-1 px-3.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous Page</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-slate-400 dark:text-slate-500 font-medium">Page</span>
          <select
            value={currentPageIndex}
            onChange={(e) => setCurrentPageIndex(Number(e.target.value))}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 font-semibold text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer"
          >
            {filteredPages.map((p, idx) => (
              <option key={p.id} value={idx}>
                {p.pageNumber} {p.headings && p.headings.length > 0 ? `(${p.headings[0].slice(0, 20)}...)` : ''}
              </option>
            ))}
          </select>
          <span className="text-slate-400 dark:text-slate-500 font-medium">of {sortedPages.length}</span>
        </div>

        <button
          onClick={() => setCurrentPageIndex((prev) => Math.min(filteredPages.length - 1, prev + 1))}
          disabled={currentPageIndex >= filteredPages.length - 1}
          className="flex items-center gap-1 px-3.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 transition-colors cursor-pointer"
        >
          <span>Next Page</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Two-Column Bilingual Reading Layout */}
      {activePage ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          
          {/* Left Column: Original English */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-100 dark:border-slate-800 shadow-sm space-y-3 relative transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Original English (Page {activePage.pageNumber})
              </span>
              <button
                onClick={() => handleCopy(activePage.originalText, 'en')}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Copy English Text"
              >
                {copiedSection === 'en' ? <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <div className={`font-sans text-slate-700 dark:text-slate-300 ${fontSizeClass} whitespace-pre-wrap leading-relaxed`}>
              {activePage.originalText || 'No text extracted for this page.'}
            </div>
          </div>

          {/* Right Column: Natural Sinhala Translation */}
          <div className="bg-blue-50/60 dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-blue-100 dark:border-blue-950/80 shadow-sm space-y-3 relative transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-blue-100 dark:border-slate-800">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                ස්වභාවික සිංහල පරිවර්තනය (Natural Sinhala)
              </span>
              <button
                onClick={() => handleCopy(activePage.translatedSinhala, 'si')}
                className="p-1.5 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 rounded-lg hover:bg-blue-100/50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Copy Sinhala Text"
              >
                {copiedSection === 'si' ? <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <div className={`font-sans text-slate-900 dark:text-slate-100 ${fontSizeClass} whitespace-pre-wrap leading-relaxed`}>
              {activePage.translatedSinhala ? (
                activePage.translatedSinhala
              ) : (
                <span className="italic text-slate-400 dark:text-slate-500">
                  This page has not been translated yet.
                </span>
              )}
            </div>
          </div>

        </div>
      ) : (
        <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800">
          No matching pages found for "{searchQuery}".
        </div>
      )}

    </div>
  );
};
