export type TranslationStatus = 'waiting' | 'processing' | 'paused' | 'completed' | 'failed';

export type TranslationGenre = 
  | 'general'
  | 'literature'
  | 'academic'
  | 'technical'
  | 'business'
  | 'educational'
  | 'fiction'
  | 'non-fiction';

export type GeminiModelId = 
  | 'auto-fallback'
  | 'gemini-3.8-flash'
  | 'gemini-3.7-flash'
  | 'gemini-3.6-flash'
  | 'gemini-3.5-flash-lite';

export interface ModelOption {
  id: GeminiModelId;
  name: string;
  badge: string;
  description: string;
  isFree: boolean;
}

export const SUPPORTED_GEMINI_MODELS: ModelOption[] = [
  {
    id: 'auto-fallback',
    name: 'Auto-Fallback & Recovery',
    badge: 'Recommended',
    description: 'Auto-switches across 3.8 Flash, 3.7 Flash, 3.6 Flash, & 3.5 Flash Lite if rate limits or timeouts occur.',
    isFree: true,
  },
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    badge: 'High Quality',
    description: 'Flagship free text model with superior natural Sinhala vocabulary and literary nuance.',
    isFree: true,
  },
  {
    id: 'gemini-3.7-flash',
    name: 'Gemini 3.7 Flash',
    badge: 'High Reasoning',
    description: 'Fast, nuanced reasoning and accurate translation for complex texts and scholarly works.',
    isFree: true,
  },
  {
    id: 'gemini-3.6-flash',
    name: 'Gemini 3.6 Flash',
    badge: 'Stable Free Tier',
    description: 'Consistent, stable translation throughput with standard free quota allowances.',
    isFree: true,
  },
  {
    id: 'gemini-3.5-flash-lite',
    name: 'Gemini 3.5 Flash Lite',
    badge: 'Highest Rate Limit',
    description: 'Ultra-low latency, generous request-per-minute limits, ideal when hitting 429 errors.',
    isFree: true,
  },
];

export type ThemeMode = 'light' | 'dark' | 'system';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  hasGeminiKey: boolean;
  preferredStyle: TranslationGenre;
  preferredModel?: GeminiModelId;
  theme?: ThemeMode;
  createdAt: string;
  updatedAt: string;
}

export interface TranslationChunk {
  id: string;
  chunkIndex: number;
  originalText: string;
  translatedSinhala: string;
  status: 'waiting' | 'translating' | 'completed' | 'failed';
  modelUsed?: string;
  autoRecovered?: boolean;
  error?: string;
}

export interface TranslationPage {
  id: string;
  jobId: string;
  pageNumber: number;
  originalText: string;
  translatedSinhala: string;
  headings?: string[];
  status: 'waiting' | 'translating' | 'completed' | 'failed';
  modelUsed?: string;
  autoRecovered?: boolean;
  error?: string;
  updatedAt: string;
}

export interface TranslationJob {
  id: string;
  userId: string;
  originalFileName: string;
  originalFileUrl?: string;
  fileSizeBytes: number;
  totalPages: number;
  completedPages: number;
  currentPage: number;
  progress: number; // percentage 0-100
  genre: TranslationGenre;
  status: TranslationStatus;
  geminiModel: string;
  lastCheckpointPage: number;
  errorInfo?: string;
  isScanned?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TranslationSettings {
  geminiApiKey: string;
  preferredStyle: TranslationGenre;
  preferredModel: GeminiModelId;
  theme: ThemeMode;
  sourceLanguage: string;
  targetLanguage: string;
  pdfPageSize: 'A4' | 'Letter';
  pdfFontSize: 'small' | 'medium' | 'large';
}

export interface ExtractedPage {
  pageNumber: number;
  text: string;
  wordCount: number;
  headings: string[];
}

export interface PdfExtractionResult {
  totalPages: number;
  isScanned: boolean;
  pages: ExtractedPage[];
  fileName: string;
  fileSizeBytes: number;
  titleEstimate?: string;
}
