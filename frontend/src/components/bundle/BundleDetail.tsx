import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { getBundle, updateBundle, deleteBundle, removeInvoiceFromBundle } from '../../api/bundles'
import { listInvoices } from '../../api/invoices'
import { downloadBundleExcel, downloadBundleCsv } from '../../api/export'
import InvoiceCard from '../invoice/InvoiceCard'
import { FileDown, Trash2, Pencil, Check, X } from 'lucide-react'

interface BundleDetailProps {
  bundleId: number
}

export default function BundleDetail({ bundleId }: BundleDetailProps) {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')

  const { data: bundle, isLoading: bundleLoading } = useQuery({
    queryKey: ['bundle', bundleId],
    queryFn: () => getBundle(bundleId),
  })

  const { data: invoicesData } = useQuery({
    queryKey: ['invoices', { bundle_id: bundleId }],
    queryFn: () => listInvoices({ bundle_id: bundleId, size: 100 }),
  })

  const submitMutation = useMutation({
    mutationFn: () => updateBundle(bundleId, { status: 'submitted' }),
    onSuccess: () => {
      toast.success('已提交報帳單')
      qc.invalidateQueries({ queryKey: ['bundle', bundleId] })
      qc.invalidateQueries({ queryKey: ['bundles'] })
    },
    onError: () => toast.error('提交失敗'),
  })

  const editMutation = useMutation({
    mutationFn: () => updateBundle(bundleId, {
      name: editName.trim(),
      description: editDesc.trim() || undefined,
    }),
    onSuccess: () => {
      toast.success('已更新報帳單')
      setEditing(false)
      qc.invalidateQueries({ queryKey: ['bundle', bundleId] })
      qc.invalidateQueries({ queryKey: ['bundles'] })
    },
    onError: () => toast.error('更新失敗'),
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteBundle(bundleId),
    onSuccess: () => {
      toast.success('已刪除報帳單')
      qc.invalidateQueries({ queryKey: ['bundles'] })
      navigate('/bundles')
    },
    onError: () => toast.error('刪除失敗'),
  })

  const removeInvoice = useMutation({
    mutationFn: (invoiceId: number) => removeInvoiceFromBundle(bundleId, invoiceId),
    onSuccess: () => {
      toast.success('已移除發票')
      qc.invalidateQueries({ queryKey: ['bundle', bundleId] })
      qc.invalidateQueries({ queryKey: ['invoices', { bundle_id: bundleId }] })
    },
    onError: () => toast.error('移除失敗'),
  })

  if (bundleLoading) return <div className="py-8 text-center text-gray-400">載入中…</div>
  if (!bundle) return <div className="py-8 text-center text-gray-400">找不到報帳單</div>

  const isLocked = bundle.status !== 'open'
  const invoices = invoicesData?.items ?? []

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="space-y-2">
              <input
                className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="報帳單名稱 *"
              />
              <input
                className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                placeholder="備註（選填）"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => editMutation.mutate()}
                  disabled={!editName.trim() || editMutation.isPending}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  <Check size={14} /> 儲存
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 transition"
                >
                  <X size={14} /> 取消
                </button>
              </div>
            </div>
          ) : (
            <div>
              <h2 className="text-lg font-bold text-gray-800">{bundle.name}</h2>
              {bundle.description && (
                <p className="text-sm text-gray-500 mt-0.5">{bundle.description}</p>
              )}
            </div>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => downloadBundleExcel(bundleId)}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition"
          >
            <FileDown size={14} /> Excel
          </button>
          <button
            onClick={() => downloadBundleCsv(bundleId)}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition"
          >
            <FileDown size={14} /> CSV
          </button>
          {!isLocked && !editing && (
            <button
              onClick={() => { setEditName(bundle.name); setEditDesc(bundle.description ?? ''); setEditing(true) }}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition"
              title="編輯"
            >
              <Pencil size={14} />
            </button>
          )}
          {!isLocked && !editing && (
            <button
              onClick={() => {
                if (confirm('確定要刪除此報帳單？')) deleteMutation.mutate()
              }}
              disabled={deleteMutation.isPending}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-100 text-red-600 rounded-lg hover:bg-red-200 disabled:opacity-50 transition"
              title="刪除"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-gray-800">{bundle.invoice_count}</p>
          <p className="text-xs text-gray-500">張發票</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-lg font-bold text-gray-800">
            {bundle.total_amount != null ? `NT$${bundle.total_amount.toLocaleString()}` : '—'}
          </p>
          <p className="text-xs text-gray-500">總金額</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-base font-bold text-gray-800">
            {bundle.status === 'open' ? '開放中' : bundle.status === 'submitted' ? '已提交' : '已封存'}
          </p>
          <p className="text-xs text-gray-500">狀態</p>
        </div>
      </div>

      {/* Submit button */}
      {!isLocked && (
        <button
          onClick={() => submitMutation.mutate()}
          disabled={submitMutation.isPending || invoices.length === 0}
          className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition text-sm"
        >
          提交報帳單
        </button>
      )}

      {/* Invoice list */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-700">發票清單</h3>
        {invoices.length === 0 ? (
          <p className="text-sm text-gray-400 italic">尚無發票</p>
        ) : (
          invoices.map((inv) => (
            <div key={inv.id} className="relative">
              <InvoiceCard invoice={inv} />
              {!isLocked && (
                <button
                  onClick={() => removeInvoice.mutate(inv.id)}
                  className="absolute top-2 right-2 p-1 text-red-400 hover:text-red-600 bg-white rounded"
                  title="移除"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
