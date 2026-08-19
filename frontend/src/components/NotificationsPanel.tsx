import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, Clock, AlertTriangle, X } from 'lucide-react';

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

// Demo notifications - in production, these would come from an API
const demoNotifications: Notification[] = [
  {
    id: '1',
    type: 'success',
    title: 'Patient Registered',
    message: 'New patient UHID-2024-0045 has been registered',
    time: '2 min ago',
    read: false,
  },
  {
    id: '2',
    type: 'info',
    title: 'Appointment Scheduled',
    message: 'Dr. Rahim has a new appointment at 2:30 PM',
    time: '15 min ago',
    read: false,
  },
  {
    id: '3',
    type: 'warning',
    title: 'Low Bed Availability',
    message: 'Only 3 beds available in General Ward',
    time: '1 hour ago',
    read: true,
  },
  {
    id: '4',
    type: 'error',
    title: 'Payment Pending',
    message: 'Invoice INV-2024-0123 is overdue by 3 days',
    time: '2 hours ago',
    read: true,
  },
];

const typeConfig: Record<string, { icon: typeof Bell; color: string; bg: string }> = {
  info: { icon: Bell, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  success: { icon: Check, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  warning: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  error: { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-500/10' },
};

export default function NotificationsPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState(demoNotifications);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-xl text-surface-400 hover:text-surface-600 dark:text-surface-400 dark:hover:text-white hover:bg-surface-100 dark:hover:bg-white/5 transition-colors focus-ring"
        style={{ minWidth: '44px', minHeight: '44px' }}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center"
          >
            {unreadCount}
          </motion.span>
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-[#141B24] border border-surface-200 dark:border-[#252D3A] rounded-xl shadow-xl z-50"
            role="menu"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-surface-100 dark:border-[#252D3A] flex items-center justify-between">
              <h3 className="text-sm font-semibold text-surface-900 dark:text-white">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300 font-medium transition-colors"
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="max-h-[320px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <Bell className="w-8 h-8 text-surface-300 dark:text-surface-600 mx-auto mb-2" />
                  <p className="text-sm text-surface-500">No notifications</p>
                </div>
              ) : (
                notifications.map((notification) => {
                  const config = typeConfig[notification.type];
                  const Icon = config.icon;
                  return (
                    <motion.div
                      key={notification.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, height: 0 }}
                      className={`px-4 py-3 border-b border-surface-50 dark:border-[#1A2230] hover:bg-surface-50 dark:hover:bg-[#1A2230] transition-colors ${
                        !notification.read ? 'bg-primary-500/5 dark:bg-primary-500/5' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-1.5 rounded-lg ${config.bg} shrink-0 mt-0.5`}>
                          <Icon className={`w-3.5 h-3.5 ${config.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-sm font-medium ${!notification.read ? 'text-surface-900 dark:text-white' : 'text-surface-700 dark:text-surface-300'}`}>
                              {notification.title}
                            </p>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                clearNotification(notification.id);
                              }}
                              className="p-1 rounded hover:bg-surface-200 dark:hover:bg-[#252D3A] text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 transition-colors shrink-0"
                              aria-label="Dismiss notification"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                          <p className="text-xs text-surface-500 mt-0.5 line-clamp-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <Clock className="w-3 h-3 text-surface-400" />
                            <span className="text-[11px] text-surface-400">{notification.time}</span>
                            {!notification.read && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="text-[11px] text-primary-500 hover:text-primary-600 dark:text-primary-400 font-medium ml-auto"
                              >
                                Mark read
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-4 py-2 border-t border-surface-100 dark:border-[#252D3A]">
                <button className="w-full text-center text-xs text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300 font-medium py-1 transition-colors">
                  View all notifications
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
