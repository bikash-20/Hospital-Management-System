import type { Billing, BillingLineItem } from '@/types';

interface PrintableInvoiceProps {
  billing: Billing;
  hospitalName?: string;
  hospitalAddress?: string;
}

export default function PrintableInvoice({
  billing,
  hospitalName = 'OpenHospital',
  hospitalAddress = 'Sylhet, Bangladesh',
}: PrintableInvoiceProps) {
  const lineItems: BillingLineItem[] = Array.isArray(billing.lineItems)
    ? billing.lineItems
    : typeof billing.lineItems === 'string'
      ? (() => { try { return JSON.parse(billing.lineItems); } catch { return []; } })()
      : [];

  return (
    <div className="print-container bg-white text-black p-8 max-w-[800px] mx-auto">
      {/* Header */}
      <div className="border-b-2 border-black pb-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{hospitalName}</h1>
            <p className="text-sm text-gray-600">{hospitalAddress}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-800">INVOICE</p>
            <p className="text-sm font-mono">{billing.invoiceNumber}</p>
            <p className="text-xs text-gray-500">
              Date: {new Date(billing.createdDate).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Patient Info */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Bill To</p>
          <p className="font-medium">{billing.patient.fullName}</p>
          <p className="text-sm text-gray-600">UHID: {billing.patient.uhid}</p>
          <p className="text-sm text-gray-600">Mobile: {billing.patient.mobileNumber}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Status</p>
          <p className={`inline-block px-3 py-1 rounded text-sm font-medium ${
            billing.status === 'PAID' ? 'bg-green-100 text-green-800' :
            billing.status === 'PARTIAL' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {billing.status}
          </p>
        </div>
      </div>

      {/* Line Items */}
      {lineItems.length > 0 ? (
        <div className="mb-6">
          <h3 className="text-sm font-bold uppercase tracking-wider border-b border-gray-300 pb-1 mb-2">
            Items
          </h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 font-medium">Description</th>
                <th className="text-center py-2 font-medium">Qty</th>
                <th className="text-right py-2 font-medium">Unit Price</th>
                <th className="text-right py-2 font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((item, i) => (
                <tr key={i} className="border-b border-gray-100">
                  <td className="py-2">{item.description}</td>
                  <td className="py-2 text-center">{item.quantity}</td>
                  <td className="py-2 text-right">৳{item.unitPrice.toLocaleString()}</td>
                  <td className="py-2 text-right">৳{item.total.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mb-6">
          <h3 className="text-sm font-bold uppercase tracking-wider border-b border-gray-300 pb-1 mb-2">
            Services
          </h3>
          <div className="text-sm text-gray-600 py-2">
            General consultation and services
          </div>
        </div>
      )}

      {/* Totals */}
      <div className="flex justify-end mb-6">
        <div className="w-64 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium">৳{billing.totalAmount.toLocaleString()}</span>
          </div>
          {billing.discount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Discount</span>
              <span className="font-medium text-red-600">-৳{billing.discount.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between text-sm border-t border-gray-300 pt-2">
            <span className="font-bold">Total Due</span>
            <span className="font-bold">
              ৳{(billing.totalAmount - billing.discount).toLocaleString()}
            </span>
          </div>
          {billing.paidAmount > 0 && (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Paid</span>
                <span className="font-medium text-green-600">৳{billing.paidAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-gray-300 pt-2">
                <span className="font-bold">Balance Due</span>
                <span className="font-bold text-red-600">
                  ৳{(billing.totalAmount - billing.discount - billing.paidAmount).toLocaleString()}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 pt-4 border-t border-gray-300">
        <div className="flex justify-between items-end">
          <div>
            <p className="text-xs text-gray-500">Generated by {hospitalName} RMS</p>
            <p className="text-xs text-gray-500">This is a computer-generated invoice</p>
          </div>
          <div className="text-right">
            <div className="w-48 border-t border-black mt-8 pt-1">
              <p className="text-sm">Authorized Signature</p>
            </div>
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          .print-container {
            margin: 0;
            padding: 20px;
            box-shadow: none;
            border: none;
          }
          body {
            background: white;
          }
        }
      `}</style>
    </div>
  );
}
