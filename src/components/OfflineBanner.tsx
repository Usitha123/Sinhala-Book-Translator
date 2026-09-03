import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, CheckCircle2 } from 'lucide-react';

export const OfflineBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [showRestoredNotice, setShowRestoredNotice] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowRestoredNotice(true);
      const timer = setTimeout(() => setShowRestoredNotice(false), 5000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowRestoredNotice(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOnline) {
    return (
      <div 
        id="offline-warning-banner"
        className="bg-slate-900 text-white px-4 py-2.5 text-xs sm:text-sm font-medium flex items-center justify-center gap-2 shadow-sm transition-all border-b border-slate-800"
      >
        <WifiOff className="w-4 h-4 text-amber-400 animate-pulse" />
        <span>Connection lost. Your completed translation progress has been saved locally.</span>
      </div>
    );
  }

  if (showRestoredNotice) {
    return (
      <div 
        id="online-restored-banner"
        className="bg-emerald-600 text-white px-4 py-2 text-xs sm:text-sm font-medium flex items-center justify-center gap-2 shadow-sm transition-all"
      >
        <CheckCircle2 className="w-4 h-4" />
        <span>Connection restored. You can continue translating seamlessly.</span>
      </div>
    );
  }

  return null;
};
