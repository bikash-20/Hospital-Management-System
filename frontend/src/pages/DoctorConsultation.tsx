import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  getAppointmentsApi,
  getPrescriptionsByPatientApi,
  createPrescriptionApi,
  getDoctorsApi,
} from '@/api/mockApi';
import type { Appointment, Medicine, LabOrder } from '@/types';
import {
  User,
  Calendar,
  Clock,
  FileText,
  Pill,
  TestTube,
  Plus,
  Trash2,
  Save,
  Stethoscope,
  ChevronRight,
  Check,
} from 'lucide-react';

export default function DoctorConsultation() {
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [diagnosis, setDiagnosis] = useState('');
  const [chiefComplaints, setChiefComplaints] = useState('');
  const [medicines, setMedicines] = useState<Medicine[]>([
    { name: '', dosage: '', duration: '', frequency: '' },
  ]);
  const [labOrders, setLabOrders] = useState<LabOrder[]>([]);
  const [labInput, setLabInput] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const { data: doctors } = useQuery({
    queryKey: ['doctors'],
    queryFn: getDoctorsApi,
  });

  // Use the first doctor (Dr. Arif) for demo
  const currentDoctor = doctors?.[0];

  const { data: appointments } = useQuery({
    queryKey: ['today-appointments', currentDoctor?.id],
    queryFn: () => getAppointmentsApi('2026-08-19', currentDoctor?.id),
    enabled: !!currentDoctor,
  });

  const { data: patientPrescriptions } = useQuery({
    queryKey: ['patient-prescriptions', selectedAppointment?.patient.id],
    queryFn: () => getPrescriptionsByPatientApi(selectedAppointment!.patient.id),
    enabled: !!selectedAppointment,
  });

  const saveMutation = useMutation({
    mutationFn: createPrescriptionApi,
    onSuccess: () => {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      // Reset form
      setDiagnosis('');
      setChiefComplaints('');
      setMedicines([{ name: '', dosage: '', duration: '', frequency: '' }]);
      setLabOrders([]);
    },
  });

  const handleSavePrescription = () => {
    if (!selectedAppointment || !currentDoctor || !diagnosis) return;
    saveMutation.mutate({
      appointment: selectedAppointment,
      patient: selectedAppointment.patient,
      doctor: currentDoctor,
      diagnosis,
      chiefComplaints: chiefComplaints.split('\n').filter(Boolean),
      medicines: medicines.filter((m) => m.name),
      labOrders,
    });
  };

  const addMedicine = () => {
    setMedicines([...medicines, { name: '', dosage: '', duration: '', frequency: '' }]);
  };

  const removeMedicine = (index: number) => {
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  const updateMedicine = (index: number, field: keyof Medicine, value: string) => {
    const updated = [...medicines];
    updated[index] = { ...updated[index], [field]: value };
    setMedicines(updated);
  };

  const addLabOrder = () => {
    if (labInput.trim()) {
      setLabOrders([...labOrders, { testName: labInput.trim(), priority: 'ROUTINE', status: 'PENDING' }]);
      setLabInput('');
    }
  };

  const removeLabOrder = (index: number) => {
    setLabOrders(labOrders.filter((_, i) => i !== index));
  };

  const selectAppointment = (apt: Appointment) => {
    setSelectedAppointment(apt);
    setDiagnosis('');
    setChiefComplaints('');
    setMedicines([{ name: '', dosage: '', duration: '', frequency: '' }]);
    setLabOrders([]);
  };

  return (
    <div className="h-[calc(100vh-112px)] flex gap-6 max-w-[1600px] mx-auto">
      {/* Left Pane - Patient History */}
      <div className="w-[380px] flex flex-col bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-700/50 overflow-hidden shrink-0">
        <div className="p-4 border-b border-surface-100 dark:border-surface-700/50">
          <h2 className="text-sm font-semibold text-surface-900 dark:text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary-400" />
            Today's Queue
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {appointments?.map((apt) => (
            <button
              key={apt.id}
              onClick={() => selectAppointment(apt)}
              className={`w-full text-left p-3 rounded-xl transition-all ${
                selectedAppointment?.id === apt.id
                  ? 'bg-primary-500/15 border border-primary-500/30'
                  : 'bg-surface-50 dark:bg-surface-800/50 border border-transparent hover:border-surface-200 dark:hover:border-surface-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 bg-primary-500/10 rounded-lg flex items-center justify-center text-xs font-bold text-primary-600 dark:text-primary-400">
                    #{apt.tokenNumber}
                  </span>
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                      apt.status === 'IN_CONSULTATION'
                        ? 'bg-blue-500/10 text-blue-500'
                        : apt.status === 'WAITING'
                        ? 'bg-amber-500/10 text-amber-500'
                        : apt.status === 'COMPLETED'
                        ? 'bg-green-500/10 text-green-500'
                        : 'bg-red-500/10 text-red-500'
                    }`}
                  >
                    {apt.status.replace('_', ' ')}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-surface-300" />
              </div>
              <p className="text-sm font-medium text-surface-900 dark:text-white ml-9">
                {apt.patient.fullName}
              </p>
              <p className="text-xs text-surface-500 ml-9">{apt.patient.uhid}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Right Pane - Consultation / Prescription */}
      <div className="flex-1 flex flex-col gap-6 min-w-0">
        {selectedAppointment ? (
          <>
            {/* Patient Info Bar */}
            <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-700/50 p-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-primary-500/10 rounded-2xl flex items-center justify-center">
                  <User className="w-7 h-7 text-primary-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-bold text-surface-900 dark:text-white">
                      {selectedAppointment.patient.fullName}
                    </h2>
                    <span className="text-xs font-mono bg-primary-500/10 text-primary-600 dark:text-primary-400 px-2 py-0.5 rounded-md">
                      {selectedAppointment.patient.uhid}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-surface-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(selectedAppointment.patient.dob).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />
                      {selectedAppointment.patient.gender}
                    </span>
                    <span>{selectedAppointment.patient.mobileNumber}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 grid grid-cols-2 gap-6 min-h-0">
              {/* History */}
              <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-700/50 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-surface-100 dark:border-surface-700/50">
                  <h3 className="text-sm font-semibold text-surface-900 dark:text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-400" />
                    Medical History
                  </h3>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {patientPrescriptions && patientPrescriptions.length > 0 ? (
                    patientPrescriptions.map((rx) => (
                      <div
                        key={rx.id}
                        className="p-3 bg-surface-50 dark:bg-surface-800/50 rounded-xl border border-surface-100 dark:border-surface-700/50"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-surface-500">
                            {new Date(rx.createdDate).toLocaleDateString()}
                          </span>
                          <span className="text-xs text-surface-500">{rx.doctor.fullName}</span>
                        </div>
                        <p className="text-sm font-medium text-surface-900 dark:text-white mb-1">
                          {rx.diagnosis}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {rx.medicines.map((med, i) => (
                            <span
                              key={i}
                              className="text-[10px] bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-full"
                            >
                              {med.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-surface-400">
                      <Stethoscope className="w-10 h-10 mb-3 opacity-50" />
                      <p className="text-sm">No previous records</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Prescription Builder */}
              <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-700/50 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-surface-100 dark:border-surface-700/50 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-surface-900 dark:text-white flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-primary-400" />
                    New Prescription
                  </h3>
                  {saveSuccess && (
                    <span className="text-xs text-green-500 flex items-center gap-1 animate-in fade-in">
                      <Check className="w-3 h-3" />
                      Saved
                    </span>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {/* Chief Complaints */}
                  <div>
                    <label className="text-xs font-medium text-surface-500 uppercase tracking-wider mb-1.5 block">
                      Chief Complaints
                    </label>
                    <textarea
                      value={chiefComplaints}
                      onChange={(e) => setChiefComplaints(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl text-sm text-surface-900 dark:text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 resize-none"
                      placeholder="One complaint per line..."
                    />
                  </div>

                  {/* Diagnosis */}
                  <div>
                    <label className="text-xs font-medium text-surface-500 uppercase tracking-wider mb-1.5 block">
                      Diagnosis *
                    </label>
                    <input
                      type="text"
                      value={diagnosis}
                      onChange={(e) => setDiagnosis(e.target.value)}
                      className="w-full px-3 py-2 bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl text-sm text-surface-900 dark:text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                      placeholder="Enter diagnosis..."
                    />
                  </div>

                  {/* Medicines */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-medium text-surface-500 uppercase tracking-wider flex items-center gap-1">
                        <Pill className="w-3 h-3" />
                        Medicines
                      </label>
                      <button
                        type="button"
                        onClick={addMedicine}
                        className="text-xs text-primary-500 hover:text-primary-400 flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        Add
                      </button>
                    </div>
                    <div className="space-y-2">
                      {medicines.map((med, idx) => (
                        <div key={idx} className="flex gap-2 items-start">
                          <div className="flex-1 grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={med.name}
                              onChange={(e) => updateMedicine(idx, 'name', e.target.value)}
                              className="px-3 py-2 bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl text-sm text-surface-900 dark:text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                              placeholder="Medicine name"
                            />
                            <input
                              type="text"
                              value={med.dosage}
                              onChange={(e) => updateMedicine(idx, 'dosage', e.target.value)}
                              className="px-3 py-2 bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl text-sm text-surface-900 dark:text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                              placeholder="Dosage"
                            />
                            <input
                              type="text"
                              value={med.frequency}
                              onChange={(e) => updateMedicine(idx, 'frequency', e.target.value)}
                              className="px-3 py-2 bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl text-sm text-surface-900 dark:text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                              placeholder="Frequency"
                            />
                            <input
                              type="text"
                              value={med.duration}
                              onChange={(e) => updateMedicine(idx, 'duration', e.target.value)}
                              className="px-3 py-2 bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl text-sm text-surface-900 dark:text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                              placeholder="Duration"
                            />
                          </div>
                          {medicines.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeMedicine(idx)}
                              className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors mt-0.5"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Lab Orders */}
                  <div>
                    <label className="text-xs font-medium text-surface-500 uppercase tracking-wider mb-1.5 flex items-center gap-1 block">
                      <TestTube className="w-3 h-3" />
                      Lab Orders
                    </label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={labInput}
                        onChange={(e) => setLabInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addLabOrder())}
                        className="flex-1 px-3 py-2 bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl text-sm text-surface-900 dark:text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                        placeholder="Add test (Enter to add)"
                      />
                      <button
                        type="button"
                        onClick={addLabOrder}
                        className="px-3 py-2 bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl text-sm text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors"
                      >
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {labOrders.map((order, idx) => (
                        <span
                          key={idx}
                          className="flex items-center gap-1.5 text-xs bg-purple-500/10 text-purple-500 px-2.5 py-1 rounded-full"
                        >
                          {order.testName}
                          <button
                            onClick={() => removeLabOrder(idx)}
                            className="hover:text-purple-300 transition-colors"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Submit */}
                  <button
                    onClick={handleSavePrescription}
                    disabled={!diagnosis || saveMutation.isPending}
                    className="w-full py-3 bg-primary-600 hover:bg-primary-500 disabled:bg-primary-600/50 text-white rounded-xl font-medium transition-all shadow-lg shadow-primary-600/25 flex items-center justify-center gap-2 mt-4"
                  >
                    <Save className="w-4 h-4" />
                    {saveMutation.isPending ? 'Saving...' : 'Submit Prescription'}
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="flex-1 flex items-center justify-center bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-700/50">
            <div className="text-center">
              <Stethoscope className="w-16 h-16 text-surface-300 dark:text-surface-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-1">
                Select a Patient
              </h3>
              <p className="text-sm text-surface-500">
                Choose a patient from the queue to start consultation
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
