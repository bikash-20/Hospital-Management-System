import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getPatientsApi, getPrescriptionsByPatientApi, getBillingsApi } from '@/api/api';
import type { Patient, Prescription, Billing } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  User,
  Calendar,
  FileText,
  Receipt,
  ChevronDown,
  ChevronRight,
  Stethoscope,
} from 'lucide-react';

export default function PatientVisitHistory() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const { data: patients } = useQuery({
    queryKey: ['patients', searchQuery],
    queryFn: () => getPatientsApi(searchQuery || undefined),
  });

  const { data: prescriptions, isLoading: prescriptionsLoading } = useQuery({
    queryKey: ['prescriptions-patient', selectedPatient?.id],
    queryFn: () => selectedPatient ? getPrescriptionsByPatientApi(selectedPatient.id) : Promise.resolve([]),
    enabled: !!selectedPatient,
  });

  const { data: billings } = useQuery({
    queryKey: ['billings'],
    queryFn: () => getBillingsApi(),
    enabled: !!selectedPatient,
  });

  const patientBillings = billings?.filter(b => b.patient.id === selectedPatient?.id);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-display text-surface-900 dark:text-white">Patient Visit History</h1>
        <p className="text-body text-surface-500 dark:text-surface-400 mt-1">
          View past consultations, prescriptions, and billing for patients
        </p>
      </div>

      {/* Patient Search */}
      <div className="card p-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
          <input
            type="text"
            placeholder="Search patient by name, UHID, or mobile..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-surface-50 dark:bg-[#111820] border border-surface-200 dark:border-[#2A2F38] rounded-xl text-surface-900 dark:text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
          />
        </div>

        {/* Patient Results */}
        {searchQuery && patients && patients.length > 0 && (
          <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
            {patients.slice(0, 10).map((patient) => (
              <button
                key={patient.id}
                onClick={() => {
                  setSelectedPatient(patient);
                  setSearchQuery('');
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-surface-50 dark:hover:bg-white/5 transition-colors text-left"
              >
                <div className="w-10 h-10 bg-primary-500/10 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-surface-900 dark:text-white truncate">{patient.fullName}</p>
                  <p className="text-xs text-surface-500">{patient.uhid} · {patient.mobileNumber}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-surface-400 ml-auto" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected Patient */}
      {selectedPatient && (
        <div className="space-y-6">
          {/* Patient Info Card */}
          <div className="card p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-primary-500/10 rounded-full flex items-center justify-center">
                  <span className="text-xl font-bold text-primary-600 dark:text-primary-400">
                    {selectedPatient.fullName.charAt(0)}
                  </span>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-surface-900 dark:text-white">{selectedPatient.fullName}</h2>
                  <p className="text-sm text-surface-500">{selectedPatient.uhid}</p>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-xs text-surface-400">{selectedPatient.mobileNumber}</span>
                    <span className="text-xs text-surface-400">{selectedPatient.gender}</span>
                    <span className="text-xs text-surface-400">
                      DOB: {new Date(selectedPatient.dob).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedPatient(null)}
                className="px-4 py-2 text-sm font-medium text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 rounded-xl hover:bg-surface-50 dark:hover:bg-white/5 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Visit Timeline */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Prescriptions */}
            <div className="lg:col-span-2">
              <div className="card overflow-hidden">
                <div className="p-4 border-b border-surface-100 dark:border-[#2A2F38] flex items-center gap-2">
                  <FileText className="w-5 h-5 text-surface-400" />
                  <h3 className="text-heading text-surface-900 dark:text-white">Prescriptions</h3>
                  <span className="text-xs text-surface-400 ml-auto">{prescriptions?.length ?? 0} total</span>
                </div>
                {prescriptionsLoading ? (
                  <div className="p-4 space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="p-3 bg-surface-50 dark:bg-[#111820] rounded-xl animate-pulse">
                        <div className="skeleton w-32 h-5 mb-2" />
                        <div className="skeleton w-48 h-4" />
                      </div>
                    ))}
                  </div>
                ) : !prescriptions || prescriptions.length === 0 ? (
                  <div className="p-8 text-center">
                    <FileText className="w-12 h-12 text-surface-300 dark:text-surface-600 mx-auto mb-3" />
                    <p className="text-sm font-medium text-surface-500">No prescriptions found</p>
                  </div>
                ) : (
                  <div className="divide-y divide-surface-50 dark:divide-[#1A1F26]">
                    {prescriptions.map((rx) => (
                      <PrescriptionCard key={rx.id} prescription={rx} />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Billing History */}
            <div>
              <div className="card overflow-hidden">
                <div className="p-4 border-b border-surface-100 dark:border-[#2A2F38] flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-surface-400" />
                  <h3 className="text-heading text-surface-900 dark:text-white">Billing</h3>
                  <span className="text-xs text-surface-400 ml-auto">{patientBillings?.length ?? 0} total</span>
                </div>
                {!patientBillings || patientBillings.length === 0 ? (
                  <div className="p-8 text-center">
                    <Receipt className="w-12 h-12 text-surface-300 dark:text-surface-600 mx-auto mb-3" />
                    <p className="text-sm font-medium text-surface-500">No billing records</p>
                  </div>
                ) : (
                  <div className="divide-y divide-surface-50 dark:divide-[#1A1F26]">
                    {patientBillings.map((billing) => (
                      <BillingCard key={billing.id} billing={billing} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PrescriptionCard({ prescription }: { prescription: Prescription }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="p-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start gap-3 text-left"
      >
        <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center shrink-0">
          <Stethoscope className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-surface-900 dark:text-white">
              {prescription.diagnosis || 'Consultation'}
            </p>
            <span className="text-xs text-surface-400">•</span>
            <span className="text-xs text-surface-500 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(prescription.createdDate).toLocaleDateString()}
            </span>
          </div>
          <p className="text-xs text-surface-500 mt-0.5">
            Dr. {prescription.doctor.fullName}
          </p>
        </div>
        <ChevronDown className={`w-4 h-4 text-surface-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 p-3 bg-surface-50 dark:bg-[#111820] rounded-xl space-y-3">
              {prescription.chiefComplaints && prescription.chiefComplaints.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-surface-500 mb-1">Chief Complaints</p>
                  <div className="flex flex-wrap gap-1">
                    {prescription.chiefComplaints.map((complaint, i) => (
                      <span key={i} className="text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full">
                        {complaint}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {prescription.medicines && prescription.medicines.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-surface-500 mb-1">Medicines</p>
                  <div className="space-y-1">
                    {prescription.medicines.map((med, i) => (
                      <div key={i} className="text-xs text-surface-600 dark:text-surface-300">
                        {med.name} — {med.dosage} — {med.frequency} — {med.duration}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {prescription.labOrders && prescription.labOrders.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-surface-500 mb-1">Lab Orders</p>
                  <div className="flex flex-wrap gap-1">
                    {prescription.labOrders.map((order, i) => (
                      <span key={i} className="text-xs bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">
                        {order.testName} ({order.priority})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function BillingCard({ billing }: { billing: Billing }) {
  const statusColors: Record<string, string> = {
    PAID: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    PARTIAL: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    UNPAID: 'bg-red-500/10 text-red-600 dark:text-red-400',
  };

  return (
    <div className="p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-surface-900 dark:text-white font-mono">
            {billing.invoiceNumber}
          </p>
          <p className="text-xs text-surface-500 mt-0.5">
            {new Date(billing.createdDate).toLocaleDateString()}
          </p>
        </div>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[billing.status]}`}>
          {billing.status}
        </span>
      </div>
      <div className="mt-2 flex items-center gap-4">
        <div>
          <p className="text-xs text-surface-500">Total</p>
          <p className="text-sm font-medium text-surface-900 dark:text-white font-tabular">
            ৳{billing.totalAmount.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-xs text-surface-500">Paid</p>
          <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 font-tabular">
            ৳{billing.paidAmount.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
