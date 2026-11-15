// ===== Enums =====
export type PatientGender = 'MALE' | 'FEMALE' | 'OTHER';
export type AppointmentStatus = 'WAITING' | 'IN_CONSULTATION' | 'COMPLETED' | 'CANCELLED';
export type BillingStatus = 'UNPAID' | 'PARTIAL' | 'PAID';
export type BedStatus = 'AVAILABLE' | 'OCCUPIED' | 'UNDER_CLEANING';
export type BedType = 'ICU' | 'EMERGENCY' | 'GENERAL' | 'CABIN';
export type UserRole = 'ADMIN' | 'DOCTOR' | 'RECEPTIONIST' | 'LAB_TECH' | 'CASHIER' | 'PATIENT';
export type Language = 'en' | 'bn';
export type BookingStatus = 'CONFIRMED' | 'PENDING' | 'CANCELLED' | 'ADMITTED';
export type PaymentMethod = 'BKASH' | 'NAGAD' | 'UPAY' | 'CASH';

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
  patientName?: string;
  patientId?: string;
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

// ===== CareBridge AI & Seat Availability =====
export interface BedTypeStat {
  type: BedType;
  available: number;
  total: number;
  occupied: number;
  dailyRate: number;
}

export interface DoctorInfo {
  id: string;
  name: string;
  email: string;
  specialization: string;
  available: boolean;
}

export interface SeatAvailabilityResponse {
  icu: BedTypeStat;
  emergency: BedTypeStat;
  general: BedTypeStat;
  cabin: BedTypeStat;
  totalBeds: number;
  totalAvailable: number;
  activeDoctors: DoctorInfo[];
}

export interface BedBookingRequest {
  guestName: string;
  guestPhone: string;
  guestNid?: string;
  guestGender: string;
  guestAge: number;
  bedType: BedType;
  paymentMethod: PaymentMethod;
  paymentTrxId: string;
  paymentAmount?: number;
  symptoms?: string;
  notes?: string;
}

export interface BedBookingResponse {
  id: string;
  bookingReference: string;
  uhid: string;
  guestName: string;
  guestPhone: string;
  guestNid?: string;
  guestGender: string;
  guestAge: number;
  bedType: BedType;
  status: BookingStatus;
  assignedBedId?: string;
  assignedBedNumber: string;
  assignedWard: string;
  dailyRate: number;
  paymentMethod: string;
  paymentTrxId: string;
  paymentAmount: number;
  paymentStatus: string;
  symptoms?: string;
  notes?: string;
  createdDate: string;
  qrData: string;
}

// ===== AI Assistant & RAG =====
export interface ActionSuggestion {
  label: string;
  action: 'NAVIGATE' | 'QUERY' | 'TRIGGER_OCR';
  targetUrl?: string;
}

export interface AIChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  modelUsed?: string;
  isOffline?: boolean;
  hashMatch?: boolean;
  isStreaming?: boolean;
  suggestions?: ActionSuggestion[];
}

export interface AIChatResponse {
  reply: string;
  modelUsed: string;
  isOffline: boolean;
  hashMatch: boolean;
  suggestions?: ActionSuggestion[];
  liveMetrics?: Record<string, unknown>;
}

export interface AISettingsPreferences {
  ollamaUrl: string;
  systemPrompt: string;
  sttEndpoint: string;
  ttsEndpoint: string;
  elevenLabsVoiceId?: string;
  grokApiKey?: string;
  openRouterApiKey?: string;
  geminiApiKey?: string;
}

export interface PrescriptionExtractedData {
  patientName?: string;
  age?: string;
  date?: string;
  diagnosis?: string;
  medicines: Array<{
    name: string;
    dosage?: string;
    duration?: string;
    frequency?: string;
    purpose?: string;
  }>;
  advice?: string;
  hashKey?: string;
}

export interface PublicAppointmentRequest {
  patientName: string;
  patientPhone: string;
  patientAge: number;
  patientGender: string;
  patientNid?: string;
  doctorId: string;
  appointmentDate: string; // ISO string
  symptoms?: string;
}

export interface PublicAppointmentResponse {
  id: string;
  tokenNumber: number;
  appointmentDate: string;
  status: AppointmentStatus;
  doctorId: string;
  doctorName: string;
  patientId: string;
  patientUhid: string;
  patientName: string;
  patientPhone: string;
  patientAge: number;
  patientGender: string;
  symptoms?: string;
  createdDate: string;
  qrData: string;
}


