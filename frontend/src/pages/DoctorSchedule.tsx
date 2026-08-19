import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDoctorScheduleApi, setDoctorScheduleApi } from '@/api/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Plus,
  Trash2,
  Save,
  Check,
} from 'lucide-react';

const daysOfWeek = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
const dayLabels: Record<string, string> = {
  MONDAY: 'Monday',
  TUESDAY: 'Tuesday',
  WEDNESDAY: 'Wednesday',
  THURSDAY: 'Thursday',
  FRIDAY: 'Friday',
  SATURDAY: 'Saturday',
  SUNDAY: 'Sunday',
};

interface TimeSlot {
  startTime: string;
  endTime: string;
  active: boolean;
}

export default function DoctorSchedule() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [schedule, setSchedule] = useState<Record<string, TimeSlot[]>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [successMessage, setSuccessMessage] = useState(false);

  // For now, use the first doctor's ID from the seed data
  // In a real app, this would come from the logged-in user's ID
  const doctorId = user?.id || '';

  const { data: existingSchedule } = useQuery({
    queryKey: ['doctor-schedule', doctorId],
    queryFn: () => getDoctorScheduleApi(doctorId),
    enabled: !!doctorId,
  });

  // Initialize schedule from existing data
  useEffect(() => {
    if (existingSchedule && existingSchedule.length > 0) {
      const grouped: Record<string, TimeSlot[]> = {};
      existingSchedule.forEach(s => {
        if (!grouped[s.dayOfWeek]) grouped[s.dayOfWeek] = [];
        grouped[s.dayOfWeek].push({
          startTime: s.startTime.substring(0, 5),
          endTime: s.endTime.substring(0, 5),
          active: s.active,
        });
      });
      setSchedule(grouped);
    }
  }, [existingSchedule]);

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = Object.entries(schedule).flatMap(([day, slots]) =>
        slots.map(slot => ({
          dayOfWeek: day,
          startTime: slot.startTime + ':00',
          endTime: slot.endTime + ':00',
          active: slot.active,
        }))
      );
      return setDoctorScheduleApi(doctorId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-schedule', doctorId] });
      setHasChanges(false);
      setSuccessMessage(true);
      showToast('Doctor schedule saved successfully', 'success');
      setTimeout(() => setSuccessMessage(false), 3000);
    },
    onError: (error: Error & { response?: { data?: { message?: string; errors?: Record<string, string> } } }) => {
      const msg = error.response?.data?.errors
        ? Object.values(error.response.data.errors).join(', ')
        : error.response?.data?.message || error.message || 'Failed to save schedule';
      showToast(msg, 'error');
    },
  });

  const addSlot = (day: string) => {
    const daySlots = schedule[day] || [];
    setSchedule({
      ...schedule,
      [day]: [...daySlots, { startTime: '09:00', endTime: '12:00', active: true }],
    });
    setHasChanges(true);
  };

  const removeSlot = (day: string, index: number) => {
    const daySlots = [...(schedule[day] || [])];
    daySlots.splice(index, 1);
    setSchedule({
      ...schedule,
      [day]: daySlots,
    });
    setHasChanges(true);
  };

  const updateSlot = (day: string, index: number, field: keyof TimeSlot, value: string | boolean) => {
    const daySlots = [...(schedule[day] || [])];
    daySlots[index] = { ...daySlots[index], [field]: value };
    setSchedule({
      ...schedule,
      [day]: daySlots,
    });
    setHasChanges(true);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-display text-surface-900 dark:text-white">Doctor Schedule</h1>
          <p className="text-body text-surface-500 dark:text-surface-400 mt-1">
            Set your available hours for each day of the week
          </p>
        </div>
        {hasChanges && (
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-500 disabled:bg-primary-600/50 text-white rounded-xl font-medium transition-all shadow-lg shadow-primary-600/20 focus-ring"
            style={{ minHeight: '44px' }}
          >
            <Save className="w-5 h-5" />
            {saveMutation.isPending ? 'Saving...' : 'Save Schedule'}
          </button>
        )}
      </div>

      {/* Success Message */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className="p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/25 rounded-xl flex items-center gap-3"
          >
            <div className="p-1 bg-emerald-500/20 rounded-full">
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
              Schedule saved successfully
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Schedule Grid */}
      <div className="space-y-4">
        {daysOfWeek.map((day) => (
          <motion.div
            key={day}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-500/10 rounded-xl flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-surface-900 dark:text-white">
                    {dayLabels[day]}
                  </h3>
                  <p className="text-xs text-surface-500">
                    {(schedule[day] || []).length} time slot{(schedule[day] || []).length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <button
                onClick={() => addSlot(day)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-500/10 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Slot
              </button>
            </div>

            {(schedule[day] || []).length === 0 ? (
              <div className="p-4 text-center text-sm text-surface-400 bg-surface-50 dark:bg-[#111820] rounded-xl">
                No time slots set — click "Add Slot" to set availability
              </div>
            ) : (
              <div className="space-y-2">
                {(schedule[day] || []).map((slot, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-surface-50 dark:bg-[#111820] rounded-xl"
                  >
                    <input
                      type="time"
                      value={slot.startTime}
                      onChange={(e) => updateSlot(day, index, 'startTime', e.target.value)}
                      className="px-3 py-2 bg-white dark:bg-[#1A1F26] border border-surface-200 dark:border-[#2A2F38] rounded-lg text-sm text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                    />
                    <span className="text-surface-400">to</span>
                    <input
                      type="time"
                      value={slot.endTime}
                      onChange={(e) => updateSlot(day, index, 'endTime', e.target.value)}
                      className="px-3 py-2 bg-white dark:bg-[#1A1F26] border border-surface-200 dark:border-[#2A2F38] rounded-lg text-sm text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                    />
                    <label className="flex items-center gap-2 ml-auto">
                      <input
                        type="checkbox"
                        checked={slot.active}
                        onChange={(e) => updateSlot(day, index, 'active', e.target.checked)}
                        className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-xs text-surface-500">Active</span>
                    </label>
                    <button
                      onClick={() => removeSlot(day, index)}
                      className="p-2 rounded-lg hover:bg-red-500/10 text-surface-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
