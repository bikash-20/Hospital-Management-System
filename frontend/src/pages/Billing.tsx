import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBillingsApi, processPaymentApi } from '@/api/api';
import type { Billing as BillingType } from '@/types';
import {
  Receipt,
  DollarSign,
  CreditCard,
  Filter,
  Check,
  AlertCircle,
  Clock,
  ArrowUpRight,
} from 'lucide-react';

const statusConfig: Record<string, { color: string; bg: string; label: string; icon: typeof Check }> = {
  PAID: { color: 'text-green-500', bg: 'bg-green-500/10', label: 'Paid', icon: Check },
  PARTIAL: { color: 'text-amber-500', bg: 'bg-amber-500/10', label: 'Partial', icon: Clock },
  UNPAID: { color: 'text-red-500', bg: 'bg-red-500/10', label: 'Unpaid', icon: AlertCircle },
};

export default function Billing() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [payingBill, setPayingBill] = useState<BillingType | null>(null);
  const [payAmount, setPayAmount] = useState('');

  const { data: billings, isLoading } = useQuery({
    queryKey: ['billings'],
    queryFn: getBillingsApi,
  });

  const payMutation = useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: number }) =>
      processPaymentApi(id, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billings'] });
      setPayingBill(null);
      setPayAmount('');
    },
  });

  const filteredBillings = statusFilter
    ? billings?.filter((b) => b.status === statusFilter)
    : billings;

  const totalRevenue = billings?.reduce((sum, b) => sum + b.paidAmount, 0) ?? 0;
  const totalPending = billings?.reduce((sum, b) => sum + (b.totalAmount - b.discount - b.paidAmount), 0) ?? 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-display text-surface-900 dark:text-white">Billing</h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1">
            Invoice management and payment processing
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5 flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 rounded-xl">
            <DollarSign className="w-5 h-5 text-emerald-500" aria-hidden="true" />
          </div>
          <div>
            <p className="text-2xl font-bold text-surface-900 dark:text-white font-tabular">৳{totalRevenue.toLocaleString()}</p>
            <p className="text-xs text-surface-500">Total Collected</p>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="p-3 bg-status-waiting-bg rounded-xl">
            <Clock className="w-5 h-5 text-amber-500" aria-hidden="true" />
          </div>
          <div>
            <p className="text-2xl font-bold text-surface-900 dark:text-white font-tabular">৳{totalPending.toLocaleString()}</p>
            <p className="text-xs text-surface-500">Pending Amount</p>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="p-3 bg-primary-500/10 rounded-xl">
            <Receipt className="w-5 h-5 text-primary-500" aria-hidden="true" />
          </div>
          <div>
            <p className="text-2xl font-bold text-surface-900 dark:text-white font-tabular">{billings?.length ?? 0}</p>
            <p className="text-xs text-surface-500">Total Invoices</p>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-surface-400" />
        {['', 'UNPAID', 'PARTIAL', 'PAID'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              statusFilter === status
                ? status
                  ? `${statusConfig[status].bg} ${statusConfig[status].color} border border-current/20`
                  : 'bg-primary-500/15 text-primary-600 dark:text-primary-400 border border-primary-500/30'
                : 'bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-500 hover:text-surface-700'
            }`}
          >
            {status ? statusConfig[status].label : 'All'}
          </button>
        ))}
      </div>

      {/* Invoices */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-20 text-surface-400">Loading invoices...</div>
        ) : filteredBillings?.map((bill) => {
          const config = statusConfig[bill.status];
          const remaining = bill.totalAmount - bill.discount - bill.paidAmount;
          return (
            <div
              key={bill.id}
              className="card p-5"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-xl ${config.bg}`}>
                    <Receipt className={`w-5 h-5 ${config.color}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-mono font-semibold text-surface-900 dark:text-white">
                        {bill.invoiceNumber}
                      </p>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${config.bg} ${config.color}`}>
                        {config.label}
                      </span>
                    </div>
                    <p className="text-sm text-surface-500 mt-0.5">
                      {bill.patient.fullName} · {bill.patient.uhid}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-surface-400">
                  {new Date(bill.createdDate).toLocaleDateString()}
                </p>
              </div>

              {/* Line Items */}
              <div className="mb-4 ml-14">
                <div className="space-y-1.5">
                  {bill.lineItems.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <span className="text-surface-600 dark:text-surface-400">{item.description}</span>
                      <span className="font-mono text-surface-700 dark:text-surface-300">৳{item.total.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-surface-100 dark:border-[#2A2F38]">
                <div className="flex flex-wrap items-center gap-4 sm:gap-6 sm:ml-14">
                  <div>
                    <span className="text-xs text-surface-500">Total</span>
                    <p className="font-semibold text-surface-900 dark:text-white">৳{bill.totalAmount.toLocaleString()}</p>
                  </div>
                  {bill.discount > 0 && (
                    <div>
                      <span className="text-xs text-surface-500">Discount</span>
                      <p className="font-semibold text-green-500">-৳{bill.discount.toLocaleString()}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-xs text-surface-500">Paid</span>
                    <p className="font-semibold text-surface-900 dark:text-white">৳{bill.paidAmount.toLocaleString()}</p>
                  </div>
                  {remaining > 0 && (
                    <div>
                      <span className="text-xs text-surface-500">Due</span>
                      <p className="font-semibold text-red-500">৳{remaining.toLocaleString()}</p>
                    </div>
                  )}
                </div>

                {remaining > 0 && (
                  <button
                    onClick={() => {
                      setPayingBill(bill);
                      setPayAmount(String(remaining));
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-sm font-medium transition-all"
                  >
                    <CreditCard className="w-4 h-4" />
                    Collect Payment
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Payment Modal */}
      {payingBill && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md shadow-2xl">
            <div className="p-6 border-b border-surface-100 dark:border-surface-700/50">
              <h2 className="text-lg font-semibold text-surface-900 dark:text-white">Process Payment</h2>
              <p className="text-sm text-surface-500 mt-1">
                Invoice: {payingBill.invoiceNumber} — {payingBill.patient.fullName}
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                  Payment Amount (৳)
                </label>
                <input
                  type="number"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl text-lg font-semibold text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                  min={0}
                  max={payingBill.totalAmount - payingBill.discount - payingBill.paidAmount}
                />
                <p className="text-xs text-surface-500 mt-1">
                  Remaining: ৳{payingBill.totalAmount - payingBill.discount - payingBill.paidAmount}
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { setPayingBill(null); setPayAmount(''); }}
                  className="flex-1 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-800 font-medium transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (payAmount && Number(payAmount) > 0) {
                      payMutation.mutate({ id: payingBill.id, amount: Number(payAmount) });
                    }
                  }}
                  disabled={!payAmount || Number(payAmount) <= 0 || payMutation.isPending}
                  className="flex-1 py-2.5 bg-primary-600 hover:bg-primary-500 disabled:bg-primary-600/50 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                >
                  <ArrowUpRight className="w-4 h-4" />
                  {payMutation.isPending ? 'Processing...' : 'Confirm Payment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
