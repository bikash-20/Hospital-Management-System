import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getQueueApi, getDoctorsApi } from '@/api/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  Monitor,
  Maximize,
  Minimize,
  Clock,
  Users,
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight,
  Wifi,
} from 'lucide-react';

export default function QueueDisplay() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [autoAnnounce, setAutoAnnounce] = useState(true);
  const [page, setPage] = useState(0);
  const [now, setNow] = useState(new Date());
  const lastAnnouncedTokenRef = useRef<string | null>(null);

  const { data: doctors } = useQuery({
    queryKey: ['doctors'],
    queryFn: getDoctorsApi,
  });

  const doctorId = selectedDoctor || doctors?.[0]?.id || '';

  const { data: queueAppointments } = useQuery({
    queryKey: ['queue', doctorId],
    queryFn: () => getQueueApi(doctorId),
    refetchInterval: 5000,
    enabled: !!doctorId,
  });

  // ── Clock tick (every second) ──
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const currentDoctor = doctors?.find((d) => d.id === doctorId);

  // ── Derive queue state ──
  const waitingList = queueAppointments?.filter(
    (a) => a.status === 'WAITING' || a.status === 'IN_CONSULTATION',
  ) ?? [];

  const currentEntry =
    waitingList.find((a) => a.status === 'IN_CONSULTATION') ?? waitingList[0] ?? null;

  const upcoming = waitingList.filter((a) => a.id !== currentEntry?.id);

  const completed = queueAppointments?.filter((a) => a.status === 'COMPLETED').length ?? 0;
  const cancelled = queueAppointments?.filter((a) => a.status === 'CANCELLED').length ?? 0;

  // ── Auto-announce: read token aloud when it changes ──
  useEffect(() => {
    if (!autoAnnounce || !currentEntry) return;
    if (lastAnnouncedTokenRef.current === currentEntry.id) return;
    lastAnnouncedTokenRef.current = currentEntry.id;

    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const text = `Token number ${currentEntry.tokenNumber}, ${currentEntry.patient.fullName}, please proceed to consultation.`;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.95;
        utterance.pitch = 1;
        window.speechSynthesis.speak(utterance);
      } catch {
        // ignore speech errors silently
      }
    }
  }, [currentEntry, autoAnnounce]);

  // ── Pagination for "Up Next" ──
  const PAGE_SIZE = 4;
  const totalPages = Math.max(1, Math.ceil(upcoming.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const upcomingPage = upcoming.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  const dateLabel = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const timeLabel = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div className={`${isFullscreen ? 'p-0' : 'space-y-6 max-w-7xl mx-auto p-4 sm:p-6'}`}>
      {!isFullscreen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-display text-surface-900 dark:text-white">Live Queue Display</h1>
            <p className="text-body text-surface-500 dark:text-surface-400 mt-1">
              Real-time patient queue — auto-refreshes every 5 seconds
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={doctorId}
              onChange={(e) => setSelectedDoctor(e.target.value)}
              className="px-4 py-2.5 bg-white dark:bg-[#1A1F26] border border-surface-200 dark:border-[#2A2F38] rounded-xl text-sm text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus-ring"
              aria-label="Select doctor"
            >
              {doctors?.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.fullName} — {doc.specialization}
                </option>
              ))}
            </select>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setAutoAnnounce(!autoAnnounce)}
              className={`p-2.5 rounded-xl border transition-colors ${
                autoAnnounce
                  ? 'bg-primary-500/12 border-primary-500/30 text-primary-500'
                  : 'bg-white dark:bg-surface-800 border-surface-200 dark:border-surface-700 text-surface-400'
              }`}
              title={autoAnnounce ? 'Auto-announce on' : 'Auto-announce off'}
              aria-label={autoAnnounce ? 'Mute auto-announce' : 'Unmute auto-announce'}
            >
              {autoAnnounce ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleFullscreen}
              className="p-2.5 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl text-surface-400 hover:text-surface-600 dark:hover:text-white hover:border-primary-500/30 transition-colors"
              title="Toggle fullscreen"
              aria-label="Toggle fullscreen"
            >
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Main Display */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className={`relative bg-gradient-to-br from-surface-900 via-surface-800 to-primary-950 rounded-3xl border border-surface-700/50 overflow-hidden ${
          isFullscreen ? 'min-h-screen rounded-none border-0' : ''
        }`}
      >
        {/* Ambient noise overlay */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Header Bar */}
        <div className="relative p-4 sm:p-6 border-b border-surface-700/50 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
                transition={{ duration: 1.6, repeat: Infinity }}
                className="w-3 h-3 bg-green-500 rounded-full"
                aria-hidden
              />
              <span className="text-green-400 text-sm font-bold uppercase tracking-wider">Live</span>
            </div>
            <div className="h-6 w-px bg-surface-700" aria-hidden />
            <Monitor className="w-5 h-5 text-surface-400" aria-hidden />
            <span className="text-white font-semibold truncate">
              {currentDoctor?.fullName ?? 'Doctor'} — Queue
            </span>
            {currentDoctor?.specialization && (
              <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full bg-primary-500/15 border border-primary-500/30 text-primary-300 text-xs">
                {currentDoctor.specialization}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 sm:gap-6 text-surface-400">
            <span className="hidden sm:inline text-sm">{dateLabel}</span>
            <div className="flex items-center gap-2">
              <Wifi className="w-4 h-4" aria-hidden />
              <motion.span
                key={timeLabel}
                initial={{ opacity: 0, y: -2 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-white font-bold tabular-nums text-lg"
              >
                {timeLabel}
              </motion.span>
            </div>
          </div>
        </div>

        <div className={`relative p-6 sm:p-10 ${isFullscreen ? 'px-8 sm:px-16 py-12' : ''}`}>
          {/* Currently Serving */}
          <div className="text-center mb-10 sm:mb-14">
            <p className="text-surface-400 text-xs sm:text-sm uppercase tracking-[0.25em] mb-3 sm:mb-4 font-semibold">
              Now Serving
            </p>
            <div className="relative inline-block">
              <motion.div
                aria-hidden
                animate={{ scale: [1, 1.08, 1], opacity: [0.15, 0.3, 0.15] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute inset-0 bg-primary-500/30 blur-3xl rounded-full"
              />
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentEntry?.id ?? 'empty'}
                  initial={{ scale: 0.4, opacity: 0, y: 24, rotate: -3 }}
                  animate={{ scale: 1, opacity: 1, y: 0, rotate: 0 }}
                  exit={{ scale: 1.6, opacity: 0, y: -24, rotate: 3 }}
                  transition={{ type: 'spring', stiffness: 180, damping: 16 }}
                  className="relative text-[80px] sm:text-[140px] font-bold text-white leading-none tabular-nums"
                >
                  #{currentEntry?.tokenNumber ?? '—'}
                </motion.div>
              </AnimatePresence>
            </div>
            <AnimatePresence mode="wait">
              <motion.p
                key={currentEntry?.id ?? 'empty'}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: 0.1 }}
                className="text-surface-300 mt-3 sm:mt-5 text-lg sm:text-2xl font-medium px-2"
              >
                {currentEntry?.patient.fullName ?? 'Waiting for the next patient…'}
              </motion.p>
            </AnimatePresence>
            {currentEntry?.patient.uhid && (
              <p className="text-surface-500 text-sm mt-1 font-mono">{currentEntry.patient.uhid}</p>
            )}
          </div>

          {/* Upcoming Queue */}
          <div>
            <div className="flex items-center justify-between mb-5 sm:mb-6 max-w-3xl mx-auto">
              <p className="text-surface-400 text-xs sm:text-sm uppercase tracking-[0.25em] font-semibold">
                Up Next
              </p>
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setPage((p) => (p - 1 + totalPages) % totalPages)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white focus-ring"
                    aria-label="Previous page"
                    style={{ minWidth: '36px', minHeight: '36px' }}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </motion.button>
                  <span className="text-surface-400 text-xs tabular-nums">
                    {safePage + 1} / {totalPages}
                  </span>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setPage((p) => (p + 1) % totalPages)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white focus-ring"
                    aria-label="Next page"
                    style={{ minWidth: '36px', minHeight: '36px' }}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </motion.button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-3xl mx-auto">
              <AnimatePresence mode="popLayout">
                {upcomingPage.length > 0 ? (
                  upcomingPage.map((apt, i) => (
                    <motion.div
                      key={apt.id}
                      layout
                      initial={{ opacity: 0, y: 30, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -20, scale: 0.9 }}
                      transition={{
                        delay: i * 0.08,
                        type: 'spring',
                        stiffness: 200,
                        damping: 20,
                      }}
                      whileHover={{ y: -4, borderColor: 'rgba(8,145,178,0.4)' }}
                      className="text-center p-4 sm:p-5 bg-[#1A1F26]/80 backdrop-blur-sm rounded-2xl border border-[#2A2F38]/50 transition-colors"
                    >
                      <div className="text-3xl sm:text-4xl font-bold text-white mb-2 tabular-nums">
                        #{apt.tokenNumber}
                      </div>
                      <p className="text-sm text-surface-300 truncate">{apt.patient.fullName}</p>
                      <p className="text-xs text-surface-500 mt-1">~{(safePage * PAGE_SIZE + i + 1) * 15} min wait</p>
                    </motion.div>
                  ))
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="col-span-full text-center py-6"
                  >
                    <p className="text-surface-500 text-sm">Queue is empty</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Queue Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 mt-10 pt-8 border-t border-surface-700/30"
          >
            <Stat icon={Users} label="In queue" value={waitingList.length} />
            <Stat icon={Clock} label="Est. total wait" value={`~${waitingList.length * 15}m`} />
            <Stat icon={Activity} label="Completed today" value={completed} />
            <Stat icon={CheckCircleSvg} label="Cancelled" value={cancelled} />
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

// ===== Inline stat block =====
function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center gap-2 text-surface-400">
      <Icon className="w-5 h-5" aria-hidden />
      <span className="text-sm">
        <span className="text-white font-bold tabular-nums text-base mr-1">{value}</span>
        {label}
      </span>
    </div>
  );
}

// Lucide doesn't ship a CheckCircle icon in some versions — fallback svg
function CheckCircleSvg({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}