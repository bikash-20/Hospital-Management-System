import api from './client';
import type {
  Patient,
  Appointment,
  Prescription,
  Billing,
  Bed,
  User,
  UserRole,
  DashboardStats,
  AuditLog,
  ManagedUser,
  DoctorSchedule,
  LabResult,
  RevenueReport,
} from '@/types';

// ===== Backend Response Types (what the API actually returns) =====
interface BackendLoginResponse {
  accessToken: string;
  tokenType: string;
  username: string;
  fullName: string;
  role: string;
  email: string;
}

interface BackendPatient {
  id: string;
  uhid: string;
  fullName: string;
  mobileNumber: string;
  dob: string;
  gender: string;
  nid: string | null;
  address: string | null;
  createdDate: string;
}

interface BackendAppointment {
  id: string;
  patient: BackendPatient;
  doctorName: string;
  doctorId: string;
  appointmentDate: string;
  tokenNumber: number;
  status: string;
  createdDate: string;
}

interface BackendPrescription {
  id: string;
  appointmentId: string;
  patient: BackendPatient;
  doctorName: string;
  diagnosis: string | null;
  chiefComplaints: string | null;
  medicines: string | null;
  labOrders: string | null;
  createdDate: string;
}

interface BackendBilling {
  id: string;
  patient: BackendPatient;
  invoiceNumber: string;
  totalAmount: number;
  discount: number;
  paidAmount: number;
  status: string;
  lineItems: string | null;
  createdDate: string;
}

interface BackendBed {
  id: string;
  bedNumber: string;
  wardName: string;
  status: string;
  patientName: string | null;
  patientId: string | null;
}

// ===== Mappers: Backend → Frontend types =====
function mapPatient(bp: BackendPatient): Patient {
  return {
    id: bp.id,
    uhid: bp.uhid,
    fullName: bp.fullName,
    mobileNumber: bp.mobileNumber,
    dob: bp.dob,
    gender: bp.gender as Patient['gender'],
    nid: bp.nid ?? '',
    address: bp.address ?? '',
    createdDate: bp.createdDate,
  };
}

function mapAppointment(ba: BackendAppointment): Appointment {
  return {
    id: ba.id,
    patient: mapPatient(ba.patient),
    doctor: {
      id: ba.doctorId,
      fullName: ba.doctorName,
      specialization: '',
      available: true,
    },
    appointmentDate: ba.appointmentDate,
    tokenNumber: ba.tokenNumber ?? 0,
    status: ba.status as Appointment['status'],
  };
}

function mapPrescription(br: BackendPrescription): Prescription {
  return {
    id: br.id,
    appointment: {
      id: br.appointmentId,
      patient: mapPatient(br.patient),
      doctor: { id: '', fullName: br.doctorName, specialization: '', available: true },
      appointmentDate: '',
      tokenNumber: 0,
      status: 'COMPLETED',
    },
    patient: mapPatient(br.patient),
    doctor: { id: '', fullName: br.doctorName, specialization: '', available: true },
    diagnosis: br.diagnosis ?? '',
    chiefComplaints: safeJsonParse<string[]>(br.chiefComplaints, []),
    medicines: safeJsonParse(br.medicines, []),
    labOrders: safeJsonParse(br.labOrders, []),
    createdDate: br.createdDate,
  };
}

function mapBilling(bb: BackendBilling): Billing {
  return {
    id: bb.id,
    patient: mapPatient(bb.patient),
    invoiceNumber: bb.invoiceNumber,
    totalAmount: Number(bb.totalAmount),
    discount: Number(bb.discount),
    paidAmount: Number(bb.paidAmount),
    status: bb.status as Billing['status'],
    lineItems: safeJsonParse(bb.lineItems, []),
    createdDate: bb.createdDate,
  };
}

function mapBed(bed: BackendBed): Bed {
  return {
    id: bed.id,
    bedNumber: bed.bedNumber,
    wardName: bed.wardName,
    status: bed.status as Bed['status'],
  };
}

function safeJsonParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

// ===== Auth API =====
export async function loginApi(username: string, password: string): Promise<{ accessToken: string; user: User }> {
  const { data } = await api.post<BackendLoginResponse>('/auth/login', { username, password });
  const user: User = {
    id: data.username, // backend doesn't return UUID for user yet
    username: data.username,
    fullName: data.fullName,
    role: data.role as UserRole,
    email: data.email,
  };
  return { accessToken: data.accessToken, user };
}

// ===== Patients API =====
export async function getPatientsApi(search?: string): Promise<Patient[]> {
  if (search) {
    const { data } = await api.get<BackendPatient[]>('/patients/search', { params: { q: search } });
    return data.map(mapPatient);
  }
  const { data } = await api.get<BackendPatient[]>('/patients');
  return data.map(mapPatient);
}

export async function getPatientByIdApi(id: string): Promise<Patient> {
  const { data } = await api.get<BackendPatient>(`/patients/${id}`);
  return mapPatient(data);
}

export async function registerPatientApi(patientData: {
  fullName: string;
  mobileNumber: string;
  dob: string;
  gender: string;
  nid?: string;
  address?: string;
}): Promise<Patient> {
  const { data } = await api.post<BackendPatient>('/patients', {
    ...patientData,
    dob: patientData.dob, // already ISO string
  });
  return mapPatient(data);
}

// ===== Appointments API =====
export async function getAppointmentsApi(): Promise<Appointment[]> {
  const { data } = await api.get<BackendAppointment[]>('/appointments');
  return data.map(mapAppointment);
}

export async function createAppointmentApi(payload: {
  patientId: string;
  doctorId: string;
  appointmentDate: string;
}): Promise<Appointment> {
  const { data } = await api.post<BackendAppointment>('/appointments', payload);
  return mapAppointment(data);
}

export async function updateAppointmentStatusApi(
  id: string,
  status: Appointment['status'],
): Promise<Appointment> {
  const { data } = await api.patch<BackendAppointment>(`/appointments/${id}/status`, { status });
  return mapAppointment(data);
}

export async function getQueueApi(doctorId: string): Promise<Appointment[]> {
  const { data } = await api.get<BackendAppointment[]>(`/appointments/queue/${doctorId}`);
  return data.map(mapAppointment);
}

// ===== Prescriptions API =====
export async function getPrescriptionsApi(): Promise<Prescription[]> {
  const { data } = await api.get<BackendPrescription[]>('/prescriptions');
  return data.map(mapPrescription);
}

export async function getPrescriptionsByPatientApi(patientId: string): Promise<Prescription[]> {
  const { data } = await api.get<BackendPrescription[]>(`/prescriptions/patient/${patientId}`);
  return data.map(mapPrescription);
}

export async function createPrescriptionApi(payload: {
  appointmentId: string;
  diagnosis: string;
  chiefComplaints?: string;
  medicines?: string;
  labOrders?: string;
}): Promise<Prescription> {
  const { data } = await api.post<BackendPrescription>('/prescriptions', payload);
  return mapPrescription(data);
}

// ===== Billing API =====
export async function getBillingsApi(): Promise<Billing[]> {
  const { data } = await api.get<BackendBilling[]>('/billing');
  return data.map(mapBilling);
}

export async function getUnpaidBillingsApi(): Promise<Billing[]> {
  const { data } = await api.get<BackendBilling[]>('/billing/unpaid');
  return data.map(mapBilling);
}

export async function createBillingApi(payload: {
  patientId: string;
  discount?: number;
  lineItems?: string;
}): Promise<Billing> {
  const { data } = await api.post<BackendBilling>('/billing', payload);
  return mapBilling(data);
}

export async function processPaymentApi(billingId: string, amount: number): Promise<Billing> {
  const { data } = await api.post<BackendBilling>(`/billing/${billingId}/payment`, { amount });
  return mapBilling(data);
}

// ===== Beds API =====
export async function getBedsApi(): Promise<Bed[]> {
  const { data } = await api.get<BackendBed[]>('/beds');
  return data.map(mapBed);
}

export async function getBedSummaryApi(): Promise<{
  available: number;
  occupied: number;
  underCleaning: number;
  total: number;
}> {
  const { data } = await api.get('/beds/summary');
  return data;
}

export async function updateBedStatusApi(id: string, status: Bed['status']): Promise<Bed> {
  const { data } = await api.patch<BackendBed>(`/beds/${id}/status`, { status });
  return mapBed(data);
}

// ===== Doctors API =====
interface BackendDoctor {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: string;
  enabled: boolean;
}

export async function getDoctorsApi(): Promise<{ id: string; fullName: string; specialization: string; available: boolean }[]> {
  try {
    const { data } = await api.get<BackendDoctor[]>('/doctors');
    return data
      .filter((d) => d.enabled)
      .map((d) => ({
        id: d.id,
        fullName: d.fullName,
        specialization: 'General Medicine',
        available: d.enabled,
      }));
  } catch {
    return [];
  }
}

// ===== Dashboard Stats (computed from real data) =====
export async function getDashboardStatsApi(): Promise<DashboardStats> {
  const { data } = await api.get<DashboardStats>('/dashboard/stats');
  return data;
}

// ===== Audit Logs API =====
export async function getAuditLogsApi(limit = 50): Promise<AuditLog[]> {
  const { data } = await api.get<AuditLog[]>('/audit-logs', { params: { limit } });
  return data;
}

export async function getAuditLogsByEntityApi(entityName: string): Promise<AuditLog[]> {
  const { data } = await api.get<AuditLog[]>(`/audit-logs/entity/${entityName}`);
  return data;
}

// ===== User Management API =====
export async function getUsersApi(): Promise<ManagedUser[]> {
  const { data } = await api.get<ManagedUser[]>('/admin/users');
  return data;
}

export async function createUserApi(payload: {
  username: string;
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
  enabled?: boolean;
}): Promise<ManagedUser> {
  const { data } = await api.post<ManagedUser>('/admin/users', payload);
  return data;
}

export async function updateUserApi(id: string, payload: {
  fullName: string;
  email: string;
  role: UserRole;
  enabled: boolean;
  password?: string;
}): Promise<ManagedUser> {
  const { data } = await api.put<ManagedUser>(`/admin/users/${id}`, payload);
  return data;
}

export async function toggleUserEnabledApi(id: string): Promise<void> {
  await api.patch(`/admin/users/${id}/toggle-enabled`);
}

export async function deleteUserApi(id: string): Promise<void> {
  await api.delete(`/admin/users/${id}`);
}

// ===== Doctor Schedule API =====
export async function getDoctorScheduleApi(doctorId: string): Promise<DoctorSchedule[]> {
  const { data } = await api.get<DoctorSchedule[]>(`/schedules/doctor/${doctorId}`);
  return data;
}

export async function setDoctorScheduleApi(doctorId: string, schedule: {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  active: boolean;
}[]): Promise<DoctorSchedule[]> {
  const { data } = await api.post<DoctorSchedule[]>(`/schedules/doctor/${doctorId}`, schedule);
  return data;
}

// ===== Lab Results API =====
export async function getLabResultsApi(status?: string): Promise<LabResult[]> {
  const params = status ? { status } : {};
  const { data } = await api.get<LabResult[]>('/lab-results', { params });
  return data;
}

export async function getLabResultsByPatientApi(patientId: string): Promise<LabResult[]> {
  const { data } = await api.get<LabResult[]>(`/lab-results/patient/${patientId}`);
  return data;
}

export async function createLabResultApi(payload: {
  appointmentId: string;
  patientId: string;
  testName: string;
  priority?: string;
  resultValue?: string;
  notes?: string;
}): Promise<LabResult> {
  const { data } = await api.post<LabResult>('/lab-results', payload);
  return data;
}

export async function updateLabResultStatusApi(id: string, status: string): Promise<LabResult> {
  const { data } = await api.patch<LabResult>(`/lab-results/${id}/status`, { status });
  return data;
}

// ===== Revenue Reports API =====
export async function getRevenueReportApi(): Promise<RevenueReport> {
  const { data } = await api.get<RevenueReport>('/reports/revenue');
  return data;
}

export async function getTodayRevenueApi(): Promise<RevenueReport> {
  const { data } = await api.get<RevenueReport>('/reports/revenue/today');
  return data;
}

export async function getWeekRevenueApi(): Promise<RevenueReport> {
  const { data } = await api.get<RevenueReport>('/reports/revenue/week');
  return data;
}

export async function getMonthRevenueApi(): Promise<RevenueReport> {
  const { data } = await api.get<RevenueReport>('/reports/revenue/month');
  return data;
}

export async function getRevenueByDateRangeApi(start: string, end: string): Promise<RevenueReport> {
  const { data } = await api.get<RevenueReport>('/reports/revenue/range', { params: { start, end } });
  return data;
}
