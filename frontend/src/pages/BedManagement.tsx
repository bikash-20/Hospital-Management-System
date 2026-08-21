import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getBedsApi,
  getWardsApi,
  createBedApi,
  deleteBedApi,
  updateBedStatusApi,
} from '@/api/api';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import type { Bed, BedStatus } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { StaggerContainer, StaggerItem } from '@/components/ui/motion';
import {
  BedStatusPill,
  extractErrorMessage,
  Modal,
} from '@/components/ui/primitives';
import {
  Check,
  X,
  AlertTriangle,
  Wind,
  LayoutGrid,
  Plus,
  Trash2,
} from 'lucide-react';

const statusConfig: Record<BedStatus, { color: string; bg: string; border: string; label: string; icon: typeof Check }> = {
  AVAILABLE: { color: 'text-green-500', bg: 'bg-green-500/15', border: 'border-green-500/30', label: 'Available', icon: Check },
  OCCUPIED: { color: 'text-red-500', bg: 'bg-red-500/15', border: 'border-red-500/30', label: 'Occupied', icon: X },
  UNDER_CLEANING: { color: 'text-amber-500', bg: 'bg-amber-500/15', border: 'border-amber-500/30', label: 'Cleaning', icon: Wind },
};

export default function BedManagement() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedWard, setSelectedWard] = useState<string | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [bedToDelete, setBedToDelete] = useState<Bed | null>(null);

  const canManageBeds = user?.role === 'ADMIN' || user?.role === 'RECEPTIONIST';

  const { data: beds, isLoading } = useQuery({
    queryKey: ['beds'],
    queryFn: () => getBedsApi(),
  });

  const { data: wards } = useQuery({
    queryKey: ['beds', 'wards'],
    queryFn: () => getWardsApi(),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: BedStatus }) => updateBedStatusApi(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['beds'] }),
    onError: (error) => {
      showToast(extractErrorMessage(error, 'Failed to update bed status'), 'error');
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload: { bedNumber: string; wardName: string }) => createBedApi(payload),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['beds'] });
      queryClient.invalidateQueries({ queryKey: ['beds', 'wards'] });
      setIsAddOpen(false);
      showToast(`Bed ${created.bedNumber} added to ${created.wardName}`, 'success');
    },
    onError: (error) => {
      showToast(extractErrorMessage(error, 'Failed to add bed'), 'error');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteBedApi(id),
    // Capture the bed being deleted at click time, so the success toast uses
    // the right bed number even if the user opens a different delete modal
    // while the first mutation is in flight (stale-closure bug fix).
    onSuccess: (_void, deletedId) => {
      const justDeleted = beds?.find((b) => b.id === deletedId);
      queryClient.invalidateQueries({ queryKey: ['beds'] });
      if (justDeleted) {
        showToast(`Bed ${justDeleted.bedNumber} removed`, 'success');
      } else {
        showToast('Bed removed', 'success');
      }
      setBedToDelete(null);
    },
    onError: (error) => {
      showToast(extractErrorMessage(error, 'Failed to remove bed'), 'error');
    },
  });

  const wardList = wards ?? [];
  const filteredBeds = selectedWard ? beds?.filter((b) => b.wardName === selectedWard) : beds;

  const bedStats = beds ? {
    total: beds.length,
    available: beds.filter((b) => b.status === 'AVAILABLE').length,
    occupied: beds.filter((b) => b.status === 'OCCUPIED').length,
    cleaning: beds.filter((b) => b.status === 'UNDER_CLEANING').length,
  } : null;

  const wardsWithStats = wardList.map((ward) => {
    const wardBeds = beds?.filter((b) => b.wardName === ward) ?? [];
    return { name: ward, total: wardBeds.length, available: wardBeds.filter((b) => b.status === 'AVAILABLE').length, occupied: wardBeds.filter((b) => b.status === 'OCCUPIED').length };
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
      >
        <div>
          <h1 className="text-display text-surface-900 dark:text-white">Bed Management</h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1">
            Monitor and manage bed availability across all wards
          </p>
        </div>
        {canManageBeds && (
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium shadow-sm focus-ring"
            data-testid="add-bed-button"
          >
            <Plus className="w-4 h-4" />
            Add Bed
          </motion.button>
        )}
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
              const isOccupied = bed.status === 'OCCUPIED';
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
                      <BedStatusPill status={bed.status} />

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
                        {canManageBeds && (
                          <motion.button
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setBedToDelete(bed)}
                            disabled={isOccupied}
                            className="p-1.5 bg-surface-100 dark:bg-white/5 hover:bg-red-500/15 text-surface-400 hover:text-red-500 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-surface-100 disabled:hover:text-surface-400"
                            title={isOccupied ? 'Discharge patient first to remove this bed' : 'Remove bed'}
                            aria-label={`Remove bed ${bed.bedNumber}`}
                            data-testid={`delete-bed-${bed.id}`}
                          >
                            <Trash2 className="w-3 h-3" />
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

      {/* Empty state when a ward has no beds */}
      {!isLoading && filteredBeds?.length === 0 && (
        <div className="card p-10 text-center">
          <LayoutGrid className="w-10 h-10 mx-auto text-surface-300 dark:text-surface-600 mb-3" />
          <p className="text-surface-500">No beds in this ward yet.</p>
          {canManageBeds && (
            <button
              onClick={() => setIsAddOpen(true)}
              className="mt-4 inline-flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 hover:underline"
            >
              <Plus className="w-4 h-4" />
              Add the first bed
            </button>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 sm:gap-6 justify-center pt-4 border-t border-surface-100 dark:border-[#2A2F38]">
        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-green-500 rounded-full" /><span className="text-xs text-surface-500">Available</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-500 rounded-full" /><span className="text-xs text-surface-500">Occupied</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-amber-500 rounded-full" /><span className="text-xs text-surface-500">Under Cleaning</span></div>
      </div>

      <AddBedModal
        open={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        wards={wardList}
        onSubmit={(payload) => createMutation.mutate(payload)}
        isSubmitting={createMutation.isPending}
      />

      <ConfirmDeleteModal
        bed={bedToDelete}
        onClose={() => setBedToDelete(null)}
        onConfirm={() => bedToDelete && deleteMutation.mutate(bedToDelete.id)}
        isSubmitting={deleteMutation.isPending}
      />
    </div>
  );
}

/* ───────────────────────────── Add Bed Modal ───────────────────────────── */

function AddBedModal({
  open,
  onClose,
  wards,
  onSubmit,
  isSubmitting,
}: {
  open: boolean;
  onClose: () => void;
  wards: string[];
  onSubmit: (payload: { bedNumber: string; wardName: string }) => void;
  isSubmitting: boolean;
}) {
  const [bedNumber, setBedNumber] = useState('');
  const [wardName, setWardName] = useState('');

  // Reset form whenever the modal opens
  useEffect(() => {
    if (open) {
      setBedNumber('');
      setWardName('');
    }
  }, [open]);

  const canSubmit = bedNumber.trim().length > 0 && wardName.trim().length > 0 && !isSubmitting;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({ bedNumber: bedNumber.trim(), wardName: wardName.trim() });
  }

  return (
    <Modal open={open} onClose={onClose} title="Add Bed" subtitle="Register a new bed in a ward" maxWidth="md">
      <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
        <div>
          <label htmlFor="bedNumber" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
            Bed Number <span className="text-red-500">*</span>
          </label>
          <input
            id="bedNumber"
            type="text"
            value={bedNumber}
            onChange={(e) => setBedNumber(e.target.value)}
            placeholder="e.g. G-09"
            maxLength={20}
            autoFocus
            required
            className="w-full px-4 py-2.5 card border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-surface-900 dark:text-white placeholder-surface-400"
            data-testid="bed-number-input"
          />
          <p className="mt-1 text-xs text-surface-500">
            Up to 20 characters. Must be unique within the chosen ward.
          </p>
        </div>

        <div>
          <label htmlFor="wardName" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
            Ward <span className="text-red-500">*</span>
          </label>
          <input
            id="wardName"
            type="text"
            value={wardName}
            onChange={(e) => setWardName(e.target.value)}
            placeholder="e.g. General Ward A"
            maxLength={50}
            list="ward-suggestions"
            required
            className="w-full px-4 py-2.5 card border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-surface-900 dark:text-white placeholder-surface-400"
            data-testid="ward-name-input"
          />
          <datalist id="ward-suggestions">
            {wards.map((w) => (
              <option key={w} value={w} />
            ))}
          </datalist>
          <p className="mt-1 text-xs text-surface-500">
            Pick an existing ward or type a new one to create it on the fly.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-100 dark:border-[#2A2F38]">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-white/5 rounded-xl transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed focus-ring"
            data-testid="submit-add-bed"
          >
            {isSubmitting ? 'Adding…' : 'Add Bed'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ─────────────────────────── Confirm Delete Modal ─────────────────────────── */

function ConfirmDeleteModal({
  bed,
  onClose,
  onConfirm,
  isSubmitting,
}: {
  bed: Bed | null;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
}) {
  return (
    <Modal open={!!bed} onClose={onClose} title="Remove Bed" subtitle="This action cannot be undone" maxWidth="sm">
      <div className="p-5 sm:p-6 space-y-4">
        <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" aria-hidden />
          <p className="text-sm text-red-700 dark:text-red-300">
            Are you sure you want to permanently remove{' '}
            <span className="font-bold">{bed?.bedNumber}</span> from{' '}
            <span className="font-medium">{bed?.wardName}</span>?
          </p>
        </div>

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-white/5 rounded-xl transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed focus-ring"
            data-testid="confirm-delete-bed"
          >
            <Trash2 className="w-4 h-4" />
            {isSubmitting ? 'Removing…' : 'Remove Bed'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ───────────────────────────────── Cards & Tabs ───────────────────────────────── */

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