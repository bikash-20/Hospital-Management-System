import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { registerPatientApi, getPatientsApi } from '@/api/api';
import type { Patient, PatientGender } from '@/types';
import {
  UserPlus,
  Search,
  AlertTriangle,
  X,
  Check,
  Users,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { StaggerContainer, StaggerItem } from '@/components/ui/motion';

export default function PatientRegistration() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<Patient | null>(null);
  const [formSuccess, setFormSuccess] = useState<Patient | null>(null);

  const [form, setForm] = useState({
    fullName: '',
    mobileNumber: '',
    dob: '',
    gender: '' as PatientGender | '',
    nid: '',
    address: '',
  });

  const { data: patients, isLoading } = useQuery({
    queryKey: ['patients', searchQuery],
    queryFn: () => getPatientsApi(searchQuery || undefined),
  });

  const registerMutation = useMutation({
    mutationFn: registerPatientApi,
    onSuccess: (newPatient) => {
      setFormSuccess(newPatient);
      setShowForm(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      setTimeout(() => setFormSuccess(null), 5000);
    },
  });

  const resetForm = () => {
    setForm({ fullName: '', mobileNumber: '', dob: '', gender: '', nid: '', address: '' });
    setDuplicateWarning(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.mobileNumber || !form.dob || !form.gender) return;
    registerMutation.mutate({
      fullName: form.fullName,
      mobileNumber: form.mobileNumber,
      dob: form.dob,
      gender: form.gender as PatientGender,
      nid: form.nid,
      address: form.address,
    });
  };

  const genderOptions: { value: PatientGender; label: string }[] = [
    { value: 'MALE', label: 'Male' },
    { value: 'FEMALE', label: 'Female' },
    { value: 'OTHER', label: 'Other' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-display text-surface-900 dark:text-white">
            Patient Registration
          </h1>
          <p className="text-body text-surface-500 dark:text-surface-400 mt-1">
            Register new patients or search existing records
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-medium transition-all shadow-lg shadow-primary-600/20 hover:shadow-primary-500/30 focus-ring"
          style={{ minHeight: '44px' }}
        >
          <UserPlus className="w-5 h-5" aria-hidden="true" />
          New Patient
        </button>
      </div>

      {/* Success Message */}
      <AnimatePresence>
        {formSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className="p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/25 rounded-xl flex items-center gap-3"
          >
            <div className="p-1 bg-emerald-500/20 rounded-full shrink-0">
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                Patient registered successfully
              </p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400/70">
                UHID: {formSuccess.uhid} — {formSuccess.fullName}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" aria-hidden="true" />
        <input
          type="text"
          placeholder="Search by name, UHID, or mobile number..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 card border-0 text-surface-900 dark:text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all"
          aria-label="Search patients"
        />
      </div>

      {/* Patient List */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-surface-100 dark:border-[#2A2F38] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-surface-400" aria-hidden="true" />
            <span className="text-sm font-medium text-surface-600 dark:text-surface-300">
              {patients?.length ?? 0} patients found
            </span>
          </div>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-100 dark:border-[#2A2F38]">
                <th className="text-left text-xs font-medium text-surface-500 uppercase tracking-wider px-4 py-3">UHID</th>
                <th className="text-left text-xs font-medium text-surface-500 uppercase tracking-wider px-4 py-3">Patient Name</th>
                <th className="text-left text-xs font-medium text-surface-500 uppercase tracking-wider px-4 py-3">Mobile</th>
                <th className="text-left text-xs font-medium text-surface-500 uppercase tracking-wider px-4 py-3">DOB</th>
                <th className="text-left text-xs font-medium text-surface-500 uppercase tracking-wider px-4 py-3">Gender</th>
                <th className="text-left text-xs font-medium text-surface-500 uppercase tracking-wider px-4 py-3">Address</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8">
                    <div className="space-y-3">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex items-center gap-4">
                          <div className="skeleton w-24 h-6 rounded" />
                          <div className="skeleton w-40 h-5 rounded" />
                          <div className="skeleton w-28 h-5 rounded" />
                          <div className="skeleton w-24 h-5 rounded" />
                          <div className="skeleton w-16 h-5 rounded" />
                          <div className="skeleton flex-1 h-5 rounded" />
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              ) : !patients || patients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <Users className="w-12 h-12 text-surface-300 dark:text-surface-600 mx-auto mb-3" />
                    <p className="text-sm font-medium text-surface-500">No patients found</p>
                    <p className="text-xs text-surface-400 mt-1">
                      {searchQuery ? 'Try a different search term' : 'Register your first patient to get started'}
                    </p>
                  </td>
                </tr>
              ) : (
                <StaggerContainer>
                  {patients.map((patient) => (
                    <StaggerItem key={patient.id}>
                      <tr className="border-b border-surface-50 dark:border-[#1A1F26] table-row-hover">
                        <td className="px-4 py-3">
                          <span className="text-xs font-mono bg-primary-500/10 text-primary-600 dark:text-primary-400 px-2 py-1 rounded-md font-tabular">
                            {patient.uhid}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium text-surface-900 dark:text-white">
                            {patient.fullName}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-surface-600 dark:text-surface-300 font-tabular">
                            {patient.mobileNumber}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-surface-600 dark:text-surface-300">
                            {new Date(patient.dob).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-surface-600 dark:text-surface-300">
                            {patient.gender}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-surface-500 truncate max-w-[200px] block">
                            {patient.address}
                          </span>
                        </td>
                      </tr>
                    </StaggerItem>
                  ))}
                </StaggerContainer>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile card view */}
        <div className="md:hidden">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card-flat p-4 space-y-2">
                  <div className="skeleton w-32 h-5 rounded" />
                  <div className="skeleton w-48 h-4 rounded" />
                  <div className="skeleton w-28 h-4 rounded" />
                </div>
              ))}
            </div>
          ) : !patients || patients.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="w-12 h-12 text-surface-300 dark:text-surface-600 mx-auto mb-3" />
              <p className="text-sm font-medium text-surface-500">No patients found</p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {patients.map((patient) => (
                <div key={patient.id} className="card-flat p-4">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs font-mono bg-primary-500/10 text-primary-600 dark:text-primary-400 px-2 py-1 rounded-md font-tabular">
                      {patient.uhid}
                    </span>
                    <span className="text-xs text-surface-400">{patient.gender}</span>
                  </div>
                  <p className="text-sm font-medium text-surface-900 dark:text-white mb-1">
                    {patient.fullName}
                  </p>
                  <p className="text-xs text-surface-500 font-tabular">{patient.mobileNumber}</p>
                  <p className="text-xs text-surface-500 mt-1">
                    DOB: {new Date(patient.dob).toLocaleDateString()}
                  </p>
                  {patient.address && (
                    <p className="text-xs text-surface-400 mt-1 truncate">{patient.address}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Registration Form Modal */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={() => { setShowForm(false); resetForm(); }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
            >
              <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label="Register new patient"
              >
                <div className="p-5 sm:p-6 border-b border-surface-100 dark:border-[#2A2F38] flex items-center justify-between">
                  <div>
                    <h2 className="text-heading text-surface-900 dark:text-white">
                      Register New Patient
                    </h2>
                    <p className="text-caption text-surface-500 mt-0.5">
                      Fill in patient details below
                    </p>
                  </div>
                  <button
                    onClick={() => { setShowForm(false); resetForm(); }}
                    className="p-2.5 rounded-xl hover:bg-surface-100 dark:hover:bg-white/5 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 transition-colors focus-ring"
                    style={{ minWidth: '44px', minHeight: '44px' }}
                    aria-label="Close dialog"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
                  {/* Duplicate Warning */}
                  {duplicateWarning && (
                    <div className="p-3 bg-amber-50 dark:bg-amber-500/8 border border-amber-200 dark:border-amber-500/20 rounded-xl flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" aria-hidden="true" />
                      <div>
                        <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                          Duplicate Patient Found
                        </p>
                        <p className="text-xs text-amber-600 dark:text-amber-400/70 mt-0.5">
                          A patient with this mobile number and DOB already exists:{' '}
                          <span className="font-medium">{duplicateWarning.fullName}</span> (UHID: {duplicateWarning.uhid})
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Full Name */}
                  <div>
                    <label htmlFor="patient-name" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                      Full Name *
                    </label>
                    <input
                      id="patient-name"
                      type="text"
                      value={form.fullName}
                      onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                      className="w-full px-4 py-2.5 bg-surface-50 dark:bg-[#111820] border border-surface-200 dark:border-[#2A2F38] rounded-xl text-surface-900 dark:text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
                      placeholder="Enter full name"
                      required
                      autoFocus
                    />
                  </div>

                  {/* Mobile + DOB */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="patient-mobile" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                        Mobile Number *
                      </label>
                      <input
                        id="patient-mobile"
                        type="tel"
                        value={form.mobileNumber}
                        onChange={(e) => setForm({ ...form, mobileNumber: e.target.value })}
                        className="w-full px-4 py-2.5 bg-surface-50 dark:bg-[#111820] border border-surface-200 dark:border-[#2A2F38] rounded-xl text-surface-900 dark:text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
                        placeholder="01XXXXXXXXX"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="patient-dob" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                        Date of Birth *
                      </label>
                      <input
                        id="patient-dob"
                        type="date"
                        value={form.dob}
                        onChange={(e) => setForm({ ...form, dob: e.target.value })}
                        className="w-full px-4 py-2.5 bg-surface-50 dark:bg-[#111820] border border-surface-200 dark:border-[#2A2F38] rounded-xl text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
                        required
                      />
                    </div>
                  </div>

                  {/* Gender */}
                  <div>
                    <fieldset>
                      <legend className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                        Gender *
                      </legend>
                      <div className="flex gap-3">
                        {genderOptions.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setForm({ ...form, gender: opt.value })}
                            className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all focus-ring ${
                              form.gender === opt.value
                                ? 'bg-primary-500/12 border-primary-500/40 text-primary-600 dark:text-primary-400'
                                : 'bg-surface-50 dark:bg-[#111820] border-surface-200 dark:border-[#2A2F38] text-surface-600 dark:text-surface-400 hover:border-surface-300 dark:hover:border-[#3A3F48]'
                            }`}
                            style={{ minHeight: '44px' }}
                            aria-pressed={form.gender === opt.value}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </fieldset>
                  </div>

                  {/* NID */}
                  <div>
                    <label htmlFor="patient-nid" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                      NID Number
                    </label>
                    <input
                      id="patient-nid"
                      type="text"
                      value={form.nid}
                      onChange={(e) => setForm({ ...form, nid: e.target.value })}
                      className="w-full px-4 py-2.5 bg-surface-50 dark:bg-[#111820] border border-surface-200 dark:border-[#2A2F38] rounded-xl text-surface-900 dark:text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
                      placeholder="National ID number"
                    />
                  </div>

                  {/* Address */}
                  <div>
                    <label htmlFor="patient-address" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                      Address
                    </label>
                    <textarea
                      id="patient-address"
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      rows={2}
                      className="w-full px-4 py-2.5 bg-surface-50 dark:bg-[#111820] border border-surface-200 dark:border-[#2A2F38] rounded-xl text-surface-900 dark:text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all resize-none"
                      placeholder="Full address"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => { setShowForm(false); resetForm(); }}
                      className="flex-1 py-2.5 rounded-xl border border-surface-200 dark:border-[#2A2F38] text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-white/5 font-medium transition-all focus-ring"
                      style={{ minHeight: '44px' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={registerMutation.isPending}
                      className="flex-1 py-2.5 bg-primary-600 hover:bg-primary-500 disabled:bg-primary-600/50 text-white rounded-xl font-medium transition-all shadow-lg shadow-primary-600/20 focus-ring"
                      style={{ minHeight: '44px' }}
                    >
                      {registerMutation.isPending ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Registering...
                        </span>
                      ) : (
                        'Register Patient'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
