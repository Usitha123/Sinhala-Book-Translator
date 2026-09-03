import React, { useState, useEffect } from 'react';
import { 
  Key, 
  User, 
  Languages, 
  FileText, 
  Shield, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Sparkles,
  Cloud,
  Copy,
  Check,
  Zap,
  Sun,
  Moon,
  Monitor
} from 'lucide-react';
import { UserProfile, TranslationSettings, TranslationGenre, GeminiModelId, SUPPORTED_GEMINI_MODELS } from '../types';
import { getSavedSettings, saveSettings, getSavedTheme, saveTheme, applyThemeClass } from '../lib/storage';
import { testGeminiApiKey } from '../lib/gemini';

interface SettingsViewProps {
  user: UserProfile;
  onSettingsUpdated: () => void;
  onOpenGeminiKeyModal: () => void;
  theme?: 'light' | 'dark' | 'system';
  onThemeChange?: (theme: 'light' | 'dark' | 'system') => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  onSettingsUpdated,
  onOpenGeminiKeyModal,
  theme = 'light',
  onThemeChange,
}) => {
  const [settings, setSettings] = useState<TranslationSettings>(getSavedSettings());
  const [apiKeyInput, setApiKeyInput] = useState<string>(settings.geminiApiKey || '');
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ status: 'idle' | 'success' | 'error'; message: string }>({
    status: 'idle',
    message: '',
  });
  const [savedNotice, setSavedNotice] = useState<boolean>(false);
  const [copiedEnv, setCopiedEnv] = useState<boolean>(false);
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark' | 'system'>(theme);

  useEffect(() => {
    setApiKeyInput(settings.geminiApiKey);
  }, [settings.geminiApiKey]);

  const handleTestKey = async () => {
    if (!apiKeyInput.trim()) {
      setTestResult({ status: 'error', message: 'Please provide an API key to test.' });
      return;
    }
    setIsTesting(true);
    setTestResult({ status: 'idle', message: 'Verifying...' });

    const res = await testGeminiApiKey(apiKeyInput.trim());
    setIsTesting(false);
    if (res.success) {
      setTestResult({ status: 'success', message: 'Gemini API Key is valid and active!' });
    } else {
      setTestResult({ status: 'error', message: res.message || 'Key validation failed.' });
    }
  };

  const handleSaveAll = () => {
    const updated: TranslationSettings = {
      ...settings,
      geminiApiKey: apiKeyInput.trim(),
    };
    saveSettings(updated);
    setSettings(updated);
    onSettingsUpdated();
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  const handleSelectTheme = (t: 'light' | 'dark' | 'system') => {
    setCurrentTheme(t);
    saveTheme(t);
    applyThemeClass(t);
    if (onThemeChange) {
      onThemeChange(t);
    }
  };

  const vercelEnvSnippet = `NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_web_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=sinhalabook-translator.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=sinhalabook-translator
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=sinhalabook-translator.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=2040681866
NEXT_PUBLIC_FIREBASE_APP_ID=1:2040681866:web:21a217152a93accda76473
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-H2PC3B2NSR
GEMINI_API_KEY=your_gemini_api_key`;

  const copyVercelEnvs = () => {
    navigator.clipboard.writeText(vercelEnvSnippet);
    setCopiedEnv(true);
    setTimeout(() => setCopiedEnv(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in text-slate-800 dark:text-slate-100 transition-colors">
      
      {/* Header */}
      <div className="pb-2 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">Application Settings</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage your Google identity, Gemini models, theme appearance, and PDF formatting.
          </p>
        </div>

        {savedNotice && (
          <div className="px-3.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold flex items-center gap-1.5 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Settings Saved</span>
          </div>
        )}
      </div>

      {/* 0. Appearance & Dark Mode Theme Section */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Sun className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold tracking-tight text-slate-800 dark:text-slate-100">Interface Appearance</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Switch between clean light theme and low-light dark mode.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
          <button
            type="button"
            onClick={() => handleSelectTheme('light')}
            className={`p-3.5 rounded-2xl border flex items-center gap-3 transition-all cursor-pointer text-xs font-semibold ${
              currentTheme === 'light'
                ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-700 dark:text-blue-300 shadow-xs'
                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
            }`}
          >
            <Sun className="w-4 h-4 text-amber-500" />
            <span>Light Mode</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectTheme('dark')}
            className={`p-3.5 rounded-2xl border flex items-center gap-3 transition-all cursor-pointer text-xs font-semibold ${
              currentTheme === 'dark'
                ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-700 dark:text-blue-300 shadow-xs'
                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
            }`}
          >
            <Moon className="w-4 h-4 text-indigo-400" />
            <span>Dark Mode</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectTheme('system')}
            className={`p-3.5 rounded-2xl border flex items-center gap-3 transition-all cursor-pointer text-xs font-semibold ${
              currentTheme === 'system'
                ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-700 dark:text-blue-300 shadow-xs'
                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
            }`}
          >
            <Monitor className="w-4 h-4 text-slate-400" />
            <span>System Default</span>
          </button>
        </div>
      </div>

      {/* 1. Account Section */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <User className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold tracking-tight text-slate-800 dark:text-slate-100">Google Account Identity</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Your cloud-synchronized profile across devices.</p>
          </div>
        </div>

        <div className="flex items-center gap-4 pt-1">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName}
              className="w-14 h-14 rounded-full object-cover ring-2 ring-blue-500/20"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-blue-600 text-white font-bold text-lg flex items-center justify-center">
              {user.displayName.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="space-y-0.5">
            <h4 className="text-base font-bold text-slate-800 dark:text-slate-100">{user.displayName}</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{user.email}</p>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium pt-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Firebase Cloud Storage & Firestore Sync Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Gemini API Credentials & Model Tier */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight text-slate-800 dark:text-slate-100">Google Gemini API Key</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Your private key for executing model translations.</p>
            </div>
          </div>

          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
            apiKeyInput 
              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' 
              : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
          }`}>
            {apiKeyInput ? 'Key Configured' : 'Missing Key'}
          </span>
        </div>

        <div className="space-y-3">
          <div className="relative">
            <input
              type={showApiKey ? 'text' : 'password'}
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="Enter your Gemini API key (AIzaSy...)"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
            >
              {showApiKey ? 'Hide' : 'Show'}
            </button>
          </div>

          {testResult.status !== 'idle' && (
            <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
              testResult.status === 'success' 
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800' 
                : 'bg-rose-50 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200 border-rose-200 dark:border-rose-800'
            }`}>
              {testResult.status === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}

          <div className="flex items-center justify-between text-xs pt-1">
            <button
              type="button"
              onClick={handleTestKey}
              disabled={isTesting || !apiKeyInput.trim()}
              className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {isTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600 dark:text-blue-400" /> : <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
              <span>Test Connection</span>
            </button>

            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 font-semibold hover:underline inline-flex items-center gap-1"
            >
              <span>Get API Key from Google AI Studio</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Free Gemini Models Tier with Auto-Fallback */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <label className="font-semibold text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Preferred Free Gemini Model (with Auto-Fallback & Recovery)</span>
            </label>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
              Free Tier Supported
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
            {SUPPORTED_GEMINI_MODELS.map((m) => {
              const isSelected = (settings.preferredModel || 'auto-fallback') === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSettings({ ...settings, preferredModel: m.id })}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-900 dark:text-blue-100 shadow-2xs font-semibold'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold">{m.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-mono">
                      {m.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-normal leading-normal">
                    {m.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* 3. Translation Preferences */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Languages className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold tracking-tight text-slate-800 dark:text-slate-100">Translation Style & Register</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Fine-tune the tone and language pair settings.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 dark:text-slate-300 block">Default Translation Tone</label>
            <select
              value={settings.preferredStyle}
              onChange={(e) => setSettings({ ...settings, preferredStyle: e.target.value as TranslationGenre })}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            >
              <option value="general">Natural / General Book</option>
              <option value="literature">Literary / Fiction Novel</option>
              <option value="academic">Academic / Scientific</option>
              <option value="technical">Technical / Computer Science</option>
              <option value="business">Business / Commercial</option>
              <option value="educational">Educational / Textbook</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 dark:text-slate-300 block">Language Pair</label>
            <div className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-medium flex items-center justify-between">
              <span>English (en) → Natural Sinhala (si)</span>
              <span className="text-[10px] font-bold uppercase bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                Unicode
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. PDF Layout Options */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold tracking-tight text-slate-800 dark:text-slate-100">PDF Book Export Layout</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Configure page dimensions and font typography for exported books.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 dark:text-slate-300 block">Paper Size</label>
            <select
              value={settings.pdfPageSize}
              onChange={(e) => setSettings({ ...settings, pdfPageSize: e.target.value as 'A4' | 'Letter' })}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            >
              <option value="A4">A4 Standard Book Format (210 × 297 mm)</option>
              <option value="Letter">US Letter (8.5 × 11 in)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 dark:text-slate-300 block">Body Text Size</label>
            <select
              value={settings.pdfFontSize}
              onChange={(e) => setSettings({ ...settings, pdfFontSize: e.target.value as 'small' | 'medium' | 'large' })}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            >
              <option value="small">Compact (11pt font)</option>
              <option value="medium">Standard Book (13pt font)</option>
              <option value="large">Large Print (15pt font)</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleSaveAll}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            Save All Preferences
          </button>
        </div>
      </div>

      {/* 5. Production Vercel & Firebase Deployment Guide */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-sm space-y-4 border border-slate-800">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight text-white">Vercel & Firebase Production Setup</h3>
              <p className="text-xs text-slate-400">Deploy this repository to production with your own Firebase project.</p>
            </div>
          </div>

          <button
            onClick={copyVercelEnvs}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-blue-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            {copiedEnv ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedEnv ? 'Copied Snippet' : 'Copy Vercel .env'}</span>
          </button>
        </div>

        <div className="text-xs text-slate-300 space-y-2">
          <p className="font-semibold text-slate-200">Required Vercel Environment Variables:</p>
          <pre className="p-3 bg-slate-950 rounded-2xl font-mono text-[11px] text-blue-200 overflow-x-auto border border-slate-800">
            {vercelEnvSnippet}
          </pre>
          <ul className="list-disc list-inside space-y-1 text-slate-400 pt-1">
            <li>In Firebase Console, enable <strong>Authentication → Sign-in method → Google</strong>.</li>
            <li>Add your Vercel deployment domain (e.g. <code>*.vercel.app</code>) to <strong>Authentication → Settings → Authorized domains</strong>.</li>
            <li>Create Firestore database and deploy the included <code>firestore.rules</code>.</li>
            <li>Enable Firebase Storage and deploy <code>storage.rules</code>.</li>
          </ul>
        </div>
      </div>

    </div>
  );
};
