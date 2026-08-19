import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { Users, Calendar, FileText, Bed, Receipt, Activity } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: 'default' | 'search' | 'error';
}

const variantStyles = {
  default: {
    bg: 'bg-surface-50 dark:bg-[#111820]',
    border: 'border-dashed border-surface-200 dark:border-[#252D3A]',
  },
  search: {
    bg: 'bg-blue-50 dark:bg-blue-500/5',
    border: 'border-dashed border-blue-200 dark:border-blue-500/20',
  },
  error: {
    bg: 'bg-red-50 dark:bg-red-500/5',
    border: 'border-dashed border-red-200 dark:border-red-500/20',
  },
};

export default function EmptyState({
  icon: Icon = Users,
  title,
  description,
  action,
  variant = 'default',
}: EmptyStateProps) {
  const styles = variantStyles[variant];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={`rounded-xl border ${styles.bg} ${styles.border} px-6 py-12 text-center`}
    >
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
        className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-surface-100 dark:bg-[#1A2230] flex items-center justify-center"
      >
        <Icon className="w-8 h-8 text-surface-400 dark:text-surface-500" />
      </motion.div>
      <h3 className="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1">
        {title}
      </h3>
      {description && (
        <p className="text-xs text-surface-500 dark:text-surface-400 max-w-xs mx-auto">
          {description}
        </p>
      )}
      {action && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={action.onClick}
          className="mt-4 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {action.label}
        </motion.button>
      )}
    </motion.div>
  );
}

// Pre-configured empty states for common scenarios
export function EmptyPatients({ onRegister }: { onRegister?: () => void }) {
  return (
    <EmptyState
      icon={Users}
      title="No patients registered yet"
      description="Register your first patient to get started with the system"
      action={onRegister ? { label: 'Register Patient', onClick: onRegister } : undefined}
    />
  );
}

export function EmptyAppointments() {
  return (
    <EmptyState
      icon={Calendar}
      title="No appointments scheduled"
      description="There are no appointments for this time period"
    />
  );
}

export function EmptyPrescriptions() {
  return (
    <EmptyState
      icon={FileText}
      title="No prescriptions found"
      description="Prescriptions will appear here after consultations"
    />
  );
}

export function EmptyBeds() {
  return (
    <EmptyState
      icon={Bed}
      title="No bed data available"
      description="Bed management data will appear here"
    />
  );
}

export function EmptyBilling() {
  return (
    <EmptyState
      icon={Receipt}
      title="No invoices yet"
      description="Invoices will be created when services are billed"
    />
  );
}

export function EmptyQueue() {
  return (
    <EmptyState
      icon={Activity}
      title="Queue is empty"
      description="No patients are currently waiting"
    />
  );
}

export function SearchEmpty({ query }: { query: string }) {
  return (
    <EmptyState
      variant="search"
      title={`No results for "${query}"`}
      description="Try adjusting your search terms or filters"
    />
  );
}
