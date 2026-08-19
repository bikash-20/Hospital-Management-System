import { useState } from 'react';
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
} from 'lucide-react';

export default function QueueDisplay() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState('');

  const { data: doctors } = useQuery({
    queryKey: ['doctors'],
    queryFn: getDoctorsApi,
  });

  // Auto-select first doctor
  const doctorId = selectedDoctor || doctors?.[0]?.fullName || '';

  const { data: queueAppointments } = useQuery({
    queryKey: ['queue', doctorId],
    queryFn: () => getQueueApi(doctorId),
    refetchInterval: 5000,
    enabled: !!doctorId,
  });

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const currentDoctor = doctors?.find((d) => d.fullName === doctorId);

  // Derive queue state from appointments
  const waitingList = queueAppointments?.filter(
    (a) => a.status === 'WAITING' || a.status === 'IN_CONSULTATION',
  ) ?? [];

  const currentEntry = waitingList.find((a) => a.status === 'IN_CONSULTATION')
    ?? waitingList[0]
    ?? null;

  const upcoming = waitingList.filter((a) => a.id !== currentEntry?.id).slice(0, 4);

  return (
    <div className={`space-y-6 max-w-7xl mx-auto ${isFullscreen ? 'p-8' : ''}`}>
      {!isFullscreen && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-display text-surface-900 dark:text-white">Live Queue Display</h1>
            <p className="text-body text-surface-500 dark:text-surface-400 mt-1">Real-time patient queue — auto-refreshes every 5 seconds</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={doctorId}
              onChange={(e) => setSelectedDoctor(e.target.value)}
              className="px-4 py-2.5 bg-white dark:bg-[#1A1F26] border border-surface-200 dark:border-[#2A2F38] rounded-xl text-sm text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus-ring"
            >
              {doctors?.map((doc) => (
                <option key={doc.fullName} value={doc.fullName}>{doc.fullName} — {doc.specialization}</option>
              ))}
            </select>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleFullscreen}
              className="p-2.5 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl text-surface-400 hover:text-surface-600 dark:hover:text-white hover:border-primary-500/30 transition-colors"
              title="Toggle fullscreen"
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
        className={`bg-gradient-to-br from-surface-900 via-surface-800 to-primary-950 rounded-3xl border border-surface-700/50 overflow-hidden ${isFullscreen ? 'min-h-[90vh]' : ''}`}
      >
        {/* Header Bar */}
        <div className="p-6 border-b border-surface-700/50 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-3 h-3 bg-green-500 rounded-full"
              />
              <span className="text-green-400 text-sm font-medium">LIVE</span>
            </div>
            <div className="h-6 w-px bg-surface-700" />
            <Monitor className="w-5 h-5 text-surface-400" />
            <span className="text-white font-semibold">{currentDoctor?.fullName ?? 'Doctor'} — Queue</span>
          </div>
          <div className="flex items-center gap-3 text-surface-400">
            <Volume2 className="w-5 h-5" />
            <span className="text-sm">{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>

        <div className={`p-8 ${isFullscreen ? 'px-16' : ''}`}>
          {/* Currently Serving */}
          <div className="text-center mb-12">
            <p className="text-surface-400 text-sm uppercase tracking-widest mb-3">Currently Serving</p>
            <div className="relative inline-block">
              <motion.div
                animate={{ scale: [1, 1.05, 1], opacity: [0.15, 0.25, 0.15] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute inset-0 bg-primary-500/20 blur-3xl rounded-full"
              />
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentEntry?.id ?? 'empty'}
                  initial={{ scale: 0.5, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 1.5, opacity: 0, y: -20 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="relative text-[120px] font-bold text-white leading-none"
                >
                  #{currentEntry?.tokenNumber ?? '—'}
                </motion.div>
              </AnimatePresence>
            </div>
            <motion.p
              key={currentEntry?.id ?? 'empty'}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-surface-400 mt-4 text-lg"
            >
              {currentEntry?.patient.fullName ?? 'No active patient'}
            </motion.p>
          </div>

          {/* Upcoming Queue */}
          <div>
            <p className="text-surface-400 text-sm uppercase tracking-widest mb-6 text-center">Up Next</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-3xl mx-auto">
              {upcoming.map((apt, i) => (
                <motion.div
                  key={apt.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, type: 'spring', stiffness: 200, damping: 20 }}
                  whileHover={{ y: -4, borderColor: 'rgba(8,145,178,0.3)' }}
                  className="text-center p-4 sm:p-5 bg-[#1A1F26]/80 rounded-2xl border border-[#2A2F38]/50 transition-colors"
                >
                  <div className="text-4xl font-bold text-white mb-2">#{apt.tokenNumber}</div>
                  <p className="text-sm text-surface-300 truncate">{apt.patient.fullName}</p>
                  <p className="text-xs text-surface-500 mt-1">~{(i + 1) * 15} min wait</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Queue Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-center gap-8 mt-10 pt-8 border-t border-surface-700/30"
          >
            <div className="flex items-center gap-2 text-surface-400">
              <Users className="w-5 h-5" />
              <span className="text-sm">
                <span className="text-white font-semibold">{waitingList.length}</span> in queue
              </span>
            </div>
            <div className="flex items-center gap-2 text-surface-400">
              <Clock className="w-5 h-5" />
              <span className="text-sm">
                <span className="text-white font-semibold">~{waitingList.length * 15}</span> min total wait
              </span>
            </div>
            <div className="flex items-center gap-2 text-surface-400">
              <Activity className="w-5 h-5" />
              <span className="text-sm">
                Updated: <span className="text-white font-semibold">
                  {new Date().toLocaleTimeString()}
                </span>
              </span>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
