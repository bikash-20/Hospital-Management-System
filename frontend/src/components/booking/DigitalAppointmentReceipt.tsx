import { useRef } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';
import { Printer, CheckCircle, User, Phone, Stethoscope, Calendar, Clock, ShieldCheck } from 'lucide-react';
import type { PublicAppointmentResponse } from '@/types';

interface DigitalAppointmentReceiptProps {
  appointment: PublicAppointmentResponse;
  onDone: () => void;
}

export default function DigitalAppointmentReceipt({ appointment, onDone }: DigitalAppointmentReceiptProps) {
  const { isBengali } = useLanguage();
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = appointment.appointmentDate
    ? new Date(appointment.appointmentDate).toLocaleDateString(isBengali ? 'bn-BD' : 'en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Today';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-xl mx-auto space-y-4"
    >
      {/* Printable Voucher Card */}
      <div
        ref={receiptRef}
        className="bg-white dark:bg-[#151B26] border-2 border-emerald-500/30 rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden"
      >
        {/* Verification Ribbon */}
        <div className="absolute top-4 right-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5" />
          {isBengali ? 'সিরিয়াল নিশ্চিতকৃত' : 'APPOINTMENT CONFIRMED'}
        </div>

        {/* Hospital Branding Header */}
        <div className="flex items-center gap-3.5 border-b border-surface-200 dark:border-[#2A3441] pb-5 mb-5">
          <div className="w-13 h-13 rounded-2xl overflow-hidden shadow-md shadow-emerald-500/20 border border-emerald-500/30 shrink-0">
            <img src="/carebridge-logo.png" alt="CareBridge AI Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-surface-900 dark:text-white flex items-center gap-2">
              CareBridge <span className="text-primary-600 dark:text-primary-400">AI</span>
              <span className="text-xs px-2 py-0.5 rounded-md bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 font-mono">
                OPD CLINIC
              </span>
            </h2>
            <p className="text-xs text-surface-500 dark:text-surface-400">
              {isBengali ? 'ডিজিটাল ওপিডি কনসাল্টেশন স্লিপ ও কিউ টোকেন' : 'Digital OPD Consultation Voucher & Queue Slip'}
            </p>
          </div>
        </div>

        {/* Token Banner */}
        <div className="bg-gradient-to-r from-primary-600/15 via-emerald-500/15 to-primary-600/15 border-2 border-primary-500/40 p-4 rounded-2xl mb-6 text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-primary-600 dark:text-primary-400 block mb-1">
            {isBengali ? 'আপনার সিরিয়াল / কিউ টোকেন নম্বর' : 'YOUR QUEUE SERIAL TOKEN'}
          </span>
          <div className="text-4xl sm:text-5xl font-black font-mono text-surface-900 dark:text-white tracking-wider">
            #{String(appointment.tokenNumber).padStart(2, '0')}
          </div>
          <span className="inline-block mt-2 px-3 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
            {isBengali ? 'ডাক্তারের ওপিডি চেম্বার কিউ-তে যুক্ত' : 'Active in Doctor OPD Queue'}
          </span>
        </div>

        {/* Doctor & Appointment Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="p-3.5 bg-surface-50 dark:bg-[#111820] rounded-xl border border-surface-200 dark:border-[#2A3441]">
            <div className="flex items-center gap-2 text-xs font-semibold text-primary-600 dark:text-primary-400 mb-1">
              <Stethoscope className="w-4 h-4" />
              <span>{isBengali ? 'পরামর্শক চিকিৎসক' : 'Consulting Doctor'}</span>
            </div>
            <div className="font-bold text-sm text-surface-900 dark:text-white">
              {appointment.doctorName}
            </div>
            <div className="text-xs text-surface-500 mt-0.5">
              General Medicine & Clinical Specialist
            </div>
          </div>

          <div className="p-3.5 bg-surface-50 dark:bg-[#111820] rounded-xl border border-surface-200 dark:border-[#2A3441]">
            <div className="flex items-center gap-2 text-xs font-semibold text-primary-600 dark:text-primary-400 mb-1">
              <Calendar className="w-4 h-4" />
              <span>{isBengali ? 'তারিখ ও সময়' : 'Date & Schedule'}</span>
            </div>
            <div className="font-bold text-sm text-surface-900 dark:text-white">
              {formattedDate}
            </div>
            <div className="text-xs text-surface-500 mt-0.5 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{isBengali ? 'সময়মত উপস্থিত থাকুন' : 'Please arrive 15 min prior'}</span>
            </div>
          </div>
        </div>

        {/* Patient Information Section */}
        <div className="p-4 bg-surface-50 dark:bg-[#111820] rounded-xl border border-surface-200 dark:border-[#2A3441] mb-6 space-y-2.5">
          <div className="flex items-center justify-between text-xs border-b border-surface-200/50 dark:border-[#2A3441]/50 pb-2">
            <span className="text-surface-500 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> {isBengali ? 'রোগীর নাম' : 'Patient Name'}
            </span>
            <span className="font-bold text-surface-900 dark:text-white">{appointment.patientName}</span>
          </div>

          <div className="flex items-center justify-between text-xs border-b border-surface-200/50 dark:border-[#2A3441]/50 pb-2">
            <span className="text-surface-500">{isBengali ? 'ইউএইচআইডি (UHID)' : 'Hospital UHID'}</span>
            <span className="font-mono font-bold text-primary-600 dark:text-primary-400">{appointment.patientUhid}</span>
          </div>

          <div className="flex items-center justify-between text-xs border-b border-surface-200/50 dark:border-[#2A3441]/50 pb-2">
            <span className="text-surface-500 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" /> {isBengali ? 'মোবাইল নম্বর' : 'Phone'}
            </span>
            <span className="font-medium text-surface-900 dark:text-white">{appointment.patientPhone}</span>
          </div>

          <div className="flex items-center justify-between text-xs border-b border-surface-200/50 dark:border-[#2A3441]/50 pb-2">
            <span className="text-surface-500">{isBengali ? 'বয়স ও লিঙ্গ' : 'Age & Gender'}</span>
            <span className="font-medium text-surface-900 dark:text-white">
              {appointment.patientAge} Yrs • {appointment.patientGender}
            </span>
          </div>

          {appointment.symptoms && (
            <div className="text-xs pt-1">
              <span className="text-surface-500 block mb-0.5">{isBengali ? 'লক্ষণ / কারণ:' : 'Reason / Symptoms:'}</span>
              <span className="italic text-surface-700 dark:text-surface-300">{appointment.symptoms}</span>
            </div>
          )}
        </div>

        {/* QR Code and Check-in note */}
        <div className="flex items-center justify-between gap-4 p-3.5 rounded-xl bg-surface-100 dark:bg-white/5 border border-surface-200 dark:border-white/10 text-xs">
          <div className="space-y-1">
            <div className="font-semibold text-surface-900 dark:text-white">
              {isBengali ? 'ক্লিনিক কিয়স্ক চেক-ইন' : 'Kiosk Digital Check-In'}
            </div>
            <div className="text-[11px] text-surface-500">
              {isBengali
                ? 'হাসপাতালে এসে কিয়স্ক বা ওপিডি কাউন্টারে এই টোকেন দেখান।'
                : 'Scan token code upon arriving at hospital reception.'}
            </div>
          </div>
          <div className="font-mono text-[10px] px-2 py-1 bg-surface-200 dark:bg-white/10 rounded font-bold shrink-0">
            {appointment.qrData.slice(0, 18)}...
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-surface-200 dark:border-[#2A3441] text-surface-700 dark:text-surface-200 hover:bg-surface-100 dark:hover:bg-[#1A2230] text-sm font-semibold transition-colors"
        >
          <Printer className="w-4 h-4" />
          {isBengali ? 'স্লিপ প্রিন্ট করুন' : 'Print Slip'}
        </button>

        <button
          type="button"
          onClick={onDone}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold shadow-md shadow-primary-600/20 transition-all"
        >
          <CheckCircle className="w-4 h-4" />
          {isBengali ? 'সম্পন্ন' : 'Done'}
        </button>
      </div>
    </motion.div>
  );
}
