import React, { useState, useEffect } from 'react';
import { 
  Key, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Info
} from 'lucide-react';
import { testGeminiApiKey } from '../lib/gemini';
import { getSavedGeminiKey, saveGeminiKey } from '../lib/storage';

interface GeminiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeySaved: (key: string) => void;
  isMandatory?: boolean;
}

export const GeminiKeyModal: React.FC<GeminiKeyModalProps> = ({
  isOpen,
  onClose,
  onKeySaved,
  isMandatory = false,
}) => {
  const [apiKey, setApiKey] = useState<string>('');
  const [showKey, setShowKey] = useState<boolean>(false);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{
    status: 'idle' | 'success' | 'error';
    message: string;
    sample?: string;
  }>({ status: 'idle', message: '' });

  useEffect(() => {
    if (isOpen) {
      const existing = getSavedGeminiKey();
      setApiKey(existing);
      setTestResult({ status: 'idle', message: '' });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    if (!apiKey.trim()) {
      setTestResult({
        status: 'error',
        message: 'Please enter your Gemini API key first.',
      });
      return;
    }

    setIsTesting(true);
    setTestResult({ status: 'idle', message: 'Verifying with Google Gemini...' });

    const res = await testGeminiApiKey(apiKey.trim());
    setIsTesting(false);

    if (res.success) {
      setTestResult({
        status: 'success',
        message: 'Gemini connection verified! Translation endpoint is fully active.',
        sample: res.sampleTranslation,
      });
    } else {
      setTestResult({
        status: 'error',
        message: res.message || 'Verification failed. Please check your Gemini key permissions.',
      });
    }
  };

  const handleSave = () => {
    if (!apiKey.trim()) {
      setTestResult({
        status: 'error',
        message: 'A Gemini API key is required to perform translations.',
      });
      return;
    }

    saveGeminiKey(apiKey.trim());
    onKeySaved(apiKey.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div 
        className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-xl border border-slate-100 dark:border-slate-800 relative text-slate-800 dark:text-slate-100 transition-colors"
        id="gemini-key-modal"
      >
        {/* Header */}
        <div className="flex items-start gap-3.5 mb-5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Key className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2">
              Connect Gemini
              <span className="text-[11px] px-2.5 py-0.5 rounded-full font-sans font-semibold bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                Required
              </span>
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              To translate your books using Gemini AI, add your personal Google Gemini API key.
            </p>
          </div>
        </div>

        {/* Informative Security Callout */}
        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/80 mb-5 text-xs text-slate-600 dark:text-slate-400 space-y-2">
          <div className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-200">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Private & Direct Execution</span>
          </div>
          <p>
            Your API key is used exclusively for your translation requests through our server-side proxy. It is never logged, never hard-coded, and never shared with other users.
          </p>
          <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 pt-1 font-medium">
            <Info className="w-3.5 h-3.5 shrink-0" />
            <span>Supports Free Gemini Models (3.6 Flash / 3.5 Flash Lite / 3.7 Flash) with auto-fallback.</span>
          </div>
        </div>

        {/* API Key Input */}
        <div className="space-y-3 mb-5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Google Gemini API Key
          </label>
          <div className="relative">
            <input
              id="input-gemini-api-key"
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
            <button
              type="button"
              id="btn-toggle-key-visibility"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 cursor-pointer"
              title={showKey ? 'Hide key' : 'Show key'}
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 pt-1">
            <span>Don't have a Gemini API key?</span>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold hover:underline"
            >
              Get key from Google AI Studio
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Connection Test Status */}
        {testResult.status !== 'idle' && (
          <div
            id="gemini-test-result"
            className={`p-3.5 rounded-xl border text-xs mb-5 transition-all ${
              testResult.status === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
                : 'bg-rose-50 dark:bg-rose-950/50 text-rose-900 dark:text-rose-200 border-rose-200 dark:border-rose-800'
            }`}
          >
            <div className="flex items-start gap-2">
              {testResult.status === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-semibold">{testResult.message}</p>
                {testResult.sample && (
                  <p className="mt-1.5 text-slate-700 dark:text-slate-300 font-sans italic bg-white/70 dark:bg-slate-800/80 p-2 rounded-lg border border-emerald-100 dark:border-emerald-900">
                    Sample Sinhala output: "{testResult.sample}"
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {!isMandatory && (
            <button
              id="btn-cancel-key-modal"
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
          )}

          <button
            id="btn-test-gemini-connection"
            type="button"
            onClick={handleTestConnection}
            disabled={isTesting || !apiKey.trim()}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 disabled:opacity-50 rounded-xl transition-colors cursor-pointer"
          >
            {isTesting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />
                <span>Testing...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Test Connection</span>
              </>
            )}
          </button>

          <button
            id="btn-save-gemini-key"
            type="button"
            onClick={handleSave}
            disabled={!apiKey.trim()}
            className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Save API Key
          </button>
        </div>
      </div>
    </div>
  );
};
