import type { InvoiceStatus } from '../../types'

interface StatusBadgeProps {
  status: InvoiceStatus
}

const CONFIG: Record<InvoiceStatus, { label: string; className: string }> = {
  pending: { label: '待確認', className: 'bg-yellow-100 text-yellow-800' },
  confirmed: { label: '已確認', className: 'bg-green-100 text-green-800' },
  rejected: { label: '已拒絕', className: 'bg-red-100 text-red-800' },
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const { label, className } = CONFIG[status] ?? CONFIG.pending
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${className}`}>
      {label}
    </span>
  )
}
