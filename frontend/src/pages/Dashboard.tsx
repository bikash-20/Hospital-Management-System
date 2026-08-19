import { useQuery } from '@tanstack/react-query';
import { getDashboardStatsApi, getAppointmentsApi, getBedsApi } from '@/api/api';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import {
  StaggerContainer,
  StaggerItem,
  InteractiveCard,
  AnimatedNumber,
} from '@/components/ui/motion';
import {
  Users,
  Calendar,
  Bed,
  DollarSign,
  Clock,
  FileText,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: getDashboardStatsApi,
  });

  const { data: appointments } = useQuery({
    queryKey: ['today-appointments'],
    queryFn: () => getAppointmentsApi(),
  });

  const { data: beds } = useQuery({
    queryKey: ['beds'],
    queryFn: () => getBedsApi(),
  });

  const bedStats = beds
    ? {
        total: beds.length,
        available: beds.filter((b) => b.status === 'AVAILABLE').length,
        occupied: beds.filter((b) => b.status === 'OCCUPIED').length,
        cleaning: beds.filter((b) => b.status === 'UNDER_CLEANING').length,
      }
    : null;

  const waitingCount = appointments?.filter((a) => a.status === 'WAITING').length ?? 0;
  const consultingCount = appointments?.filter((a) => a.status === 'IN_CONSULTATION').length ?? 0;
  const completedCount = appointments?.filter((a) => a.status === 'COMPLETED').length ?? 0;

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
          {greeting()}, {user?.fullName?.split(' ').slice(-1)[0]}
        </h1>
        <p className="text-surface-500 dark:text-surface-400 mt-1">
          Here's what's happening at the hospital today.
        </p>
      </motion.div>

      {/* Stats Grid */}
      <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StaggerItem>
          <StatCard
            label="Patients Today"
            value={stats?.patientsToday ?? 0}
            icon={Users}
            color="primary"
            trend="+12%"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Appointments"
            value={stats?.appointmentsToday ?? 0}
            icon={Calendar}
            color="blue"
            trend={`${waitingCount} waiting`}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Beds Available"
            value={`${bedStats?.available ?? 0}/${bedStats?.total ?? 0}`}
            icon={Bed}
            color="green"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Revenue Today"
            value={`৳${(stats?.revenue ?? 0).toLocaleString()}`}
            icon={DollarSign}
            color="amber"
            trend="+8%"
          />
        </StaggerItem>
      </StaggerContainer>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Appointment Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="lg:col-span-2 bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-700/50 p-6 shadow-card dark:shadow-none"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-surface-900 dark:text-white">
              Today's Appointments
            </h2>
            <Link
              to="/appointments"
              className="text-sm text-primary-500 hover:text-primary-400 flex items-center gap-1 transition-colors"
            >
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="flex gap-4 mb-6">
            <StatusBadge label="Waiting" count={waitingCount} color="amber" />
            <StatusBadge label="Consulting" count={consultingCount} color="blue" />
            <StatusBadge label="Completed" count={completedCount} color="green" />
          </div>

          <StaggerContainer className="space-y-3">
            {appointments?.slice(0, 5).map((apt) => (
              <StaggerItem key={apt.id}>
                <motion.div
                  whileHover={{ x: 4, backgroundColor: 'rgba(8,145,178,0.03)' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  className="flex items-center justify-between p-3 rounded-xl border border-transparent"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-500/10 rounded-full flex items-center justify-center text-sm font-bold text-primary-600 dark:text-primary-400">
                      #{apt.tokenNumber}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-surface-900 dark:text-white">
                        {apt.patient.fullName}
                      </p>
                      <p className="text-xs text-surface-500">
                        {apt.doctor.fullName} · {apt.doctor.specialization}
                      </p>
                    </div>
                  </div>
                  <StatusPill status={apt.status} />
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </motion.div>

        {/* Bed Overview + Quick Actions */}
        <div className="space-y-6">
          {/* Bed Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-700/50 p-6 shadow-card dark:shadow-none"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-surface-900 dark:text-white">
                Bed Status
              </h2>
              <Link
                to="/beds"
                className="text-sm text-primary-500 hover:text-primary-400 flex items-center gap-1 transition-colors"
              >
                Manage <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {bedStats && (
              <div className="space-y-3">
                <BedStatRow label="Available" count={bedStats.available} total={bedStats.total} color="green" />
                <BedStatRow label="Occupied" count={bedStats.occupied} total={bedStats.total} color="red" />
                <BedStatRow label="Under Cleaning" count={bedStats.cleaning} total={bedStats.total} color="amber" />
              </div>
            )}
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-700/50 p-6 shadow-card dark:shadow-none"
          >
            <h2 className="text-lg font-semibold text-surface-900 dark:text-white mb-4">
              Quick Actions
            </h2>
            <div className="space-y-2">
              <QuickAction to="/patients" icon={Users} label="Register Patient" />
              <QuickAction to="/consultation" icon={FileText} label="Start Consultation" />
              <QuickAction to="/queue" icon={Clock} label="View Queue" />
              <QuickAction to="/billing" icon={DollarSign} label="Process Billing" />
            </div>
          </motion.div>

          {/* Alerts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.4 }}
            className="bg-amber-50 dark:bg-amber-500/10 rounded-2xl border border-amber-200 dark:border-amber-500/30 p-4"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                  Pending Bills: {stats?.pendingBills ?? 0}
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400/70 mt-0.5">
                  {stats?.pendingBills ?? 0} patients have unpaid invoices
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// Sub-components
function StatCard({
  label,
  value,
  icon: Icon,
  color,
  trend,
}: {
  label: string;
  value: string | number;
  icon: typeof Users;
  color: string;
  trend?: string;
}) {
  const colorMap: Record<string, string> = {
    primary: 'bg-primary-500/10 text-primary-600 dark:text-primary-400',
    blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    green: 'bg-green-500/10 text-green-600 dark:text-green-400',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  };

  return (
    <InteractiveCard className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-700/50 p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2.5 rounded-xl ${colorMap[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <span className="text-xs font-medium text-green-500 bg-green-500/10 px-2 py-1 rounded-full flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            {trend}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-surface-900 dark:text-white">
        {typeof value === 'number' ? <AnimatedNumber value={value} /> : value}
      </p>
      <p className="text-sm text-surface-500 mt-1">{label}</p>
    </InteractiveCard>
  );
}

function BedStatRow({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const colorMap: Record<string, string> = { green: 'bg-green-500', red: 'bg-red-500', amber: 'bg-amber-500' };
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-surface-500">{label}</span>
        <span className={`text-sm font-medium text-${color}-500`}>{count}</span>
      </div>
      <div className="w-full h-2 bg-surface-100 dark:bg-surface-800 rounded-full overflow-hidden">
        <motion.div
          className={`h-full ${colorMap[color]} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${(count / total) * 100}%` }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] as [number, number, number, number], delay: 0.3 }}
        />
      </div>
    </div>
  );
}

function StatusBadge({ label, count, color }: { label: string; count: number; color: string }) {
  const colorMap: Record<string, string> = {
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    green: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
  };

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${colorMap[color]}`}>
      <span className="w-2 h-2 rounded-full bg-current" />
      <span className="text-sm font-medium">{label}</span>
      <span className="text-sm font-bold">{count}</span>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    WAITING: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    IN_CONSULTATION: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    COMPLETED: 'bg-green-500/10 text-green-600 dark:text-green-400',
    CANCELLED: 'bg-red-500/10 text-red-600 dark:text-red-400',
  };

  const labels: Record<string, string> = {
    WAITING: 'Waiting',
    IN_CONSULTATION: 'Consulting',
    COMPLETED: 'Done',
    CANCELLED: 'Cancelled',
  };

  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

function QuickAction({ to, icon: Icon, label }: { to: string; icon: typeof Users; label: string }) {
  return (
    <Link to={to}>
      <motion.div
        whileHover={{ x: 4, backgroundColor: 'rgba(8,145,178,0.03)' }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className="flex items-center gap-3 p-3 rounded-xl border border-surface-200 dark:border-surface-700/50 group"
      >
        <Icon className="w-5 h-5 text-surface-400 group-hover:text-primary-400 transition-colors" />
        <span className="text-sm font-medium text-surface-700 dark:text-surface-300 group-hover:text-surface-900 dark:group-hover:text-white transition-colors">
          {label}
        </span>
        <ArrowRight className="w-4 h-4 text-surface-300 dark:text-surface-600 ml-auto group-hover:text-primary-400 group-hover:translate-x-0.5 transition-all" />
      </motion.div>
    </Link>
  );
}
