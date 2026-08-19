import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getPrescriptionsApi } from '@/api/api';
import type { Prescription } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  User,
  Calendar,
  Pill,
  TestTube,
  Printer,
  X,
} from 'lucide-react';
import PrintablePrescription from '@/components/PrintablePrescription';

export default function Prescriptions() {
  const { data: prescriptions = [] } = useQuery({
    queryKey: ['prescriptions'],
    queryFn: getPrescriptionsApi,
  });

  const [printingRx, setPrintingRx] = useState<Prescription | null>(null);

  const handlePrint = (rx: Prescription) => {
    setPrintingRx(rx);
    setTimeout(() => {
      window.print();
    }, 100);
  };

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
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePrint(rx)}
                  className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-white/5 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 transition-colors"
                  title="Print prescription"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <span className="text-xs text-surface-400 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(rx.createdDate).toLocaleDateString()}
                </span>
              </div>
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

      {/* Print Preview Modal */}
      <AnimatePresence>
        {printingRx && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 print:hidden"
              onClick={() => setPrintingRx(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4 print:p-0 print:inset-auto"
            >
              <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-2xl print:shadow-none print:max-h-none print:overflow-visible">
                <div className="p-4 border-b border-surface-200 flex items-center justify-between print:hidden">
                  <h3 className="font-semibold text-surface-900">Prescription Preview</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => window.print()}
                      className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-sm font-medium flex items-center gap-2"
                    >
                      <Printer className="w-4 h-4" />
                      Print
                    </button>
                    <button
                      onClick={() => setPrintingRx(null)}
                      className="p-2 rounded-lg hover:bg-surface-100 text-surface-400"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <PrintablePrescription prescription={printingRx} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
