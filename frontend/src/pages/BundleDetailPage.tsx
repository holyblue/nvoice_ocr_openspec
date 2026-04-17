import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { getBundle, addInvoiceToBundle } from '../api/bundles'
import { listInvoices } from '../api/invoices'
import BundleDetail from '../components/bundle/BundleDetail'
import { ArrowLeft, PlusCircle } from 'lucide-react'
import { useState } from 'react'

export default function BundleDetailPage() {
  const { id } = useParams<{ id: string }>()
  const bundleId = Number(id)
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [showAdd, setShowAdd] = useState(false)
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | ''>('')

  const { data: bundle } = useQuery({
    queryKey: ['bundle', bundleId],
    queryFn: () => getBundle(bundleId),
  })

  // Invoices not yet in any bundle
  const { data: freeInvoices } = useQuery({
    queryKey: ['invoices', { bundle_id: 'none' }],
    queryFn: () => listInvoices({ size: 100 }),
    enabled: showAdd,
    select: (data) => data.items.filter((inv) => !inv.bundle_id),
  })

  const addMutation = useMutation({
    mutationFn: () => addInvoiceToBundle(bundleId, Number(selectedInvoiceId)),
    onSuccess: () => {
      toast.success('發票已加入報帳單')
      setSelectedInvoiceId('')
      setShowAdd(false)
      qc.invalidateQueries({ queryKey: ['bundle', bundleId] })
      qc.invalidateQueries({ queryKey: ['invoices'] })
    },
    onError: () => toast.error('加入失敗'),
  })

  const isLocked = bundle?.status !== 'open'

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Back */}
      <button
        onClick={() => navigate('/bundles')}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft size={16} /> 回報帳單列表
      </button>

      {/* Add invoice panel */}
      {!isLocked && (
        <div>
          {!showAdd ? (
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800"
            >
              <PlusCircle size={16} /> 加入發票
            </button>
          ) : (
            <div className="flex gap-2 items-center bg-white border border-gray-200 rounded-lg p-3">
              <select
                className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-sm"
                value={selectedInvoiceId}
                onChange={(e) => setSelectedInvoiceId(e.target.value ? Number(e.target.value) : '')}
              >
                <option value="">選擇發票…</option>
                {(freeInvoices ?? []).map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.invoice_number ?? `#${inv.id}`} — {inv.seller_name ?? '未知'}{' '}
                    {inv.amount_total != null ? `NT$${inv.amount_total.toLocaleString()}` : ''}
                  </option>
                ))}
              </select>
              <button
                onClick={() => addMutation.mutate()}
                disabled={!selectedInvoiceId || addMutation.isPending}
                className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
              >
                加入
              </button>
              <button
                onClick={() => setShowAdd(false)}
                className="text-sm text-gray-400 hover:text-gray-600"
              >
                取消
              </button>
            </div>
          )}
        </div>
      )}

      {/* Bundle content */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <BundleDetail bundleId={bundleId} />
      </div>
    </div>
  )
}
