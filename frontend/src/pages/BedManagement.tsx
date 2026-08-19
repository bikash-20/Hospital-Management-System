import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBedsApi, updateBedStatusApi } from '@/api/api';
import type { BedStatus } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { StaggerContainer, StaggerItem } from '@/components/ui/motion';
import {
  Check,
  X,
  AlertTriangle,
  Wind,
  LayoutGrid,
} from 'lucide-react';

const statusConfig: Record<BedStatus, { color: string; bg: string; border: string; label: string; icon: typeof Check }> = {
  AVAILABLE: { color: 'text-green-500', bg: 'bg-green-500/15', border: 'border-green-500/30', label: 'Available', icon: Check },
  OCCUPIED: { color: 'text-red-500', bg: 'bg-red-500/15', border: 'border-red-500/30', label: 'Occupied', icon: X },
  UNDER_CLEANING: { color: 'text-amber-500', bg: 'bg-amber-500/15', border: 'border-amber-500/30', label: 'Cleaning', icon: Wind },
};

export default function BedManagement() {
  const queryClient = useQueryClient();
  const [selectedWard, setSelectedWard] = useState<string | null>(null);

  const { data: beds, isLoading } = useQuery({
    queryKey: ['beds'],
    queryFn: () => getBedsApi(),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: BedStatus }) => updateBedStatusApi(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['beds'] }),
  });

  const wards = beds ? [...new Set(beds.map((b) => b.wardName))] : [];
  const filteredBeds = selectedWard ? beds?.filter((b) => b.wardName === selectedWard) : beds;

  const bedStats = beds ? {
    total: beds.length,
    available: beds.filter((b) => b.status === 'AVAILABLE').length,
    occupied: beds.filter((b) => b.status === 'OCCUPIED').length,
    cleaning: beds.filter((b) => b.status === 'UNDER_CLEANING').length,
  } : null;

  const wardsWithStats = wards.map((ward) => {
    const wardBeds = beds?.filter((b) => b.wardName === ward) ?? [];
    return { name: ward, total: wardBeds.length, available: wardBeds.filter((b) => b.status === 'AVAILABLE').length, occupied: wardBeds.filter((b) => b.status === 'OCCUPIED').length };
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-display text-surface-900 dark:text-white">Bed Management</h1>
        <p className="text-surface-500 dark:text-surface-400 mt-1">
          Monitor and manage bed availability across all wards
        </p>
      </motion.div>

      {/* Stats */}
      {bedStats && (
        <StaggerContainer className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <StaggerItem>
            <StatCard icon={LayoutGrid} label="Total Beds" value={bedStats.total} color="surface" />
          </StaggerItem>
          <StaggerItem>
            <StatCard icon={Check} label="Available" value={bedStats.available} color="green" />
          </StaggerItem>
          <StaggerItem>
            <StatCard icon={X} label="Occupied" value={bedStats.occupied} color="red" />
          </StaggerItem>
          <StaggerItem>
            <StatCard icon={Wind} label="Under Cleaning" value={bedStats.cleaning} color="amber" />
          </StaggerItem>
        </StaggerContainer>
      )}

      {/* Ward Tabs */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="flex items-center gap-2 overflow-x-auto pb-2">
        <WardTab label={`All Wards (${beds?.length ?? 0})`} active={!selectedWard} onClick={() => setSelectedWard(null)} />
        {wardsWithStats.map((ward) => (
          <WardTab key={ward.name} label={`${ward.name} (${ward.available}/${ward.total})`} active={selectedWard === ward.name} onClick={() => setSelectedWard(ward.name)} />
        ))}
      </motion.div>

      {/* Bed Grid */}
      {isLoading ? (
        <div className="text-center py-20 text-surface-400">Loading beds...</div>
      ) : (
        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredBeds?.map((bed) => {
              const config = statusConfig[bed.status];
              const StatusIcon = config.icon;
              return (
                <StaggerItem key={bed.id}>
                  <motion.div
                    whileHover={{ y: -4, boxShadow: '0 8px 30px rgba(0,0,0,0.08)' }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    className={`bg-white dark:bg-[#1A1F26] rounded-2xl border ${config.border} p-4 sm:p-5 group relative overflow-hidden`}
                  >
                    {/* Subtle gradient accent */}
                    <div className={`absolute top-0 left-0 right-0 h-1 ${
                      bed.status === 'AVAILABLE' ? 'bg-gradient-to-r from-green-400 to-green-500' :
                      bed.status === 'OCCUPIED' ? 'bg-gradient-to-r from-red-400 to-red-500' :
                      'bg-gradient-to-r from-amber-400 to-amber-500'
                    }`} />

                    <div className="flex items-center justify-between mb-3 mt-1">
                      <span className="text-lg font-bold text-surface-900 dark:text-white">{bed.bedNumber}</span>
                      <motion.div
                        animate={bed.status === 'AVAILABLE' ? { scale: [1, 1.1, 1] } : {}}
                        transition={{ duration: 2, repeat: Infinity }}
                        className={`p-1.5 rounded-lg ${config.bg}`}
                      >
                        <StatusIcon className={`w-4 h-4 ${config.color}`} />
                      </motion.div>
                    </div>

                    <p className="text-sm text-surface-500 mb-4">{bed.wardName}</p>

                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${config.bg} ${config.color}`}>
                        {config.label}
                      </span>

                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {bed.status !== 'AVAILABLE' && (
                          <motion.button
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => updateStatusMutation.mutate({ id: bed.id, status: 'AVAILABLE' })}
                            className="p-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-500 rounded-lg transition-colors"
                            title="Mark Available"
                          >
                            <Check className="w-3 h-3" />
                          </motion.button>
                        )}
                        {bed.status !== 'OCCUPIED' && (
                          <motion.button
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => updateStatusMutation.mutate({ id: bed.id, status: 'OCCUPIED' })}
                            className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors"
                            title="Mark Occupied"
                          >
                            <X className="w-3 h-3" />
                          </motion.button>
                        )}
                        {bed.status !== 'UNDER_CLEANING' && (
                          <motion.button
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => updateStatusMutation.mutate({ id: bed.id, status: 'UNDER_CLEANING' })}
                            className="p-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 rounded-lg transition-colors"
                            title="Start Cleaning"
                          >
                            <AlertTriangle className="w-3 h-3" />
                          </motion.button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                </StaggerItem>
              );
            })}
          </AnimatePresence>
        </StaggerContainer>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 sm:gap-6 justify-center pt-4 border-t border-surface-100 dark:border-[#2A2F38]">
        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-green-500 rounded-full" /><span className="text-xs text-surface-500">Available</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-500 rounded-full" /><span className="text-xs text-surface-500">Occupied</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-amber-500 rounded-full" /><span className="text-xs text-surface-500">Under Cleaning</span></div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: typeof LayoutGrid; label: string; value: number; color: string }) {
  const colorMap: Record<string, string> = {
    surface: 'bg-surface-100 dark:bg-surface-800 text-surface-500',
    green: 'bg-green-500/10 text-green-500',
    red: 'bg-red-500/10 text-red-500',
    amber: 'bg-amber-500/10 text-amber-500',
  };
  return (
    <div className="card p-4 flex items-center gap-4">
      <div className={`p-3 rounded-xl ${colorMap[color]}`}><Icon className="w-5 h-5" /></div>
      <div>
        <p className={`text-2xl font-bold ${color === 'surface' ? 'text-surface-900 dark:text-white' : `text-${color}-500`}`}>{value}</p>
        <p className="text-xs text-surface-500">{label}</p>
      </div>
    </div>
  );
}

function WardTab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
        active
          ? 'bg-primary-500/15 text-primary-600 dark:text-primary-400 border border-primary-500/30'
          : 'bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-400 hover:border-surface-300 dark:hover:border-surface-600'
      }`}
    >
      {label}
    </motion.button>
  );
}
