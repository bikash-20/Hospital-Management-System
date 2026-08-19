// ===== Enums =====
export type PatientGender = 'MALE' | 'FEMALE' | 'OTHER';
export type AppointmentStatus = 'WAITING' | 'IN_CONSULTATION' | 'COMPLETED' | 'CANCELLED';
export type BillingStatus = 'UNPAID' | 'PARTIAL' | 'PAID';
export type BedStatus = 'AVAILABLE' | 'OCCUPIED' | 'UNDER_CLEANING';
export type UserRole = 'ADMIN' | 'DOCTOR' | 'RECEPTIONIST' | 'LAB_TECH' | 'CASHIER';

// ===== Core Entities =====
export interface Patient {
  id: string;
  uhid: string;
  fullName: string;
  mobileNumber: string;
  dob: string;
  gender: PatientGender;
  nid: string;
  address: string;
  createdDate: string;
}

export interface Doctor {
  id: string;
  fullName: string;
  specialization: string;
  available: boolean;
}

export interface Appointment {
  id: string;
  patient: Patient;
  doctor: Doctor;
  appointmentDate: string;
  tokenNumber: number;
  status: AppointmentStatus;
}

export interface Medicine {
  name: string;
  dosage: string;
  duration: string;
  frequency: string;
}

export interface LabOrder {
  testName: string;
  priority: 'ROUTINE' | 'URGENT';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
}

export interface Prescription {
  id: string;
  appointment: Appointment;
  patient: Patient;
  doctor: Doctor;
  diagnosis: string;
  chiefComplaints: string[];
  medicines: Medicine[];
  labOrders: LabOrder[];
  createdDate: string;
}

export interface BillingLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Billing {
  id: string;
  patient: Patient;
  invoiceNumber: string;
  totalAmount: number;
  discount: number;
  paidAmount: number;
  status: BillingStatus;
  lineItems: BillingLineItem[];
  createdDate: string;
}

export interface Bed {
  id: string;
  bedNumber: string;
  wardName: string;
  status: BedStatus;
}

// ===== Auth & User =====
export interface User {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  email: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

// ===== Queue =====
export interface QueueEntry {
  appointment: Appointment;
  position: number;
  estimatedWait: number;
}

export interface QueueUpdate {
  doctorId: string;
  currentToken: number;
  queue: QueueEntry[];
  lastUpdated: string;
}

// ===== API =====
export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

export interface ApiError {
  message: string;
  code: string;
  timestamp: string;
}

// ===== Stats =====
export interface DashboardStats {
  patientsToday: number;
  appointmentsToday: number;
  bedsAvailable: number;
  bedsTotal: number;
  revenue: number;
  pendingBills: number;
}

// ===== Audit Log =====
export interface AuditLog {
  id: string;
  entityName: string;
  operation: string;
  entityId: string;
  oldValues: string | null;
  newValues: string | null;
  userId: string;
  userName: string;
  timestamp: string;
}

// ===== User Management =====
export interface ManagedUser {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: UserRole;
  enabled: boolean;
  createdDate: string;
}

// ===== Doctor Schedule =====
export interface DoctorSchedule {
  id: string;
  doctorId: string;
  doctorName: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  active: boolean;
}

// ===== Lab Results =====
export interface LabResult {
  id: string;
  appointmentId: string;
  patient: Patient;
  orderedByName: string;
  testName: string;
  priority: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  resultValue: string | null;
  notes: string | null;
  completedAt: string | null;
  createdDate: string;
}

// ===== Revenue Reports =====
export interface RevenueReport {
  totalRevenue: number;
  totalCollected: number;
  totalPending: number;
  totalDiscount: number;
  totalInvoices: number;
  paidInvoices: number;
  unpaidInvoices: number;
  partialInvoices: number;
  dailyBreakdown: DailyRevenue[];
  revenueByStatus: Record<string, number>;
}

export interface DailyRevenue {
  date: string;
  revenue: number;
  invoiceCount: number;
}
