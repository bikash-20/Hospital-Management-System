import { useQuery } from '@tanstack/react-query';
import { getPrescriptionsApi } from '@/api/api';
import {
  FileText,
  User,
  Calendar,
  Pill,
  TestTube,
} from 'lucide-react';

export default function Prescriptions() {
  const { data: prescriptions = [] } = useQuery({
    queryKey: ['prescriptions'],
    queryFn: getPrescriptionsApi,
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-display text-surface-900 dark:text-white">Prescriptions</h1>
        <p className="text-body text-surface-500 dark:text-surface-400 mt-1">
          View and manage patient prescriptions
        </p>
      </div>

      {/* Empty state */}
      {!prescriptions || prescriptions.length === 0 ? (
        <div className="card p-12 text-center">
          <FileText className="w-12 h-12 text-surface-300 dark:text-surface-600 mx-auto mb-3" />
          <p className="text-sm font-medium text-surface-500">No prescriptions found</p>
          <p className="text-xs text-surface-400 mt-1">Prescriptions will appear here after consultations</p>
        </div>
      ) : (
      <div className="space-y-4">
        {prescriptions.map((rx) => (
          <div
            key={rx.id}
            className="card p-5 sm:p-6"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-primary-500/10 rounded-xl">
                  <FileText className="w-5 h-5 text-primary-500" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-surface-900 dark:text-white">
                    {rx.diagnosis}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-sm text-surface-500">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />
                      {rx.patient.fullName}
                    </span>
                    <span>·</span>
                    <span>{rx.patient.uhid}</span>
                    <span>·</span>
                    <span>{rx.doctor.fullName}</span>
                  </div>
                </div>
              </div>
              <span className="text-xs text-surface-400 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(rx.createdDate).toLocaleDateString()}
              </span>
            </div>

            {/* Chief Complaints */}
            {rx.chiefComplaints.length > 0 && (
              <div className="mb-4 ml-[52px]">
                <p className="text-xs font-medium text-surface-500 uppercase tracking-wider mb-2">
                  Chief Complaints
                </p>
                <div className="flex flex-wrap gap-2">
                  {rx.chiefComplaints.map((complaint, i) => (
                    <span
                      key={i}
                      className="text-xs bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 px-2.5 py-1 rounded-full"
                    >
                      {complaint}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Medicines */}
            <div className="sm:ml-[52px]">
              <p className="text-xs font-medium text-surface-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Pill className="w-3 h-3" aria-hidden="true" />
                Medicines
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {rx.medicines.map((med, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-2.5 bg-blue-500/5 rounded-xl border border-blue-500/10"
                  >                      <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center shrink-0">
                      <Pill className="w-3.5 h-3.5 text-blue-500" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-surface-900 dark:text-white">
                        {med.name}
                      </p>
                      <p className="text-[11px] text-surface-500">
                        {med.dosage} · {med.frequency} · {med.duration}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Lab Orders */}
            {rx.labOrders.length > 0 && (
              <div className="sm:ml-[52px] mt-4">
                <p className="text-xs font-medium text-surface-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <TestTube className="w-3 h-3" />
                  Lab Orders
                </p>
                <div className="flex flex-wrap gap-2">
                  {rx.labOrders.map((order, i) => (
                    <span
                      key={i}
                      className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        order.status === 'COMPLETED'
                          ? 'bg-status-completed-bg text-emerald-500'
                          : order.status === 'IN_PROGRESS'
                          ? 'bg-status-consulting-bg text-blue-500'
                          : 'bg-purple-500/10 text-purple-500'
                      }`}
                    >
                      {order.testName}
                      <span className="opacity-60 ml-1">
                        ({order.status.replace('_', ' ').toLowerCase()})
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      )}
    </div>
  );
}
