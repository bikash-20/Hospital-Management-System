import { useState, type FormEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  Eye,
  EyeOff,
  AlertCircle,
  Shield,
  Stethoscope,
  ClipboardList,
  FlaskConical,
  Banknote,
  Sparkles,
  Lock,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const trustMetrics: { label: string; value: string; icon: LucideIcon }[] = [
  { label: 'Avg. wait time', value: '−42%', icon: Activity },
  { label: 'Duplicate records', value: '0', icon: CheckCircle2 },
  { label: 'Audit coverage', value: '100%', icon: Shield },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedDemo, setSelectedDemo] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/');
    } catch {
      setError('Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  const demoAccounts: { username: string; role: string; icon: LucideIcon }[] = [
    { username: 'admin', role: 'Admin', icon: Shield },
    { username: 'dr.rahim', role: 'Doctor', icon: Stethoscope },
    { username: 'reception1', role: 'Reception', icon: ClipboardList },
    { username: 'labtech1', role: 'Lab Tech', icon: FlaskConical },
    { username: 'cashier1', role: 'Cashier', icon: Banknote },
  ];

  const fillDemo = (user: string) => {
    setUsername(user);
    setPassword('password');
    setSelectedDemo(user);
    setTimeout(() => setSelectedDemo(null), 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B1929] via-[#0F1A28] to-[#0A1628] flex relative overflow-hidden">
      {/* Ambient aurora — slow color drift behind everything */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-50"
        animate={{
          background: [
            'radial-gradient(60% 50% at 20% 30%, rgba(13,127,122,0.20), transparent 60%)',
            'radial-gradient(60% 50% at 80% 70%, rgba(15,159,154,0.18), transparent 60%)',
            'radial-gradient(50% 50% at 50% 50%, rgba(13,127,122,0.16), transparent 60%)',
          ],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600/20 to-primary-800/10" />

        {/* Animated background orbs */}
        <motion.div
          className="absolute w-[28rem] h-[28rem] bg-primary-500/10 rounded-full blur-3xl"
          animate={{ x: [0, 30, -20, 0], y: [0, -40, 20, 0], scale: [1, 1.05, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          style={{ top: '10%', left: '20%' }}
        />
        <motion.div
          className="absolute w-72 h-72 bg-accent-500/10 rounded-full blur-3xl"
          animate={{ x: [0, -20, 30, 0], y: [0, 30, -20, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          style={{ bottom: '15%', right: '25%' }}
        />

        <div className="relative z-10 text-center px-12 max-w-xl">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
            className="flex items-center justify-center mb-8"
          >
            <div className="relative">
              <motion.div
                aria-hidden
                className="absolute inset-0 rounded-2xl bg-primary-400/30 blur-xl"
                animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              />
              <div className="relative p-4 bg-primary-500/20 rounded-2xl backdrop-blur-sm border border-primary-500/30 ring-1 ring-primary-400/20">
                <img src="/openhospital-logo.svg" alt="CareBridge medical logo" className="w-16 h-16" />
              </div>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-5xl font-bold text-white mb-3 tracking-tight"
          >
            CareBridge
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/15 border border-primary-500/30 text-primary-200 text-xs font-semibold uppercase tracking-widest mb-6"
          >
            <Sparkles className="w-3.5 h-3.5" /> Resource Management System
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="text-surface-300 text-lg max-w-md mx-auto leading-relaxed mb-10"
          >
            Replace paper with a single workflow: registration, consultation, lab, pharmacy, and billing — unified and real-time.
          </motion.p>

          {/* Trust metric chips */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.75, duration: 0.5 }}
            className="grid grid-cols-3 gap-3 max-w-md mx-auto mb-2"
          >
            {trustMetrics.map((m) => {
              const Icon = m.icon;
              return (
                <motion.div
                  key={m.label}
                  whileHover={{ y: -2 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                  className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm"
                >
                  <Icon className="w-4 h-4 text-primary-300 mb-1.5 mx-auto" />
                  <div className="text-lg font-bold text-white font-tabular">{m.value}</div>
                  <div className="text-[10px] text-surface-400 uppercase tracking-wider leading-tight">{m.label}</div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Floating icons */}
          <motion.div
            className="absolute top-20 left-20"
            animate={{ y: [0, -8, 0], rotate: [0, 5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Stethoscope className="w-16 h-16 text-primary-400/20" />
          </motion.div>
          <motion.div
            className="absolute bottom-32 right-16"
            animate={{ y: [0, 8, 0], rotate: [0, -5, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          >
            <Heart className="w-14 h-14 text-primary-400/20" />
          </motion.div>
          <motion.div
            className="absolute top-40 right-24"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
          >
            <FlaskConical className="w-12 h-12 text-primary-400/20" />
          </motion.div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative z-10">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:hidden flex items-center gap-3 mb-8 justify-center"
          >
            <div className="p-3 bg-primary-500/20 rounded-xl border border-primary-500/30">
              <img src="/openhospital-logo.svg" alt="CareBridge medical logo" className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">CareBridge</h1>
              <p className="text-surface-400 text-sm">RMS</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-8"
          >
            <h2 className="text-2xl font-bold text-white mb-2">Welcome back</h2>
            <p className="text-surface-400">Sign in to your account</p>
          </motion.div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2 text-red-400 text-sm"
                role="alert"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <div>
              <label htmlFor="login-username" className="block text-sm font-medium text-surface-300 mb-1.5">
                Username
              </label>
              <motion.input
                id="login-username"
                whileFocus={{ scale: 1.01, boxShadow: '0 0 0 3px rgba(8,145,178,0.15)' }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-[#141D28] border border-[#2A3444] rounded-xl text-white placeholder-[#7A92A8] focus:outline-none focus:ring-2 focus:ring-primary-500/40 transition-all"
                placeholder="Enter username"
                required
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-surface-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <motion.input
                  id="login-password"
                  whileFocus={{ scale: 1.01, boxShadow: '0 0 0 3px rgba(8,145,178,0.15)' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-[#141D28] border border-[#2A3444] rounded-xl text-white placeholder-[#7A92A8] focus:outline-none focus:ring-2 focus:ring-primary-500/40 transition-all pr-11"
                  placeholder="Enter password"
                  required
                />
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-300 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </motion.button>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={!loading ? { scale: 1.01, boxShadow: '0 8px 30px rgba(8,145,178,0.4)' } : undefined}
              whileTap={!loading ? { scale: 0.98 } : undefined}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="relative w-full py-3 bg-primary-600 hover:bg-primary-500 disabled:bg-primary-600/50 text-white font-medium rounded-xl transition-colors shadow-lg shadow-primary-600/25 overflow-hidden focus-ring"
            >
              <span className="relative flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <motion.svg
                      className="w-5 h-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </motion.svg>
                    Signing in...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" /> Sign In
                  </>
                )}
              </span>
            </motion.button>
          </motion.form>

          {/* Demo accounts */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8"
          >
            <p className="text-surface-500 text-xs uppercase tracking-wider mb-3 text-center">
              Demo Accounts — password: <span className="text-primary-400">password</span>
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {demoAccounts.map((demo, i) => {
                const Icon = demo.icon;
                const isSelected = selectedDemo === demo.username;
                return (
                  <motion.button
                    key={demo.username}
                    type="button"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + i * 0.05 }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => fillDemo(demo.username)}
                    className={`relative flex flex-col items-center gap-1 p-2 rounded-lg border transition-colors text-xs group ${
                      isSelected
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                        : 'bg-[#141D28] hover:bg-[#1A2A3A] border-[#2A3444] hover:border-primary-500/40'
                    }`}
                  >
                    <AnimatePresence mode="wait">
                      {isSelected ? (
                        <motion.span
                          key="check"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center"
                        >
                          <CheckCircle2 className="w-3 h-3 text-white" />
                        </motion.span>
                      ) : (
                        <Icon
                          key="icon"
                          className="w-4 h-4 text-surface-400 group-hover:text-primary-400 transition-colors"
                          aria-hidden="true"
                        />
                      )}
                    </AnimatePresence>
                    <span
                      className={`transition-colors ${
                        isSelected ? 'text-emerald-200' : 'text-surface-400 group-hover:text-surface-200'
                      }`}
                    >
                      {demo.role}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
