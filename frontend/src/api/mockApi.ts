import type {
  Patient,
  Appointment,
  Prescription,
  Billing,
  Bed,
  QueueUpdate,
  DashboardStats,
  AuthResponse,
  LoginCredentials,
  PaginatedResponse,
} from '@/types';
import {
  mockPatients,
  mockDoctors,
  mockAppointments,
  mockPrescriptions,
  mockBillings,
  mockBeds,
  mockQueueUpdate,
  mockDashboardStats,
  mockUsers,
} from './mockData';

// Simulate network delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

let uhidCounter = 7;
let nextTokenNumber = 5;

// ===== Auth =====
export async function loginApi(
  credentials: LoginCredentials,
): Promise<AuthResponse> {
  await delay(500);
  const user = mockUsers[credentials.username];
  if (!user || credentials.password !== 'password') {
    throw new Error('Invalid username or password');
  }
  return {
    accessToken: `mock-jwt-${credentials.username}-${Date.now()}`,
    user,
  };
}

// ===== Patients =====
export async function getPatientsApi(
  page = 0,
  size = 10,
  search?: string,
): Promise<PaginatedResponse<Patient>> {
  await delay(300);
  let filtered = [...mockPatients];
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.fullName.toLowerCase().includes(q) ||
        p.uhid.toLowerCase().includes(q) ||
        p.mobileNumber.includes(q),
    );
  }
  const start = page * size;
  return {
    content: filtered.slice(start, start + size),
    totalElements: filtered.length,
    totalPages: Math.ceil(filtered.length / size),
    page,
    size,
  };
}

export async function getPatientByIdApi(id: string): Promise<Patient> {
  await delay(200);
  const patient = mockPatients.find((p) => p.id === id);
  if (!patient) throw new Error('Patient not found');
  return patient;
}

export async function checkDuplicatePatientApi(
  mobileNumber: string,
  dob: string,
): Promise<Patient | null> {
  await delay(300);
  return (
    mockPatients.find((p) => p.mobileNumber === mobileNumber && p.dob === dob) ||
    null
  );
}

export async function registerPatientApi(
  data: Omit<Patient, 'id' | 'uhid' | 'createdDate'>,
): Promise<Patient> {
  await delay(400);
  const uhid = `SYL-2026-${String(uhidCounter++).padStart(5, '0')}`;
  const newPatient: Patient = {
    ...data,
    id: `pat-${uhidCounter}`,
    uhid,
    createdDate: new Date().toISOString(),
  };
  mockPatients.push(newPatient);
  return newPatient;
}

// ===== Appointments =====
export async function getAppointmentsApi(
  date?: string,
  doctorId?: string,
  status?: string,
): Promise<Appointment[]> {
  await delay(300);
  let filtered = [...mockAppointments];
  if (date) filtered = filtered.filter((a) => a.appointmentDate.startsWith(date));
  if (doctorId) filtered = filtered.filter((a) => a.doctor.id === doctorId);
  if (status) filtered = filtered.filter((a) => a.status === status);
  return filtered;
}

export async function createAppointmentApi(
  data: Omit<Appointment, 'id' | 'tokenNumber' | 'status'>,
): Promise<Appointment> {
  await delay(300);
  const newAppointment: Appointment = {
    ...data,
    id: `apt-${Date.now()}`,
    tokenNumber: nextTokenNumber++,
    status: 'WAITING',
  };
  mockAppointments.push(newAppointment);
  return newAppointment;
}

export async function updateAppointmentStatusApi(
  id: string,
  status: Appointment['status'],
): Promise<Appointment> {
  await delay(200);
  const apt = mockAppointments.find((a) => a.id === id);
  if (!apt) throw new Error('Appointment not found');
  apt.status = status;
  return apt;
}

// ===== Prescriptions =====
export async function getPrescriptionsByPatientApi(
  patientId: string,
): Promise<Prescription[]> {
  await delay(300);
  return mockPrescriptions.filter((rx) => rx.patient.id === patientId);
}

export async function createPrescriptionApi(
  data: Omit<Prescription, 'id' | 'createdDate'>,
): Promise<Prescription> {
  await delay(400);
  const newRx: Prescription = {
    ...data,
    id: `rx-${Date.now()}`,
    createdDate: new Date().toISOString(),
  };
  mockPrescriptions.push(newRx);
  return newRx;
}

// ===== Billing =====
export async function getBillingsApi(
  status?: string,
): Promise<Billing[]> {
  await delay(300);
  let filtered = [...mockBillings];
  if (status) filtered = filtered.filter((b) => b.status === status);
  return filtered;
}

export async function getBillingByIdApi(id: string): Promise<Billing> {
  await delay(200);
  const billing = mockBillings.find((b) => b.id === id);
  if (!billing) throw new Error('Billing not found');
  return billing;
}

export async function processPaymentApi(
  billingId: string,
  amount: number,
): Promise<Billing> {
  await delay(400);
  const billing = mockBillings.find((b) => b.id === billingId);
  if (!billing) throw new Error('Billing not found');
  billing.paidAmount += amount;
  if (billing.paidAmount >= billing.totalAmount - billing.discount) {
    billing.status = 'PAID';
  } else if (billing.paidAmount > 0) {
    billing.status = 'PARTIAL';
  }
  return billing;
}

// ===== Beds =====
export async function getBedsApi(wardName?: string): Promise<Bed[]> {
  await delay(200);
  let filtered = [...mockBeds];
  if (wardName) filtered = filtered.filter((b) => b.wardName === wardName);
  return filtered;
}

export async function updateBedStatusApi(
  id: string,
  status: Bed['status'],
): Promise<Bed> {
  await delay(200);
  const bed = mockBeds.find((b) => b.id === id);
  if (!bed) throw new Error('Bed not found');
  bed.status = status;
  return bed;
}

// ===== Queue =====
export async function getQueueApi(
  doctorId: string,
): Promise<QueueUpdate> {
  await delay(200);
  void doctorId;
  return { ...mockQueueUpdate, lastUpdated: new Date().toISOString() };
}

// ===== Dashboard =====
export async function getDashboardStatsApi(): Promise<DashboardStats> {
  await delay(300);
  return mockDashboardStats;
}

// ===== Doctors =====
export async function getDoctorsApi() {
  await delay(200);
  return [...mockDoctors];
}
