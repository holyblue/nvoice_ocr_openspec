import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { getInvoice, updateInvoice, deleteInvoice, classifyInvoice, getInvoiceImageUrl } from '../api/invoices'
import InvoiceForm from '../components/invoice/InvoiceForm'
import StatusBadge from '../components/shared/StatusBadge'
import { ArrowLeft, RefreshCw, Trash2 } from 'lucide-react'
import type { InvoiceFormValues } from '../components/invoice/InvoiceForm'
import type { ClassificationSuggestion } from '../types'
import { useState } from 'react'

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const invoiceId = Number(id)
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [suggestion, setSuggestion] = useState<ClassificationSuggestion | null>(null)

  const { data: invoice, isLoading } = useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: () => getInvoice(invoiceId),
    enabled: !!invoiceId,
  })

  const updateMutation = useMutation({
    mutationFn: (values: InvoiceFormValues) =>
      updateInvoice(invoiceId, { ...values, status: 'confirmed', category_id: values.category_id ?? undefined }),
    onSuccess: () => {
      toast.success('發票已更新')
      qc.invalidateQueries({ queryKey: ['invoices'] })
      qc.invalidateQueries({ queryKey: ['invoice', invoiceId] })
    },
    onError: () => toast.error('更新失敗'),
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteInvoice(invoiceId),
    onSuccess: () => {
      toast.success('發票已刪除')
      navigate('/invoices')
    },
    onError: () => toast.error('刪除失敗'),
  })

  const classifyMutation = useMutation({
    mutationFn: () => classifyInvoice(invoiceId),
    onSuccess: (result) => {
      setSuggestion(result)
      toast.success('重新分類完成')
    },
    onError: () => toast.error('分類失敗'),
  })

  if (isLoading) {
    return <div className="text-center py-12 text-gray-400">載入中…</div>
  }

  if (!invoice) {
    return <div className="text-center py-12 text-gray-400">找不到發票</div>
  }

  const actionButtons = (
    <div className="flex gap-2">
      <button
        onClick={() => classifyMutation.mutate()}
        disabled={classifyMutation.isPending}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 disabled:opacity-50 transition"
      >
        <RefreshCw size={14} className={classifyMutation.isPending ? 'animate-spin' : ''} />
        重新分類
      </button>
      <button
        onClick={() => {
          if (confirm('確定刪除此發票？')) deleteMutation.mutate()
        }}
        disabled={deleteMutation.isPending}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50 transition ml-auto"
      >
        <Trash2 size={14} /> 刪除
      </button>
    </div>
  )

  const invoiceForm = (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <InvoiceForm
        invoice={invoice}
        suggestion={suggestion}
        onSubmit={(values) => updateMutation.mutate(values)}
        isLoading={updateMutation.isPending}
      />
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-400 hover:text-gray-600"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-gray-800 flex-1">發票詳細</h1>
        <StatusBadge status={invoice.status} />
      </div>

      {invoice.image_path ? (
        <div className="md:grid md:grid-cols-[2fr_3fr] gap-6 items-start">
          {/* Left: full invoice image */}
          <div className="sticky top-4">
            <img
              src={getInvoiceImageUrl(invoice.id)}
              alt="發票圖片"
              className="w-full object-contain max-h-[calc(100vh-8rem)] rounded-xl"
            />
          </div>
          {/* Right: actions + form */}
          <div className="space-y-4">
            {actionButtons}
            {invoiceForm}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {actionButtons}
          {invoiceForm}
        </div>
      )}
    </div>
  )
}
