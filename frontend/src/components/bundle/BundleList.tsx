import type { Bundle } from '../../types'
import { formatAmount } from '../../utils/format'

interface BundleListProps {
  bundles: Bundle[]
  selectedId?: number | null
  onSelect: (bundle: Bundle) => void
}

const STATUS_LABEL: Record<string, string> = {
  open: '開放中',
  submitted: '已提交',
  archived: '已封存',
}

const STATUS_CLASS: Record<string, string> = {
  open: 'bg-green-100 text-green-700',
  submitted: 'bg-blue-100 text-blue-700',
  archived: 'bg-gray-100 text-gray-500',
}

export default function BundleList({ bundles, selectedId, onSelect }: BundleListProps) {
  if (!bundles.length) {
    return <p className="text-sm text-gray-400 italic py-4">尚無報帳單</p>
  }

  return (
    <div className="divide-y divide-gray-100">
      {bundles.map((b) => (
        <button
          key={b.id}
          onClick={() => onSelect(b)}
          className={`w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors ${
            selectedId === b.id ? 'bg-blue-50 border-l-2 border-blue-600' : ''
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-sm text-gray-800 truncate">{b.name}</span>
            <span
              className={`text-xs px-1.5 py-0.5 rounded font-medium ${STATUS_CLASS[b.status] ?? STATUS_CLASS.open}`}
            >
              {STATUS_LABEL[b.status] ?? b.status}
            </span>
          </div>
          <div className="flex gap-3 mt-0.5 text-xs text-gray-400">
            <span>{b.invoice_count} 張發票</span>
            <span>{formatAmount(b.total_amount)}</span>
          </div>
        </button>
      ))}
    </div>
  )
}
