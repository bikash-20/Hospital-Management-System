import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  registerPatientApi,
  checkDuplicatePatientApi,
  getPatientsApi,
} from '@/api/mockApi';
import type { Patient, PatientGender } from '@/types';
import {
  UserPlus,
  Search,
  AlertTriangle,
  X,
  Check,
  Phone,
  Calendar,
  MapPin,
  CreditCard,
  Users,
} from 'lucide-react';

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

  const { data: patientsData, isLoading } = useQuery({
    queryKey: ['patients', searchQuery],
    queryFn: () => getPatientsApi(0, 20, searchQuery || undefined),
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
  };

  const handleDuplicateCheck = async () => {
    if (form.mobileNumber && form.dob) {
      const existing = await checkDuplicatePatientApi(form.mobileNumber, form.dob);
      if (existing) {
        setDuplicateWarning(existing);
      }
    }
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
            Patient Registration
          </h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1">
            Register new patients or search existing records
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-medium transition-all shadow-lg shadow-primary-600/25 hover:shadow-primary-500/40"
        >
          <UserPlus className="w-5 h-5" />
          New Patient
        </button>
      </div>

      {/* Success Message */}
      {formSuccess && (
        <div className="p-4 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2">
          <div className="p-1 bg-green-500/20 rounded-full">
            <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-green-800 dark:text-green-300">
              Patient registered successfully
            </p>
            <p className="text-xs text-green-600 dark:text-green-400/70">
              UHID: {formSuccess.uhid} — {formSuccess.fullName}
            </p>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
        <input
          type="text"
          placeholder="Search by name, UHID, or mobile number..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl text-surface-900 dark:text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
        />
      </div>

      {/* Patient List */}
      <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-700/50 overflow-hidden">
        <div className="p-4 border-b border-surface-100 dark:border-surface-700/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-surface-400" />
            <span className="text-sm font-medium text-surface-600 dark:text-surface-300">
              {patientsData?.totalElements ?? 0} patients found
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-100 dark:border-surface-700/50">
                <th className="text-left text-xs font-medium text-surface-500 uppercase tracking-wider px-4 py-3">
                  UHID
                </th>
                <th className="text-left text-xs font-medium text-surface-500 uppercase tracking-wider px-4 py-3">
                  Patient Name
                </th>
                <th className="text-left text-xs font-medium text-surface-500 uppercase tracking-wider px-4 py-3">
                  Mobile
                </th>
                <th className="text-left text-xs font-medium text-surface-500 uppercase tracking-wider px-4 py-3">
                  DOB
                </th>
                <th className="text-left text-xs font-medium text-surface-500 uppercase tracking-wider px-4 py-3">
                  Gender
                </th>
                <th className="text-left text-xs font-medium text-surface-500 uppercase tracking-wider px-4 py-3">
                  Address
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-surface-400">
                    Loading patients...
                  </td>
                </tr>
              ) : patientsData?.content.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-surface-400">
                    No patients found
                  </td>
                </tr>
              ) : (
                patientsData?.content.map((patient) => (
                  <tr
                    key={patient.id}
                    className="border-b border-surface-50 dark:border-surface-800/50 hover:bg-surface-50 dark:hover:bg-surface-800/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono bg-primary-500/10 text-primary-600 dark:text-primary-400 px-2 py-1 rounded-md">
                        {patient.uhid}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-surface-900 dark:text-white">
                        {patient.fullName}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-surface-600 dark:text-surface-300">
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Registration Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-700 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-surface-100 dark:border-surface-700/50 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-surface-900 dark:text-white">
                  Register New Patient
                </h2>
                <p className="text-sm text-surface-500 mt-0.5">
                  Fill in patient details below
                </p>
              </div>
              <button
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                  setDuplicateWarning(null);
                }}
                className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Duplicate Warning */}
              {duplicateWarning && (
                <div className="p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                      Duplicate Patient Found
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-400/70 mt-0.5">
                      A patient with this mobile number and DOB already exists:{' '}
                      <span className="font-medium">{duplicateWarning.fullName}</span> (UHID:{' '}
                      {duplicateWarning.uhid})
                    </p>
                  </div>
                </div>
              )}

              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="w-full px-4 py-2.5 bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl text-surface-900 dark:text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
                  placeholder="Enter full name"
                  required
                  autoFocus
                />
              </div>

              {/* Mobile + DOB */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                    <Phone className="w-3.5 h-3.5 inline mr-1" />
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    value={form.mobileNumber}
                    onChange={(e) => setForm({ ...form, mobileNumber: e.target.value })}
                    onBlur={handleDuplicateCheck}
                    className="w-full px-4 py-2.5 bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl text-surface-900 dark:text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
                    placeholder="01XXXXXXXXX"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                    <Calendar className="w-3.5 h-3.5 inline mr-1" />
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    value={form.dob}
                    onChange={(e) => setForm({ ...form, dob: e.target.value })}
                    onBlur={handleDuplicateCheck}
                    className="w-full px-4 py-2.5 bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
                    required
                  />
                </div>
              </div>

              {/* Gender */}
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                  Gender *
                </label>
                <div className="flex gap-3">
                  {genderOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setForm({ ...form, gender: opt.value })}
                      className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                        form.gender === opt.value
                          ? 'bg-primary-500/15 border-primary-500/50 text-primary-600 dark:text-primary-400'
                          : 'bg-surface-50 dark:bg-surface-800 border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-400 hover:border-surface-300 dark:hover:border-surface-600'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* NID */}
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                  <CreditCard className="w-3.5 h-3.5 inline mr-1" />
                  NID Number
                </label>
                <input
                  type="text"
                  value={form.nid}
                  onChange={(e) => setForm({ ...form, nid: e.target.value })}
                  className="w-full px-4 py-2.5 bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl text-surface-900 dark:text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
                  placeholder="National ID number"
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                  <MapPin className="w-3.5 h-3.5 inline mr-1" />
                  Address
                </label>
                <textarea
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2.5 bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl text-surface-900 dark:text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all resize-none"
                  placeholder="Full address"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                    setDuplicateWarning(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-800 font-medium transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={registerMutation.isPending}
                  className="flex-1 py-2.5 bg-primary-600 hover:bg-primary-500 disabled:bg-primary-600/50 text-white rounded-xl font-medium transition-all shadow-lg shadow-primary-600/25"
                >
                  {registerMutation.isPending ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
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
        </div>
      )}
    </div>
  );
}
