import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createBedBookingApi } from '@/api/api';
import type { BedType, BedBookingRequest, BedBookingResponse, PaymentMethod } from '@/types';
import MfsPaymentModal from './MfsPaymentModal';
import DigitalAdmissionReceipt from './DigitalAdmissionReceipt';
import {
  BedDouble,
  HeartPulse,
  Home,
  Activity,
  X,
  CreditCard,
  AlertCircle,
} from 'lucide-react';

interface SeatBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultBedType?: BedType;
}

export default function SeatBookingModal({
  isOpen,
  onClose,
  defaultBedType = 'ICU',
}: SeatBookingModalProps) {
  const { t, isBengali } = useLanguage();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<'FORM' | 'RECEIPT'>('FORM');
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

  // Form State
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestNid, setGuestNid] = useState('');
  const [guestAge, setGuestAge] = useState<number>(35);
  const [guestGender, setGuestGender] = useState('MALE');
  const [bedType, setBedType] = useState<BedType>(defaultBedType);
  const [symptoms, setSymptoms] = useState('');
  const [formError, setFormError] = useState('');

  // Confirmed booking response
  const [confirmedBooking, setConfirmedBooking] = useState<BedBookingResponse | null>(null);

  const bedTypePricing: Record<BedType, { rate: number; icon: typeof Activity; desc: string }> = {
    ICU: { rate: 5000, icon: HeartPulse, desc: isBengali ? 'ভেন্টিলেটর ও সার্বক্ষণিক কার্ডিয়াক সাপোর্ট' : 'Ventilator & continuous cardiac monitoring' },
    EMERGENCY: { rate: 2500, icon: Activity, desc: isBengali ? 'ট্রমা কেয়ার ও তাৎক্ষণিক ট্রায়াজ বেড' : 'Immediate trauma & critical triage stabilization' },
    CABIN: { rate: 3500, icon: Home, desc: isBengali ? 'এসি, ব্যক্তিগত বাথরুম ও রোগীর পরিচারক সুবিধা' : 'Private AC room with attendant amenities' },
    GENERAL: { rate: 800, icon: BedDouble, desc: isBengali ? 'সাধারণ ওয়ার্ডে সার্বক্ষণিক নার্সিং কেয়ার' : 'Spacious ward with 24/7 on-call nursing' },
  };

  const bookingMutation = useMutation({
    mutationFn: (req: BedBookingRequest) => createBedBookingApi(req),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['seat-availability'] });
      queryClient.invalidateQueries({ queryKey: ['beds'] });
      setConfirmedBooking(data);
      setStep('RECEIPT');
    },
    onError: (err: unknown) => {
      setFormError(err instanceof Error ? err.message : 'Booking failed. Please try again.');
    },
  });

  if (!isOpen) return null;

  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!guestName.trim()) {
      setFormError(isBengali ? 'অনুগ্রহ করে রোগীর নাম লিখুন' : 'Patient full name is required');
      return;
    }
    if (!guestPhone.trim() || guestPhone.length < 10) {
      setFormError(isBengali ? 'সঠিক মোবাইল নম্বর লিখুন (১১ ডিজিট)' : 'Valid 11-digit mobile number is required');
      return;
    }
    setIsPaymentOpen(true);
  };

  const handlePaymentSuccess = (method: PaymentMethod, trxId: string) => {
    setIsPaymentOpen(false);
    const payload: BedBookingRequest = {
      guestName: guestName.trim(),
      guestPhone: guestPhone.trim(),
      guestNid: guestNid.trim() || undefined,
      guestAge: Number(guestAge) || 30,
      guestGender,
      bedType,
      paymentMethod: method,
      paymentTrxId: trxId,
      paymentAmount: bedTypePricing[bedType].rate,
      symptoms: symptoms.trim() || undefined,
    };
    bookingMutation.mutate(payload);
  };

  const handleModalClose = () => {
    setStep('FORM');
    setConfirmedBooking(null);
    onClose();
  };

  return (
    <>
      <AnimatePresence>
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-2xl bg-white dark:bg-[#151B26] border border-surface-200 dark:border-[#2A3441] rounded-2xl shadow-2xl overflow-hidden my-8"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-surface-100 dark:border-[#2A3441] flex items-center justify-between bg-surface-50/50 dark:bg-[#111820]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary-600/10 text-primary-600 dark:text-primary-400 flex items-center justify-center">
                  <BedDouble className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-surface-900 dark:text-white">
                    {step === 'RECEIPT' ? t('receiptTitle') : t('bookingModalTitle')}
                  </h3>
                  <p className="text-xs text-surface-500 dark:text-surface-400">
                    {step === 'RECEIPT' ? t('receiptSubtitle') : t('bookingModalSub')}
                  </p>
                </div>
              </div>
              <button
                onClick={handleModalClose}
                className="p-1.5 rounded-lg text-surface-400 hover:text-surface-700 dark:hover:text-white hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              {step === 'RECEIPT' && confirmedBooking ? (
                <DigitalAdmissionReceipt booking={confirmedBooking} onDone={handleModalClose} />
              ) : (
                <form onSubmit={handleProceedToPayment} className="space-y-6">
                  {formError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs rounded-xl flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {formError}
                    </div>
                  )}

                  {/* Bed Category Selector */}
                  <div>
                    <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 uppercase tracking-wider mb-2">
                      {t('selectedCategoryLabel')}
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {(Object.keys(bedTypePricing) as BedType[]).map((type) => {
                        const Icon = bedTypePricing[type].icon;
                        const isSelected = bedType === type;
                        return (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setBedType(type)}
                            className={`p-3 rounded-xl border text-left transition-all relative ${
                              isSelected
                                ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-950/20 ring-2 ring-primary-500/20'
                                : 'border-surface-200 dark:border-[#2A3441] hover:bg-surface-50 dark:hover:bg-[#1A2230]'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <Icon className={`w-4 h-4 ${isSelected ? 'text-primary-600 dark:text-primary-400' : 'text-surface-400'}`} />
                              <span className="text-xs font-bold text-surface-900 dark:text-white">
                                ৳ {bedTypePricing[type].rate}
                              </span>
                            </div>
                            <div className="font-semibold text-xs text-surface-900 dark:text-white">
                              {type}
                            </div>
                            <div className="text-[10px] text-surface-400 mt-1 line-clamp-1">
                              {bedTypePricing[type].desc}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Patient Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-surface-700 dark:text-surface-300 mb-1">
                        {t('patientNameLabel')} *
                      </label>
                      <input
                        type="text"
                        required
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        placeholder="E.g. Mohammed Rahman"
                        className="w-full px-3 py-2 bg-surface-50 dark:bg-[#111820] border border-surface-200 dark:border-[#2A3441] rounded-xl text-sm text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-surface-700 dark:text-surface-300 mb-1">
                        {t('patientPhoneLabel')} *
                      </label>
                      <input
                        type="tel"
                        required
                        value={guestPhone}
                        onChange={(e) => setGuestPhone(e.target.value)}
                        placeholder="017XXXXXXXX"
                        className="w-full px-3 py-2 bg-surface-50 dark:bg-[#111820] border border-surface-200 dark:border-[#2A3441] rounded-xl text-sm text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-surface-700 dark:text-surface-300 mb-1">
                          {t('patientAgeLabel')}
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={120}
                          value={guestAge}
                          onChange={(e) => setGuestAge(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-surface-50 dark:bg-[#111820] border border-surface-200 dark:border-[#2A3441] rounded-xl text-sm text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-surface-700 dark:text-surface-300 mb-1">
                          {t('patientGenderLabel')}
                        </label>
                        <select
                          value={guestGender}
                          onChange={(e) => setGuestGender(e.target.value)}
                          className="w-full px-3 py-2 bg-surface-50 dark:bg-[#111820] border border-surface-200 dark:border-[#2A3441] rounded-xl text-sm text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                        >
                          <option value="MALE">{t('genderMale')}</option>
                          <option value="FEMALE">{t('genderFemale')}</option>
                          <option value="OTHER">{t('genderOther')}</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-surface-700 dark:text-surface-300 mb-1">
                        {t('patientNidLabel')}
                      </label>
                      <input
                        type="text"
                        value={guestNid}
                        onChange={(e) => setGuestNid(e.target.value)}
                        placeholder="NID / BRC Number"
                        className="w-full px-3 py-2 bg-surface-50 dark:bg-[#111820] border border-surface-200 dark:border-[#2A3441] rounded-xl text-sm text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                      />
                    </div>
                  </div>

                  {/* Medical Symptoms */}
                  <div>
                    <label className="block text-xs font-medium text-surface-700 dark:text-surface-300 mb-1">
                      {t('symptomsLabel')}
                    </label>
                    <textarea
                      rows={2}
                      value={symptoms}
                      onChange={(e) => setSymptoms(e.target.value)}
                      placeholder={t('symptomsPlaceholder')}
                      className="w-full px-3 py-2 bg-surface-50 dark:bg-[#111820] border border-surface-200 dark:border-[#2A3441] rounded-xl text-sm text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 resize-none"
                    />
                  </div>

                  {/* Pricing Summary & Submit */}
                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-surface-100 dark:border-[#2A3441]">
                    <div>
                      <span className="text-xs text-surface-500">{isBengali ? 'প্রারম্ভিক ডিপোজিট' : 'Standard Deposit'}:</span>
                      <div className="text-lg font-bold text-surface-900 dark:text-white">
                        ৳ {bedTypePricing[bedType].rate.toLocaleString()}
                        <span className="text-xs font-normal text-surface-400 ml-1">{t('perDay')}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={handleModalClose}
                        className="flex-1 sm:flex-none px-4 py-2.5 text-sm text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white transition-colors"
                      >
                        {t('closeBtn')}
                      </button>
                      <button
                        type="submit"
                        className="flex-1 sm:flex-none px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-primary-500/20 flex items-center justify-center gap-2 transition-all"
                      >
                        <CreditCard className="w-4 h-4" />
                        {t('nextToPayment')}
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      </AnimatePresence>

      {/* MFS Payment Modal */}
      <MfsPaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        amount={bedTypePricing[bedType].rate}
        bedType={bedType}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </>
  );
}
