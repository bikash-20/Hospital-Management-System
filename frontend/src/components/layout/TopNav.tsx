import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sun,
  Moon,
  LogOut,
  ChevronDown,
  User,
  Menu,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import type { UserRole } from '@/types';
import CommandPalette from '@/components/CommandPalette';
import NotificationsPanel from '@/components/NotificationsPanel';

const roleLabels: Record<UserRole, string> = {
  ADMIN: 'Administrator',
  DOCTOR: 'Doctor',
  RECEPTIONIST: 'Receptionist',
  LAB_TECH: 'Lab Technician',
  CASHIER: 'Cashier',
};

const roleBadgeColors: Record<UserRole, string> = {
  ADMIN: 'bg-red-500/12 text-red-400 border-red-500/25',
  DOCTOR: 'bg-blue-500/12 text-blue-400 border-blue-500/25',
  RECEPTIONIST: 'bg-emerald-500/12 text-emerald-400 border-emerald-500/25',
  LAB_TECH: 'bg-purple-500/12 text-purple-400 border-purple-500/25',
  CASHIER: 'bg-amber-500/12 text-amber-400 border-amber-500/25',
};

interface TopNavProps {
  onMenuToggle?: () => void;
}

export default function TopNav({ onMenuToggle }: TopNavProps) {
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
    <header className="h-16 bg-white/80 dark:bg-[#0F1A28]/90 backdrop-blur-xl border-b border-surface-200 dark:border-[#1E2E40] flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        {/* Mobile hamburger */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onMenuToggle}
          className="p-2.5 rounded-xl text-surface-400 hover:text-surface-700 dark:text-surface-400 dark:hover:text-white hover:bg-surface-100 dark:hover:bg-white/5 transition-colors lg:hidden focus-ring"
          style={{ minWidth: '44px', minHeight: '44px' }}
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </motion.button>

        <div>
          <p className="text-sm text-surface-500 dark:text-surface-400 hidden sm:block">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Command Palette Trigger */}
        <CommandPalette />

        {/* Theme toggle */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.9, rotate: 15 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          onClick={toggleTheme}
          className="p-2.5 rounded-xl text-surface-400 hover:text-surface-600 dark:text-surface-400 dark:hover:text-white hover:bg-surface-100 dark:hover:bg-white/5 transition-colors focus-ring"
          style={{ minWidth: '44px', minHeight: '44px' }}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
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

        {/* Notifications Panel */}
        <NotificationsPanel />

        {/* User dropdown */}
        <div className="relative" ref={dropdownRef}>
          <motion.button
            whileHover={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(241,245,249,0.8)' }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3 pr-2 py-1.5 rounded-xl transition-all focus-ring"
            style={{ minHeight: '44px' }}
            aria-expanded={dropdownOpen}
            aria-haspopup="true"
          >
            <div className="w-8 h-8 bg-primary-500/15 rounded-full flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-primary-400" aria-hidden="true" />
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
              <ChevronDown className="w-4 h-4 text-surface-400" aria-hidden="true" />
            </motion.div>
          </motion.button>

          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-[#1A2332] border border-surface-200 dark:border-[#2A3444] rounded-xl shadow-xl py-2 z-50"
                role="menu"
              >
                <div className="px-4 py-2 border-b border-surface-100 dark:border-[#2A2F38]">
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
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 transition-colors focus-ring"
                  style={{ minHeight: '44px' }}
                  role="menuitem"
                >
                  <LogOut className="w-4 h-4" aria-hidden="true" />
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
