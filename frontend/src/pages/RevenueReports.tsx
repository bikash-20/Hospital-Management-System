import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getRevenueReportApi, getTodayRevenueApi, getWeekRevenueApi, getMonthRevenueApi, getRevenueByDateRangeApi } from '@/api/api';
import { motion } from 'framer-motion';
import { StaggerContainer, StaggerItem } from '@/components/ui/motion';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  FileText,
  Check,
  Clock,
  AlertTriangle,
} from 'lucide-react';

type ReportPeriod = 'overall' | 'today' | 'week' | 'month' | 'custom';

export default function RevenueReports() {
  const [period, setPeriod] = useState<ReportPeriod>('overall');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data: overallReport, isLoading: overallLoading } = useQuery({
    queryKey: ['revenue-report', 'overall'],
    queryFn: getRevenueReportApi,
    enabled: period === 'overall',
  });

  const { data: todayReport, isLoading: todayLoading } = useQuery({
    queryKey: ['revenue-report', 'today'],
    queryFn: getTodayRevenueApi,
    enabled: period === 'today',
  });

  const { data: weekReport, isLoading: weekLoading } = useQuery({
    queryKey: ['revenue-report', 'week'],
    queryFn: getWeekRevenueApi,
    enabled: period === 'week',
  });

  const { data: monthReport, isLoading: monthLoading } = useQuery({
    queryKey: ['revenue-report', 'month'],
    queryFn: getMonthRevenueApi,
    enabled: period === 'month',
  });

  const { data: customReport, isLoading: customLoading } = useQuery({
    queryKey: ['revenue-report', 'custom', startDate, endDate],
    queryFn: () => getRevenueByDateRangeApi(startDate, endDate),
    enabled: period === 'custom' && !!startDate && !!endDate,
  });

  const report = period === 'overall' ? overallReport
    : period === 'today' ? todayReport
    : period === 'week' ? weekReport
    : period === 'month' ? monthReport
    : customReport;

  const isLoading = period === 'overall' ? overallLoading
    : period === 'today' ? todayLoading
    : period === 'week' ? weekLoading
    : period === 'month' ? monthLoading
    : customLoading;

  const formatCurrency = (amount: number) => `৳${amount.toLocaleString()}`;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-display text-surface-900 dark:text-white">Revenue Reports</h1>
        <p className="text-body text-surface-500 dark:text-surface-400 mt-1">
          Financial overview and revenue analytics
        </p>
      </div>

      {/* Period Selector */}
      <div className="card p-3">
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'overall', label: 'All Time' },
            { key: 'today', label: 'Today' },
            { key: 'week', label: 'This Week' },
            { key: 'month', label: 'This Month' },
            { key: 'custom', label: 'Custom Range' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setPeriod(key as ReportPeriod)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                period === key
                  ? 'bg-primary-500/12 text-primary-600 dark:text-primary-400 border border-primary-500/25'
                  : 'card-flat text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {period === 'custom' && (
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-surface-100 dark:border-[#2A2F38]">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-surface-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 bg-surface-50 dark:bg-[#111820] border border-surface-200 dark:border-[#2A2F38] rounded-lg text-sm text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              />
            </div>
            <span className="text-surface-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 bg-surface-50 dark:bg-[#111820] border border-surface-200 dark:border-[#2A2F38] rounded-lg text-sm text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
            />
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="flex items-center justify-between mb-3">
                <div className="skeleton w-10 h-10 rounded-xl" />
              </div>
              <div className="skeleton w-24 h-8 mb-2" />
              <div className="skeleton w-32 h-4" />
            </div>
          ))}
        </div>
      ) : report ? (
        <>
          {/* Stats Cards */}
          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StaggerItem>
              <motion.div
                whileHover={{ y: -1 }}
                className="card p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-xl bg-primary-500/10">
                    <DollarSign className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    Revenue
                  </span>
                </div>
                <p className="text-2xl font-bold text-surface-900 dark:text-white font-tabular">
                  {formatCurrency(report.totalRevenue)}
                </p>
                <p className="text-caption text-surface-500 mt-1">Total Revenue</p>
              </motion.div>
            </StaggerItem>

            <StaggerItem>
              <motion.div
                whileHover={{ y: -1 }}
                className="card p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10">
                    <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    Collected
                  </span>
                </div>
                <p className="text-2xl font-bold text-surface-900 dark:text-white font-tabular">
                  {formatCurrency(report.totalCollected)}
                </p>
                <p className="text-caption text-surface-500 mt-1">Total Collected</p>
              </motion.div>
            </StaggerItem>

            <StaggerItem>
              <motion.div
                whileHover={{ y: -1 }}
                className="card p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/10">
                    <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <span className="text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-1 rounded-full flex items-center gap-1">
                    <TrendingDown className="w-3 h-3" />
                    Pending
                  </span>
                </div>
                <p className="text-2xl font-bold text-surface-900 dark:text-white font-tabular">
                  {formatCurrency(report.totalPending)}
                </p>
                <p className="text-caption text-surface-500 mt-1">Total Pending</p>
              </motion.div>
            </StaggerItem>

            <StaggerItem>
              <motion.div
                whileHover={{ y: -1 }}
                className="card p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-xl bg-blue-500/10">
                    <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-1 rounded-full">
                    {report.totalInvoices} invoices
                  </span>
                </div>
                <p className="text-2xl font-bold text-surface-900 dark:text-white font-tabular">
                  {report.totalInvoices}
                </p>
                <p className="text-caption text-surface-500 mt-1">Total Invoices</p>
              </motion.div>
            </StaggerItem>
          </StaggerContainer>

          {/* Revenue by Status */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="card p-5"
            >
              <h2 className="text-heading text-surface-900 dark:text-white mb-4">Revenue by Status</h2>
              <div className="space-y-4">
                {Object.entries(report.revenueByStatus || {}).map(([status, amount]) => (
                  <div key={status} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-surface-600 dark:text-surface-300">{status}</span>
                      <span className="text-sm font-medium font-tabular text-surface-900 dark:text-white">
                        {formatCurrency(Number(amount))}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-surface-100 dark:bg-[#1A1F26] rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${
                          status === 'PAID' ? 'bg-emerald-500' :
                          status === 'PARTIAL' ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        initial={{ width: 0 }}
                        animate={{
                          width: `${report.totalRevenue > 0 ? (Number(amount) / report.totalRevenue) * 100 : 0}%`
                        }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="card p-5"
            >
              <h2 className="text-heading text-surface-900 dark:text-white mb-4">Invoice Summary</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-emerald-500" />
                    <span className="text-sm font-medium text-surface-900 dark:text-white">Paid</span>
                  </div>
                  <span className="text-sm font-bold font-tabular text-emerald-600 dark:text-emerald-400">
                    {report.paidInvoices}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-500/10 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-amber-500" />
                    <span className="text-sm font-medium text-surface-900 dark:text-white">Partial</span>
                  </div>
                  <span className="text-sm font-bold font-tabular text-amber-600 dark:text-amber-400">
                    {report.partialInvoices}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-500/10 rounded-xl">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    <span className="text-sm font-medium text-surface-900 dark:text-white">Unpaid</span>
                  </div>
                  <span className="text-sm font-bold font-tabular text-red-600 dark:text-red-400">
                    {report.unpaidInvoices}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Daily Breakdown */}
          {report.dailyBreakdown && report.dailyBreakdown.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="card p-5"
            >
              <h2 className="text-heading text-surface-900 dark:text-white mb-4">Daily Breakdown</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-surface-100 dark:border-[#2A2F38]">
                      <th className="text-left text-xs font-medium text-surface-500 uppercase tracking-wider px-4 py-3">Date</th>
                      <th className="text-left text-xs font-medium text-surface-500 uppercase tracking-wider px-4 py-3">Revenue</th>
                      <th className="text-left text-xs font-medium text-surface-500 uppercase tracking-wider px-4 py-3">Invoices</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.dailyBreakdown.map((day) => (
                      <tr key={day.date} className="border-b border-surface-50 dark:border-[#1A1F26]">
                        <td className="px-4 py-3 text-sm text-surface-900 dark:text-white">{day.date}</td>
                        <td className="px-4 py-3 text-sm font-medium font-tabular text-surface-900 dark:text-white">
                          {formatCurrency(day.revenue)}
                        </td>
                        <td className="px-4 py-3 text-sm text-surface-500">{day.invoiceCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </>
      ) : (
        <div className="card p-12 text-center">
          <DollarSign className="w-12 h-12 text-surface-300 dark:text-surface-600 mx-auto mb-3" />
          <p className="text-sm font-medium text-surface-500">No revenue data available</p>
          <p className="text-xs text-surface-400 mt-1">Select a different time period</p>
        </div>
      )}
    </div>
  );
}
