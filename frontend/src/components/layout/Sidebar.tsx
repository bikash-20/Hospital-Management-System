import { NavLink } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';
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
  Stethoscope,
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
  { label: 'Appointments', path: '/appointments', icon: Calendar, roles: ['ADMIN', 'RECEPTIONIST', 'DOCTOR'] },
  { label: 'Consultation', path: '/consultation', icon: Stethoscope, roles: ['DOCTOR'] },
  { label: 'Prescriptions', path: '/prescriptions', icon: FileText, roles: ['DOCTOR', 'RECEPTIONIST'] },
  { label: 'Queue Display', path: '/queue', icon: Activity, roles: ['ADMIN', 'RECEPTIONIST', 'DOCTOR'] },
  { label: 'Bed Management', path: '/beds', icon: Bed, roles: ['ADMIN'] },
  { label: 'Billing', path: '/billing', icon: Receipt, roles: ['ADMIN', 'CASHIER', 'RECEPTIONIST'] },
  { label: 'Settings', path: '/settings', icon: Settings, roles: ['ADMIN'] },
];

export default function Sidebar() {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const filteredItems = navItems.filter(
    (item) => user && item.roles.includes(user.role),
  );

  return (
    <motion.aside
      animate={{ width: collapsed ? 70 : 260 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="h-screen bg-surface-900 border-r border-surface-700/50 flex flex-col relative shrink-0 overflow-hidden"
    >
      {/* Logo */}
      <div className="p-4 flex items-center gap-3 border-b border-surface-700/50 min-h-[64px]">
        <div className="p-2 bg-primary-500/20 rounded-lg shrink-0">
          <Activity className="w-5 h-5 text-primary-400" />
        </div>
        <AnimatePresence>
          {!collapsed && (
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
      <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className="block"
            >
              {({ isActive }) => (
                <motion.div
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 ${
                    isActive
                      ? 'bg-primary-500/15 text-primary-400'
                      : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800/50'
                  } ${collapsed ? 'justify-center px-2' : ''}`}
                  title={collapsed ? item.label : undefined}
                >
                  {/* Active indicator bar */}
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary-400 rounded-r-full"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                  <Icon className="w-5 h-5 shrink-0" />
                  <AnimatePresence>
                    {!collapsed && (
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

      {/* Collapse toggle */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-surface-800 border border-surface-700 rounded-full flex items-center justify-center text-surface-400 hover:text-white hover:bg-surface-700 transition-colors z-10 shadow-lg"
      >
        {collapsed ? (
          <ChevronRight className="w-3 h-3" />
        ) : (
          <ChevronLeft className="w-3 h-3" />
        )}
      </motion.button>
    </motion.aside>
  );
}
