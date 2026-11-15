import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getAllBedBookingsApi, getSeatAvailabilityApi, getDashboardStatsApi } from '@/api/api';
import { useLanguage } from '@/context/LanguageContext';
import { Bell, Check, Clock, AlertTriangle, X, BedDouble, HeartPulse, CreditCard } from 'lucide-react';

interface NotificationItem {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  time: string;
  read: boolean;
  category: 'BOOKING' | 'CAPACITY' | 'BILLING' | 'GENERAL';
}

const typeConfig: Record<string, { icon: typeof Bell; color: string; bg: string }> = {
  info: { icon: Bell, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  success: { icon: Check, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  warning: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  error: { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-500/10' },
};

export default function NotificationsPanel() {
  const { isBengali } = useLanguage();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Local storage for read notification IDs
  const [readIds, setReadIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('carebridge_read_notifications');
      return stored ? new Set(JSON.parse(stored)) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  });

  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('carebridge_dismissed_notifications');
      return stored ? new Set(JSON.parse(stored)) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  });

  // Dynamic live data queries from the hospital database
  const { data: bookings } = useQuery({
    queryKey: ['admin-bookings'],
    queryFn: getAllBedBookingsApi,
    refetchInterval: 8000,
  });

  const { data: seatData } = useQuery({
    queryKey: ['seat-availability'],
    queryFn: getSeatAvailabilityApi,
    refetchInterval: 10000,
  });

  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: getDashboardStatsApi,
    refetchInterval: 12000,
  });

  // Listen for instant booking events
  useEffect(() => {
    const handleNewBooking = () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['seat-availability'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['beds'] });
    };

    window.addEventListener('new-hospital-booking', handleNewBooking);
    return () => window.removeEventListener('new-hospital-booking', handleNewBooking);
  }, [queryClient]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Synthesize dynamic notifications from real hospital events
  const notifications = useMemo<NotificationItem[]>(() => {
    const list: NotificationItem[] = [];

    // 1. Bed Bookings from database
    if (bookings && bookings.length > 0) {
      // Sort newest first
      const sorted = [...bookings].reverse();
      sorted.slice(0, 10).forEach((b) => {
        const id = `booking-${b.id}`;
        if (dismissedIds.has(id)) return;

        const isIcu = b.bedType === 'ICU';
        list.push({
          id,
          type: isIcu ? 'warning' : 'info',
          title: isBengali
            ? `জরুরি ${b.bedType} সিট বুকিং: ${b.guestName}`
            : `Emergency ${b.bedType} Reservation: ${b.guestName}`,
          message: isBengali
            ? `বেড নম্বর: ${b.assignedBedNumber} (${b.assignedWard})। পেমেন্ট: ৳${b.paymentAmount} (${b.paymentMethod})। রেফারেন্স: ${b.bookingReference}`
            : `Assigned Bed: ${b.assignedBedNumber} (${b.assignedWard}). Deposit: ৳${b.paymentAmount} via ${b.paymentMethod}. Ref: ${b.bookingReference}`,
          time: b.createdDate ? new Date(b.createdDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
          read: readIds.has(id),
          category: 'BOOKING',
        });
      });
    }

    // 2. Capacity alerts
    if (seatData) {
      if (seatData.icu && seatData.icu.available <= 1) {
        const id = `capacity-icu-${seatData.icu.available}`;
        if (!dismissedIds.has(id)) {
          list.push({
            id,
            type: 'error',
            title: isBengali ? 'আইসিইউ সিট সতর্কতা' : 'Critical ICU Capacity',
            message: isBengali
              ? `আইসিইউতে মাত্র ${seatData.icu.available} টি সিট বাকি আছে!`
              : `Only ${seatData.icu.available} ICU beds remaining in critical care unit!`,
            time: 'Live',
            read: readIds.has(id),
            category: 'CAPACITY',
          });
        }
      }

      if (seatData.emergency && seatData.emergency.available <= 1) {
        const id = `capacity-emg-${seatData.emergency.available}`;
        if (!dismissedIds.has(id)) {
          list.push({
            id,
            type: 'warning',
            title: isBengali ? 'ইমার্জেন্সি ট্রায়াজ সতর্কতা' : 'Emergency Triage Alert',
            message: isBengali
              ? `ইমার্জেন্সি বিভাগে মাত্র ${seatData.emergency.available} টি বেড খালি আছে।`
              : `Only ${seatData.emergency.available} Emergency beds available.`,
            time: 'Live',
            read: readIds.has(id),
            category: 'CAPACITY',
          });
        }
      }
    }

    // 3. Billing alerts
    if (stats && stats.pendingBills > 0) {
      const id = `billing-pending-${stats.pendingBills}`;
      if (!dismissedIds.has(id)) {
        list.push({
          id,
          type: 'info',
          title: isBengali ? 'পেন্ডিং ইনভয়েস রিমাইন্ডার' : 'Pending Invoices',
          message: isBengali
            ? `${stats.pendingBills} টি চালান এখনও অপরিশোধিত রয়েছে।`
            : `${stats.pendingBills} patient invoices currently pending collection.`,
          time: 'Today',
          read: readIds.has(id),
          category: 'BILLING',
        });
      }
    }

    return list;
  }, [bookings, seatData, stats, readIds, dismissedIds, isBengali]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: string) => {
    setReadIds((prev) => {
      const updated = new Set(prev);
      updated.add(id);
      localStorage.setItem('carebridge_read_notifications', JSON.stringify(Array.from(updated)));
      return updated;
    });
  };

  const markAllAsRead = () => {
    setReadIds(() => {
      const allIds = new Set(notifications.map((n) => n.id));
      localStorage.setItem('carebridge_read_notifications', JSON.stringify(Array.from(allIds)));
      return allIds;
    });
  };

  const dismissNotification = (id: string) => {
    setDismissedIds((prev) => {
      const updated = new Set(prev);
      updated.add(id);
      localStorage.setItem('carebridge_dismissed_notifications', JSON.stringify(Array.from(updated)));
      return updated;
    });
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
            className="absolute top-1.5 right-1.5 min-w-4 h-4 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
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
            className="absolute right-0 top-full mt-2 w-88 sm:w-96 bg-white dark:bg-[#141B24] border border-surface-200 dark:border-[#252D3A] rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-surface-100 dark:border-[#252D3A] flex items-center justify-between bg-surface-50/50 dark:bg-[#0E1520]">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-surface-900 dark:text-white">
                  {isBengali ? 'বিজ্ঞপ্তি ও অ্যালার্ট' : 'Hospital Alerts'}
                </span>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 text-xs font-bold bg-primary-500/10 text-primary-600 dark:text-primary-400 rounded-full">
                    {unreadCount} {isBengali ? 'নতুন' : 'new'}
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="text-xs text-primary-600 dark:text-primary-400 hover:underline font-medium"
                >
                  {isBengali ? 'সব পঠিত হিসেবে চিহ্নিত করুন' : 'Mark all as read'}
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto divide-y divide-surface-100 dark:divide-[#252D3A]">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-sm text-surface-400">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  {isBengali ? 'কোনো নতুন বিজ্ঞপ্তি নেই' : 'No notifications'}
                </div>
              ) : (
                notifications.map((n) => {
                  const cfg = typeConfig[n.type] || typeConfig.info;
                  const Icon =
                    n.category === 'BOOKING'
                      ? BedDouble
                      : n.category === 'CAPACITY'
                      ? HeartPulse
                      : n.category === 'BILLING'
                      ? CreditCard
                      : cfg.icon;

                  return (
                    <div
                      key={n.id}
                      onClick={() => markAsRead(n.id)}
                      className={`p-3.5 hover:bg-surface-50 dark:hover:bg-white/5 transition-colors cursor-pointer flex items-start gap-3 relative group ${
                        !n.read ? 'bg-primary-50/30 dark:bg-primary-950/10' : ''
                      }`}
                    >
                      <div className={`p-2 rounded-xl shrink-0 ${cfg.bg}`}>
                        <Icon className={`w-4 h-4 ${cfg.color}`} />
                      </div>

                      <div className="flex-1 min-w-0 pr-6">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-semibold text-surface-900 dark:text-white truncate">
                            {n.title}
                          </h4>
                          {!n.read && (
                            <span className="w-1.5 h-1.5 rounded-full bg-primary-500 shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5 line-clamp-2 leading-relaxed">
                          {n.message}
                        </p>
                        <div className="flex items-center gap-1 mt-1 text-[10px] text-surface-400">
                          <Clock className="w-3 h-3" />
                          <span>{n.time}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          dismissNotification(n.id);
                        }}
                        className="absolute right-2.5 top-2.5 p-1 rounded-lg text-surface-400 opacity-0 group-hover:opacity-100 hover:text-surface-600 dark:hover:text-white transition-opacity"
                        title="Dismiss"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
