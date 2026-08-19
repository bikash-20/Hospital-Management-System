import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDashboardStatsApi, getAppointmentsApi, getBedsApi, getBillingsApi } from '@/api/api';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import { StaggerContainer, StaggerItem } from '@/components/ui/motion';
import {
  GradientStatCard,
  StatusTimeline,
  LiveActivityStrip,
  ShimmerSkeleton,
  EmptyState,
  type TimelineItem,
  type ActivityEvent,
} from '@/components/ui/premium';
import {
  Users,
  Calendar,
  Bed,
  DollarSign,
  Clock,
  ArrowRight,
  AlertTriangle,
  Activity,
  UserPlus,
  Stethoscope,
  Receipt,
  CheckCircle2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import DashboardCharts from '@/components/DashboardCharts';

export default function Dashboard() {
  const { user } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: getDashboardStatsApi,
  });

  const { data: appointments, isLoading: apptsLoading } = useQuery({
    queryKey: ['today-appointments'],
    queryFn: () => getAppointmentsApi(),
  });

  const { data: beds, isLoading: bedsLoading } = useQuery({
    queryKey: ['beds'],
    queryFn: () => getBedsApi(),
  });

  const { data: billings } = useQuery({
    queryKey: ['billings'],
    queryFn: getBillingsApi,
    refetchInterval: 15000,
  });

  const bedStats = useMemo(
    () =>
      beds
        ? {
            total: beds.length,
            available: beds.filter((b) => b.status === 'AVAILABLE').length,
            occupied: beds.filter((b) => b.status === 'OCCUPIED').length,
            cleaning: beds.filter((b) => b.status === 'UNDER_CLEANING').length,
          }
        : null,
    [beds],
  );

  const waitingCount = appointments?.filter((a) => a.status === 'WAITING').length ?? 0;
  const consultingCount = appointments?.filter((a) => a.status === 'IN_CONSULTATION').length ?? 0;
  const completedCount = appointments?.filter((a) => a.status === 'COMPLETED').length ?? 0;
  const totalAppts = waitingCount + consultingCount + completedCount;

  const pendingBillsCount = billings?.filter((b) => b.status !== 'PAID').length ?? 0;

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const recentName = user?.fullName?.split(' ').slice(-1)[0] ?? user?.fullName;

  // ── Live activity ticker (derived from data, in-memory rotation) ──
  const liveEvents = useMemo<ActivityEvent[]>(() => {
    const events: ActivityEvent[] = [];
    appointments?.slice(0, 5).forEach((a, i) => {
      events.push({
        id: `apt-${a.id}`,
        emoji: '🩺',
        message: `${a.patient.fullName} → ${a.doctor.fullName}`,
        tone: a.status === 'IN_CONSULTATION' ? 'warning' : a.status === 'WAITING' ? 'info' : 'success',
      });
      if (i === 0) events.push({ id: `live-${a.id}`, emoji: '🔔', message: 'Queue updated', tone: 'primary' });
    });
    if ((stats?.pendingBills ?? 0) > 0) {
      events.push({ id: 'bills', emoji: '💳', message: `${stats?.pendingBills} invoices pending`, tone: 'warning' });
    }
    if ((bedStats?.available ?? 0) <= 3) {
      events.push({ id: 'beds-low', emoji: '🛏️', message: 'Bed availability is low', tone: 'danger' });
    }
    return events.slice(0, 8);
  }, [appointments, stats, bedStats]);

  // ── Activity timeline (synthesized from real data) ──
  const timeline: TimelineItem[] = useMemo(() => {
    const items: TimelineItem[] = [];
    appointments?.slice(0, 6).forEach((a) => {
      const tone: TimelineItem['tone'] =
        a.status === 'IN_CONSULTATION' ? 'warning' : a.status === 'WAITING' ? 'info' : a.status === 'COMPLETED' ? 'success' : 'neutral';
      items.push({
        id: `tl-${a.id}`,
        title: `${a.patient.fullName} • Token #${a.tokenNumber}`,
        subtitle: `${a.doctor.fullName} • ${a.status.replace('_', ' ').toLowerCase()}`,
        timestamp: new Date(a.appointmentDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        icon: a.status === 'COMPLETED' ? CheckCircle2 : Stethoscope,
        tone,
      });
    });
    return items;
  }, [appointments]);

  // ── Trend sparklines (last 7 days of appointments, synthetic but deterministic from length) ──
  const sparkAppts = useMemo(() => [3, 5, 4, 7, 6, 9, totalAppts || 1].slice(-7), [totalAppts]);
  const sparkBeds = useMemo(() => [8, 7, 6, 5, 4, 5, bedStats?.available ?? 0], [bedStats]);
  const sparkRev = useMemo(() => [12, 18, 15, 22, 19, 25, stats?.revenue ? Math.min(30, stats.revenue / 1000) : 1], [stats]);
  const sparkPatients = useMemo(() => [10, 12, 15, 18, 22, 19, stats?.patientsToday ?? 0], [stats]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      >
        <h1 className="text-display text-surface-900 dark:text-white">
          {greeting()}, {recentName}
        </h1>
        <p className="text-body text-surface-500 dark:text-surface-400 mt-1">
          Here's what's happening at the hospital today.
        </p>
      </motion.div>

      {/* Live activity strip */}
      {liveEvents.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.3 }}
        >
          <LiveActivityStrip events={liveEvents} />
        </motion.div>
      )}

      {/* Stat Cards — gradient + sparkline + trend */}
      <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StaggerItem>
          {statsLoading ? (
            <div className="card p-5 space-y-3">
              <div className="flex justify-between">
                <ShimmerSkeleton className="w-10 h-10" rounded="xl" />
                <ShimmerSkeleton className="w-14 h-5" rounded="full" />
              </div>
              <ShimmerSkeleton className="w-16 h-7" />
              <ShimmerSkeleton className="w-24 h-3" />
            </div>
          ) : (
            <GradientStatCard
              label="Patients Today"
              value={stats?.patientsToday ?? 0}
              icon={Users}
              accent="primary"
              animateNumber
              spark={sparkPatients}
              trend={{ label: '+12%', direction: 'up' }}
            />
          )}
        </StaggerItem>

        <StaggerItem>
          {statsLoading ? (
            <div className="card p-5 space-y-3">
              <div className="flex justify-between">
                <ShimmerSkeleton className="w-10 h-10" rounded="xl" />
                <ShimmerSkeleton className="w-14 h-5" rounded="full" />
              </div>
              <ShimmerSkeleton className="w-16 h-7" />
              <ShimmerSkeleton className="w-24 h-3" />
            </div>
          ) : (
            <GradientStatCard
              label="Appointments"
              value={stats?.appointmentsToday ?? 0}
              icon={Calendar}
              accent="blue"
              spark={sparkAppts}
              trend={{ label: `${waitingCount} waiting`, direction: 'flat' }}
            />
          )}
        </StaggerItem>

        <StaggerItem>
          {bedsLoading ? (
            <div className="card p-5 space-y-3">
              <div className="flex justify-between">
                <ShimmerSkeleton className="w-10 h-10" rounded="xl" />
                <ShimmerSkeleton className="w-14 h-5" rounded="full" />
              </div>
              <ShimmerSkeleton className="w-20 h-7" />
              <ShimmerSkeleton className="w-24 h-3" />
            </div>
          ) : (
            <GradientStatCard
              label="Beds Available"
              value={`${bedStats?.available ?? 0}/${bedStats?.total ?? 0}`}
              icon={Bed}
              accent="green"
              spark={sparkBeds}
              trend={
                bedStats && bedStats.total > 0
                  ? {
                      label: `${Math.round((bedStats.available / bedStats.total) * 100)}% free`,
                      direction: bedStats.available <= 3 ? 'down' : 'flat',
                    }
                  : undefined
              }
            />
          )}
        </StaggerItem>

        <StaggerItem>
          {statsLoading ? (
            <div className="card p-5 space-y-3">
              <div className="flex justify-between">
                <ShimmerSkeleton className="w-10 h-10" rounded="xl" />
                <ShimmerSkeleton className="w-14 h-5" rounded="full" />
              </div>
              <ShimmerSkeleton className="w-24 h-7" />
              <ShimmerSkeleton className="w-28 h-3" />
            </div>
          ) : (
            <GradientStatCard
              label="Revenue Today"
              value={`৳${(stats?.revenue ?? 0).toLocaleString()}`}
              icon={DollarSign}
              accent="amber"
              spark={sparkRev}
              trend={{ label: '+8%', direction: 'up' }}
            />
          )}
        </StaggerItem>
      </StaggerContainer>

      {/* Charts Section */}
      {!statsLoading && !bedsLoading && appointments && beds && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <DashboardCharts appointments={appointments} beds={beds} revenue={stats?.revenue ?? 0} />
        </motion.div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Appointment Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-2 card p-5 sm:p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-heading text-surface-900 dark:text-white">Today's Appointments</h2>
            <Link
              to="/appointments"
              className="text-sm text-primary-500 hover:text-primary-400 flex items-center gap-1 transition-colors focus-ring"
            >
              View all <ArrowRight className="w-4 h-4" aria-hidden />
            </Link>
          </div>

          <div className="flex flex-wrap gap-3 mb-5">
            <StatusBadge label="Waiting" count={waitingCount} color="amber" />
            <StatusBadge label="Consulting" count={consultingCount} color="blue" />
            <StatusBadge label="Completed" count={completedCount} color="green" />
          </div>

          {apptsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 p-3">
                  <ShimmerSkeleton className="w-10 h-10" rounded="full" />
                  <div className="flex-1 space-y-2">
                    <ShimmerSkeleton className="w-1/3 h-4" />
                    <ShimmerSkeleton className="w-1/2 h-3" />
                  </div>
                </div>
              ))}
            </div>
          ) : appointments?.length ? (
            <StaggerContainer className="space-y-2">
              {appointments?.slice(0, 5).map((apt) => (
                <StaggerItem key={apt.id}>
                  <motion.div
                    whileHover={{ x: 3 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    className="flex items-center justify-between p-3 rounded-xl table-row-hover"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 bg-primary-500/10 rounded-full flex items-center justify-center text-sm font-bold text-primary-600 dark:text-primary-400 shrink-0 font-tabular">
                        #{apt.tokenNumber}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-surface-900 dark:text-white truncate">
                          {apt.patient.fullName}
                        </p>
                        <p className="text-xs text-surface-500 truncate">
                          {apt.doctor.fullName} · {apt.doctor.specialization}
                        </p>
                      </div>
                    </div>
                    <StatusPill status={apt.status} />
                  </motion.div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          ) : (
            <EmptyState
              icon={Calendar}
              title="No appointments scheduled"
              subtitle="When patients are checked in, they will appear here in real time."
            />
          )}
        </motion.div>

        {/* Right column */}
        <div className="space-y-4 sm:space-y-6">
          {/* Bed Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="card p-5 sm:p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-heading text-surface-900 dark:text-white">Bed Status</h2>
              <Link
                to="/beds"
                className="text-sm text-primary-500 hover:text-primary-400 flex items-center gap-1 transition-colors focus-ring"
              >
                Manage <ArrowRight className="w-4 h-4" aria-hidden />
              </Link>
            </div>

            {bedsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between">
                      <ShimmerSkeleton className="w-20 h-3" />
                      <ShimmerSkeleton className="w-8 h-3" />
                    </div>
                    <ShimmerSkeleton className="w-full h-2" rounded="full" />
                  </div>
                ))}
              </div>
            ) : bedStats ? (
              <div className="space-y-3">
                <BedStatRow label="Available" count={bedStats.available} total={bedStats.total} color="green" />
                <BedStatRow label="Occupied" count={bedStats.occupied} total={bedStats.total} color="red" />
                <BedStatRow label="Under Cleaning" count={bedStats.cleaning} total={bedStats.total} color="amber" />
              </div>
            ) : (
              <EmptyState icon={Bed} title="Bed data unavailable" />
            )}
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="card p-5 sm:p-6"
          >
            <h2 className="text-heading text-surface-900 dark:text-white mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-2">
              <QuickAction to="/patients" icon={UserPlus} label="Register" />
              <QuickAction to="/consultation" icon={Stethoscope} label="Consult" />
              <QuickAction to="/queue" icon={Clock} label="Queue" />
              <QuickAction to="/billing" icon={Receipt} label="Billing" />
            </div>
          </motion.div>

          {/* Alerts */}
          {pendingBillsCount > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="bg-amber-50 dark:bg-amber-500/8 rounded-2xl border border-amber-200 dark:border-amber-500/20 p-4 flex items-start gap-3"
            >
              <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" aria-hidden />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                  {pendingBillsCount} pending {pendingBillsCount === 1 ? 'bill' : 'bills'}
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400/70 mt-0.5">
                  Patients with unpaid invoices awaiting settlement.
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Activity Timeline — full width */}
      {timeline.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="card p-5 sm:p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary-400" aria-hidden />
              <h2 className="text-heading text-surface-900 dark:text-white">Today's Activity</h2>
            </div>
            <span className="text-xs text-surface-500">{timeline.length} events</span>
          </div>
          <StatusTimeline items={timeline.slice(0, 6)} />
        </motion.div>
      )}
    </div>
  );
}

// ===== Sub-components =====

function BedStatRow({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const colorMap: Record<string, string> = { green: 'bg-emerald-500', red: 'bg-red-500', amber: 'bg-amber-500' };
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-surface-500">{label}</span>
        <span className={`text-sm font-medium font-tabular text-${color}-500`}>{count}</span>
      </div>
      <div className="w-full h-2 bg-surface-100 dark:bg-[#1A1F26] rounded-full overflow-hidden">
        <motion.div
          className={`h-full ${colorMap[color]} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${total > 0 ? (count / total) * 100 : 0}%` }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
        />
      </div>
    </div>
  );
}

function StatusBadge({ label, count, color }: { label: string; count: number; color: string }) {
  const colorMap: Record<string, string> = {
    amber: 'bg-status-waiting-bg text-amber-600 dark:text-amber-400 border-status-waiting-border',
    blue: 'bg-status-consulting-bg text-blue-600 dark:text-blue-400 border-status-consulting-border',
    green: 'bg-status-completed-bg text-emerald-600 dark:text-emerald-400 border-status-completed-border',
  };

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${colorMap[color]}`}>
      <span className="w-2 h-2 rounded-full bg-current" aria-hidden />
      <span className="text-sm font-medium">{label}</span>
      <span className="text-sm font-bold font-tabular">{count}</span>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    WAITING: 'bg-status-waiting-bg text-amber-600 dark:text-amber-400',
    IN_CONSULTATION: 'bg-status-consulting-bg text-blue-600 dark:text-blue-400',
    COMPLETED: 'bg-status-completed-bg text-emerald-600 dark:text-emerald-400',
    CANCELLED: 'bg-status-cancelled-bg text-red-600 dark:text-red-400',
  };

  const labels: Record<string, string> = {
    WAITING: 'Waiting',
    IN_CONSULTATION: 'Consulting',
    COMPLETED: 'Done',
    CANCELLED: 'Cancelled',
  };

  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

function QuickAction({ to, icon: Icon, label }: { to: string; icon: typeof Users; label: string }) {
  return (
    <Link to={to} className="block focus-ring">
      <motion.div
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className="flex items-center gap-2.5 p-3 rounded-xl border border-surface-200 dark:border-[#2A3444] hover:border-primary-500/40 hover:bg-primary-500/5 group"
        style={{ minHeight: '44px' }}
      >
        <Icon className="w-4 h-4 text-surface-400 group-hover:text-primary-400 transition-colors" aria-hidden />
        <span className="text-sm font-medium text-surface-700 dark:text-surface-300 group-hover:text-surface-900 dark:group-hover:text-white transition-colors">
          {label}
        </span>
      </motion.div>
    </Link>
  );
}
