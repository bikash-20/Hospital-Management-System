import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';
import { getSeatAvailabilityApi } from '@/api/api';
import type { BedType } from '@/types';
import SeatBookingModal from '@/components/booking/SeatBookingModal';
import CareBridgeAIChat from '@/components/ai/CareBridgeAIChat';
import { useNavigate } from 'react-router-dom';
import {
  HeartPulse,
  Activity,
  Home,
  BedDouble,
  ShieldCheck,
  Bot,
  Sparkles,
  UserCheck,
  Clock,
  ChevronRight,
  LogIn,
  Languages,
  Download,
} from 'lucide-react';

export default function PublicHome() {
  const { t, language, toggleLanguage, isBengali } = useLanguage();
  const navigate = useNavigate();

  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedBedType, setSelectedBedType] = useState<BedType>('ICU');
  const [aiChatOpen, setAiChatOpen] = useState(false);

  const { data: seatData } = useQuery({
    queryKey: ['seat-availability'],
    queryFn: getSeatAvailabilityApi,
    refetchInterval: 10000, // Poll every 10 seconds for real-time live bed tracking
  });

  const handleOpenBooking = (type: BedType) => {
    setSelectedBedType(type);
    setBookingModalOpen(true);
  };

  const bedCards = [
    {
      type: 'ICU' as BedType,
      title: t('icuTitle'),
      stat: seatData?.icu,
      icon: HeartPulse,
      gradient: 'from-rose-500/10 via-rose-500/5 to-transparent',
      borderColor: 'border-rose-500/30',
      badgeColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
      rate: '৳ 5,000',
      desc: isBengali ? 'ইনভেসিভ ভেন্টিলেটর, আর্টারিয়াল মনিটরিং ও ২৪/৭ ক্রিটিক্যাল কেয়ার নার্সিং।' : 'Invasive ventilation, arterial monitoring & 1:1 dedicated critical nursing.',
    },
    {
      type: 'EMERGENCY' as BedType,
      title: t('emergencyTitle'),
      stat: seatData?.emergency,
      icon: Activity,
      gradient: 'from-amber-500/10 via-amber-500/5 to-transparent',
      borderColor: 'border-amber-500/30',
      badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
      rate: '৳ 2,500',
      desc: isBengali ? 'তাৎক্ষণিক ট্রমা রেসাসিটেশন ও জরুরি ট্রায়াজ পর্যবেক্ষণ ইউনিট।' : 'Rapid trauma resuscitation & immediate emergency triage stabilization.',
    },
    {
      type: 'CABIN' as BedType,
      title: t('cabinTitle'),
      stat: seatData?.cabin,
      icon: Home,
      gradient: 'from-blue-500/10 via-blue-500/5 to-transparent',
      borderColor: 'border-blue-500/30',
      badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
      rate: '৳ 3,500',
      desc: isBengali ? 'শীতাতপ নিয়ন্ত্রিত প্রাইভেট কেবিন, সংযুক্ত বাথরুম ও পরিচারক সুবিধা।' : 'Deluxe private room with dedicated ensuite bathroom and attendant couch.',
    },
    {
      type: 'GENERAL' as BedType,
      title: t('generalTitle'),
      stat: seatData?.general,
      icon: BedDouble,
      gradient: 'from-emerald-500/10 via-emerald-500/5 to-transparent',
      borderColor: 'border-emerald-500/30',
      badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
      rate: '৳ 800',
      desc: isBengali ? 'পরিচ্ছন্ন ওয়ার্ড, নিয়মিত মেডিকেল রাউন্ড ও সার্বক্ষণিক সহায়তা।' : 'Well-ventilated ward with periodic medical rounds and 24/7 nursing.',
    },
  ];

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-[#0D1117] text-surface-900 dark:text-surface-100 flex flex-col font-sans">
      {/* Public Header / Navigation */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-[#161B22]/80 backdrop-blur-md border-b border-surface-200 dark:border-[#21262D]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-md shadow-emerald-500/20 shrink-0 border border-emerald-500/30">
              <img src="/carebridge-logo.png" alt="CareBridge AI logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base sm:text-lg tracking-tight text-surface-900 dark:text-white">
                  CareBridge <span className="text-primary-600 dark:text-primary-400">AI</span>
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] uppercase font-mono font-semibold rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Live Operations
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* PWA Install Trigger */}
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('open-pwa-install-banner'))}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/20 transition-all shadow-sm"
              title="Install CareBridge AI App"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isBengali ? 'অ্যাপ ডাউনলোড' : 'Install App'}</span>
            </button>

            {/* Language Switcher */}
            <button
              type="button"
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-surface-200 dark:border-[#30363D] hover:bg-surface-100 dark:hover:bg-[#21262D] transition-colors"
            >
              <Languages className="w-3.5 h-3.5" />
              <span>{language === 'en' ? 'বাংলা' : 'English'}</span>
            </button>

            {/* Staff Login Link */}
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-surface-100 dark:bg-[#21262D] hover:bg-surface-200 dark:hover:bg-[#30363D] text-xs font-semibold text-surface-800 dark:text-surface-200 transition-colors"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{t('navLogin')}</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenBooking('ICU')}
              className="hidden sm:flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold shadow-md shadow-primary-600/20 transition-all"
            >
              <HeartPulse className="w-3.5 h-3.5" />
              <span>{t('ctaBookBed')}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 px-4 sm:px-6 lg:px-8 border-b border-surface-200 dark:border-[#21262D]">
        <div className="max-w-5xl mx-auto text-center space-y-5">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800"
          >
            <Sparkles className="w-3.5 h-3.5 text-primary-500 animate-pulse" />
            <span>{t('heroBadge')}</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-surface-900 dark:text-white leading-tight"
          >
            {t('heroTitle')}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-sm sm:text-base text-surface-600 dark:text-surface-300 max-w-3xl mx-auto leading-relaxed"
          >
            {t('heroSubtitle')}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-3 pt-3"
          >
            <button
              type="button"
              onClick={() => handleOpenBooking('EMERGENCY')}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary-600 to-emerald-600 hover:from-primary-700 hover:to-emerald-700 text-white font-semibold text-sm shadow-xl shadow-primary-600/25 flex items-center gap-2 transition-all"
            >
              <HeartPulse className="w-4 h-4" />
              <span>{t('ctaBookBed')}</span>
            </button>

            <button
              type="button"
              onClick={() => setAiChatOpen(true)}
              className="px-5 py-3 rounded-xl bg-surface-100 hover:bg-surface-200 dark:bg-[#1C2128] dark:hover:bg-[#262C36] text-surface-800 dark:text-surface-200 font-semibold text-sm border border-surface-200 dark:border-[#30363D] flex items-center gap-2 transition-all"
            >
              <Bot className="w-4 h-4 text-primary-500" />
              <span>{t('ctaTalkAI')}</span>
            </button>
          </motion.div>
        </div>
      </section>

      {/* Real-time Seat Availability Cards */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-3 mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-surface-900 dark:text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-500" />
              {t('seatStatusTitle')}
            </h2>
            <p className="text-xs sm:text-sm text-surface-500 dark:text-surface-400 mt-1">
              {t('seatStatusSub')}
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-surface-500 dark:text-surface-400 bg-surface-100 dark:bg-[#161B22] px-3 py-1.5 rounded-lg border border-surface-200 dark:border-[#30363D]">
            <Clock className="w-3.5 h-3.5 text-primary-500" />
            <span>{isBengali ? '১০ সেকেন্ড পর পর স্বয়ংক্রিয় আপডেট' : 'Auto-refreshed every 10s'}</span>
          </div>
        </div>

        {/* 4 Seat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {bedCards.map((card) => {
            const Icon = card.icon;
            const available = card.stat?.available ?? 0;
            const total = card.stat?.total ?? 0;
            const isAvailable = available > 0;

            return (
              <motion.div
                key={card.type}
                whileHover={{ y: -4 }}
                className={`bg-white dark:bg-[#161B22] border ${card.borderColor} rounded-2xl p-5 shadow-lg relative overflow-hidden flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-surface-100 dark:bg-[#21262D] flex items-center justify-center text-primary-500">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${card.badgeColor}`}>
                      {card.rate} {t('perDay')}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-surface-900 dark:text-white mb-1">
                    {card.title}
                  </h3>
                  <p className="text-xs text-surface-500 dark:text-surface-400 mb-4 leading-relaxed">
                    {card.desc}
                  </p>
                </div>

                <div className="space-y-3 pt-3 border-t border-surface-100 dark:border-[#21262D]">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-surface-500 font-medium">
                      {isBengali ? 'খালি সিট' : 'Available Seats'}:
                    </span>
                    <span className={`font-mono font-bold text-sm ${isAvailable ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {available} / {total}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-surface-100 dark:bg-[#21262D] rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${isAvailable ? 'bg-emerald-500' : 'bg-rose-500'}`}
                      style={{ width: `${total > 0 ? (available / total) * 100 : 0}%` }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenBooking(card.type)}
                    className="w-full py-2.5 px-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-all"
                  >
                    <span>{t('bookThisSeat')}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Feature Highlights: Free AI Health Services & Hospital Management */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full border-t border-surface-200 dark:border-[#21262D]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-[#161B22] border border-surface-200 dark:border-[#21262D]">
            <div className="w-10 h-10 rounded-xl bg-primary-500/10 text-primary-600 dark:text-primary-400 flex items-center justify-center mb-4">
              <Bot className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-surface-900 dark:text-white text-base mb-2">
              {isBengali ? 'ফ্রি এআই স্বাস্থ্য সহকারী' : 'Free AI Health Assistant'}
            </h3>
            <p className="text-xs text-surface-500 dark:text-surface-400 leading-relaxed">
              {isBengali
                ? 'যে কেউ প্রেসক্রিপশন ছবি আপলোড করে ঔষধের ডোজ, খাবারের সতর্কতা ও পার্শ্বপ্রতিক্রিয়া পরীক্ষা করতে পারেন।'
                : 'Upload prescriptions to extract dosages, drug interactions, contraindications, and dietary warnings for free.'}
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-[#161B22] border border-surface-200 dark:border-[#21262D]">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-surface-900 dark:text-white text-base mb-2">
              {isBengali ? 'স্বয়ংক্রিয় জরুরি ভর্তি' : 'Automated Seat Allocation'}
            </h3>
            <p className="text-xs text-surface-500 dark:text-surface-400 leading-relaxed">
              {isBengali
                ? 'সিট খালি থাকা মাত্রই সিস্টেম রোগী ও ডাক্তারের জন্য তাৎক্ষণিক ভর্তি নিশ্চিত করে ডিজিটাল ভাউচার তৈরি করে।'
                : 'Direct synchronization between patient booking, hospital inventory, and instant digital voucher generation.'}
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-[#161B22] border border-surface-200 dark:border-[#21262D]">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
              <UserCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-surface-900 dark:text-white text-base mb-2">
              {isBengali ? 'সম্পূর্ণ হাসপাতাল অপারেশন' : 'Full Staff Workspace'}
            </h3>
            <p className="text-xs text-surface-500 dark:text-surface-400 leading-relaxed">
              {isBengali
                ? 'অ্যাডমিন, ক্যাশিয়ার, ডাক্তার ও নার্সিং স্টাফদের জন্য পৃথক এআই লেআউট ও সমন্বিত অপারেশন ব্যবস্থাপনা।'
                : 'Role-dedicated AI copilot layouts for Admin, Cashier, Doctor, and Receptionist with audit logs and billing.'}
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-6 border-t border-surface-200 dark:border-[#21262D] text-center text-xs text-surface-500">
        <p>CareBridge AI • Personal Intelligent Hospital Management System</p>
      </footer>

      {/* Modals & AI Floating Widget */}
      <SeatBookingModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        defaultBedType={selectedBedType}
      />

      <CareBridgeAIChat
        onOpenBooking={() => setBookingModalOpen(true)}
        isOpenExternal={aiChatOpen}
        onCloseExternal={() => setAiChatOpen(false)}
      />
    </div>
  );
}
