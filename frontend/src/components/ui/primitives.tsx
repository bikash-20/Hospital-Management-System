import { useEffect, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, AlertTriangle, Check, Clock, AlertCircle, Printer } from 'lucide-react';
import type { Patient, AppointmentStatus, BillingStatus, BedStatus } from '@/types';

/* ============================================================================
 * StatusPill — one source of truth for status colors & labels
 * Used by Appointments, Prescriptions, Billing, BedManagement, LabResults
 * ========================================================================= */

type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary';

interface ToneStyle {
  bg: string;
  fg: string;
  border: string;
}

const toneStyles: Record<StatusTone, ToneStyle> = {
  success: { bg: 'bg-emerald-500/12', fg: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/25' },
  warning: { bg: 'bg-amber-500/12', fg: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500/25' },
  danger: { bg: 'bg-red-500/12', fg: 'text-red-600 dark:text-red-400', border: 'border-red-500/25' },
  info: { bg: 'bg-blue-500/12', fg: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500/25' },
  neutral: { bg: 'bg-surface-200/60 dark:bg-surface-700/40', fg: 'text-surface-600 dark:text-surface-300', border: 'border-surface-300 dark:border-surface-600' },
  primary: { bg: 'bg-primary-500/12', fg: 'text-primary-600 dark:text-primary-400', border: 'border-primary-500/25' },
};

const appointmentStatusMap: Record<AppointmentStatus, { tone: StatusTone; label: string }> = {
  WAITING: { tone: 'warning', label: 'Waiting' },
  IN_CONSULTATION: { tone: 'info', label: 'In Consultation' },
  COMPLETED: { tone: 'success', label: 'Completed' },
  CANCELLED: { tone: 'danger', label: 'Cancelled' },
};

const billingStatusMap: Record<BillingStatus, { tone: StatusTone; label: string; icon: typeof Check }> = {
  PAID: { tone: 'success', label: 'Paid', icon: Check },
  PARTIAL: { tone: 'warning', label: 'Partial', icon: Clock },
  UNPAID: { tone: 'danger', label: 'Unpaid', icon: AlertCircle },
};

const bedStatusMap: Record<BedStatus, { tone: StatusTone; label: string }> = {
  AVAILABLE: { tone: 'success', label: 'Available' },
  OCCUPIED: { tone: 'danger', label: 'Occupied' },
  UNDER_CLEANING: { tone: 'warning', label: 'Cleaning' },
};

const labStatusMap: Record<string, { tone: StatusTone; label: string }> = {
  PENDING: { tone: 'warning', label: 'Pending' },
  IN_PROGRESS: { tone: 'info', label: 'In Progress' },
  COMPLETED: { tone: 'success', label: 'Completed' },
};

interface StatusPillProps {
  tone: StatusTone;
  label: string;
  className?: string;
}

export function StatusPill({ tone, label, className = '' }: StatusPillProps) {
  const style = toneStyles[tone];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${style.bg} ${style.fg} ${style.border} ${className}`}
    >
      {label}
    </span>
  );
}

export function AppointmentStatusPill({ status }: { status: AppointmentStatus }) {
  const cfg = appointmentStatusMap[status];
  return <StatusPill tone={cfg.tone} label={cfg.label} />;
}

export function BillingStatusPill({ status }: { status: BillingStatus }) {
  const cfg = billingStatusMap[status];
  const Icon = cfg.icon;
  const style = toneStyles[cfg.tone];
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${style.bg} ${style.fg} ${style.border}`}>
      <Icon className="w-3 h-3" aria-hidden />
      {cfg.label}
    </span>
  );
}

export function BedStatusPill({ status }: { status: BedStatus }) {
  const cfg = bedStatusMap[status];
  return <StatusPill tone={cfg.tone} label={cfg.label} />;
}

export function LabStatusPill({ status }: { status: string }) {
  const cfg = labStatusMap[status] ?? { tone: 'neutral' as StatusTone, label: status };
  return <StatusPill tone={cfg.tone} label={cfg.label} />;
}

/* ============================================================================
 * extractErrorMessage — uniform error-to-toast helper
 * Used by every mutation onError across the app
 * ========================================================================= */

interface AxiosLikeError {
  response?: { data?: { message?: string; errors?: Record<string, string> } };
  message?: string;
}

export function extractErrorMessage(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  const e = err as AxiosLikeError;
  if (e?.response?.data?.errors) {
    return Object.values(e.response.data.errors).join(', ');
  }
  return e?.response?.data?.message || e?.message || fallback;
}

/* ============================================================================
 * Modal — backdrop + centered dialog with Escape-to-close + body scroll lock
 * Replaces the duplicated AnimatePresence wrappers in PatientRegistration etc.
 * ========================================================================= */

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

const widthMap = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-xl', '2xl': 'max-w-2xl' };

export function Modal({ open, onClose, title, subtitle, children, maxWidth = 'lg' }: ModalProps) {
  // Escape-to-close
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Body scroll lock
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            onClick={onClose}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label={title}
              onClick={(e) => e.stopPropagation()}
              className={`card w-full ${widthMap[maxWidth]} max-h-[90vh] overflow-y-auto shadow-2xl`}
            >
              <div className="p-5 sm:p-6 border-b border-surface-100 dark:border-[#2A2F38] flex items-center justify-between">
                <div>
                  <h2 className="text-heading text-surface-900 dark:text-white">{title}</h2>
                  {subtitle && <p className="text-caption text-surface-500 mt-0.5">{subtitle}</p>}
                </div>
                <button
                  onClick={onClose}
                  className="p-2.5 rounded-xl hover:bg-surface-100 dark:hover:bg-white/5 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 transition-colors focus-ring"
                  style={{ minWidth: '44px', minHeight: '44px' }}
                  aria-label="Close dialog"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ============================================================================
 * DuplicatePatientWarning — surface the UI that already existed but was dead
 * ========================================================================= */

export function DuplicatePatientWarning({ patient }: { patient: Patient }) {
  return (
    <div className="p-3 bg-amber-50 dark:bg-amber-500/8 border border-amber-200 dark:border-amber-500/20 rounded-xl flex items-start gap-3">
      <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" aria-hidden />
      <div>
        <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Duplicate Patient Found</p>
        <p className="text-xs text-amber-600 dark:text-amber-400/70 mt-0.5">
          A patient with this mobile number and DOB already exists:{' '}
          <span className="font-medium">{patient.fullName}</span> (UHID: {patient.uhid})
        </p>
      </div>
    </div>
  );
}

/* ============================================================================
 * PatientSearchInput — shared search box used by PatientRegistration +
 * PatientVisitHistory. Returns the raw input + a search button + dropdown
 * of matches; click selects a patient.
 * ========================================================================= */

interface PatientSearchInputProps {
  query: string;
  onQueryChange: (v: string) => void;
  results: Patient[];
  onSelect: (p: Patient) => void;
  placeholder?: string;
  label?: string;
}

export function PatientSearchInput({
  query,
  onQueryChange,
  results,
  onSelect,
  placeholder = 'Search by name, UHID, or mobile number...',
  label = 'Search patients',
}: PatientSearchInputProps) {
  return (
    <div className="relative">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" aria-hidden />
      <input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        className="w-full pl-12 pr-4 py-3 card border-0 text-surface-900 dark:text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all"
        aria-label={label}
      />
      {query && results.length > 0 && (
        <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
          {results.slice(0, 10).map((patient) => (
            <button
              key={patient.id}
              type="button"
              onClick={() => {
                onSelect(patient);
                onQueryChange('');
              }}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-surface-50 dark:hover:bg-white/5 transition-colors text-left"
            >
              <div className="w-10 h-10 bg-primary-500/10 rounded-full flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-primary-600 dark:text-primary-400">
                  {patient.fullName.charAt(0)}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-surface-900 dark:text-white truncate">{patient.fullName}</p>
                <p className="text-xs text-surface-500">
                  {patient.uhid} · {patient.mobileNumber}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================================
 * PrintModal — wraps printable layouts. Call onClose to dismiss; trigger
 * window.print() externally when ready.
 * ========================================================================= */

interface PrintModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function PrintModal({ open, onClose, title, children }: PrintModalProps) {
  // Same backdrop behavior as Modal
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 print:hidden"
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4 print:static print:p-0 print:block"
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label={title}
              className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl print:shadow-none print:border-0 print:max-h-none print:max-w-full"
            >
              <div className="p-5 sm:p-6 border-b border-surface-100 dark:border-[#2A2F38] flex items-center justify-between print:hidden">
                <h2 className="text-heading text-surface-900 dark:text-white">{title}</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="p-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white transition-colors focus-ring"
                    style={{ minWidth: '44px', minHeight: '44px' }}
                    aria-label="Print"
                  >
                    <Printer className="w-5 h-5" />
                  </button>
                  <button
                    onClick={onClose}
                    className="p-2.5 rounded-xl hover:bg-surface-100 dark:hover:bg-white/5 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 transition-colors focus-ring"
                    style={{ minWidth: '44px', minHeight: '44px' }}
                    aria-label="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}