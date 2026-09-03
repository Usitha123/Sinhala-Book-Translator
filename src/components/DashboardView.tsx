import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  Play, 
  RotateCcw, 
  Clock, 
  Layers, 
  BookOpen, 
  Sparkles,
  ArrowRight,
  Trash2,
  BookMarked,
  Download
} from 'lucide-react';
import { UserProfile, TranslationJob, TranslationGenre, PdfExtractionResult } from '../types';
import { parsePdfFile } from '../lib/pdfParser';

interface DashboardViewProps {
  user: UserProfile;
  activeJobs: TranslationJob[];
  onStartTranslation: (extraction: PdfExtractionResult, genre: TranslationGenre) => void;
  onResumeJob: (job: TranslationJob) => void;
  onOpenReader: (job: TranslationJob) => void;
  onDeleteJob: (jobId: string) => void;
  onExportPdf: (job: TranslationJob) => void;
  onConnectGemini: () => void;
  hasGeminiKey: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  activeJobs,
  onStartTranslation,
  onResumeJob,
  onOpenReader,
  onDeleteJob,
  onExportPdf,
  onConnectGemini,
  hasGeminiKey,
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [pdfData, setPdfData] = useState<PdfExtractionResult | null>(null);
  const [selectedGenre, setSelectedGenre] = useState<TranslationGenre>('general');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Find any unfinished job for prominent Resume banner
  const unfinishedJob = activeJobs.find(j => j.status === 'processing' || j.status === 'paused');
  const completedJobs = activeJobs.filter(j => j.status === 'completed');
  const totalPagesTranslated = activeJobs.reduce((acc, j) => acc + j.completedPages, 0);

  const handleFile = async (file: File) => {
    if (!file || !file.name.toLowerCase().endsWith('.pdf')) {
      setParseError('Please select a valid .PDF document file.');
      return;
    }

    setSelectedFile(file);
    setIsParsing(true);
    setParseError(null);
    setPdfData(null);

    try {
      const parsed = await parsePdfFile(file);
      setPdfData(parsed);
    } catch (err: any) {
      console.error('PDF parsing error:', err);
      setParseError('Could not extract text from this PDF file. Ensure it is not password protected.');
    } finally {
      setIsParsing(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleStart = () => {
    if (!pdfData) return;
    onStartTranslation(pdfData, selectedGenre);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      
      {/* Prominent Resume Banner if unfinished job exists */}
      {unfinishedJob && (
        <div 
          id="active-resume-card"
          className="bg-slate-900 text-white p-6 rounded-3xl shadow-sm border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
        >
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                Continue Unfinished Translation
              </span>
            </div>
            <h3 className="text-xl font-bold tracking-tight text-white">
              {unfinishedJob.originalFileName}
            </h3>
            <p className="text-xs text-slate-400">
              Checkpoint saved: Page {unfinishedJob.completedPages} of {unfinishedJob.totalPages} ({unfinishedJob.progress}%)
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              id="btn-resume-banner"
              onClick={() => onResumeJob(unfinishedJob)}
              className="flex-1 md:flex-none px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Resume Translation</span>
            </button>
          </div>
        </div>
      )}

      {/* Welcome & Overview Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
            Welcome, {user.displayName}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Upload any English book or PDF to translate into authentic, natural literary Sinhala.
          </p>
        </div>

        {/* Quick Stats Pill Group */}
        <div className="flex items-center gap-3 text-xs">
          <div className="px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
            <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Books</span>
            <span className="text-base font-bold text-slate-800 dark:text-slate-100 tracking-tight">{activeJobs.length}</span>
          </div>

          <div className="px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
            <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Completed</span>
            <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">{completedJobs.length}</span>
          </div>

          <div className="px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
            <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Pages Translated</span>
            <span className="text-base font-bold text-blue-600 dark:text-blue-400 tracking-tight">{totalPagesTranslated}</span>
          </div>
        </div>
      </div>

      {/* Main Translation Upload Stage */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-100 dark:border-slate-800 shadow-sm space-y-6 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100">Translate a Book</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Supports standard PDFs, large textbooks, and literature novels.</p>
            </div>
          </div>

          {!hasGeminiKey && (
            <button
              onClick={onConnectGemini}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
            >
              Add Gemini Key
            </button>
          )}
        </div>

        {/* Drag-and-Drop Area */}
        <div
          id="dropzone-pdf"
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center cursor-pointer transition-all ${
            dragOver 
              ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 scale-[1.01]' 
              : selectedFile 
                ? 'border-slate-400 dark:border-slate-600 bg-slate-50/80 dark:bg-slate-800/80' 
                : 'border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-slate-50/50 dark:hover:bg-slate-800/40'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFile(e.target.files[0]);
              }
            }}
          />

          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900">
              <UploadCloud className="w-6 h-6" />
            </div>

            <div>
              <p className="text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-100">
                {selectedFile ? selectedFile.name : 'Click to upload or drag and drop your PDF book'}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                PDF format up to 100MB • Scanned & digital books supported
              </p>
            </div>
          </div>
        </div>

        {/* Parsing state */}
        {isParsing && (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-3 text-xs font-medium text-slate-700 dark:text-slate-300 animate-pulse">
            <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin" />
            <span>Analyzing document structure, headings, and page boundaries...</span>
          </div>
        )}

        {/* Parse Error */}
        {parseError && (
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-200 flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
            <span>{parseError}</span>
          </div>
        )}

        {/* Inspected PDF Details & Configuration */}
        {pdfData && (
          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-5 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">{pdfData.fileName}</h4>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    {(pdfData.fileSizeBytes / (1024 * 1024)).toFixed(2)} MB • {pdfData.totalPages} Pages
                  </p>
                </div>
              </div>

              {pdfData.isScanned ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  Scanned Image PDF Detected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Digital Text PDF Verified
                </span>
              )}
            </div>

            {/* Genre / Style Selection */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Select Translation Tone & Genre
              </label>
              <p className="text-xs text-slate-400 dark:text-slate-500 -mt-1">
                Optimizes Gemini's vocabulary register, terminology, and literary tone.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1">
                {[
                  { id: 'general', label: 'General Book' },
                  { id: 'literature', label: 'Literature / Novel' },
                  { id: 'academic', label: 'Academic / Science' },
                  { id: 'technical', label: 'Technical / IT' },
                  { id: 'business', label: 'Business / Finance' },
                  { id: 'educational', label: 'Educational' },
                ].map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setSelectedGenre(g.id as TranslationGenre)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium border text-center transition-all cursor-pointer ${
                      selectedGenre === g.id
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs font-semibold'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Start Button */}
            <div className="pt-2 flex justify-end">
              <button
                id="btn-start-translation"
                onClick={handleStart}
                className="w-full sm:w-auto px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-blue-200" />
                <span>Start Sinhala Translation</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Recent Books / History Section in Dashboard */}
      {activeJobs.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold tracking-tight text-slate-800 dark:text-slate-100">Your Books</h3>
            <span className="text-xs text-slate-400 dark:text-slate-500">{activeJobs.length} total</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeJobs.map((job) => (
              <div 
                key={job.id} 
                className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm hover:border-slate-200 dark:hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                      job.status === 'completed'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                        : job.status === 'processing'
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                          : job.status === 'paused'
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                            : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                    }`}>
                      {job.status}
                    </span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      {new Date(job.updatedAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-base font-bold tracking-tight text-slate-800 dark:text-slate-100 truncate" title={job.originalFileName}>
                      {job.originalFileName}
                    </h4>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                      Category: {job.genre} • {job.totalPages} pages
                    </p>
                  </div>

                  {/* Mini Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
                      <span>{job.completedPages} / {job.totalPages} pages</span>
                      <span className="text-blue-600 dark:text-blue-400">{job.progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${
                          job.status === 'completed' ? 'bg-emerald-500' : 'bg-blue-600'
                        }`} 
                        style={{ width: `${job.progress}%` }} 
                      />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => onDeleteJob(job.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
                    title="Delete Translation"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-1.5">
                    {job.status !== 'completed' ? (
                      <button
                        onClick={() => onResumeJob(job)}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Continue</span>
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => onExportPdf(job)}
                          className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                          title="Download Sinhala PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>PDF</span>
                        </button>

                        <button
                          onClick={() => onOpenReader(job)}
                          className="px-3.5 py-1.5 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <BookMarked className="w-3.5 h-3.5" />
                          <span>Read</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
