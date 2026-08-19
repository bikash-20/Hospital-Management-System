import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sun,
  Moon,
  Bell,
  LogOut,
  ChevronDown,
  User,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import type { UserRole } from '@/types';

const roleLabels: Record<UserRole, string> = {
  ADMIN: 'Administrator',
  DOCTOR: 'Doctor',
  RECEPTIONIST: 'Receptionist',
  LAB_TECH: 'Lab Technician',
  CASHIER: 'Cashier',
};

const roleBadgeColors: Record<UserRole, string> = {
  ADMIN: 'bg-red-500/15 text-red-400 border-red-500/30',
  DOCTOR: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  RECEPTIONIST: 'bg-green-500/15 text-green-400 border-green-500/30',
  LAB_TECH: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  CASHIER: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
};

export default function TopNav() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  return (
    <header className="h-16 bg-white/80 dark:bg-surface-900/80 backdrop-blur-xl border-b border-surface-200 dark:border-surface-700/50 flex items-center justify-between px-6 sticky top-0 z-40">
      <div>
        <p className="text-sm text-surface-500 dark:text-surface-400">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* Theme toggle */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9, rotate: 15 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          onClick={toggleTheme}
          className="p-2 rounded-xl text-surface-400 hover:text-surface-600 dark:text-surface-400 dark:hover:text-white hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <AnimatePresence mode="wait">
            {isDark ? (
              <motion.div key="sun" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                <Sun className="w-5 h-5" />
              </motion.div>
            ) : (
              <motion.div key="moon" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                <Moon className="w-5 h-5" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>

        {/* Notifications */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          className="p-2 rounded-xl text-surface-400 hover:text-surface-600 dark:text-surface-400 dark:hover:text-white hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors relative"
        >
          <Bell className="w-5 h-5" />
          <motion.span
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"
          />
        </motion.button>

        {/* User dropdown */}
        <div className="relative" ref={dropdownRef}>
          <motion.button
            whileHover={{ backgroundColor: 'rgba(241,245,249,0.5)' }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-3 pl-3 pr-2 py-1.5 rounded-xl dark:hover:bg-surface-800 transition-all"
          >
            <div className="w-8 h-8 bg-primary-500/20 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-primary-400" />
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-medium text-surface-900 dark:text-white leading-tight">
                {user.fullName}
              </p>
              <p className="text-[11px] text-surface-500 dark:text-surface-400 leading-tight">
                {roleLabels[user.role]}
              </p>
            </div>
            <motion.div animate={{ rotate: dropdownOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown className="w-4 h-4 text-surface-400" />
            </motion.div>
          </motion.button>

          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl shadow-xl py-2 z-50"
              >
                <div className="px-4 py-2 border-b border-surface-100 dark:border-surface-700">
                  <p className="text-sm font-medium text-surface-900 dark:text-white">{user.fullName}</p>
                  <p className="text-xs text-surface-500">{user.email}</p>
                  <span
                    className={`inline-block mt-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${roleBadgeColors[user.role]}`}
                  >
                    {roleLabels[user.role]}
                  </span>
                </div>
                <motion.button
                  whileHover={{ x: 2, backgroundColor: 'rgba(239,68,68,0.1)' }}
                  onClick={() => {
                    setDropdownOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
