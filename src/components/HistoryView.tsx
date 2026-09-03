import React from 'react';
import { 
  Play, 
  BookMarked, 
  Download, 
  Trash2, 
  BookOpen, 
  History, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  FileText
} from 'lucide-react';
import { TranslationJob } from '../types';

interface HistoryViewProps {
  jobs: TranslationJob[];
  onResumeJob: (job: TranslationJob) => void;
  onOpenReader: (job: TranslationJob) => void;
  onExportPdf: (job: TranslationJob) => void;
  onDeleteJob: (jobId: string) => void;
  onStartNewBook: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  jobs,
  onResumeJob,
  onOpenReader,
  onExportPdf,
  onDeleteJob,
  onStartNewBook,
}) => {
  if (jobs.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto border border-blue-100 dark:border-blue-900">
          <History className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100">No Translation History Yet</h2>
        <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mx-auto">
          Upload and translate your first English PDF book to see it recorded in your account.
        </p>
        <button
          onClick={onStartNewBook}
          className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          Translate a Book
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in text-slate-800 dark:text-slate-100 transition-colors">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">Translation History</h1>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            All books translated with your account are saved with full checkpoint history.
          </p>
        </div>

        <button
          onClick={onStartNewBook}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <BookOpen className="w-4 h-4" />
          <span>Translate New Book</span>
        </button>
      </div>

      {/* Responsive Table / Card Container */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                <th className="py-3.5 px-4 sm:px-6">Book Name</th>
                <th className="py-3.5 px-4">Progress</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 hidden md:table-cell">Last Updated</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {jobs.map((job) => {
                const isComplete = job.status === 'completed';

                return (
                  <tr key={job.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                    
                    {/* Book Name */}
                    <td className="py-4 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate max-w-xs sm:max-w-md font-sans" title={job.originalFileName}>
                            {job.originalFileName}
                          </p>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 capitalize">
                            {job.genre} • {job.totalPages} total pages
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Progress */}
                    <td className="py-4 px-4">
                      <div className="w-32 sm:w-44 space-y-1">
                        <div className="flex justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                          <span>{job.completedPages} / {job.totalPages} pages</span>
                          <span className="text-blue-600 dark:text-blue-400">{job.progress}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              isComplete ? 'bg-emerald-500' : 'bg-blue-600'
                            }`}
                            style={{ width: `${job.progress}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                        job.status === 'completed'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                          : job.status === 'processing'
                            ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                            : job.status === 'paused'
                              ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                              : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                      }`}>
                        {job.status === 'completed' && <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />}
                        {job.status}
                      </span>
                    </td>

                    {/* Last Updated */}
                    <td className="py-4 px-4 text-slate-400 dark:text-slate-500 hidden md:table-cell">
                      {new Date(job.updatedAt).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {!isComplete ? (
                          <button
                            onClick={() => onResumeJob(job)}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
                            title="Continue Translation"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span>Continue</span>
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => onOpenReader(job)}
                              className="px-3 py-1.5 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white rounded-lg font-semibold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                              title="Open in Bilingual Reader"
                            >
                              <BookMarked className="w-3 h-3" />
                              <span className="hidden sm:inline">Read</span>
                            </button>

                            <button
                              onClick={() => onExportPdf(job)}
                              className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-semibold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                              title="Download Sinhala PDF"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">PDF</span>
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => onDeleteJob(job.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors ml-1 cursor-pointer"
                          title="Delete Translation"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
