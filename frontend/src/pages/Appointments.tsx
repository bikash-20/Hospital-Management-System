import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAppointmentsApi,
  createAppointmentApi,
  getPatientsApi,
} from '@/api/api';
import type { AppointmentStatus } from '@/types';
import { useToast } from '@/context/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';
import { StaggerContainer, StaggerItem } from '@/components/ui/motion';
import {
  Plus,
  Filter,
  Clock,
  X,
  Calendar,
  ChevronDown,
} from 'lucide-react';

const statusColors: Record<string, string> = {
  WAITING: 'bg-status-waiting-bg text-amber-600 dark:text-amber-400 border border-status-waiting-border',
  IN_CONSULTATION: 'bg-status-consulting-bg text-blue-600 dark:text-blue-400 border border-status-consulting-border',
  COMPLETED: 'bg-status-completed-bg text-emerald-600 dark:text-emerald-400 border border-status-completed-border',
  CANCELLED: 'bg-status-cancelled-bg text-red-600 dark:text-red-400 border border-status-cancelled-border',
};

const statusLabels: Record<string, string> = {
  WAITING: 'Waiting',
  IN_CONSULTATION: 'In Consultation',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export default function Appointments() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | ''>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  const { data: appointments, isLoading } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => getAppointmentsApi(),
  });

  const { data: patients } = useQuery({
    queryKey: ['patients-all'],
    queryFn: () => getPatientsApi(),
  });

  const filtered = appointments?.filter(
    (a) => !statusFilter || a.status === statusFilter,
  );

  const createMutation = useMutation({
    mutationFn: createAppointmentApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      setShowCreateModal(false);
      showToast('Appointment created successfully', 'success');
    },
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-display text-surface-900 dark:text-white">Appointments</h1>
          <p className="text-body text-surface-500 dark:text-surface-400 mt-1">
            Manage patient appointments and scheduling
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-medium transition-all shadow-lg shadow-primary-600/20 focus-ring"
          style={{ minHeight: '44px' }}
        >
          <Plus className="w-5 h-5" aria-hidden="true" />
          New Appointment
        </button>
      </div>

      {/* Filter Bar — collapsible on mobile */}
      <div className="card p-3">
        <button
          onClick={() => setFiltersExpanded(!filtersExpanded)}
          className="flex items-center gap-2 text-sm font-medium text-surface-600 dark:text-surface-300 sm:hidden w-full"
          aria-expanded={filtersExpanded}
        >
          <Filter className="w-4 h-4" aria-hidden="true" />
          Filters
          <motion.div animate={{ rotate: filtersExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="w-4 h-4 ml-auto" />
          </motion.div>
        </button>

        <div className={`flex flex-wrap items-center gap-2 ${filtersExpanded ? 'mt-3' : ''} ${!filtersExpanded ? 'hidden sm:flex' : ''}`}>
          <Filter className="w-4 h-4 text-surface-400 hidden sm:block" aria-hidden="true" />
          <button
            onClick={() => setStatusFilter('')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all focus-ring ${
              !statusFilter
                ? 'bg-primary-500/12 text-primary-600 dark:text-primary-400 border border-primary-500/25'
                : 'card-flat text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
            }`}
            style={{ minHeight: '36px' }}
          >
            All
          </button>
          {Object.entries(statusLabels).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key as AppointmentStatus)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all focus-ring ${
                statusFilter === key
                  ? statusColors[key]
                  : 'card-flat text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
              }`}
              style={{ minHeight: '36px' }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-100 dark:border-[#2A2F38]">
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
                  <td colSpan={5} className="px-4 py-8">
                    <div className="space-y-3">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex items-center gap-4">
                          <div className="skeleton w-10 h-10 rounded-xl" />
                          <div className="skeleton w-32 h-5 rounded" />
                          <div className="skeleton w-28 h-5 rounded" />
                          <div className="skeleton w-20 h-5 rounded" />
                          <div className="skeleton w-24 h-6 rounded-full" />
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              ) : !filtered || filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <Calendar className="w-12 h-12 text-surface-300 dark:text-surface-600 mx-auto mb-3" />
                    <p className="text-sm font-medium text-surface-500">No appointments found</p>
                    <p className="text-xs text-surface-400 mt-1">
                      {statusFilter ? 'Try a different filter' : 'Create your first appointment'}
                    </p>
                  </td>
                </tr>
              ) : (
                <StaggerContainer>
                  {filtered.map((apt) => (
                    <StaggerItem key={apt.id}>
                      <tr className="border-b border-surface-50 dark:border-[#1A1F26] table-row-hover">
                        <td className="px-4 py-3">
                          <span className="w-9 h-9 bg-primary-500/10 rounded-xl flex items-center justify-center text-sm font-bold text-primary-600 dark:text-primary-400 font-tabular">
                            #{apt.tokenNumber}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-surface-900 dark:text-white">{apt.patient.fullName}</p>
                          <p className="text-xs text-surface-500 font-tabular">{apt.patient.uhid}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-surface-600 dark:text-surface-300">{apt.doctor.fullName}</p>
                          <p className="text-xs text-surface-500">{apt.doctor.specialization}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-surface-600 dark:text-surface-300 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                            {new Date(apt.appointmentDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${statusColors[apt.status]}`}>
                            {statusLabels[apt.status]}
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
                  <div className="skeleton w-20 h-5 rounded" />
                  <div className="skeleton w-40 h-4 rounded" />
                  <div className="skeleton w-28 h-4 rounded" />
                </div>
              ))}
            </div>
          ) : !filtered || filtered.length === 0 ? (
            <div className="p-8 text-center">
              <Calendar className="w-12 h-12 text-surface-300 dark:text-surface-600 mx-auto mb-3" />
              <p className="text-sm font-medium text-surface-500">No appointments found</p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {filtered.map((apt) => (
                <div key={apt.id} className="card-flat p-4">
                  <div className="flex items-start justify-between mb-2">
                    <span className="w-9 h-9 bg-primary-500/10 rounded-xl flex items-center justify-center text-sm font-bold text-primary-600 dark:text-primary-400 font-tabular">
                      #{apt.tokenNumber}
                    </span>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[apt.status]}`}>
                      {statusLabels[apt.status]}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-surface-900 dark:text-white">{apt.patient.fullName}</p>
                  <p className="text-xs text-surface-500 mt-1">
                    {apt.doctor.fullName} · {apt.doctor.specialization}
                  </p>
                  <p className="text-xs text-surface-400 mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" aria-hidden="true" />
                    {new Date(apt.appointmentDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={() => setShowCreateModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
            >
              <div
                className="card w-full max-w-md shadow-2xl"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label="Create new appointment"
              >
                <div className="p-5 border-b border-surface-100 dark:border-[#2A2F38] flex items-center justify-between">
                  <h2 className="text-heading text-surface-900 dark:text-white">New Appointment</h2>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="p-2.5 rounded-xl hover:bg-surface-100 dark:hover:bg-white/5 text-surface-400 focus-ring"
                    style={{ minWidth: '44px', minHeight: '44px' }}
                    aria-label="Close dialog"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const patientId = formData.get('patientId') as string;
                    const doctorId = formData.get('doctorId') as string;
                    const date = formData.get('appointmentDate') as string;
                    if (patientId && doctorId) {
                      createMutation.mutate({
                        patientId,
                        doctorId,
                        appointmentDate: date || new Date().toISOString(),
                      });
                    }
                  }}
                  className="p-5 space-y-4"
                >
                  <div>
                    <label htmlFor="apt-patient" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Patient</label>
                    <select id="apt-patient" name="patientId" required className="w-full px-4 py-2.5 bg-surface-50 dark:bg-[#111820] border border-surface-200 dark:border-[#2A2F38] rounded-xl text-sm text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus-ring" style={{ minHeight: '44px' }}>
                      <option value="">Select patient</option>
                      {patients?.map((p) => (
                        <option key={p.id} value={p.id}>{p.fullName} ({p.uhid})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="apt-doctor" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Doctor</label>
                    <input id="apt-doctor" name="doctorId" type="text" required className="w-full px-4 py-2.5 bg-surface-50 dark:bg-[#111820] border border-surface-200 dark:border-[#2A2F38] rounded-xl text-sm text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus-ring" placeholder="Doctor ID" style={{ minHeight: '44px' }} />
                  </div>
                  <div>
                    <label htmlFor="apt-date" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Date & Time</label>
                    <input id="apt-date" name="appointmentDate" type="datetime-local" className="w-full px-4 py-2.5 bg-surface-50 dark:bg-[#111820] border border-surface-200 dark:border-[#2A2F38] rounded-xl text-sm text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus-ring" style={{ minHeight: '44px' }} />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 py-2.5 rounded-xl border border-surface-200 dark:border-[#2A2F38] text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-white/5 font-medium transition-all focus-ring" style={{ minHeight: '44px' }}>
                      Cancel
                    </button>
                    <button type="submit" disabled={createMutation.isPending} className="flex-1 py-2.5 bg-primary-600 hover:bg-primary-500 disabled:bg-primary-600/50 text-white rounded-xl font-medium transition-all shadow-lg shadow-primary-600/20 focus-ring" style={{ minHeight: '44px' }}>
                      {createMutation.isPending ? 'Creating...' : 'Create'}
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
