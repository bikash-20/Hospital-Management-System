import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  Bed,
  Receipt,
  Activity,
  Settings,
  Stethoscope,
  History,
  UserCog,
  CalendarClock,
  FlaskConical,
  BarChart3,
  ClipboardList,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  roles: string[];
  keywords: string[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'LAB_TECH', 'CASHIER'], keywords: ['home', 'overview', 'main'] },
  { label: 'Patients', path: '/patients', icon: Users, roles: ['ADMIN', 'RECEPTIONIST', 'DOCTOR'], keywords: ['register', 'new patient', 'uhid'] },
  { label: 'Patient History', path: '/patient-history', icon: ClipboardList, roles: ['ADMIN', 'DOCTOR', 'RECEPTIONIST'], keywords: ['visit', 'records', 'history'] },
  { label: 'Appointments', path: '/appointments', icon: Calendar, roles: ['ADMIN', 'RECEPTIONIST', 'DOCTOR'], keywords: ['book', 'schedule', 'token'] },
  { label: 'Consultation', path: '/consultation', icon: Stethoscope, roles: ['DOCTOR'], keywords: ['examine', 'diagnosis', 'consult'] },
  { label: 'Prescriptions', path: '/prescriptions', icon: FileText, roles: ['DOCTOR', 'RECEPTIONIST'], keywords: ['medicine', 'drug', 'rx'] },
  { label: 'Queue Display', path: '/queue', icon: Activity, roles: ['ADMIN', 'RECEPTIONIST', 'DOCTOR'], keywords: ['waiting', 'line', 'next'] },
  { label: 'Lab Results', path: '/lab-results', icon: FlaskConical, roles: ['LAB_TECH', 'DOCTOR'], keywords: ['test', 'report', 'lab'] },
  { label: 'Doctor Schedule', path: '/schedule', icon: CalendarClock, roles: ['DOCTOR'], keywords: ['availability', 'shift', 'roster'] },
  { label: 'Bed Management', path: '/beds', icon: Bed, roles: ['ADMIN'], keywords: ['ward', 'room', 'occupancy'] },
  { label: 'Billing', path: '/billing', icon: Receipt, roles: ['ADMIN', 'CASHIER', 'RECEPTIONIST'], keywords: ['invoice', 'payment', 'pay'] },
  { label: 'Revenue Reports', path: '/reports', icon: BarChart3, roles: ['ADMIN', 'CASHIER'], keywords: ['finance', 'earnings', 'revenue'] },
  { label: 'User Management', path: '/users', icon: UserCog, roles: ['ADMIN'], keywords: ['staff', 'accounts', 'users'] },
  { label: 'Audit Logs', path: '/audit-logs', icon: History, roles: ['ADMIN'], keywords: ['activity', 'log', 'audit'] },
  { label: 'Settings', path: '/settings', icon: Settings, roles: ['ADMIN'], keywords: ['config', 'preferences', 'system'] },
];

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const filteredItems = navItems
    .filter((item) => user && item.roles.includes(user.role))
    .filter((item) => {
      if (!query) return true;
      const lower = query.toLowerCase();
      return (
        item.label.toLowerCase().includes(lower) ||
        item.keywords.some((kw) => kw.toLowerCase().includes(lower))
      );
    });

  const handleSelect = useCallback(
    (path: string) => {
      navigate(path);
      setIsOpen(false);
      setQuery('');
      setSelectedIndex(0);
    },
    [navigate],
  );

  // Keyboard shortcut to open
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, filteredItems.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && filteredItems[selectedIndex]) {
        handleSelect(filteredItems[selectedIndex].path);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
        setQuery('');
        setSelectedIndex(0);
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredItems, handleSelect]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selected = listRef.current.children[selectedIndex] as HTMLElement;
      if (selected) {
        selected.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl border border-surface-200 dark:border-[#252D3A] bg-white dark:bg-[#141B24] text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 hover:border-surface-300 dark:hover:border-[#303A48] transition-all text-sm"
        style={{ minWidth: '44px', minHeight: '44px' }}
      >
        <Search className="w-4 h-4" aria-hidden="true" />
        <span className="hidden sm:inline">Search pages...</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium text-surface-400 bg-surface-100 dark:bg-[#1A2230] rounded border border-surface-200 dark:border-[#252D3A]">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={() => {
                setIsOpen(false);
                setQuery('');
                setSelectedIndex(0);
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-lg z-50"
            >
              <div className="bg-white dark:bg-[#141B24] border border-surface-200 dark:border-[#252D3A] rounded-xl shadow-2xl overflow-hidden">
                {/* Search Input */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-surface-100 dark:border-[#252D3A]">
                  <Search className="w-5 h-5 text-surface-400" aria-hidden="true" />
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Search pages, features..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="flex-1 bg-transparent text-surface-900 dark:text-white placeholder-surface-400 focus:outline-none text-sm"
                  />
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      setQuery('');
                      setSelectedIndex(0);
                    }}
                    className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-[#1A2230] text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Results */}
                <div ref={listRef} className="max-h-[300px] overflow-y-auto py-2">
                  {filteredItems.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <p className="text-sm text-surface-500">No results found</p>
                      <p className="text-xs text-surface-400 mt-1">Try a different search term</p>
                    </div>
                  ) : (
                    filteredItems.map((item, index) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.path}
                          onClick={() => handleSelect(item.path)}
                          onMouseEnter={() => setSelectedIndex(index)}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                            index === selectedIndex
                              ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400'
                              : 'text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-[#1A2230]'
                          }`}
                        >
                          <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                          <span className="text-sm font-medium">{item.label}</span>
                          <span className="ml-auto text-xs text-surface-400">{item.path}</span>
                        </button>
                      );
                    })
                  )}
                </div>

                {/* Footer */}
                <div className="px-4 py-2 border-t border-surface-100 dark:border-[#252D3A] flex items-center gap-4 text-xs text-surface-400">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-surface-100 dark:bg-[#1A2230] rounded text-[10px]">↑↓</kbd>
                    Navigate
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-surface-100 dark:bg-[#1A2230] rounded text-[10px]">↵</kbd>
                    Select
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-surface-100 dark:bg-[#1A2230] rounded text-[10px]">esc</kbd>
                    Close
                  </span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
