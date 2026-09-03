import React from 'react';
import { 
  BookOpen, 
  Key, 
  History, 
  Settings, 
  LogOut, 
  AlertCircle, 
  BookMarked,
  Sun,
  Moon
} from 'lucide-react';
import { UserProfile } from '../types';

interface NavbarProps {
  user: UserProfile | null;
  activeTab: 'dashboard' | 'history' | 'reader' | 'settings';
  setActiveTab: (tab: 'dashboard' | 'history' | 'reader' | 'settings') => void;
  hasGeminiKey: boolean;
  onOpenKeyModal: () => void;
  onSignOut: () => void;
  hasActiveJob: boolean;
  theme: 'light' | 'dark' | 'system';
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeTab,
  setActiveTab,
  hasGeminiKey,
  onOpenKeyModal,
  onSignOut,
  hasActiveJob,
  theme,
  onToggleTheme,
}) => {
  const isDark = theme === 'dark';

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand */}
        <div 
          onClick={() => setActiveTab('dashboard')} 
          className="flex items-center gap-3 cursor-pointer select-none group"
          id="nav-brand-logo"
        >
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xl italic shadow-xs group-hover:bg-blue-700 transition-colors">
            S
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg tracking-tight text-slate-800 dark:text-slate-100">SinhalaBook</span>
              <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 rounded-md border border-blue-100 dark:border-blue-900/50">
                Translator
              </span>
            </div>
            <p className="text-xs text-slate-400 font-sans -mt-0.5">Natural AI Book Translation</p>
          </div>
        </div>

        {/* Navigation Tabs (when logged in) */}
        {user && (
          <nav className="hidden md:flex items-center gap-1 bg-slate-50 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700/60 text-sm">
            <button
              id="nav-tab-dashboard"
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 shadow-xs font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50'
              }`}
            >
              <BookOpen className={`w-4 h-4 ${activeTab === 'dashboard' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
              <span>Translate</span>
              {hasActiveJob && (
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              )}
            </button>

            <button
              id="nav-tab-history"
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'history'
                  ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 shadow-xs font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50'
              }`}
            >
              <History className={`w-4 h-4 ${activeTab === 'history' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
              <span>History</span>
            </button>

            <button
              id="nav-tab-reader"
              onClick={() => setActiveTab('reader')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'reader'
                  ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 shadow-xs font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50'
              }`}
            >
              <BookMarked className={`w-4 h-4 ${activeTab === 'reader' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
              <span>Reader</span>
            </button>

            <button
              id="nav-tab-settings"
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'settings'
                  ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 shadow-xs font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50'
              }`}
            >
              <Settings className={`w-4 h-4 ${activeTab === 'settings' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
              <span>Settings</span>
            </button>
          </nav>
        )}

        {/* Right Section: Dark Mode Toggle, Key Status & User Profile */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Dark Mode Toggle Button */}
          <button
            id="btn-theme-toggle"
            type="button"
            onClick={onToggleTheme}
            className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all cursor-pointer"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme mode"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>

          {user ? (
            <>
              {/* Gemini Key Pill */}
              <button
                id="btn-gemini-key-status"
                onClick={onOpenKeyModal}
                className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                  hasGeminiKey
                    ? 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                    : 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/60 animate-pulse'
                }`}
                title="Configure Google Gemini API Key"
              >
                <Key className="w-3.5 h-3.5 text-slate-400" />
                {hasGeminiKey ? (
                  <>
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Gemini Active</span>
                  </>
                ) : (
                  <>
                    <span className="font-semibold text-blue-700 dark:text-blue-300">Connect Gemini Key</span>
                    <AlertCircle className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  </>
                )}
              </button>

              {/* User Avatar & Logout */}
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
                <div 
                  onClick={() => setActiveTab('settings')}
                  className="flex items-center gap-2.5 p-1 pr-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  id="user-profile-summary"
                  title={user.email}
                >
                  {user.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt={user.displayName} 
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-white dark:ring-slate-800 shadow-xs"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300 font-bold flex items-center justify-center text-xs">
                      {user.displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="hidden lg:inline text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[120px]">
                    {user.displayName.split(' ')[0]}
                  </span>
                </div>

                <button
                  id="btn-logout"
                  onClick={onSignOut}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                  title="Sign out of Google"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline font-medium">English → Natural Sinhala</span>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Subnavigation */}
      {user && (
        <div className="flex md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-1.5 justify-around text-xs">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center py-1.5 px-3 rounded-lg cursor-pointer ${
              activeTab === 'dashboard' ? 'text-blue-600 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-950/60' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <BookOpen className="w-4 h-4 mb-0.5" />
            <span>Translate</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex flex-col items-center py-1.5 px-3 rounded-lg cursor-pointer ${
              activeTab === 'history' ? 'text-blue-600 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-950/60' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <History className="w-4 h-4 mb-0.5" />
            <span>History</span>
          </button>
          <button
            onClick={() => setActiveTab('reader')}
            className={`flex flex-col items-center py-1.5 px-3 rounded-lg cursor-pointer ${
              activeTab === 'reader' ? 'text-blue-600 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-950/60' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <BookMarked className="w-4 h-4 mb-0.5" />
            <span>Reader</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center py-1.5 px-3 rounded-lg cursor-pointer ${
              activeTab === 'settings' ? 'text-blue-600 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-950/60' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Settings className="w-4 h-4 mb-0.5" />
            <span>Settings</span>
          </button>
        </div>
      )}
    </header>
  );
};
