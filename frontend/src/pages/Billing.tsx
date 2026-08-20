import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBillingsApi, processPaymentApi } from '@/api/api';
import type { Billing as BillingType, BillingStatus } from '@/types';
import {
  Receipt,
  DollarSign,
  CreditCard,
  Filter,
  Clock,
  ArrowUpRight,
  Printer,
} from 'lucide-react';
import PrintableInvoice from '@/components/PrintableInvoice';
import { useToast } from '@/context/ToastContext';
import {
  BillingStatusPill,
  Modal,
  PrintModal,
  extractErrorMessage,
} from '@/components/ui/primitives';

const statusLabelMap: Record<BillingStatus, string> = {
  PAID: 'Paid',
  PARTIAL: 'Partial',
  UNPAID: 'Unpaid',
};

export default function Billing() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<BillingStatus | ''>('');
  const [payingBill, setPayingBill] = useState<BillingType | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [printingBill, setPrintingBill] = useState<BillingType | null>(null);

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
      showToast('Payment recorded successfully', 'success');
    },
    onError: (error) => {
      showToast(extractErrorMessage(error, 'Payment failed'), 'error');
    },
  });

  const filteredBillings = statusFilter
    ? billings?.filter((b) => b.status === statusFilter)
    : billings;

  const totalRevenue = billings?.reduce((sum, b) => sum + b.paidAmount, 0) ?? 0;
  const totalPending = billings?.reduce((sum, b) => sum + (b.totalAmount - b.discount - b.paidAmount), 0) ?? 0;

  const closePayModal = () => {
    setPayingBill(null);
    setPayAmount('');
  };

  const handlePrint = (bill: BillingType) => {
    setPrintingBill(bill);
    setTimeout(() => window.print(), 100);
  };

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
        {(['', 'UNPAID', 'PARTIAL', 'PAID'] as const).map((status) => (
          <button
            key={status || 'ALL'}
            onClick={() => setStatusFilter(status as BillingStatus | '')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              statusFilter === status
                ? status
                  ? 'bg-primary-500/15 text-primary-600 dark:text-primary-400 border border-primary-500/30'
                  : 'bg-primary-500/15 text-primary-600 dark:text-primary-400 border border-primary-500/30'
                : 'bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-500 hover:text-surface-700'
            }`}
          >
            {status ? statusLabelMap[status as BillingStatus] : 'All'}
          </button>
        ))}
      </div>

      {/* Invoices */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-20 text-surface-400">Loading invoices...</div>
        ) : filteredBillings?.map((bill) => {
          const remaining = bill.totalAmount - bill.discount - bill.paidAmount;
          return (
            <div key={bill.id} className="card p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-xl bg-primary-500/10">
                    <Receipt className="w-5 h-5 text-primary-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-mono font-semibold text-surface-900 dark:text-white">
                        {bill.invoiceNumber}
                      </p>
                      <BillingStatusPill status={bill.status} />
                    </div>
                    <p className="text-sm text-surface-500 mt-0.5">
                      {bill.patient.fullName} · {bill.patient.uhid}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePrint(bill)}
                    className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-white/5 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 transition-colors"
                    title="Print invoice"
                    aria-label="Print invoice"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                  <p className="text-xs text-surface-400">
                    {new Date(bill.createdDate).toLocaleDateString()}
                  </p>
                </div>
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
      <Modal
        open={!!payingBill}
        onClose={closePayModal}
        title="Process Payment"
        subtitle={payingBill ? `Invoice: ${payingBill.invoiceNumber} — ${payingBill.patient.fullName}` : ''}
        maxWidth="md"
      >
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
              max={payingBill ? payingBill.totalAmount - payingBill.discount - payingBill.paidAmount : undefined}
            />
            {payingBill && (
              <p className="text-xs text-surface-500 mt-1">
                Remaining: ৳{payingBill.totalAmount - payingBill.discount - payingBill.paidAmount}
              </p>
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={closePayModal}
              className="flex-1 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-800 font-medium transition-all"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (payingBill && payAmount && Number(payAmount) > 0) {
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
      </Modal>

      {/* Print Preview Modal */}
      <PrintModal open={!!printingBill} onClose={() => setPrintingBill(null)} title="Invoice Preview">
        {printingBill && <PrintableInvoice billing={printingBill} />}
      </PrintModal>
    </div>
  );
}
