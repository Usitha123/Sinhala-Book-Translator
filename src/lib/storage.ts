import { db } from './firebase';
import { 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  collection, 
  query, 
  where, 
  deleteDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { TranslationJob, TranslationPage, TranslationSettings } from '../types';

const JOBS_STORAGE_PREFIX = 'sinhalabook_jobs_';
const PAGES_STORAGE_PREFIX = 'sinhalabook_pages_';
const SETTINGS_KEY = 'sinhalabook_settings';
const API_KEY_STORAGE = 'sinhalabook_gemini_api_key';
const THEME_STORAGE_KEY = 'sinhalabook_theme';

// Theme management
export function getSavedTheme(): 'light' | 'dark' | 'system' {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'dark' || saved === 'light' || saved === 'system') {
      return saved;
    }
  } catch {
    // ignore
  }
  return 'light';
}

export function saveTheme(theme: 'light' | 'dark' | 'system') {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    applyThemeClass(theme);
  } catch {
    // ignore
  }
}

export function applyThemeClass(theme: 'light' | 'dark' | 'system') {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  if (isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

// Local storage helpers
function getLocalJobs(userId: string): TranslationJob[] {
  try {
    const raw = localStorage.getItem(`${JOBS_STORAGE_PREFIX}${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalJobs(userId: string, jobs: TranslationJob[]) {
  localStorage.setItem(`${JOBS_STORAGE_PREFIX}${userId}`, JSON.stringify(jobs));
}

function getLocalPages(jobId: string): TranslationPage[] {
  try {
    const raw = localStorage.getItem(`${PAGES_STORAGE_PREFIX}${jobId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalPages(jobId: string, pages: TranslationPage[]) {
  localStorage.setItem(`${PAGES_STORAGE_PREFIX}${jobId}`, JSON.stringify(pages));
}

export const DEFAULT_GEMINI_KEY = '';

// API Key management
export function getSavedGeminiKey(): string {
  return localStorage.getItem(API_KEY_STORAGE) || '';
}

export function saveGeminiKey(apiKey: string) {
  if (apiKey && apiKey.trim()) {
    localStorage.setItem(API_KEY_STORAGE, apiKey.trim());
  } else {
    localStorage.removeItem(API_KEY_STORAGE);
  }
}

// Settings management
export function getSavedSettings(): TranslationSettings {
  const fallback: TranslationSettings = {
    geminiApiKey: getSavedGeminiKey(),
    preferredStyle: 'general',
    preferredModel: 'auto-fallback',
    theme: getSavedTheme(),
    sourceLanguage: 'en',
    targetLanguage: 'si',
    pdfPageSize: 'A4',
    pdfFontSize: 'medium',
  };

  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return { 
      ...fallback, 
      ...parsed, 
      geminiApiKey: getSavedGeminiKey(),
      theme: parsed.theme || getSavedTheme(),
      preferredModel: parsed.preferredModel || 'auto-fallback' 
    };
  } catch {
    return fallback;
  }
}

export function saveSettings(settings: Partial<TranslationSettings>) {
  const current = getSavedSettings();
  const merged: TranslationSettings = { ...current, ...settings };
  if (settings.geminiApiKey !== undefined) {
    saveGeminiKey(settings.geminiApiKey);
  }
  if (settings.theme !== undefined) {
    saveTheme(settings.theme);
  }
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged));
}

// Job operations
export async function saveTranslationJob(job: TranslationJob): Promise<void> {
  // Update local cache immediately
  const jobs = getLocalJobs(job.userId);
  const index = jobs.findIndex(j => j.id === job.id);
  if (index >= 0) {
    jobs[index] = { ...job, updatedAt: new Date().toISOString() };
  } else {
    jobs.unshift({ ...job, updatedAt: new Date().toISOString() });
  }
  saveLocalJobs(job.userId, jobs);

  // Sync to Firestore if available
  if (db) {
    try {
      const jobRef = doc(db, 'translations', job.id);
      await setDoc(jobRef, {
        ...job,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } catch (e) {
      console.warn('Firestore job save error (cached locally):', e);
    }
  }
}

export async function getTranslationJobs(userId: string): Promise<TranslationJob[]> {
  const localList = getLocalJobs(userId);

  if (db) {
    try {
      const q = query(collection(db, 'translations'), where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      const remoteJobs: TranslationJob[] = [];
      querySnapshot.forEach((d) => {
        remoteJobs.push(d.data() as TranslationJob);
      });

      if (remoteJobs.length > 0) {
        // Merge with local list (prefer newest)
        const map = new Map<string, TranslationJob>();
        localList.forEach(j => map.set(j.id, j));
        remoteJobs.forEach(j => {
          const existing = map.get(j.id);
          if (!existing || new Date(j.updatedAt) > new Date(existing.updatedAt)) {
            map.set(j.id, j);
          }
        });
        const merged = Array.from(map.values()).sort((a, b) => 
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
        saveLocalJobs(userId, merged);
        return merged;
      }
    } catch (e) {
      console.warn('Firestore fetch error, falling back to local jobs:', e);
    }
  }

  return localList.sort((a, b) => 
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export async function getTranslationJob(userId: string, jobId: string): Promise<TranslationJob | null> {
  const jobs = await getTranslationJobs(userId);
  return jobs.find(j => j.id === jobId) || null;
}

export async function deleteTranslationJob(userId: string, jobId: string): Promise<void> {
  const jobs = getLocalJobs(userId).filter(j => j.id !== jobId);
  saveLocalJobs(userId, jobs);
  localStorage.removeItem(`${PAGES_STORAGE_PREFIX}${jobId}`);

  if (db) {
    try {
      await deleteDoc(doc(db, 'translations', jobId));
    } catch (e) {
      console.warn('Firestore delete error:', e);
    }
  }
}

// Page operations
export async function saveTranslationPage(page: TranslationPage): Promise<void> {
  const pages = getLocalPages(page.jobId);
  const index = pages.findIndex(p => p.pageNumber === page.pageNumber);
  if (index >= 0) {
    pages[index] = { ...page, updatedAt: new Date().toISOString() };
  } else {
    pages.push({ ...page, updatedAt: new Date().toISOString() });
  }
  pages.sort((a, b) => a.pageNumber - b.pageNumber);
  saveLocalPages(page.jobId, pages);

  if (db) {
    try {
      const pageRef = doc(db, 'translations', page.jobId, 'pages', `page_${page.pageNumber}`);
      await setDoc(pageRef, {
        ...page,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } catch (e) {
      console.warn('Firestore page save error (cached locally):', e);
    }
  }
}

export async function getTranslationPages(jobId: string): Promise<TranslationPage[]> {
  const localPages = getLocalPages(jobId);

  if (db) {
    try {
      const q = collection(db, 'translations', jobId, 'pages');
      const snap = await getDocs(q);
      const remotePages: TranslationPage[] = [];
      snap.forEach(d => remotePages.push(d.data() as TranslationPage));

      if (remotePages.length > 0) {
        const map = new Map<number, TranslationPage>();
        localPages.forEach(p => map.set(p.pageNumber, p));
        remotePages.forEach(p => map.set(p.pageNumber, p));
        const merged = Array.from(map.values()).sort((a, b) => a.pageNumber - b.pageNumber);
        saveLocalPages(jobId, merged);
        return merged;
      }
    } catch (e) {
      console.warn('Firestore pages fetch error, using local pages:', e);
    }
  }

  return localPages.sort((a, b) => a.pageNumber - b.pageNumber);
}
