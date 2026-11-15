import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createPublicAppointmentApi, getPublicDoctorsApi, getSeatAvailabilityApi } from '@/api/api';
import type { PublicAppointmentRequest, PublicAppointmentResponse } from '@/types';
import DigitalAppointmentReceipt from './DigitalAppointmentReceipt';
import {
  Calendar,
  Clock,
  Stethoscope,
  X,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface DoctorAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDoctorId?: string;
}

export default function DoctorAppointmentModal({
  isOpen,
  onClose,
  defaultDoctorId,
}: DoctorAppointmentModalProps) {
  const { isBengali } = useLanguage();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<'FORM' | 'RECEIPT'>('FORM');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(defaultDoctorId || '');

  // Quick date selection
  const [dateOption, setDateOption] = useState<'TODAY' | 'TOMORROW' | 'CUSTOM'>('TODAY');
  const [customDate, setCustomDate] = useState<string>(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('10:00');

  // Patient details
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [patientAge, setPatientAge] = useState<number>(30);
  const [patientGender, setPatientGender] = useState('MALE');
  const [patientNid, setPatientNid] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [formError, setFormError] = useState('');

  const [confirmedAppt, setConfirmedAppt] = useState<PublicAppointmentResponse | null>(null);

  // Fetch active doctors
  const { data: doctorsData } = useQuery({
    queryKey: ['public-doctors'],
    queryFn: async () => {
      try {
        const res = await getPublicDoctorsApi();
        if (res && res.length > 0) return res;
      } catch {
        // Fallback to availability activeDoctors
      }
      const avail = await getSeatAvailabilityApi();
      return avail.activeDoctors;
    },
  });

  const doctors = useMemo(() => doctorsData || [], [doctorsData]);

  // Set default doctor once loaded if none set
  if (!selectedDoctorId && doctors.length > 0) {
    setSelectedDoctorId(doctors[0].id);
  }

  const timeSlots = [
    { time: '10:00', label: isBengali ? 'সকাল ১০:০০ টা' : '10:00 AM' },
    { time: '11:30', label: isBengali ? 'সকাল ১১:৩০ টা' : '11:30 AM' },
    { time: '14:30', label: isBengali ? 'দুপুর ০২:৩০ টা' : '02:30 PM' },
    { time: '16:00', label: isBengali ? 'বিকাল ০৪:০০ টা' : '04:00 PM' },
    { time: '18:30', label: isBengali ? 'সন্ধ্যা ০৬:৩০ টা' : '06:30 PM' },
    { time: '20:00', label: isBengali ? 'রাত ০৮:০০ টা' : '08:00 PM' },
  ];

  const appointmentMutation = useMutation({
    mutationFn: (req: PublicAppointmentRequest) => createPublicAppointmentApi(req),
    onSuccess: (data) => {
      // Invalidate all related queues across doctor and admin dashboards
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['today-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['patients-all'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      // Notify staff panels immediately
      window.dispatchEvent(new CustomEvent('new-hospital-booking', { detail: data }));
      setConfirmedAppt(data);
      setStep('RECEIPT');
    },
    onError: (err: unknown) => {
      setFormError(err instanceof Error ? err.message : 'Appointment booking failed. Please try again.');
    },
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!selectedDoctorId) {
      setFormError(isBengali ? 'অনুগ্রহ করে একজন চিকিৎসক নির্বাচন করুন' : 'Please select a consulting doctor');
      return;
    }
    if (!patientName.trim()) {
      setFormError(isBengali ? 'রোগীর পূর্ণ নাম প্রদান করুন' : 'Patient full name is required');
      return;
    }
    if (!patientPhone.trim() || patientPhone.length < 10) {
      setFormError(isBengali ? 'সঠিক ১১-ডিজিটের মোবাইল নম্বর প্রদান করুন' : 'Valid mobile number is required');
      return;
    }

    // Determine target ISO date string
    let dateStr = customDate;
    if (dateOption === 'TODAY') {
      const d = new Date();
      dateStr = d.toISOString().split('T')[0];
    } else if (dateOption === 'TOMORROW') {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      dateStr = d.toISOString().split('T')[0];
    }

    const fullIsoDate = `${dateStr}T${selectedTimeSlot}:00`;

    const payload: PublicAppointmentRequest = {
      doctorId: selectedDoctorId,
      patientName: patientName.trim(),
      patientPhone: patientPhone.trim(),
      patientAge: Number(patientAge) || 30,
      patientGender,
      patientNid: patientNid.trim() || undefined,
      appointmentDate: fullIsoDate,
      symptoms: symptoms.trim() || undefined,
    };

    appointmentMutation.mutate(payload);
  };

  const handleModalClose = () => {
    setStep('FORM');
    setFormError('');
    setConfirmedAppt(null);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleModalClose}
          className="fixed inset-0 bg-black/75 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          className="relative w-full max-w-2xl bg-white dark:bg-[#141B24] border border-surface-200 dark:border-[#273447] rounded-3xl shadow-2xl overflow-hidden my-8 z-10"
        >
          {/* Header */}
          <div className="p-6 border-b border-surface-200 dark:border-[#273447] flex items-center justify-between bg-surface-50/50 dark:bg-[#0E1520]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-500/10 border border-primary-500/20 text-primary-600 dark:text-primary-400 flex items-center justify-center">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-surface-900 dark:text-white flex items-center gap-2">
                  {isBengali ? 'বিশেষজ্ঞ ডাক্তার অ্যাপয়েন্টমেন্ট বুকিং' : 'Book Specialist Doctor Appointment'}
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                    OPD QUEUE
                  </span>
                </h3>
                <p className="text-xs text-surface-500 dark:text-surface-400">
                  {isBengali ? 'তাৎক্ষণিক সিরিয়াল টোকেন ও ডিজিটাল প্রেসক্রিপশন প্রস্তুতি' : 'Instant serial token with automated doctor queue registration'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleModalClose}
              className="p-2 rounded-xl text-surface-400 hover:text-surface-600 dark:hover:text-white hover:bg-surface-100 dark:hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 max-h-[75vh] overflow-y-auto">
            {step === 'RECEIPT' && confirmedAppt ? (
              <DigitalAppointmentReceipt appointment={confirmedAppt} onDone={handleModalClose} />
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {formError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {formError}
                  </div>
                )}

                {/* Doctor Selector */}
                <div>
                  <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 uppercase tracking-wider mb-2.5">
                    {isBengali ? 'পরামর্শক বিশেষজ্ঞ নির্বাচন করুন *' : 'Select Consulting Specialist *'}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {doctors.map((doc) => {
                      const isSelected = selectedDoctorId === doc.id;
                      return (
                        <button
                          key={doc.id}
                          type="button"
                          onClick={() => setSelectedDoctorId(doc.id)}
                          className={`p-3.5 rounded-2xl border text-left transition-all relative flex items-start gap-3 ${
                            isSelected
                              ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-950/20 ring-2 ring-primary-500/25'
                              : 'border-surface-200 dark:border-[#273447] hover:bg-surface-50 dark:hover:bg-[#1A2332]'
                          }`}
                        >
                          <div className="w-9 h-9 rounded-xl bg-primary-500/10 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0">
                            <Stethoscope className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs sm:text-sm text-surface-900 dark:text-white truncate">
                                {doc.name}
                              </span>
                              {isSelected && (
                                <CheckCircle2 className="w-4 h-4 text-primary-500 shrink-0" />
                              )}
                            </div>
                            <div className="text-[11px] text-surface-500 mt-0.5 truncate">
                              {doc.specialization}
                            </div>
                            <div className="mt-1 flex items-center gap-1.5 text-[10px]">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                                {isBengali ? 'চেম্বার খোলা' : 'Chamber Active'}
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Date & Shift Schedule */}
                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 uppercase tracking-wider">
                    {isBengali ? 'অ্যাপয়েন্টমেন্টের দিন ও শিফট *' : 'Appointment Schedule & Shift *'}
                  </label>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setDateOption('TODAY')}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                        dateOption === 'TODAY'
                          ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                          : 'border-surface-200 dark:border-[#273447] text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-white/5'
                      }`}
                    >
                      {isBengali ? 'আজকের সিরিয়াল' : 'Today'}
                    </button>

                    <button
                      type="button"
                      onClick={() => setDateOption('TOMORROW')}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                        dateOption === 'TOMORROW'
                          ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                          : 'border-surface-200 dark:border-[#273447] text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-white/5'
                      }`}
                    >
                      {isBengali ? 'আগামীকাল' : 'Tomorrow'}
                    </button>

                    <button
                      type="button"
                      onClick={() => setDateOption('CUSTOM')}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                        dateOption === 'CUSTOM'
                          ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                          : 'border-surface-200 dark:border-[#273447] text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-white/5'
                      }`}
                    >
                      {isBengali ? 'নির্দিষ্ট তারিখ' : 'Pick Date'}
                    </button>

                    {dateOption === 'CUSTOM' && (
                      <input
                        type="date"
                        value={customDate}
                        onChange={(e) => setCustomDate(e.target.value)}
                        className="px-3 py-1.5 bg-surface-50 dark:bg-[#111820] border border-surface-200 dark:border-[#273447] rounded-xl text-xs text-surface-900 dark:text-white"
                      />
                    )}
                  </div>

                  {/* Time Slots */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                    {timeSlots.map((slot) => {
                      const isSelected = selectedTimeSlot === slot.time;
                      return (
                        <button
                          key={slot.time}
                          type="button"
                          onClick={() => setSelectedTimeSlot(slot.time)}
                          className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                            isSelected
                              ? 'bg-emerald-500/15 border-emerald-500 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/30'
                              : 'border-surface-200 dark:border-[#273447] text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-[#1A2332]'
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>{slot.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Patient Information */}
                <div className="space-y-4 pt-2 border-t border-surface-200/60 dark:border-[#273447]/60">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-surface-700 dark:text-surface-300 mb-1">
                        {isBengali ? 'রোগীর পূর্ণ নাম *' : 'Patient Full Name *'}
                      </label>
                      <input
                        type="text"
                        required
                        value={patientName}
                        onChange={(e) => setPatientName(e.target.value)}
                        placeholder="E.g. Mohammed Rahman"
                        className="w-full px-3.5 py-2.5 bg-surface-50 dark:bg-[#111820] border border-surface-200 dark:border-[#273447] rounded-xl text-sm text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-surface-700 dark:text-surface-300 mb-1">
                        {isBengali ? 'যোগাযোগের মোবাইল নম্বর (+৮৮০) *' : 'Mobile Number (+880) *'}
                      </label>
                      <input
                        type="tel"
                        required
                        value={patientPhone}
                        onChange={(e) => setPatientPhone(e.target.value)}
                        placeholder="017XXXXXXXX"
                        className="w-full px-3.5 py-2.5 bg-surface-50 dark:bg-[#111820] border border-surface-200 dark:border-[#273447] rounded-xl text-sm text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-surface-700 dark:text-surface-300 mb-1">
                        {isBengali ? 'বয়স' : 'Age'}
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={120}
                        value={patientAge}
                        onChange={(e) => setPatientAge(Number(e.target.value))}
                        className="w-full px-3.5 py-2 bg-surface-50 dark:bg-[#111820] border border-surface-200 dark:border-[#273447] rounded-xl text-sm text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-surface-700 dark:text-surface-300 mb-1">
                        {isBengali ? 'লিঙ্গ' : 'Gender'}
                      </label>
                      <select
                        value={patientGender}
                        onChange={(e) => setPatientGender(e.target.value)}
                        className="w-full px-3.5 py-2 bg-surface-50 dark:bg-[#111820] border border-surface-200 dark:border-[#273447] rounded-xl text-sm text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                      >
                        <option value="MALE">{isBengali ? 'পুরুষ' : 'Male'}</option>
                        <option value="FEMALE">{isBengali ? 'নারী' : 'Female'}</option>
                        <option value="OTHER">{isBengali ? 'অন্যান্য' : 'Other'}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-surface-700 dark:text-surface-300 mb-1">
                        {isBengali ? 'জাতীয় পরিচয়পত্র (ঐচ্ছিক)' : 'NID / BRC (Optional)'}
                      </label>
                      <input
                        type="text"
                        value={patientNid}
                        onChange={(e) => setPatientNid(e.target.value)}
                        placeholder="NID Number"
                        className="w-full px-3.5 py-2 bg-surface-50 dark:bg-[#111820] border border-surface-200 dark:border-[#273447] rounded-xl text-sm text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-surface-700 dark:text-surface-300 mb-1">
                      {isBengali ? 'রোগের প্রধান লক্ষণ বা চেকআপের কারণ' : 'Symptoms or Primary Reason for Visit'}
                    </label>
                    <textarea
                      rows={2}
                      value={symptoms}
                      onChange={(e) => setSymptoms(e.target.value)}
                      placeholder={isBengali ? 'যেমন: জ্বর, সর্দি, পেটে ব্যথা, বা রুটিন হেলথ চেকআপ...' : 'E.g. Fever, chronic cough, regular diabetes review...'}
                      className="w-full px-3.5 py-2 bg-surface-50 dark:bg-[#111820] border border-surface-200 dark:border-[#273447] rounded-xl text-sm text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 resize-none"
                    />
                  </div>
                </div>

                {/* Footer Submit */}
                <div className="pt-4 border-t border-surface-200 dark:border-[#273447] flex items-center justify-between">
                  <div className="text-xs text-surface-500 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-primary-500" />
                    <span>{isBengali ? 'স্বয়ংক্রিয় টোকেন ও ওপিডি কিউ সিঙ্ক' : 'Instant serial token & real-time queue sync'}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleModalClose}
                      className="px-4 py-2.5 rounded-xl border border-surface-200 dark:border-[#273447] text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-white/5 text-xs font-semibold transition-colors"
                    >
                      {isBengali ? 'বাতিল' : 'Cancel'}
                    </button>

                    <button
                      type="submit"
                      disabled={appointmentMutation.isPending}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold shadow-lg shadow-primary-600/25 transition-all disabled:opacity-50"
                    >
                      {appointmentMutation.isPending ? (
                        <span>{isBengali ? 'সিরিয়াল নির্ধারণ হচ্ছে...' : 'Confirming Serial...'}</span>
                      ) : (
                        <>
                          <Calendar className="w-4 h-4" />
                          <span>{isBengali ? 'সিরিয়াল নিশ্চিত করুন' : 'Confirm Appointment'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
