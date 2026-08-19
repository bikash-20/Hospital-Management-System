import { NavLink } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  Bed,
  Receipt,
  Activity,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Stethoscope,
  History,
  UserCog,
  CalendarClock,
  FlaskConical,
  BarChart3,
  ClipboardList,
} from 'lucide-react';

interface NavItem {
  label: string;
  path: string;
  icon: typeof LayoutDashboard;
  roles: string[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'LAB_TECH', 'CASHIER'] },
  { label: 'Patients', path: '/patients', icon: Users, roles: ['ADMIN', 'RECEPTIONIST', 'DOCTOR'] },
  { label: 'Patient History', path: '/patient-history', icon: ClipboardList, roles: ['ADMIN', 'DOCTOR', 'RECEPTIONIST'] },
  { label: 'Appointments', path: '/appointments', icon: Calendar, roles: ['ADMIN', 'RECEPTIONIST', 'DOCTOR'] },
  { label: 'Consultation', path: '/consultation', icon: Stethoscope, roles: ['DOCTOR'] },
  { label: 'Prescriptions', path: '/prescriptions', icon: FileText, roles: ['DOCTOR', 'RECEPTIONIST'] },
  { label: 'Queue Display', path: '/queue', icon: Activity, roles: ['ADMIN', 'RECEPTIONIST', 'DOCTOR'] },
  { label: 'Lab Results', path: '/lab-results', icon: FlaskConical, roles: ['LAB_TECH', 'DOCTOR'] },
  { label: 'Doctor Schedule', path: '/schedule', icon: CalendarClock, roles: ['DOCTOR'] },
  { label: 'Bed Management', path: '/beds', icon: Bed, roles: ['ADMIN'] },
  { label: 'Billing', path: '/billing', icon: Receipt, roles: ['ADMIN', 'CASHIER', 'RECEPTIONIST'] },
  { label: 'Revenue Reports', path: '/reports', icon: BarChart3, roles: ['ADMIN', 'CASHIER'] },
  { label: 'User Management', path: '/users', icon: UserCog, roles: ['ADMIN'] },
  { label: 'Audit Logs', path: '/audit-logs', icon: History, roles: ['ADMIN'] },
  { label: 'Settings', path: '/settings', icon: Settings, roles: ['ADMIN'] },
];

function useBreakpoint() {
  const [bp, setBp] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  useEffect(() => {
    function check() {
      const w = window.innerWidth;
      if (w < 769) setBp('mobile');
      else if (w < 1025) setBp('tablet');
      else setBp('desktop');
    }
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return bp;
}

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export default function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const { user } = useAuth();
  const bp = useBreakpoint();
  const [collapsed, setCollapsed] = useState(false);

  // Auto-collapse on tablet
  useEffect(() => {
    if (bp === 'tablet') setCollapsed(true);
    if (bp === 'desktop') setCollapsed(false);
  }, [bp]);

  const filteredItems = navItems.filter(
    (item) => user && item.roles.includes(user.role),
  );

  const isCollapsed = bp === 'tablet' || (bp === 'desktop' && collapsed);
  const sidebarWidth = isCollapsed ? 72 : 260;

  // Mobile: full overlay sidebar
  if (bp === 'mobile') {
    return (
      <>
        {/* Hamburger button */}
        <button
          onClick={onMobileClose}
          className="fixed top-3 left-3 z-50 p-2.5 rounded-xl bg-[#1A1F26] border border-[#2A2F38] text-surface-300 hover:text-white transition-colors lg:hidden"
          aria-label="Open navigation menu"
          style={{ display: mobileOpen ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '44px', minHeight: '44px' }}
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Mobile overlay */}
        <AnimatePresence>
          {mobileOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="mobile-overlay lg:hidden"
                onClick={onMobileClose}
              />
              <motion.aside
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="fixed inset-y-0 left-0 z-50 w-[260px] sidebar-bg flex flex-col border-r border-[#2A2F38] shadow-[var(--shadow-sidebar)]"
              >
                <MobileSidebarContent
                  items={filteredItems}
                  onClose={onMobileClose}
                />
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      </>
    );
  }

  // Tablet / Desktop sidebar
  return (
    <motion.aside
      animate={{ width: sidebarWidth }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="h-screen sidebar-bg border-r border-[#2A2F38] flex flex-col relative shrink-0 overflow-hidden hidden lg:flex"
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Logo */}
      <div className="p-4 flex items-center gap-3 border-b border-[#2A2F38] min-h-[64px]">
        <div className="p-2 bg-primary-500/15 rounded-xl shrink-0">
          <Activity className="w-5 h-5 text-primary-400" aria-hidden="true" />
        </div>
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden whitespace-nowrap"
            >
              <h2 className="text-sm font-bold text-white">OpenHospital</h2>
              <p className="text-[10px] text-surface-500 uppercase tracking-wider">RMS</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto" aria-label="Sidebar">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className="block focus-ring"
            >
              {({ isActive }) => (
                <motion.div
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  className={`relative flex items-center gap-3 rounded-xl text-sm font-medium transition-colors duration-150 ${
                    isActive
                      ? 'bg-primary-500/12 text-primary-400'
                      : 'text-surface-400 hover:text-surface-200 hover:bg-white/5'
                  } ${isCollapsed ? 'justify-center px-0 py-3' : 'px-3 py-2.5'}`}
                  style={{ minHeight: '44px' }}
                  title={isCollapsed ? item.label : undefined}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {/* Active indicator bar */}
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary-400 rounded-r-full"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                  <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />
                  <AnimatePresence>
                    {!isCollapsed && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.15 }}
                        className="overflow-hidden whitespace-nowrap"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Collapse toggle (desktop only) */}
      {bp === 'desktop' && (
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-surface-800 border border-surface-700 rounded-full flex items-center justify-center text-surface-400 hover:text-white hover:bg-surface-700 transition-colors z-10 shadow-lg focus-ring"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="w-3 h-3" aria-hidden="true" />
          ) : (
            <ChevronLeft className="w-3 h-3" aria-hidden="true" />
          )}
        </motion.button>
      )}
    </motion.aside>
  );
}

// Mobile sidebar content
function MobileSidebarContent({
  items,
  onClose,
}: {
  items: NavItem[];
  onClose: () => void;
}) {
  return (
    <>
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-[#2A2F38] min-h-[64px]">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-500/15 rounded-xl">
            <Activity className="w-5 h-5 text-primary-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">OpenHospital</h2>
            <p className="text-[10px] text-surface-500 uppercase tracking-wider">RMS</p>
          </div>
        </div>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onClose}
          className="p-2 rounded-xl text-surface-400 hover:text-white hover:bg-white/5 transition-colors focus-ring"
          style={{ minWidth: '44px', minHeight: '44px' }}
          aria-label="Close navigation menu"
        >
          <X className="w-5 h-5" />
        </motion.button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto" aria-label="Mobile navigation">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              onClick={onClose}
              className="block focus-ring"
            >
              {({ isActive }) => (
                <motion.div
                  whileTap={{ scale: 0.97 }}
                  className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 ${
                    isActive
                      ? 'bg-primary-500/12 text-primary-400'
                      : 'text-surface-400 hover:text-surface-200 hover:bg-white/5'
                  }`}
                  style={{ minHeight: '44px' }}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active-mobile"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary-400 rounded-r-full"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                  <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />
                  <span>{item.label}</span>
                </motion.div>
              )}
            </NavLink>
          );
        })}
      </nav>
    </>
  );
}
