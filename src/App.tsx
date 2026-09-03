import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { OfflineBanner } from './components/OfflineBanner';
import { LandingView } from './components/LandingView';
import { GeminiKeyModal } from './components/GeminiKeyModal';
import { DashboardView } from './components/DashboardView';
import { TranslateProgressView } from './components/TranslateProgressView';
import { ReaderView } from './components/ReaderView';
import { HistoryView } from './components/HistoryView';
import { SettingsView } from './components/SettingsView';
import { 
  UserProfile, 
  TranslationJob, 
  TranslationPage, 
  TranslationGenre, 
  PdfExtractionResult,
  GeminiModelId
} from './types';
import { 
  signInWithGooglePopup, 
  signOutUser, 
  onAuthChange 
} from './lib/firebase';
import { 
  getSavedGeminiKey, 
  saveGeminiKey, 
  saveTranslationJob, 
  getTranslationJobs, 
  deleteTranslationJob, 
  saveTranslationPage, 
  getTranslationPages,
  getSavedSettings,
  saveSettings
} from './lib/storage';
import { translateTextChunk } from './lib/gemini';
import { exportSinhalaPdf } from './lib/pdfExporter';

export function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'reader' | 'settings'>('dashboard');

  // Gemini Key state
  const [hasGeminiKey, setHasGeminiKey] = useState<boolean>(false);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState<boolean>(false);
  const [isMandatoryKeyModal, setIsMandatoryKeyModal] = useState<boolean>(false);

  // Preferred Gemini Model
  const [selectedModel, setSelectedModel] = useState<GeminiModelId>(() => getSavedSettings().preferredModel);

  // Job and Progress states
  const [jobs, setJobs] = useState<TranslationJob[]>([]);
  const [activeJob, setActiveJob] = useState<TranslationJob | null>(null);
  const [activePages, setActivePages] = useState<TranslationPage[]>([]);
  const [isShowingProgress, setIsShowingProgress] = useState<boolean>(false);
  const [viewingReaderJob, setViewingReaderJob] = useState<TranslationJob | null>(null);
  const [readerPages, setReaderPages] = useState<TranslationPage[]>([]);

  // Real-time translation loop flags & metrics
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [currentPageNumber, setCurrentPageNumber] = useState<number>(0);
  const [currentOriginalSnippet, setCurrentOriginalSnippet] = useState<string>('');
  const [currentTranslatedSnippet, setCurrentTranslatedSnippet] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [failedPages, setFailedPages] = useState<number[]>([]);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);

  // Translation loop pause control ref
  const shouldPauseRef = useRef<boolean>(false);
  const activeExtractionRef = useRef<PdfExtractionResult | null>(null);

  // Initialize Auth & Key state
  useEffect(() => {
    const key = getSavedGeminiKey();
    setHasGeminiKey(!!key);

    const unsubscribe = onAuthChange(async (firebaseUser) => {
      setUser(firebaseUser);
      setAuthLoading(false);

      if (firebaseUser) {
        const userJobs = await getTranslationJobs(firebaseUser.uid);
        setJobs(userJobs);
      } else {
        setJobs([]);
        setActiveJob(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // Reload jobs helper
  const reloadJobs = async () => {
    if (!user) return;
    const list = await getTranslationJobs(user.uid);
    setJobs(list);
  };

  // Google Sign In handler
  const handleSignIn = async () => {
    setAuthLoading(true);
    try {
      const u = await signInWithGooglePopup();
      setUser(u);
      const list = await getTranslationJobs(u.uid);
      setJobs(list);
      // If no key saved yet, prompt for Gemini key
      const key = getSavedGeminiKey();
      if (!key) {
        setIsMandatoryKeyModal(true);
        setIsKeyModalOpen(true);
      }
    } catch (err: any) {
      console.error('Sign-in error:', err);
    } finally {
      setAuthLoading(false);
    }
  };

  // Sign out handler
  const handleSignOut = async () => {
    await signOutUser();
    setUser(null);
    setActiveJob(null);
    setActiveTab('dashboard');
  };

  // Start new translation job
  const handleStartTranslation = async (extraction: PdfExtractionResult, genre: TranslationGenre) => {
    if (!user) return;

    // Check for Gemini Key
    const key = getSavedGeminiKey();
    if (!key) {
      setIsMandatoryKeyModal(true);
      setIsKeyModalOpen(true);
      return;
    }

    activeExtractionRef.current = extraction;

    const newJob: TranslationJob = {
      id: 'job_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      userId: user.uid,
      originalFileName: extraction.fileName,
      fileSizeBytes: extraction.fileSizeBytes,
      totalPages: extraction.totalPages,
      completedPages: 0,
      currentPage: 1,
      progress: 0,
      status: 'processing',
      genre,
      geminiModel: selectedModel,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastCheckpointPage: 0,
    };

    await saveTranslationJob(newJob);
    setActiveJob(newJob);
    setActivePages([]);
    setFailedPages([]);
    setIsShowingProgress(true);
    await reloadJobs();

    // Begin translation engine loop
    runTranslationLoop(newJob, extraction, []);
  };

  // Resume unfinished job
  const handleResumeJob = async (job: TranslationJob) => {
    const key = getSavedGeminiKey();
    if (!key) {
      setIsMandatoryKeyModal(true);
      setIsKeyModalOpen(true);
      return;
    }

    const pages = await getTranslationPages(job.id);
    setActiveJob(job);
    setActivePages(pages);

    if (job.status === 'completed') {
      setViewingReaderJob(job);
      setReaderPages(pages);
      setActiveTab('reader');
      return;
    }

    setIsShowingProgress(true);
    // Resume processing loop
    runTranslationLoop(job, activeExtractionRef.current, pages);
  };

  // Pause translation
  const handlePauseTranslation = async () => {
    shouldPauseRef.current = true;
    setStatusMessage('Pausing safely... saving last completed checkpoint.');
  };

  // Core Translation Execution Loop
  const runTranslationLoop = async (
    job: TranslationJob,
    extraction: PdfExtractionResult | null,
    existingPages: TranslationPage[]
  ) => {
    shouldPauseRef.current = false;
    setIsTranslating(true);
    setIsShowingProgress(true);

    const pagesMap = new Map<number, TranslationPage>();
    existingPages.forEach(p => pagesMap.set(p.pageNumber, p));

    let completedCount = existingPages.filter(p => p.translatedSinhala && p.translatedSinhala.trim()).length;
    let currentJobState: TranslationJob = { ...job, status: 'processing' };
    await saveTranslationJob(currentJobState);

    const totalPages = job.totalPages;
    const startPage = completedCount + 1;

    for (let pageNum = startPage; pageNum <= totalPages; pageNum++) {
      if (shouldPauseRef.current) {
        currentJobState = {
          ...currentJobState,
          status: 'paused',
          currentPage: pageNum,
          updatedAt: new Date().toISOString(),
        };
        await saveTranslationJob(currentJobState);
        setActiveJob(currentJobState);
        setIsTranslating(false);
        setStatusMessage('Translation paused. All progress preserved.');
        await reloadJobs();
        return;
      }

      setCurrentPageNumber(pageNum);
      setStatusMessage(`Translating page ${pageNum} of ${totalPages}...`);

      // Determine text content for this page
      let pageText = '';
      if (extraction?.pages[pageNum - 1]) {
        pageText = extraction.pages[pageNum - 1].text;
      } else {
        pageText = pagesMap.get(pageNum)?.originalText || `[Page ${pageNum} Content]`;
      }

      setCurrentOriginalSnippet(pageText);
      setCurrentTranslatedSnippet('');

      // Send to server-side Gemini translator with selectedModel
      const res = await translateTextChunk(pageText, job.genre, pageNum, 0, selectedModel);

      if (res.success && res.translatedSinhala) {
        setCurrentTranslatedSnippet(res.translatedSinhala);

        const newPageRecord: TranslationPage = {
          id: `page_${job.id}_${pageNum}`,
          jobId: job.id,
          pageNumber: pageNum,
          originalText: pageText,
          translatedSinhala: res.translatedSinhala,
          headings: extraction?.pages[pageNum - 1]?.headings || [],
          status: 'completed',
          updatedAt: new Date().toISOString(),
          modelUsed: res.modelUsed,
          autoRecovered: res.autoRecovered,
        };

        pagesMap.set(pageNum, newPageRecord);
        await saveTranslationPage(newPageRecord);

        completedCount++;
        const newProgress = Math.round((completedCount / totalPages) * 100);

        currentJobState = {
          ...currentJobState,
          completedPages: completedCount,
          currentPage: pageNum,
          progress: newProgress,
          lastCheckpointPage: pageNum,
          updatedAt: new Date().toISOString(),
        };

        await saveTranslationJob(currentJobState);
        setActiveJob({ ...currentJobState });
        setActivePages(Array.from(pagesMap.values()).sort((a, b) => a.pageNumber - b.pageNumber));
      } else {
        // Translation failed for this page
        console.warn(`Page ${pageNum} failed:`, res.error);
        setFailedPages(prev => Array.from(new Set([...prev, pageNum])));
        setStatusMessage(`Page ${pageNum} encountered an issue: ${res.error || 'Timeout'}. Saved checkpoint.`);
      }
    }

    // Check completion
    const isAllDone = completedCount >= totalPages;

    currentJobState = {
      ...currentJobState,
      status: isAllDone ? 'completed' : 'paused',
      progress: Math.min(100, Math.round((completedCount / totalPages) * 100)),
      updatedAt: new Date().toISOString(),
    };

    await saveTranslationJob(currentJobState);
    setActiveJob(currentJobState);
    setIsTranslating(false);
    setStatusMessage(isAllDone ? 'Translation completed successfully!' : 'Translation paused. Checkpoints preserved.');
    await reloadJobs();
  };

  // Model Engine switcher
  const handleModelChange = (model: GeminiModelId) => {
    setSelectedModel(model);
    saveSettings({ preferredModel: model });
    if (activeJob) {
      const updated = { ...activeJob, geminiModel: model };
      setActiveJob(updated);
      saveTranslationJob(updated);
    }
  };

  // Retry individual failed page (e.g. Retry Page 1)
  const handleRetryPage = async (pageNum: number) => {
    if (!activeJob) return;
    setStatusMessage(`Retrying translation for page ${pageNum} with ${selectedModel}...`);
    
    let pageText = activePages.find(p => p.pageNumber === pageNum)?.originalText || '';
    if (!pageText && activeExtractionRef.current?.pages[pageNum - 1]) {
      pageText = activeExtractionRef.current.pages[pageNum - 1].text;
    }
    if (!pageText) {
      pageText = `[Page ${pageNum} Content]`;
    }

    const res = await translateTextChunk(pageText, activeJob.genre, pageNum, 0, selectedModel);
    if (res.success && res.translatedSinhala) {
      const updatedPage: TranslationPage = {
        id: `page_${activeJob.id}_${pageNum}`,
        jobId: activeJob.id,
        pageNumber: pageNum,
        originalText: pageText,
        translatedSinhala: res.translatedSinhala,
        headings: activeExtractionRef.current?.pages[pageNum - 1]?.headings || [],
        status: 'completed',
        updatedAt: new Date().toISOString(),
        modelUsed: res.modelUsed,
        autoRecovered: res.autoRecovered,
      };
      await saveTranslationPage(updatedPage);
      const newPages = await getTranslationPages(activeJob.id);
      setActivePages(newPages);
      setFailedPages(prev => prev.filter(p => p !== pageNum));

      // Recalculate completed count and progress
      const completedCount = newPages.filter(p => p.translatedSinhala && p.translatedSinhala.trim()).length;
      const isAllDone = completedCount >= activeJob.totalPages;
      const updatedJob: TranslationJob = {
        ...activeJob,
        completedPages: completedCount,
        progress: Math.min(100, Math.round((completedCount / activeJob.totalPages) * 100)),
        status: isAllDone ? 'completed' : activeJob.status,
        updatedAt: new Date().toISOString(),
      };
      await saveTranslationJob(updatedJob);
      setActiveJob(updatedJob);
      await reloadJobs();

      setStatusMessage(`Page ${pageNum} translated successfully!`);
    } else {
      setStatusMessage(`Retry for page ${pageNum} failed: ${res.error || 'Rate limit or timeout'}`);
    }
  };

  // Retry all failed pages
  const handleRetryAllFailed = async () => {
    const pagesToRetry = [...failedPages];
    for (const p of pagesToRetry) {
      await handleRetryPage(p);
    }
  };

  // Open Bilingual Reader
  const handleOpenReader = async (job: TranslationJob) => {
    setViewingReaderJob(job);
    const pages = await getTranslationPages(job.id);
    setReaderPages(pages);
    setActiveTab('reader');
  };

  // Export PDF Book handler
  const handleExportPdf = async (job: TranslationJob) => {
    setIsExportingPdf(true);
    try {
      const pages = await getTranslationPages(job.id);
      const blob = await exportSinhalaPdf(job, pages);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const cleanName = job.originalFileName.replace(/\.pdf$/i, '');
      link.download = `${cleanName}_Sinhala_Translation.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('PDF export failed:', err);
      alert('Could not export PDF: ' + (err?.message || 'Unknown error'));
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Delete job
  const handleDeleteJob = async (jobId: string) => {
    if (!user) return;
    if (window.confirm('Are you sure you want to delete this translation job and all its pages?')) {
      await deleteTranslationJob(user.uid, jobId);
      if (activeJob?.id === jobId) {
        setActiveJob(null);
        setActivePages([]);
      }
      if (viewingReaderJob?.id === jobId) {
        setViewingReaderJob(null);
        setReaderPages([]);
      }
      await reloadJobs();
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 flex flex-col font-sans text-[#1e293b] dark:text-slate-100 selection:bg-blue-100 dark:selection:bg-blue-900 selection:text-blue-900 dark:selection:text-blue-100 transition-colors">
      
      {/* Network offline resilience banner */}
      <OfflineBanner />

      {/* Primary Navigation */}
      <Navbar
        user={user}
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
        }}
        hasGeminiKey={hasGeminiKey}
        onOpenKeyModal={() => {
          setIsMandatoryKeyModal(false);
          setIsKeyModalOpen(true);
        }}
        onSignOut={handleSignOut}
        hasActiveJob={isTranslating}
      />

      {/* Main View Router */}
      <main className="flex-1 pb-16">
        {!user ? (
          <LandingView
            onSignInWithGoogle={handleSignIn}
            isLoading={authLoading}
          />
        ) : (
          <>
            {/* If currently translating or viewing translate progress tab */}
            {activeJob && isShowingProgress && activeTab === 'dashboard' ? (
              <TranslateProgressView
                job={activeJob}
                pages={activePages}
                isTranslating={isTranslating}
                currentPageNumber={currentPageNumber}
                currentOriginalSnippet={currentOriginalSnippet}
                currentTranslatedSnippet={currentTranslatedSnippet}
                statusMessage={statusMessage}
                failedPages={failedPages}
                selectedModel={selectedModel}
                onChangeModel={handleModelChange}
                onPause={handlePauseTranslation}
                onResume={() => runTranslationLoop(activeJob, activeExtractionRef.current, activePages)}
                onRetryPage={handleRetryPage}
                onRetryAllFailed={handleRetryAllFailed}
                onOpenReader={() => {
                  setIsShowingProgress(false);
                  handleOpenReader(activeJob);
                }}
                onDownloadPdf={() => handleExportPdf(activeJob)}
                onBackToDashboard={() => {
                  setIsShowingProgress(false);
                  setActiveTab('dashboard');
                }}
                isExportingPdf={isExportingPdf}
              />
            ) : (
              <>
                {activeTab === 'dashboard' && (
                  <DashboardView
                    user={user}
                    activeJobs={jobs}
                    onStartTranslation={handleStartTranslation}
                    onResumeJob={(j) => {
                      setActiveJob(j);
                      handleResumeJob(j);
                    }}
                    onOpenReader={handleOpenReader}
                    onDeleteJob={handleDeleteJob}
                    onExportPdf={handleExportPdf}
                    onConnectGemini={() => {
                      setIsMandatoryKeyModal(false);
                      setIsKeyModalOpen(true);
                    }}
                    hasGeminiKey={hasGeminiKey}
                  />
                )}

                {activeTab === 'history' && (
                  <HistoryView
                    jobs={jobs}
                    onResumeJob={(j) => {
                      setActiveJob(j);
                      handleResumeJob(j);
                      setActiveTab('dashboard');
                    }}
                    onOpenReader={handleOpenReader}
                    onExportPdf={handleExportPdf}
                    onDeleteJob={handleDeleteJob}
                    onStartNewBook={() => setActiveTab('dashboard')}
                  />
                )}

                {activeTab === 'reader' && (
                  <ReaderView
                    job={viewingReaderJob || activeJob || jobs[0] || null}
                    pages={readerPages.length > 0 ? readerPages : activePages}
                    onBackToDashboard={() => setActiveTab('dashboard')}
                    onExportPdf={handleExportPdf}
                    isExportingPdf={isExportingPdf}
                  />
                )}

                {activeTab === 'settings' && (
                  <SettingsView
                    user={user}
                    onSettingsUpdated={() => {
                      const k = getSavedGeminiKey();
                      setHasGeminiKey(!!k);
                    }}
                    onOpenGeminiKeyModal={() => {
                      setIsMandatoryKeyModal(false);
                      setIsKeyModalOpen(true);
                    }}
                  />
                )}
              </>
            )}
          </>
        )}
      </main>

      {/* Gemini API Key Modal */}
      <GeminiKeyModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        onKeySaved={(newKey) => {
          saveGeminiKey(newKey);
          setHasGeminiKey(true);
          setIsKeyModalOpen(false);
        }}
        isMandatory={isMandatoryKeyModal}
      />
    </div>
  );
}
export default App;
