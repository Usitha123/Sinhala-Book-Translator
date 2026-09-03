import React from 'react';
import { 
  Pause, 
  Play, 
  RotateCcw, 
  AlertCircle, 
  Download, 
  BookMarked, 
  Loader2, 
  Sparkles,
  ArrowLeft,
  FileText,
  Zap,
  ShieldCheck
} from 'lucide-react';
import { TranslationJob, TranslationPage, GeminiModelId, SUPPORTED_GEMINI_MODELS } from '../types';

interface TranslateProgressViewProps {
  job: TranslationJob;
  pages: TranslationPage[];
  isTranslating: boolean;
  currentPageNumber: number;
  currentOriginalSnippet: string;
  currentTranslatedSnippet: string;
  statusMessage: string;
  failedPages: number[];
  selectedModel?: GeminiModelId;
  onChangeModel?: (model: GeminiModelId) => void;
  onPause: () => void;
  onResume: () => void;
  onRetryPage: (pageNum: number) => void;
  onRetryAllFailed?: () => void;
  onOpenReader: () => void;
  onDownloadPdf: () => void;
  onBackToDashboard: () => void;
  isExportingPdf: boolean;
}

export const TranslateProgressView: React.FC<TranslateProgressViewProps> = ({
  job,
  pages,
  isTranslating,
  currentPageNumber,
  currentOriginalSnippet,
  currentTranslatedSnippet,
  statusMessage,
  failedPages,
  selectedModel = 'auto-fallback',
  onChangeModel,
  onPause,
  onResume,
  onRetryPage,
  onRetryAllFailed,
  onOpenReader,
  onDownloadPdf,
  onBackToDashboard,
  isExportingPdf,
}) => {
  const isComplete = job.status === 'completed' || (job.totalPages > 0 && job.completedPages >= job.totalPages);
  const remainingPages = Math.max(0, job.totalPages - job.completedPages);

  // Check if any pages were auto-recovered
  const autoRecoveredCount = pages.filter(p => p.autoRecovered).length;
  const currentModelOption = SUPPORTED_GEMINI_MODELS.find(m => m.id === (selectedModel || job.geminiModel)) || SUPPORTED_GEMINI_MODELS[0];

  // Local retry loading states
  const [retryingPageNumber, setRetryingPageNumber] = React.useState<number | null>(null);
  const [isRetryingAll, setIsRetryingAll] = React.useState<boolean>(false);

  const handleSingleRetry = async (pageNum: number) => {
    setRetryingPageNumber(pageNum);
    try {
      await onRetryPage(pageNum);
    } finally {
      setRetryingPageNumber(null);
    }
  };

  const handleRetryAll = async () => {
    if (!onRetryAllFailed) return;
    setIsRetryingAll(true);
    try {
      await onRetryAllFailed();
    } finally {
      setIsRetryingAll(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in">
      
      {/* Top Bar Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          onClick={onBackToDashboard}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {/* Active Model Pill */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/80 text-xs font-medium">
            <Zap className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>{currentModelOption.name}</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-blue-200/60 dark:bg-blue-900/80 rounded font-semibold">Free Tier</span>
          </div>

          <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${
            isComplete
              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
              : isTranslating
                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 animate-pulse'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
          }`}>
            {isComplete ? 'Translation Complete' : isTranslating ? 'Translating...' : 'Translation Paused'}
          </span>
        </div>
      </div>

      {/* Main Status Hero Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6 transition-colors">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                {job.genre.toUpperCase()} TRANSLATION PIPELINE
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500">•</span>
              <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                <ShieldCheck className="w-3.5 h-3.5" /> Auto-Fallback & Recovery
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
              {job.originalFileName}
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-400 font-sans">
              Free Gemini Models (3.6 Flash / 3.5 Flash Lite / 3.7 Flash) • Checkpoints autosaved safely
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5">
            {!isComplete ? (
              isTranslating ? (
                <button
                  id="btn-pause-translation"
                  onClick={onPause}
                  className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-bold text-xs transition-all flex items-center gap-2 border border-slate-200 dark:border-slate-700 cursor-pointer"
                >
                  <Pause className="w-4 h-4" />
                  <span>Pause Translation</span>
                </button>
              ) : (
                <button
                  id="btn-resume-translation"
                  onClick={onResume}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition-all flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Resume Translation</span>
                </button>
              )
            ) : (
              <>
                <button
                  id="btn-open-reader-complete"
                  onClick={onOpenReader}
                  className="px-4 py-2.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer border border-transparent dark:border-slate-700"
                >
                  <BookMarked className="w-4 h-4" />
                  <span>Open Reader</span>
                </button>

                <button
                  id="btn-download-pdf-complete"
                  onClick={onDownloadPdf}
                  disabled={isExportingPdf}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition-all flex items-center gap-2 shadow-xs disabled:opacity-60 cursor-pointer"
                >
                  {isExportingPdf ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  <span>Download Sinhala PDF</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Big Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-baseline justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-slate-800 dark:text-slate-100">
                {job.completedPages} <span className="text-slate-400 font-normal">/</span> {job.totalPages}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Pages Completed</span>
            </div>

            <span className="text-2xl font-extrabold tracking-tight text-blue-600 dark:text-blue-400">
              {job.progress}%
            </span>
          </div>

          <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isComplete
                  ? 'bg-emerald-500'
                  : 'bg-blue-600 dark:bg-blue-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, job.progress))}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-400 pt-1">
            <span className="font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
              {isTranslating && <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600 dark:text-blue-400" />}
              {statusMessage || `Page ${currentPageNumber || job.completedPages + 1} processing...`}
            </span>
            <span>{remainingPages} pages remaining</span>
          </div>
        </div>

        {/* 4 Quantitative Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-400 block tracking-wider">Completed</span>
            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">{job.completedPages}</span>
            <span className="text-[11px] text-slate-400 dark:text-slate-400 block">pages preserved</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-400 block tracking-wider">Remaining</span>
            <span className="text-lg font-bold text-blue-600 dark:text-blue-400 tracking-tight">{remainingPages}</span>
            <span className="text-[11px] text-slate-400 dark:text-slate-400 block">pages to go</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-400 block tracking-wider">Model Mode</span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate mt-0.5" title={currentModelOption.name}>
              {currentModelOption.name}
            </span>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block">
              {autoRecoveredCount > 0 ? `${autoRecoveredCount} auto-recovered` : 'Auto-fallback active'}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-400 block tracking-wider">Checkpoint</span>
            <span className="text-lg font-bold text-slate-800 dark:text-slate-200 tracking-tight">Page {job.lastCheckpointPage || job.completedPages}</span>
            <span className="text-[11px] text-slate-400 dark:text-slate-400 block">resumable safe state</span>
          </div>
        </div>

        {/* Model Selector Bar */}
        {onChangeModel && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Translation Model Engine:</span>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {SUPPORTED_GEMINI_MODELS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => onChangeModel(m.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer whitespace-nowrap ${
                    selectedModel === m.id
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                  title={m.description}
                >
                  {m.name.replace('Gemini ', '')}
                </button>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Failed Chunks / Error Recovery Callout if any */}
      {failedPages.length > 0 && (
        <div 
          id="failed-pages-recovery-card"
          className="p-6 rounded-3xl bg-rose-50/90 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-900 dark:text-rose-200 space-y-4 animate-fade-in shadow-xs"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 font-bold text-sm text-rose-900 dark:text-rose-200">
              <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>Some pages experienced a translation timeout or rate limit</span>
            </div>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 w-fit">
              {failedPages.length} {failedPages.length === 1 ? 'page needs retry' : 'pages need retry'}
            </span>
          </div>

          <p className="text-rose-800 dark:text-rose-300 leading-relaxed font-sans text-xs sm:text-sm">
            Completed pages are completely safe and preserved. You can retry the failed pages below without restarting:
          </p>

          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            {failedPages.map((p) => (
              <button
                key={p}
                id={`btn-retry-page-${p}`}
                onClick={() => handleSingleRetry(p)}
                disabled={retryingPageNumber !== null || isRetryingAll || isTranslating}
                className="px-4 py-2 bg-white dark:bg-slate-800 border border-rose-300 dark:border-rose-700/60 text-rose-800 dark:text-rose-200 font-bold text-xs rounded-xl hover:bg-rose-100 dark:hover:bg-slate-700 disabled:opacity-60 flex items-center gap-2 transition-all cursor-pointer shadow-xs hover:shadow-sm"
              >
                {retryingPageNumber === p ? (
                  <Loader2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 animate-spin" />
                ) : (
                  <RotateCcw className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                )}
                <span>{retryingPageNumber === p ? `Retrying Page ${p}...` : `Retry Page ${p}`}</span>
              </button>
            ))}

            {failedPages.length > 1 && onRetryAllFailed && (
              <button
                id="btn-retry-all-failed"
                onClick={handleRetryAll}
                disabled={retryingPageNumber !== null || isRetryingAll || isTranslating}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-xs"
              >
                {isRetryingAll ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RotateCcw className="w-3.5 h-3.5" />
                )}
                <span>{isRetryingAll ? 'Retrying Failed Pages...' : `Retry All ${failedPages.length} Failed Pages`}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Live Bilingual Translation Stream Monitor */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 transition-colors">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h3 className="text-sm font-bold tracking-tight text-slate-800 dark:text-slate-100">
              Live Translation Activity (Page {currentPageNumber || job.completedPages + 1})
            </h3>
          </div>
          <span className="text-xs text-slate-400 dark:text-slate-400 font-mono">
            {isTranslating ? 'Streaming active' : 'Idle'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
          
          {/* Source English */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50 space-y-2">
            <div className="flex items-center justify-between text-slate-400 dark:text-slate-400 font-bold text-[10px] uppercase tracking-wider">
              <span>Source English Content</span>
              <FileText className="w-3.5 h-3.5" />
            </div>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-sans text-xs sm:text-sm whitespace-pre-wrap max-h-56 overflow-y-auto">
              {currentOriginalSnippet || pages[pages.length - 1]?.originalText || 'Preparing next page text...'}
            </p>
          </div>

          {/* Sinhala Output */}
          <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 space-y-2">
            <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 font-bold text-[10px] uppercase tracking-wider">
              <span>Natural Sinhala Translation</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold">
                Unicode
              </span>
            </div>
            <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-sans text-xs sm:text-sm whitespace-pre-wrap max-h-56 overflow-y-auto">
              {currentTranslatedSnippet || pages[pages.length - 1]?.translatedSinhala || (isTranslating ? 'Generating natural Sinhala prose with Gemini...' : 'Waiting to resume...')}
            </p>
          </div>

        </div>
      </div>

    </div>
  );
};
