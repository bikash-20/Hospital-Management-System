import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAppointmentsApi,
  createAppointmentApi,
  getDoctorsApi,
  getPatientsApi,
} from '@/api/mockApi';
import {
  Plus,
  Filter,
  Clock,
  X,
} from 'lucide-react';

const statusColors: Record<string, string> = {
  WAITING: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  IN_CONSULTATION: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  COMPLETED: 'bg-green-500/10 text-green-600 dark:text-green-400',
  CANCELLED: 'bg-red-500/10 text-red-600 dark:text-red-400',
};

const statusLabels: Record<string, string> = {
  WAITING: 'Waiting',
  IN_CONSULTATION: 'In Consultation',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export default function Appointments() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: appointments, isLoading } = useQuery({
    queryKey: ['appointments', statusFilter],
    queryFn: () => getAppointmentsApi('2026-08-19', undefined, statusFilter || undefined),
  });

  const { data: doctors } = useQuery({
    queryKey: ['doctors'],
    queryFn: getDoctorsApi,
  });

  const { data: patientsData } = useQuery({
    queryKey: ['patients-all'],
    queryFn: () => getPatientsApi(0, 50),
  });

  const createMutation = useMutation({
    mutationFn: createAppointmentApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      setShowCreateModal(false);
    },
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Appointments</h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1">
            Manage patient appointments and scheduling
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-medium transition-all shadow-lg shadow-primary-600/25"
        >
          <Plus className="w-5 h-5" />
          New Appointment
        </button>
      </div>

      {/* Status Filter */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-surface-400" />
        <button
          onClick={() => setStatusFilter('')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            !statusFilter
              ? 'bg-primary-500/15 text-primary-600 dark:text-primary-400 border border-primary-500/30'
              : 'bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
          }`}
        >
          All
        </button>
        {Object.entries(statusLabels).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              statusFilter === key
                ? `${statusColors[key]} border border-current/20`
                : 'bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-700/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-100 dark:border-surface-700/50">
                <th className="text-left text-xs font-medium text-surface-500 uppercase tracking-wider px-4 py-3">Token</th>
                <th className="text-left text-xs font-medium text-surface-500 uppercase tracking-wider px-4 py-3">Patient</th>
                <th className="text-left text-xs font-medium text-surface-500 uppercase tracking-wider px-4 py-3">Doctor</th>
                <th className="text-left text-xs font-medium text-surface-500 uppercase tracking-wider px-4 py-3">Time</th>
                <th className="text-left text-xs font-medium text-surface-500 uppercase tracking-wider px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-surface-400">
                    Loading appointments...
                  </td>
                </tr>
              ) : appointments?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-surface-400">
                    No appointments found
                  </td>
                </tr>
              ) : (
                appointments?.map((apt) => (
                  <tr
                    key={apt.id}
                    className="border-b border-surface-50 dark:border-surface-800/50 hover:bg-surface-50 dark:hover:bg-surface-800/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="w-9 h-9 bg-primary-500/10 rounded-xl flex items-center justify-center text-sm font-bold text-primary-600 dark:text-primary-400">
                        #{apt.tokenNumber}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-surface-900 dark:text-white">{apt.patient.fullName}</p>
                      <p className="text-xs text-surface-500">{apt.patient.uhid}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-surface-600 dark:text-surface-300">{apt.doctor.fullName}</p>
                      <p className="text-xs text-surface-500">{apt.doctor.specialization}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-surface-600 dark:text-surface-300 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(apt.appointmentDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[apt.status]}`}>
                        {statusLabels[apt.status]}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-700 w-full max-w-md shadow-2xl">
            <div className="p-6 border-b border-surface-100 dark:border-surface-700/50 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-surface-900 dark:text-white">New Appointment</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const patient = patientsData?.content.find((p) => p.id === formData.get('patientId'));
                const doctor = doctors?.find((d) => d.id === formData.get('doctorId'));
                if (patient && doctor) {
                  createMutation.mutate({
                    patient,
                    doctor,
                    appointmentDate: new Date().toISOString(),
                  });
                }
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Patient</label>
                <select name="patientId" required className="w-full px-4 py-2.5 bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl text-sm text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50">
                  <option value="">Select patient</option>
                  {patientsData?.content.map((p) => (
                    <option key={p.id} value={p.id}>{p.fullName} ({p.uhid})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Doctor</label>
                <select name="doctorId" required className="w-full px-4 py-2.5 bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl text-sm text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50">
                  <option value="">Select doctor</option>
                  {doctors?.filter((d) => d.available).map((d) => (
                    <option key={d.id} value={d.id}>{d.fullName} — {d.specialization}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-800 font-medium transition-all">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-medium transition-all">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
