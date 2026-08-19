import type {
  Patient,
  Doctor,
  Appointment,
  Prescription,
  Billing,
  Bed,
  QueueUpdate,
  DashboardStats,
  User,
} from '@/types';

// ===== Doctors =====
export const mockDoctors: Doctor[] = [
  { id: 'doc-1', fullName: 'Dr. Arif Hassan', specialization: 'Cardiology', available: true },
  { id: 'doc-2', fullName: 'Dr. Nusrat Jahan', specialization: 'Pediatrics', available: true },
  { id: 'doc-3', fullName: 'Dr. Kamal Uddin', specialization: 'Orthopedics', available: true },
  { id: 'doc-4', fullName: 'Dr. Fatema Begum', specialization: 'Gynecology', available: false },
  { id: 'doc-5', fullName: 'Dr. Rafiq Ahmed', specialization: 'General Medicine', available: true },
];

// ===== Patients =====
export const mockPatients: Patient[] = [
  {
    id: 'pat-1',
    uhid: 'SYL-2026-00001',
    fullName: 'Mohammad Rahim Uddin',
    mobileNumber: '01712345678',
    dob: '1985-03-15',
    gender: 'MALE',
    nid: '1234567890123',
    address: '22 Zindabazar, Sylhet 3100',
    createdDate: '2026-01-10T09:00:00Z',
  },
  {
    id: 'pat-2',
    uhid: 'SYL-2026-00002',
    fullName: 'Sabrina Akter',
    mobileNumber: '01812345678',
    dob: '1992-07-22',
    gender: 'FEMALE',
    nid: '2345678901234',
    address: '15 Mirabazar, Sylhet 3100',
    createdDate: '2026-01-15T10:30:00Z',
  },
  {
    id: 'pat-3',
    uhid: 'SYL-2026-00003',
    fullName: 'Abdul Karim',
    mobileNumber: '01912345678',
    dob: '1978-11-08',
    gender: 'MALE',
    nid: '3456789012345',
    address: '8 Ambarkhana, Sylhet 3100',
    createdDate: '2026-02-01T08:45:00Z',
  },
  {
    id: 'pat-4',
    uhid: 'SYL-2026-00004',
    fullName: 'Rashida Khatun',
    mobileNumber: '01612345678',
    dob: '1995-05-30',
    gender: 'FEMALE',
    nid: '4567890123456',
    address: '31 Kumarghata, Sylhet 3100',
    createdDate: '2026-02-10T11:00:00Z',
  },
  {
    id: 'pat-5',
    uhid: 'SYL-2026-00005',
    fullName: 'Jamal Hossain',
    mobileNumber: '01512345678',
    dob: '1970-01-20',
    gender: 'MALE',
    nid: '5678901234567',
    address: '5 Subid Bazar, Sylhet 3100',
    createdDate: '2026-02-15T14:20:00Z',
  },
  {
    id: 'pat-6',
    uhid: 'SYL-2026-00006',
    fullName: 'Nasima Begum',
    mobileNumber: '01312345678',
    dob: '1988-09-12',
    gender: 'FEMALE',
    nid: '6789012345678',
    address: '42 Shibganj, Sylhet 3100',
    createdDate: '2026-03-01T09:15:00Z',
  },
];

// ===== Appointments =====
export const mockAppointments: Appointment[] = [
  {
    id: 'apt-1',
    patient: mockPatients[0],
    doctor: mockDoctors[0],
    appointmentDate: '2026-08-19T09:00:00Z',
    tokenNumber: 1,
    status: 'IN_CONSULTATION',
  },
  {
    id: 'apt-2',
    patient: mockPatients[1],
    doctor: mockDoctors[0],
    appointmentDate: '2026-08-19T09:30:00Z',
    tokenNumber: 2,
    status: 'WAITING',
  },
  {
    id: 'apt-3',
    patient: mockPatients[2],
    doctor: mockDoctors[1],
    appointmentDate: '2026-08-19T10:00:00Z',
    tokenNumber: 1,
    status: 'COMPLETED',
  },
  {
    id: 'apt-4',
    patient: mockPatients[3],
    doctor: mockDoctors[0],
    appointmentDate: '2026-08-19T10:00:00Z',
    tokenNumber: 3,
    status: 'WAITING',
  },
  {
    id: 'apt-5',
    patient: mockPatients[4],
    doctor: mockDoctors[2],
    appointmentDate: '2026-08-19T10:30:00Z',
    tokenNumber: 1,
    status: 'WAITING',
  },
  {
    id: 'apt-6',
    patient: mockPatients[5],
    doctor: mockDoctors[0],
    appointmentDate: '2026-08-19T11:00:00Z',
    tokenNumber: 4,
    status: 'CANCELLED',
  },
];

// ===== Prescriptions =====
export const mockPrescriptions: Prescription[] = [
  {
    id: 'rx-1',
    appointment: mockAppointments[2],
    patient: mockPatients[2],
    doctor: mockDoctors[1],
    diagnosis: 'Acute Viral Bronchitis',
    chiefComplaints: ['Persistent cough for 5 days', 'Low-grade fever', 'Chest congestion'],
    medicines: [
      { name: 'Amoxicillin 500mg', dosage: '500mg', duration: '7 days', frequency: 'Three times daily' },
      { name: 'Salbutamol Inhaler', dosage: '2 puffs', duration: '14 days', frequency: 'As needed' },
      { name: 'Paracetamol 500mg', dosage: '500mg', duration: '5 days', frequency: 'When fever > 100°F' },
    ],
    labOrders: [
      { testName: 'CBC', priority: 'ROUTINE', status: 'COMPLETED' },
      { testName: 'Chest X-Ray', priority: 'URGENT', status: 'PENDING' },
    ],
    createdDate: '2026-08-19T10:45:00Z',
  },
  {
    id: 'rx-2',
    appointment: mockAppointments[0],
    patient: mockPatients[0],
    doctor: mockDoctors[0],
    diagnosis: 'Essential Hypertension - Stage 1',
    chiefComplaints: ['Headache for 2 weeks', 'Occasional dizziness', 'High BP readings at home'],
    medicines: [
      { name: 'Amlodipine 5mg', dosage: '5mg', duration: '30 days', frequency: 'Once daily (morning)' },
      { name: 'Losartan 50mg', dosage: '50mg', duration: '30 days', frequency: 'Once daily (evening)' },
    ],
    labOrders: [
      { testName: 'Lipid Profile', priority: 'ROUTINE', status: 'PENDING' },
      { testName: 'Renal Function Test', priority: 'ROUTINE', status: 'PENDING' },
      { testName: 'ECG', priority: 'ROUTINE', status: 'PENDING' },
    ],
    createdDate: '2026-08-19T09:30:00Z',
  },
];

// ===== Billing =====
export const mockBillings: Billing[] = [
  {
    id: 'bill-1',
    patient: mockPatients[2],
    invoiceNumber: 'INV-2026-0001',
    totalAmount: 2500,
    discount: 0,
    paidAmount: 0,
    status: 'UNPAID',
    lineItems: [
      { description: 'Consultation Fee - Dr. Nusrat Jahan', quantity: 1, unitPrice: 800, total: 800 },
      { description: 'CBC Test', quantity: 1, unitPrice: 500, total: 500 },
      { description: 'Chest X-Ray', quantity: 1, unitPrice: 1200, total: 1200 },
    ],
    createdDate: '2026-08-19T10:50:00Z',
  },
  {
    id: 'bill-2',
    patient: mockPatients[0],
    invoiceNumber: 'INV-2026-0002',
    totalAmount: 3500,
    discount: 500,
    paidAmount: 3000,
    status: 'PAID',
    lineItems: [
      { description: 'Consultation Fee - Dr. Arif Hassan', quantity: 1, unitPrice: 1200, total: 1200 },
      { description: 'Lipid Profile Test', quantity: 1, unitPrice: 800, total: 800 },
      { description: 'Renal Function Test', quantity: 1, unitPrice: 700, total: 700 },
      { description: 'ECG', quantity: 1, unitPrice: 800, total: 800 },
    ],
    createdDate: '2026-08-19T09:45:00Z',
  },
  {
    id: 'bill-3',
    patient: mockPatients[4],
    invoiceNumber: 'INV-2026-0003',
    totalAmount: 1500,
    discount: 0,
    paidAmount: 500,
    status: 'PARTIAL',
    lineItems: [
      { description: 'Consultation Fee - Dr. Kamal Uddin', quantity: 1, unitPrice: 1000, total: 1000 },
      { description: 'X-Ray Left Knee', quantity: 1, unitPrice: 500, total: 500 },
    ],
    createdDate: '2026-08-19T11:00:00Z',
  },
];

// ===== Beds =====
export const mockBeds: Bed[] = [
  { id: 'bed-1', bedNumber: 'G-01', wardName: 'General Ward A', status: 'AVAILABLE' },
  { id: 'bed-2', bedNumber: 'G-02', wardName: 'General Ward A', status: 'OCCUPIED' },
  { id: 'bed-3', bedNumber: 'G-03', wardName: 'General Ward A', status: 'AVAILABLE' },
  { id: 'bed-4', bedNumber: 'G-04', wardName: 'General Ward A', status: 'UNDER_CLEANING' },
  { id: 'bed-5', bedNumber: 'G-05', wardName: 'General Ward A', status: 'OCCUPIED' },
  { id: 'bed-6', bedNumber: 'G-06', wardName: 'General Ward A', status: 'AVAILABLE' },
  { id: 'bed-7', bedNumber: 'G-07', wardName: 'General Ward A', status: 'AVAILABLE' },
  { id: 'bed-8', bedNumber: 'G-08', wardName: 'General Ward A', status: 'OCCUPIED' },
  { id: 'bed-9', bedNumber: 'S-01', wardName: 'Semi-Private Ward', status: 'OCCUPIED' },
  { id: 'bed-10', bedNumber: 'S-02', wardName: 'Semi-Private Ward', status: 'AVAILABLE' },
  { id: 'bed-11', bedNumber: 'S-03', wardName: 'Semi-Private Ward', status: 'AVAILABLE' },
  { id: 'bed-12', bedNumber: 'S-04', wardName: 'Semi-Private Ward', status: 'UNDER_CLEANING' },
  { id: 'bed-13', bedNumber: 'P-01', wardName: 'Private Cabin', status: 'OCCUPIED' },
  { id: 'bed-14', bedNumber: 'P-02', wardName: 'Private Cabin', status: 'AVAILABLE' },
  { id: 'bed-15', bedNumber: 'P-03', wardName: 'Private Cabin', status: 'AVAILABLE' },
  { id: 'bed-16', bedNumber: 'ICU-01', wardName: 'ICU', status: 'OCCUPIED' },
  { id: 'bed-17', bedNumber: 'ICU-02', wardName: 'ICU', status: 'OCCUPIED' },
  { id: 'bed-18', bedNumber: 'ICU-03', wardName: 'ICU', status: 'AVAILABLE' },
  { id: 'bed-19', bedNumber: 'ICU-04', wardName: 'ICU', status: 'UNDER_CLEANING' },
  { id: 'bed-20', bedNumber: 'EM-01', wardName: 'Emergency', status: 'AVAILABLE' },
  { id: 'bed-21', bedNumber: 'EM-02', wardName: 'Emergency', status: 'OCCUPIED' },
  { id: 'bed-22', bedNumber: 'EM-03', wardName: 'Emergency', status: 'AVAILABLE' },
];

// ===== Queue =====
export const mockQueueUpdate: QueueUpdate = {
  doctorId: 'doc-1',
  currentToken: 1,
  queue: mockAppointments
    .filter((a) => a.doctor.id === 'doc-1' && a.appointmentDate.startsWith('2026-08-19'))
    .map((apt, idx) => ({
      appointment: apt,
      position: idx + 1,
      estimatedWait: idx * 15,
    })),
  lastUpdated: new Date().toISOString(),
};

// ===== Dashboard Stats =====
export const mockDashboardStats: DashboardStats = {
  patientsToday: 24,
  appointmentsToday: 18,
  bedsAvailable: 10,
  bedsTotal: 22,
  revenue: 45500,
  pendingBills: 3,
};

// ===== Users =====
export const mockUsers: Record<string, User> = {
  admin: {
    id: 'usr-1',
    username: 'admin',
    fullName: 'System Administrator',
    role: 'ADMIN',
    email: 'admin@carebridge.example',
  },
  doctor: {
    id: 'usr-2',
    username: 'doctor',
    fullName: 'Dr. Arif Hassan',
    role: 'DOCTOR',
    email: 'arif@carebridge.example',
  },
  receptionist: {
    id: 'usr-3',
    username: 'receptionist',
    fullName: 'Taslima Akter',
    role: 'RECEPTIONIST',
    email: 'taslima@carebridge.example',
  },
  labtech: {
    id: 'usr-4',
    username: 'labtech',
    fullName: 'Rafiqul Islam',
    role: 'LAB_TECH',
    email: 'rafiq@carebridge.example',
  },
  cashier: {
    id: 'usr-5',
    username: 'cashier',
    fullName: 'Farhana Rahman',
    role: 'CASHIER',
    email: 'farhana@carebridge.example',
  },
};
