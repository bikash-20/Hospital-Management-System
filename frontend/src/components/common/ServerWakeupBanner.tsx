import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cloud, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function ServerWakeupBanner() {
  const { isBengali } = useLanguage();
  const [isWakingUp, setIsWakingUp] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let wakeCheckInterval: ReturnType<typeof setInterval> | null = null;
    let hasConnected = false;

    // Start a 2.5s timer. If health check does not reply within 2.5s, server is likely sleeping
    const sleepDetector = setTimeout(() => {
      if (!hasConnected) {
        setIsWakingUp(true);
      }
    }, 2500);

    const checkServerHealth = async () => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);
        const res = await fetch('/health', { signal: controller.signal });
        clearTimeout(timeout);
        if (res.ok) {
          hasConnected = true;
          clearTimeout(sleepDetector);
          if (isWakingUp) {
            setIsOnline(true);
            setIsWakingUp(false);
            setTimeout(() => setIsOnline(false), 3500);
          }
          if (wakeCheckInterval) clearInterval(wakeCheckInterval);
        }
      } catch {
        // Still asleep or connecting
      }
    };

    // Ping health initially
    checkServerHealth();

    // If sleeping, poll every 3 seconds to detect wakeup
    wakeCheckInterval = setInterval(checkServerHealth, 3000);

    return () => {
      clearTimeout(sleepDetector);
      if (wakeCheckInterval) clearInterval(wakeCheckInterval);
      if (timer) clearInterval(timer);
    };
  }, [isWakingUp]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isWakingUp) {
      interval = setInterval(() => {
        setSecondsElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      setSecondsElapsed(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isWakingUp]);

  return (
    <AnimatePresence>
      {isWakingUp && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-4 inset-x-4 sm:inset-x-auto sm:right-6 z-[9999] max-w-md w-full"
        >
          <div className="bg-[#161B22]/95 backdrop-blur-xl border border-amber-500/40 rounded-2xl p-4 shadow-2xl shadow-black/50 text-white flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-bold text-sm text-amber-400 flex items-center gap-1.5">
                  <Cloud className="w-4 h-4" />
                  {isBengali ? 'ক্লাউড সার্ভার চালু হচ্ছে...' : 'Cloud Server Waking Up...'}
                </h4>
                <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold shrink-0">
                  {secondsElapsed}s / ~30s
                </span>
              </div>

              <p className="text-xs text-surface-300 mt-1 leading-relaxed">
                {isBengali
                  ? 'রেন্ডার ফ্রি টিয়ার নিষ্ক্রিয় অবস্থায় স্লিপ মোডে যায়। সার্ভার বুট হতে প্রায় ৩০ সেকেন্ড লাগবে। অনুগ্রহ করে অপেক্ষা করুন, ডেটা স্বয়ংক্রিয়ভাবে লোড হবে।'
                  : 'Render free tier spins down when idle. The backend takes ~30-50s to wake up. Please wait; your data will load automatically.'}
              </p>

              <div className="w-full bg-surface-800 rounded-full h-1.5 mt-2.5 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full transition-all duration-1000"
                  style={{ width: `${Math.min(95, (secondsElapsed / 35) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {isOnline && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-4 inset-x-4 sm:inset-x-auto sm:right-6 z-[9999] max-w-sm w-full"
        >
          <div className="bg-[#161B22]/95 backdrop-blur-xl border border-emerald-500/40 rounded-2xl p-3.5 shadow-2xl text-white flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-xs sm:text-sm text-emerald-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                {isBengali ? 'সার্ভার সচল ও সংযুক্ত!' : 'Backend Online & Connected!'}
              </h4>
              <p className="text-[11px] text-surface-400">
                {isBengali ? 'লাইভ কার্যক্রম সক্রিয় হয়েছে' : 'Live hospital operations active'}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
