import { Link } from 'react-router-dom'
import type { Invoice } from '../../types'
import StatusBadge from '../shared/StatusBadge'
import ConfidenceBadge from '../shared/ConfidenceBadge'
import { formatDate } from '../../utils/format'

interface InvoiceCardProps {
  invoice: Invoice
}

export default function InvoiceCard({ invoice }: InvoiceCardProps) {
  return (
    <Link
      to={`/invoices/${invoice.id}`}
      className="block bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-800 truncate">
            {invoice.seller_name ?? '（賣方未知）'}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {invoice.invoice_number ?? '—'} · {formatDate(invoice.purchase_date)}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <StatusBadge status={invoice.status} />
          {invoice.classification_confidence != null && (
            <ConfidenceBadge
              confidence={invoice.classification_confidence}
              source={invoice.classification_source}
            />
          )}
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-gray-500">
          {invoice.amount_total != null
            ? `NT$ ${invoice.amount_total.toLocaleString()}`
            : '金額未知'}
        </span>
        {invoice.bundle_id && (
          <span className="text-xs text-blue-500">報帳單 #{invoice.bundle_id}</span>
        )}
      </div>
    </Link>
  )
}
