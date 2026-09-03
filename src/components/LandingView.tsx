import React from 'react';
import { 
  BookOpen, 
  Sparkles, 
  ShieldCheck, 
  RotateCcw, 
  FileText, 
  CheckCircle, 
  ArrowRight,
  Languages,
  BookMarked,
  Download
} from 'lucide-react';

interface LandingViewProps {
  onSignInWithGoogle: () => void;
  isLoading: boolean;
  onExploreFeatures?: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({
  onSignInWithGoogle,
  isLoading,
  onExploreFeatures,
}) => {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-between bg-[#f8fafc] text-slate-800">
      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 text-center">
        
        {/* Eyebrow badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-blue-600 text-xs font-semibold tracking-wide uppercase mb-6 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>Next-Generation Literary & Academic Translation</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 max-w-4xl mx-auto leading-[1.15]">
          Translate Books into <span className="text-blue-600">Natural Sinhala</span> with AI
        </h1>

        {/* Subtitle */}
        <p className="mt-5 text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto font-sans leading-relaxed">
          Upload your English PDF books and transform them into fluent, readable, authentic Sinhala using Google Gemini. Resume progress anytime and export a beautifully formatted book PDF.
        </p>

        {/* Call to Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <button
            id="btn-login-google"
            onClick={onSignInWithGoogle}
            disabled={isLoading}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-slate-900 text-white font-semibold flex items-center justify-center gap-3 shadow-md hover:bg-slate-800 hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-60 cursor-pointer"
          >
            {/* Google Icon SVG */}
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span className="text-sm tracking-wide">
              {isLoading ? 'Connecting to Google...' : 'Continue with Google'}
            </span>
          </button>

          <a
            href="#comparison-section"
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 hover:text-slate-900 transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
          >
            <span>See Quality Comparison</span>
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </a>
        </div>

        {/* Feature Highlights Grid */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6 text-left max-w-5xl mx-auto">
          
          <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
              <Languages className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-800 font-sans tracking-tight">Authentic Sinhala Fluency</h3>
            <p className="mt-2 text-xs text-slate-500 leading-relaxed font-sans">
              Rejects rigid, unnatural machine word substitution. Translates into idiomatic Sinhala as if crafted by a cultured native scholar.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
              <RotateCcw className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-800 font-sans tracking-tight">Persistent Checkpoint & Resume</h3>
            <p className="mt-2 text-xs text-slate-500 leading-relaxed font-sans">
              Translate 500-page volumes effortlessly. Progress saves continuously page-by-page. Close the tab or return another day and resume seamlessly.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
              <Download className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-800 font-sans tracking-tight">Sinhala Book PDF Export</h3>
            <p className="mt-2 text-xs text-slate-500 leading-relaxed font-sans">
              Export completed translations into an elegant A4 book PDF with authentic Unicode Sinhala typography, chapter headings, and page margins.
            </p>
          </div>

        </div>

      </div>

      {/* Comparison Demo Section */}
      <div id="comparison-section" className="bg-slate-50/70 border-t border-slate-200/80 py-14">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-slate-800">
              Why Word-for-Word Machine Translation Fails
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl mx-auto font-sans">
              English grammar and idioms cannot be mapped word-for-word into Sinhala without sounding bizarre. Observe the difference:
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-xs font-sans">
            
            {/* English Source */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                Original English
              </span>
              <p className="text-slate-800 text-sm italic font-serif leading-relaxed">
                "The project was abandoned because the team could not secure sufficient funding."
              </p>
              <div className="mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-400">
                Source sentence from technical report
              </div>
            </div>

            {/* Awkward Literal */}
            <div className="p-5 rounded-2xl bg-rose-50/70 border border-rose-200 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 block mb-1.5">
                Generic Machine Translation (Unnatural)
              </span>
              <p className="text-rose-950 text-sm font-sans leading-relaxed">
                "ව්යාපෘතිය අත්හැර දමන ලදී මන්ද කණ්ඩායමට ප්රමාණවත් අරමුදල් ආරක්ෂා කර ගැනීමට නොහැකි විය."
              </p>
              <div className="mt-3 pt-2.5 border-t border-rose-100 text-[11px] text-rose-700 font-medium">
                ❌ Unnatural word order, awkward translation of "secure" as "ආරක්ෂා කර"
              </div>
            </div>

            {/* Natural Sinhala */}
            <div className="p-5 rounded-2xl bg-blue-50/70 border border-blue-200 shadow-2xs ring-1 ring-blue-500/20">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block mb-1.5 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-blue-600" />
                SinhalaBook Translator (Natural Sinhala)
              </span>
              <p className="text-slate-900 text-sm font-semibold font-sans leading-relaxed">
                "ප්‍රමාණවත් අරමුදල් සපයා ගැනීමට කණ්ඩායමට නොහැකි වූ බැවින් ව්‍යාපෘතිය අත්හැර දමන ලදී."
              </p>
              <div className="mt-3 pt-2.5 border-t border-blue-100 text-[11px] text-blue-700 font-medium">
                ✓ Elegant literary grammar, contextual meaning of "secure" as "සපයා ගැනීම"
              </div>
            </div>

          </div>

          <div className="mt-8 text-center">
            <button
              onClick={onSignInWithGoogle}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-xs hover:bg-blue-700 transition-colors shadow-xs cursor-pointer"
            >
              <span>Get Started Free with Google</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400">
        <p>SinhalaBook Translator • Powered by Google Gemini AI & Firebase • Enterprise-Ready PDF Architecture</p>
      </footer>
    </div>
  );
};
