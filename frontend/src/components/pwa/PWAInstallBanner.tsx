import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';
import { Download, X, Share, PlusSquare, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export default function PWAInstallBanner() {
  const { isBengali } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (already installed as PWA on Android/iOS/macOS)
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      // @ts-expect-error iOS Safari standalone check
      window.navigator.standalone === true;

    setIsStandalone(isStandaloneMode);
    if (isStandaloneMode) return;

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent) && !('MSStream' in window);
    setIsIOS(isIOSDevice);

    // Check if dismissed recently (24 hours)
    const dismissedAt = localStorage.getItem('cb_pwa_install_dismissed');
    const isRecentlyDismissed = dismissedAt && Date.now() - parseInt(dismissedAt, 10) < 24 * 60 * 60 * 1000;

    // Listen for Chrome / Android / Desktop install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (!isRecentlyDismissed) {
        setShowBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for appinstalled
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowBanner(false);
      setDeferredPrompt(null);
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    // Manual re-trigger event (e.g. from TopNav or Footer)
    const handleManualTrigger = () => {
      setShowBanner(true);
      if (isIOSDevice) setShowIOSGuide(true);
    };
    window.addEventListener('open-pwa-install-banner', handleManualTrigger);

    // If iOS and not standalone and not recently dismissed, show install prompt after 2 seconds
    if (isIOSDevice && !isRecentlyDismissed) {
      const timer = setTimeout(() => setShowBanner(true), 2500);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.removeEventListener('appinstalled', handleAppInstalled);
        window.removeEventListener('open-pwa-install-banner', handleManualTrigger);
      };
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('open-pwa-install-banner', handleManualTrigger);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

    if (!deferredPrompt) {
      return;
    }

    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      setIsInstalled(true);
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setShowIOSGuide(false);
    localStorage.setItem('cb_pwa_install_dismissed', Date.now().toString());
  };

  if (isStandalone || isInstalled || (!showBanner && !showIOSGuide)) {
    return null;
  }

  return (
    <AnimatePresence>
      <div className="fixed top-3 inset-x-3 sm:inset-x-auto sm:right-6 sm:top-5 z-50 max-w-md w-full print:hidden">
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative bg-gradient-to-r from-surface-900 via-[#101826] to-[#0A131F] border border-primary-500/30 rounded-2xl p-4 shadow-2xl text-white backdrop-blur-xl"
        >
          {/* Subtle neon glow border */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-2xl opacity-20 blur-sm pointer-events-none" />

          <div className="relative flex items-start gap-3.5">
            {/* Custom App Logo with Squircle Badge */}
            <div className="relative shrink-0 w-13 h-13 rounded-2xl overflow-hidden border border-emerald-400/30 shadow-lg shadow-emerald-500/20 bg-surface-950 flex items-center justify-center">
              <img
                src="/carebridge-logo.png"
                alt="CareBridge AI Logo"
                className="w-full h-full object-cover"
              />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-surface-950 animate-ping" />
            </div>

            <div className="flex-1 min-w-0 pr-6">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm sm:text-base text-white tracking-tight">
                  CareBridge AI
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                  App v1.0
                </span>
              </div>

              <p className="text-xs text-surface-300 mt-0.5 leading-relaxed">
                {isBengali
                  ? 'অফলাইন অ্যাক্সেস, দ্রুত সিট বুকিং ও হেলথ এআই নোটিফিকেশনের জন্য সরাসরি অ্যাপ ইনস্টল করুন।'
                  : 'Install CareBridge AI on your Mac, Android, or iPhone for instant access and live hospital alerts.'}
              </p>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 mt-3">
                <button
                  type="button"
                  onClick={handleInstallClick}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-teal-500 via-emerald-500 to-primary-600 hover:from-teal-400 hover:to-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-500/25 transition-all focus-ring"
                  style={{ minHeight: '36px' }}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>
                    {isIOS
                      ? (isBengali ? 'ইনস্টল নির্দেশিকা' : 'Install on iOS')
                      : (isBengali ? 'অ্যাপ ইনস্টল করুন' : 'Install App')}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleDismiss}
                  className="px-2.5 py-1.5 rounded-xl text-surface-400 hover:text-white hover:bg-white/5 text-xs transition-colors"
                >
                  {isBengali ? 'পরে' : 'Later'}
                </button>
              </div>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={handleDismiss}
              className="absolute top-2 right-2 p-1.5 text-surface-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Close install prompt"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* iOS Specific Instructions Modal / Accordion */}
          {showIOSGuide && isIOS && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 pt-3 border-t border-surface-800 text-xs text-surface-300 space-y-2"
            >
              <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                <Smartphone className="w-4 h-4" />
                <span>{isBengali ? 'আইফোন / আইপ্যাডে ইনস্টল করার নিয়ম:' : 'How to install on iPhone & iPad:'}</span>
              </div>
              <ol className="space-y-1.5 pl-1 text-[11px] text-surface-300">
                <li className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-surface-800 text-center text-[10px] leading-4 text-emerald-400 shrink-0 font-bold">1</span>
                  <span>
                    {isBengali ? 'সাফারি ব্রাউজারের নিচে শেয়ার বোতামে চাপুন:' : 'Tap the Safari share icon at the bottom of the screen:'}{' '}
                    <Share className="w-3.5 h-3.5 inline text-teal-400" />
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-surface-800 text-center text-[10px] leading-4 text-emerald-400 shrink-0 font-bold">2</span>
                  <span>
                    {isBengali ? 'নিচে স্ক্রল করে "Add to Home Screen" নির্বাচন করুন:' : 'Scroll down and tap "Add to Home Screen":'}{' '}
                    <PlusSquare className="w-3.5 h-3.5 inline text-teal-400" />
                  </span>
                </li>
              </ol>
            </motion.div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
