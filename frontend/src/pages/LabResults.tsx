import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getLabResultsApi, updateLabResultStatusApi } from '@/api/api';
import type { LabResult } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { StaggerContainer, StaggerItem } from '@/components/ui/motion';
import {
  FlaskConical,
  Search,
  Clock,
  Check,
} from 'lucide-react';

const statusStyles: Record<string, { icon: typeof Clock; color: string; bg: string }> = {
  PENDING: { icon: Clock, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10 border border-amber-500/20' },
  IN_PROGRESS: { icon: FlaskConical, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10 border border-blue-500/20' },
  COMPLETED: { icon: Check, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10 border border-emerald-500/20' },
};

const statusLabels: Record<string, string> = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
};

export default function LabResults() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedResult, setSelectedResult] = useState<LabResult | null>(null);
  const [resultValue, setResultValue] = useState('');

  const { data: labResults, isLoading } = useQuery({
    queryKey: ['lab-results', statusFilter],
    queryFn: () => getLabResultsApi(statusFilter || undefined),
  });

  const filtered = labResults?.filter(r =>
    !searchQuery ||
    r.patient.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.testName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateLabResultStatusApi(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lab-results'] });
    },
  });

  const updateResultMutation = useMutation({
    mutationFn: ({ id }: { id: string; resultValue: string }) =>
      updateLabResultStatusApi(id, 'COMPLETED'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lab-results'] });
      setSelectedResult(null);
      setResultValue('');
    },
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-display text-surface-900 dark:text-white">Lab Results</h1>
        <p className="text-body text-surface-500 dark:text-surface-400 mt-1">
          Manage and view laboratory test results
        </p>
      </div>

      {/* Search & Filters */}
      <div className="card p-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <input
              type="text"
              placeholder="Search by patient or test name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-surface-50 dark:bg-[#111820] border border-surface-200 dark:border-[#2A2F38] rounded-xl text-sm text-surface-900 dark:text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setStatusFilter('')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                !statusFilter
                  ? 'bg-primary-500/12 text-primary-600 dark:text-primary-400 border border-primary-500/25'
                  : 'card-flat text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
              }`}
            >
              All
            </button>
            {Object.entries(statusLabels).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  statusFilter === key
                    ? `${statusStyles[key].bg} ${statusStyles[key].color}`
                    : 'card-flat text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lab Results Table */}
      <div className="card overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-100 dark:border-[#2A2F38]">
                <th className="text-left text-xs font-medium text-surface-500 uppercase tracking-wider px-4 py-3">Patient</th>
                <th className="text-left text-xs font-medium text-surface-500 uppercase tracking-wider px-4 py-3">Test</th>
                <th className="text-left text-xs font-medium text-surface-500 uppercase tracking-wider px-4 py-3">Priority</th>
                <th className="text-left text-xs font-medium text-surface-500 uppercase tracking-wider px-4 py-3">Status</th>
                <th className="text-left text-xs font-medium text-surface-500 uppercase tracking-wider px-4 py-3">Date</th>
                <th className="text-left text-xs font-medium text-surface-500 uppercase tracking-wider px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8">
                    <div className="space-y-3">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex items-center gap-4">
                          <div className="skeleton w-32 h-5 rounded" />
                          <div className="skeleton w-24 h-5 rounded" />
                          <div className="skeleton w-16 h-6 rounded-full" />
                          <div className="skeleton w-20 h-5 rounded" />
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              ) : !filtered || filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <FlaskConical className="w-12 h-12 text-surface-300 dark:text-surface-600 mx-auto mb-3" />
                    <p className="text-sm font-medium text-surface-500">No lab results found</p>
                    <p className="text-xs text-surface-400 mt-1">
                      Lab results will appear here
                    </p>
                  </td>
                </tr>
              ) : (
                <StaggerContainer>
                  {filtered.map((result) => (
                    <StaggerItem key={result.id}>
                      <tr className="border-b border-surface-50 dark:border-[#1A1F26] table-row-hover">
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-surface-900 dark:text-white">{result.patient.fullName}</p>
                          <p className="text-xs text-surface-500 font-mono">{result.patient.uhid}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-surface-900 dark:text-white">{result.testName}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                            result.priority === 'URGENT'
                              ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                              : 'bg-surface-100 dark:bg-white/5 text-surface-600 dark:text-surface-400'
                          }`}>
                            {result.priority}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${statusStyles[result.status]?.bg}`}>
                            {(() => {
                              const StatusIcon = statusStyles[result.status]?.icon || Clock;
                              return <StatusIcon className="w-3 h-3" />;
                            })()}
                            {statusLabels[result.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-surface-500">
                            {new Date(result.createdDate).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {result.status === 'PENDING' && (
                              <button
                                onClick={() => updateStatusMutation.mutate({ id: result.id, status: 'IN_PROGRESS' })}
                                className="px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                              >
                                Start
                              </button>
                            )}
                            {result.status === 'IN_PROGRESS' && (
                              <button
                                onClick={() => {
                                  setSelectedResult(result);
                                  setResultValue(result.resultValue || '');
                                }}
                                className="px-3 py-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                              >
                                Complete
                              </button>
                            )}
                            {result.status === 'COMPLETED' && (
                              <span className="text-xs text-emerald-500 flex items-center gap-1">
                                <Check className="w-3 h-3" />
                                Done
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    </StaggerItem>
                  ))}
                </StaggerContainer>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile card view */}
        <div className="md:hidden">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card-flat p-4 space-y-2">
                  <div className="skeleton w-32 h-5 rounded" />
                  <div className="skeleton w-24 h-5 rounded" />
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {filtered?.map((result) => (
                <div key={result.id} className="card-flat p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-surface-900 dark:text-white">{result.patient.fullName}</p>
                      <p className="text-xs text-surface-500">{result.testName}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${statusStyles[result.status]?.bg}`}>
                      {statusLabels[result.status]}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    {result.status === 'PENDING' && (
                      <button
                        onClick={() => updateStatusMutation.mutate({ id: result.id, status: 'IN_PROGRESS' })}
                        className="flex-1 py-2 text-xs font-medium text-blue-600 border border-blue-200 rounded-lg"
                      >
                        Start
                      </button>
                    )}
                    {result.status === 'IN_PROGRESS' && (
                      <button
                        onClick={() => {
                          setSelectedResult(result);
                          setResultValue(result.resultValue || '');
                        }}
                        className="flex-1 py-2 text-xs font-medium text-emerald-600 border border-emerald-200 rounded-lg"
                      >
                        Complete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Complete Result Modal */}
      <AnimatePresence>
        {selectedResult && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={() => setSelectedResult(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
            >
              <div className="card w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="p-5 border-b border-surface-100 dark:border-[#2A2F38]">
                  <h2 className="text-heading text-surface-900 dark:text-white">Complete Lab Result</h2>
                  <p className="text-sm text-surface-500 mt-1">
                    {selectedResult.testName} — {selectedResult.patient.fullName}
                  </p>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                      Result Value
                    </label>
                    <textarea
                      value={resultValue}
                      onChange={(e) => setResultValue(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-2.5 bg-surface-50 dark:bg-[#111820] border border-surface-200 dark:border-[#2A2F38] rounded-xl text-sm text-surface-900 dark:text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 resize-none"
                      placeholder="Enter test results..."
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setSelectedResult(null)}
                      className="flex-1 py-2.5 rounded-xl border border-surface-200 dark:border-[#2A2F38] text-surface-600 dark:text-surface-400 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => updateResultMutation.mutate({ id: selectedResult.id, resultValue })}
                      disabled={updateResultMutation.isPending}
                      className="flex-1 py-2.5 bg-primary-600 hover:bg-primary-500 disabled:bg-primary-600/50 text-white rounded-xl font-medium"
                    >
                      {updateResultMutation.isPending ? 'Saving...' : 'Mark Complete'}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
