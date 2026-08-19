import { useState, type FormEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  Eye,
  EyeOff,
  AlertCircle,
  Stethoscope,
  Pill,
  Activity,
} from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

  const demoAccounts = [
    { username: 'admin', role: 'Admin', icon: '👤' },
    { username: 'doctor', role: 'Doctor', icon: '🩺' },
    { username: 'receptionist', role: 'Reception', icon: '📋' },
    { username: 'labtech', role: 'Lab Tech', icon: '🔬' },
    { username: 'cashier', role: 'Cashier', icon: '💰' },
  ];

  const fillDemo = (user: string) => {
    setUsername(user);
    setPassword('password');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-900 via-surface-800 to-primary-950 flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600/20 to-primary-800/10" />

        {/* Animated background orbs */}
        <motion.div
          className="absolute w-96 h-96 bg-primary-500/10 rounded-full blur-3xl"
          animate={{
            x: [0, 30, -20, 0],
            y: [0, -40, 20, 0],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          style={{ top: '10%', left: '20%' }}
        />
        <motion.div
          className="absolute w-72 h-72 bg-accent-500/10 rounded-full blur-3xl"
          animate={{
            x: [0, -20, 30, 0],
            y: [0, 30, -20, 0],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          style={{ bottom: '15%', right: '25%' }}
        />

        <div className="relative z-10 text-center px-12">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
            className="flex items-center justify-center mb-8"
          >
            <div className="p-4 bg-primary-500/20 rounded-2xl backdrop-blur-sm border border-primary-500/30">
              <Heart className="w-12 h-12 text-primary-400" />
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-5xl font-bold text-white mb-4 tracking-tight"
          >
            OpenHospital
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="text-primary-200/80 text-xl font-medium mb-2"
          >
            RMS
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="text-surface-400 text-lg max-w-md mx-auto leading-relaxed"
          >
            Resource & Patient Workflow Management System
          </motion.p>

          {/* Floating icons */}
          <motion.div
            className="absolute top-20 left-20"
            animate={{ y: [0, -8, 0], rotate: [0, 5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Stethoscope className="w-16 h-16 text-primary-300/20" />
          </motion.div>
          <motion.div
            className="absolute bottom-32 right-16"
            animate={{ y: [0, 8, 0], rotate: [0, -5, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          >
            <Pill className="w-14 h-14 text-primary-300/20" />
          </motion.div>
          <motion.div
            className="absolute top-40 right-24"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
          >
            <Activity className="w-12 h-12 text-primary-300/20" />
          </motion.div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:hidden flex items-center gap-3 mb-8 justify-center"
          >
            <div className="p-3 bg-primary-500/20 rounded-xl border border-primary-500/30">
              <Heart className="w-8 h-8 text-primary-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">OpenHospital</h1>
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
              <label className="block text-sm font-medium text-surface-300 mb-1.5">
                Username
              </label>
              <motion.input
                whileFocus={{ scale: 1.01, boxShadow: '0 0 0 3px rgba(8,145,178,0.15)' }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-surface-800/50 border border-surface-700 rounded-xl text-white placeholder-surface-500 focus:outline-none transition-all"
                placeholder="Enter username"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <motion.input
                  whileFocus={{ scale: 1.01, boxShadow: '0 0 0 3px rgba(8,145,178,0.15)' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-surface-800/50 border border-surface-700 rounded-xl text-white placeholder-surface-500 focus:outline-none transition-all pr-11"
                  placeholder="Enter password"
                  required
                />
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </motion.button>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.01, boxShadow: '0 8px 25px rgba(8,145,178,0.3)' }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="w-full py-3 bg-primary-600 hover:bg-primary-500 disabled:bg-primary-600/50 text-white font-medium rounded-xl transition-colors shadow-lg shadow-primary-600/25"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
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
                </span>
              ) : (
                'Sign In'
              )}
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
            <div className="grid grid-cols-5 gap-2">
              {demoAccounts.map((demo, i) => (
                <motion.button
                  key={demo.username}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + i * 0.05 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => fillDemo(demo.username)}
                  className="flex flex-col items-center gap-1 p-2 rounded-lg bg-surface-800/30 hover:bg-surface-700/50 border border-surface-700/50 hover:border-primary-500/30 transition-colors text-xs group"
                >
                  <span className="text-lg">{demo.icon}</span>
                  <span className="text-surface-400 group-hover:text-surface-200 transition-colors">
                    {demo.role}
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
