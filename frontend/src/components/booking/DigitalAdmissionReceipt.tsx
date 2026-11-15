import { useRef } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';
import { Printer, CheckCircle, Hospital, User, Phone, BedDouble, CreditCard, ShieldCheck } from 'lucide-react';
import type { BedBookingResponse } from '@/types';

interface DigitalAdmissionReceiptProps {
  booking: BedBookingResponse;
  onDone: () => void;
}

export default function DigitalAdmissionReceipt({ booking, onDone }: DigitalAdmissionReceiptProps) {
  const { t, isBengali } = useLanguage();
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-xl mx-auto space-y-4"
    >
      {/* Printable Receipt Card */}
      <div
        ref={receiptRef}
        className="bg-white dark:bg-[#151B26] border-2 border-emerald-500/30 rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden"
      >
        {/* Verification Ribbon */}
        <div className="absolute top-4 right-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5" />
          {isBengali ? 'কনফার্মড ও ভেরিফায়েড' : 'AUTO-CONFIRMED & VERIFIED'}
        </div>

        {/* Hospital Branding Header */}
        <div className="flex items-center gap-3 border-b border-surface-200 dark:border-[#2A3441] pb-5 mb-5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-600 to-emerald-600 flex items-center justify-center text-white shadow-md">
            <Hospital className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-surface-900 dark:text-white flex items-center gap-2">
              {t('brandName')}
              <span className="text-xs px-2 py-0.5 rounded-md bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 font-mono">
                CLINICAL
              </span>
            </h2>
            <p className="text-xs text-surface-500 dark:text-surface-400">
              {t('receiptSubtitle')}
            </p>
          </div>
        </div>

        {/* Reference & QR Code Header */}
        <div className="bg-surface-50 dark:bg-[#111820] p-4 rounded-xl border border-surface-200 dark:border-[#2A3441] mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-[11px] uppercase tracking-wider font-semibold text-surface-500">
              {t('bookingRefLabel')}
            </span>
            <div className="text-lg font-mono font-bold text-primary-600 dark:text-primary-400">
              {booking.bookingReference}
            </div>
            <div className="text-xs text-surface-400">
              {booking.createdDate ? new Date(booking.createdDate).toLocaleString() : new Date().toLocaleString()}
            </div>
          </div>

          <div className="text-center sm:text-right">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-surface-500">
              {t('uhidLabel')}
            </span>
            <div className="text-sm font-mono font-semibold text-surface-800 dark:text-surface-200">
              {booking.uhid}
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mb-6">
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-surface-50/50 dark:bg-[#1A2230]">
            <User className="w-4 h-4 text-surface-400 mt-0.5 shrink-0" />
            <div>
              <div className="text-xs text-surface-500">{t('patientNameLabel')}</div>
              <div className="font-semibold text-surface-900 dark:text-white">{booking.guestName}</div>
              <div className="text-xs text-surface-400">{booking.guestAge} yrs • {booking.guestGender}</div>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-surface-50/50 dark:bg-[#1A2230]">
            <Phone className="w-4 h-4 text-surface-400 mt-0.5 shrink-0" />
            <div>
              <div className="text-xs text-surface-500">{t('patientPhoneLabel')}</div>
              <div className="font-medium text-surface-900 dark:text-white">{booking.guestPhone}</div>
              {booking.guestNid && <div className="text-xs text-surface-400 font-mono">NID: {booking.guestNid}</div>}
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-primary-50/50 dark:bg-primary-950/20 border border-primary-200/50 dark:border-primary-900/30">
            <BedDouble className="w-4 h-4 text-primary-600 dark:text-primary-400 mt-0.5 shrink-0" />
            <div>
              <div className="text-xs text-primary-700 dark:text-primary-300 font-medium">{t('bedAllocatedLabel')}</div>
              <div className="font-bold text-surface-900 dark:text-white text-base">
                {booking.assignedBedNumber}
              </div>
              <div className="text-xs text-surface-500">{booking.assignedWard} ({booking.bedType})</div>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/30">
            <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
            <div>
              <div className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">{t('amountPaidLabel')}</div>
              <div className="font-bold text-surface-900 dark:text-white text-base">
                ৳ {Number(booking.paymentAmount).toLocaleString()}
              </div>
              <div className="text-xs font-mono text-surface-500">
                {booking.paymentMethod} • TrxID: {booking.paymentTrxId}
              </div>
            </div>
          </div>
        </div>

        {/* Symptoms Summary */}
        {booking.symptoms && (
          <div className="mb-6 p-3 rounded-lg bg-surface-50 dark:bg-[#111820] text-xs">
            <span className="font-semibold text-surface-700 dark:text-surface-300">{t('symptomsLabel')}:</span>{' '}
            <span className="text-surface-600 dark:text-surface-400">{booking.symptoms}</span>
          </div>
        )}

        {/* Barcode & Security Stamp */}
        <div className="border-t border-surface-200 dark:border-[#2A3441] pt-4 flex flex-col sm:flex-row items-center justify-between text-xs text-surface-400 gap-2">
          <div className="font-mono tracking-widest text-surface-600 dark:text-surface-300">
            ||||| | |||| ||| |||||| | ||| |||||
          </div>
          <div>{isBengali ? 'কেয়ারব্রিজ এআই কেন্দ্রীয় সার্ভার কর্তৃক অনুমোদিত' : 'Authorized by CareBridge AI Core'}</div>
        </div>
      </div>

      {/* Action Buttons (Hidden on Print) */}
      <div className="flex items-center justify-end gap-3 print:hidden">
        <button
          type="button"
          onClick={handlePrint}
          className="px-4 py-2.5 bg-surface-100 hover:bg-surface-200 dark:bg-[#1E2634] dark:hover:bg-[#283244] text-surface-800 dark:text-white rounded-xl text-sm font-medium flex items-center gap-2 transition-all shadow-sm"
        >
          <Printer className="w-4 h-4" />
          {t('printReceiptBtn')}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-medium shadow-md shadow-primary-500/20 flex items-center gap-2 transition-all"
        >
          <CheckCircle className="w-4 h-4" />
          {t('doneBtn')}
        </button>
      </div>
    </motion.div>
  );
}
