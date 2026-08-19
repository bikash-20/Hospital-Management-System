import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAuditLogsApi, getAuditLogsByEntityApi } from '@/api/api';
import type { AuditLog } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { StaggerContainer, StaggerItem } from '@/components/ui/motion';
import {
  History,
  Search,
  Filter,
  ChevronDown,
  FileText,
  User,
  Clock,
  AlertTriangle,
  Check,
  Trash2,
} from 'lucide-react';

const operationStyles: Record<string, { icon: typeof Check; color: string }> = {
  CREATE: { icon: Check, color: 'text-emerald-500 bg-emerald-500/10' },
  UPDATE: { icon: FileText, color: 'text-blue-500 bg-blue-500/10' },
  DELETE: { icon: Trash2, color: 'text-red-500 bg-red-500/10' },
};

const entityLabels: Record<string, string> = {
  Patient: 'Patient',
  Appointment: 'Appointment',
  Prescription: 'Prescription',
  Billing: 'Billing',
  Bed: 'Bed',
  User: 'User',
};

export default function AuditLogs() {
  const [entityFilter, setEntityFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const { data: allLogs, isLoading } = useQuery({
    queryKey: ['audit-logs', entityFilter],
    queryFn: () => entityFilter ? getAuditLogsByEntityApi(entityFilter) : getAuditLogsApi(100),
  });

  const logs = allLogs?.filter(log => 
    !searchQuery || 
    log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.entityId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.entityName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const entities = ['Patient', 'Appointment', 'Prescription', 'Billing', 'Bed', 'User'];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-display text-surface-900 dark:text-white">Audit Logs</h1>
        <p className="text-body text-surface-500 dark:text-surface-400 mt-1">
          System activity history and change tracking
        </p>
      </div>

      {/* Search & Filters */}
      <div className="card p-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <input
              type="text"
              placeholder="Search by user, entity ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-surface-50 dark:bg-[#111820] border border-surface-200 dark:border-[#2A2F38] rounded-xl text-sm text-surface-900 dark:text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setEntityFilter('')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                !entityFilter
                  ? 'bg-primary-500/12 text-primary-600 dark:text-primary-400 border border-primary-500/25'
                  : 'card-flat text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
              }`}
            >
              All
            </button>
            {entities.map((entity) => (
              <button
                key={entity}
                onClick={() => setEntityFilter(entity)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  entityFilter === entity
                    ? 'bg-primary-500/12 text-primary-600 dark:text-primary-400 border border-primary-500/25'
                    : 'card-flat text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
                }`}
              >
                {entityLabels[entity] || entity}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-surface-100 dark:border-[#2A2F38] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-surface-400" />
            <span className="text-sm font-medium text-surface-600 dark:text-surface-300">
              {logs?.length ?? 0} log entries
            </span>
          </div>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-100 dark:border-[#2A2F38]">
                <th className="text-left text-xs font-medium text-surface-500 uppercase tracking-wider px-4 py-3">Time</th>
                <th className="text-left text-xs font-medium text-surface-500 uppercase tracking-wider px-4 py-3">Operation</th>
                <th className="text-left text-xs font-medium text-surface-500 uppercase tracking-wider px-4 py-3">Entity</th>
                <th className="text-left text-xs font-medium text-surface-500 uppercase tracking-wider px-4 py-3">User</th>
                <th className="text-left text-xs font-medium text-surface-500 uppercase tracking-wider px-4 py-3">Details</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8">
                    <div className="space-y-3">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex items-center gap-4">
                          <div className="skeleton w-32 h-5 rounded" />
                          <div className="skeleton w-20 h-6 rounded-full" />
                          <div className="skeleton w-24 h-5 rounded" />
                          <div className="skeleton w-28 h-5 rounded" />
                          <div className="skeleton w-16 h-5 rounded" />
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              ) : !logs || logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <History className="w-12 h-12 text-surface-300 dark:text-surface-600 mx-auto mb-3" />
                    <p className="text-sm font-medium text-surface-500">No audit logs found</p>
                    <p className="text-xs text-surface-400 mt-1">
                      System activity will appear here
                    </p>
                  </td>
                </tr>
              ) : (
                <StaggerContainer>
                  {logs.map((log) => (
                    <StaggerItem key={log.id}>
                      <tr 
                        className="border-b border-surface-50 dark:border-[#1A1F26] table-row-hover cursor-pointer"
                        onClick={() => setSelectedLog(log)}
                      >
                        <td className="px-4 py-3">
                          <span className="text-xs text-surface-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                            operationStyles[log.operation]?.color || 'text-surface-500 bg-surface-500/10'
                          }`}>
                            {(() => {
                              const OpIcon = operationStyles[log.operation]?.icon || AlertTriangle;
                              return <OpIcon className="w-3 h-3" />;
                            })()}
                            {log.operation}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium text-surface-900 dark:text-white">
                            {entityLabels[log.entityName] || log.entityName}
                          </span>
                          <span className="text-xs text-surface-400 ml-2 font-mono">
                            {log.entityId.slice(0, 8)}...
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-surface-600 dark:text-surface-300 flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {log.userName}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {(log.oldValues || log.newValues) && (
                            <span className="text-xs text-primary-500 hover:text-primary-400">
                              View changes
                            </span>
                          )}
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
                  <div className="skeleton w-20 h-5 rounded" />
                  <div className="skeleton w-40 h-4 rounded" />
                </div>
              ))}
            </div>
          ) : !logs || logs.length === 0 ? (
            <div className="p-8 text-center">
              <History className="w-12 h-12 text-surface-300 dark:text-surface-600 mx-auto mb-3" />
              <p className="text-sm font-medium text-surface-500">No audit logs found</p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {logs.map((log) => (
                <div 
                  key={log.id} 
                  className="card-flat p-4"
                  onClick={() => setSelectedLog(log)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                      operationStyles[log.operation]?.color || 'text-surface-500 bg-surface-500/10'
                    }`}>
                      {log.operation}
                    </span>
                    <span className="text-xs text-surface-400">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-surface-900 dark:text-white">
                    {entityLabels[log.entityName] || log.entityName}
                  </p>
                  <p className="text-xs text-surface-500 mt-1 flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {log.userName}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedLog && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={() => setSelectedLog(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
            >
              <div 
                className="card w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-5 border-b border-surface-100 dark:border-[#2A2F38]">
                  <h2 className="text-heading text-surface-900 dark:text-white">Audit Log Details</h2>
                </div>
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-surface-500 mb-1">Operation</p>
                      <p className="text-sm font-medium text-surface-900 dark:text-white">{selectedLog.operation}</p>
                    </div>
                    <div>
                      <p className="text-xs text-surface-500 mb-1">Entity</p>
                      <p className="text-sm font-medium text-surface-900 dark:text-white">
                        {entityLabels[selectedLog.entityName] || selectedLog.entityName}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-surface-500 mb-1">User</p>
                      <p className="text-sm font-medium text-surface-900 dark:text-white">{selectedLog.userName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-surface-500 mb-1">Time</p>
                      <p className="text-sm font-medium text-surface-900 dark:text-white">
                        {new Date(selectedLog.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-surface-500 mb-1">Entity ID</p>
                    <p className="text-sm font-mono text-surface-600 dark:text-surface-300 break-all">
                      {selectedLog.entityId}
                    </p>
                  </div>

                  {selectedLog.oldValues && (
                    <div>
                      <p className="text-xs text-surface-500 mb-1">Old Values</p>
                      <pre className="text-xs text-surface-600 dark:text-surface-300 bg-surface-50 dark:bg-[#111820] p-3 rounded-xl overflow-x-auto">
                        {selectedLog.oldValues}
                      </pre>
                    </div>
                  )}

                  {selectedLog.newValues && (
                    <div>
                      <p className="text-xs text-surface-500 mb-1">New Values</p>
                      <pre className="text-xs text-surface-600 dark:text-surface-300 bg-surface-50 dark:bg-[#111820] p-3 rounded-xl overflow-x-auto">
                        {selectedLog.newValues}
                      </pre>
                    </div>
                  )}
                </div>
                <div className="p-5 border-t border-surface-100 dark:border-[#2A2F38]">
                  <button
                    onClick={() => setSelectedLog(null)}
                    className="w-full py-2.5 rounded-xl border border-surface-200 dark:border-[#2A2F38] text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-white/5 font-medium transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
