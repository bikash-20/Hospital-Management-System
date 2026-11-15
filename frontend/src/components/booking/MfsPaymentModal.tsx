import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';
import { ShieldCheck, CheckCircle2, X, RefreshCw } from 'lucide-react';
import type { PaymentMethod } from '@/types';

interface MfsPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  bedType: string;
  onPaymentSuccess: (method: PaymentMethod, trxId: string) => void;
}

export default function MfsPaymentModal({
  isOpen,
  onClose,
  amount,
  bedType,
  onPaymentSuccess,
}: MfsPaymentModalProps) {
  const { t, isBengali } = useLanguage();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('BKASH');
  const [walletNumber, setWalletNumber] = useState('01712345678');
  const [pin, setPin] = useState('12345');
  const [trxId, setTrxId] = useState('');
  const [processing, setProcessing] = useState(false);

  if (!isOpen) return null;

  const generateDemoTrxId = () => {
    const prefix = selectedMethod === 'BKASH' ? 'BK' : selectedMethod === 'NAGAD' ? 'NG' : 'UP';
    const rand = Math.random().toString(36).substring(2, 9).toUpperCase();
    const generated = `${prefix}${rand}`;
    setTrxId(generated);
  };

  const handleConfirm = () => {
    let finalTrx = trxId.trim();
    if (!finalTrx) {
      const prefix = selectedMethod === 'BKASH' ? 'BK' : selectedMethod === 'NAGAD' ? 'NG' : 'UP';
      finalTrx = `${prefix}${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    }

    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      onPaymentSuccess(selectedMethod, finalTrx);
    }, 1200);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-md bg-white dark:bg-[#151B26] border border-surface-200 dark:border-[#2A3441] rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-surface-100 dark:border-[#2A3441] flex items-center justify-between bg-surface-50/50 dark:bg-[#111820]">
            <div>
              <h3 className="text-lg font-bold text-surface-900 dark:text-white">
                {t('paymentTitle')}
              </h3>
              <p className="text-xs sm:text-sm text-surface-500 dark:text-surface-400 mt-0.5">
                {bedType} • ৳ {amount.toLocaleString()} {isBengali ? 'জামানত' : 'Deposit'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-surface-400 hover:text-surface-700 dark:hover:text-white hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-5">
            {/* Payment Method Selector */}
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => { setSelectedMethod('BKASH'); setTrxId(''); }}
                className={`py-3.5 px-2.5 rounded-xl text-xs sm:text-sm font-bold border flex flex-col items-center justify-center gap-1.5 transition-all ${
                  selectedMethod === 'BKASH'
                    ? 'border-[#E2136E] bg-[#E2136E]/10 text-[#E2136E] ring-2 ring-[#E2136E]/20'
                    : 'border-surface-200 dark:border-[#2A3441] text-surface-600 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-[#1A2230]'
                }`}
              >
                <span className="w-3.5 h-3.5 rounded-full bg-[#E2136E]" />
                bKash (বিকাশ)
              </button>

              <button
                type="button"
                onClick={() => { setSelectedMethod('NAGAD'); setTrxId(''); }}
                className={`py-3.5 px-2.5 rounded-xl text-xs sm:text-sm font-bold border flex flex-col items-center justify-center gap-1.5 transition-all ${
                  selectedMethod === 'NAGAD'
                    ? 'border-[#F7921E] bg-[#F7921E]/10 text-[#F7921E] ring-2 ring-[#F7921E]/20'
                    : 'border-surface-200 dark:border-[#2A3441] text-surface-600 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-[#1A2230]'
                }`}
              >
                <span className="w-3.5 h-3.5 rounded-full bg-[#F7921E]" />
                Nagad (নগদ)
              </button>

              <button
                type="button"
                onClick={() => { setSelectedMethod('UPAY'); setTrxId(''); }}
                className={`py-3.5 px-2.5 rounded-xl text-xs sm:text-sm font-bold border flex flex-col items-center justify-center gap-1.5 transition-all ${
                  selectedMethod === 'UPAY'
                    ? 'border-[#005BAC] bg-[#005BAC]/10 text-[#005BAC] ring-2 ring-[#005BAC]/20'
                    : 'border-surface-200 dark:border-[#2A3441] text-surface-600 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-[#1A2230]'
                }`}
              >
                <span className="w-3.5 h-3.5 rounded-full bg-[#005BAC]" />
                Upay / Rocket
              </button>
            </div>

            {/* Wallet Info Form */}
            <div className="space-y-3.5 bg-surface-50 dark:bg-[#111820] p-4 rounded-xl border border-surface-200 dark:border-[#2A3441]">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1">
                  {t('accountNumberLabel')}
                </label>
                <input
                  type="text"
                  value={walletNumber}
                  onChange={(e) => setWalletNumber(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-[#18202F] border border-surface-300 dark:border-[#354152] rounded-xl text-base text-surface-900 dark:text-white placeholder:text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1">
                  {t('pinLabel')}
                </label>
                <input
                  type="password"
                  maxLength={5}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-[#18202F] border border-surface-300 dark:border-[#354152] rounded-xl text-base text-surface-900 dark:text-white tracking-widest placeholder:text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs sm:text-sm font-semibold text-surface-700 dark:text-surface-300">
                    {t('trxIdLabel')}
                  </label>
                  <button
                    type="button"
                    onClick={generateDemoTrxId}
                    className="text-xs sm:text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1 font-medium"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    {t('generateTrxBtn')}
                  </button>
                </div>
                <input
                  type="text"
                  value={trxId}
                  onChange={(e) => setTrxId(e.target.value)}
                  placeholder="E.g. BK89X92L4"
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-[#18202F] border border-surface-300 dark:border-[#354152] rounded-xl text-base font-mono text-surface-900 dark:text-white placeholder:text-sm uppercase focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="flex items-start gap-2.5 text-xs sm:text-sm text-surface-500 dark:text-surface-400">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>
                {isBengali
                  ? 'কেয়ারব্রিজ এআই অটোমেটেড ভেরিফিকেশন ইঞ্জিন পেমেন্ট পাওয়া মাত্রই তাৎক্ষণিক সিট কনফার্ম ও রসিদ জারি করবে।'
                  : 'CareBridge AI instantly verifies MFS deposits and automatically commits the reserved seat.'}
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={processing}
                className="px-4 py-2.5 text-sm sm:text-base font-semibold text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white transition-colors"
              >
                {t('closeBtn')}
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={processing}
                className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm sm:text-base font-bold shadow-md shadow-primary-500/20 flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {processing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    {isBengali ? 'যাচাই হচ্ছে...' : 'Verifying TrxID...'}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    {t('confirmPaymentBtn')}
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
