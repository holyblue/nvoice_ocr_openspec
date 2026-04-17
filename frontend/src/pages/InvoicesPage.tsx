import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { listInvoices, type InvoiceFilters } from '../api/invoices'
import { listCategories } from '../api/categories'
import InvoiceCard from '../components/invoice/InvoiceCard'
import { Search } from 'lucide-react'

export default function InvoicesPage() {
  const [filters, setFilters] = useState<InvoiceFilters>({ page: 1, size: 20 })
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['invoices', filters],
    queryFn: () => listInvoices(filters),
  })

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: listCategories,
  })

  const handleFilter = (partial: Partial<InvoiceFilters>) => {
    setFilters((prev) => ({ ...prev, ...partial, page: 1 }))
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-800">發票清單</h1>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 flex flex-wrap gap-3 items-end">
        <div className="flex items-center gap-1 border border-gray-300 rounded px-2 py-1.5 text-sm w-48">
          <Search size={14} className="text-gray-400" />
          <input
            className="flex-1 focus:outline-none bg-transparent"
            placeholder="搜尋…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="border border-gray-300 rounded px-2 py-1.5 text-sm"
          value={filters.status ?? ''}
          onChange={(e) => handleFilter({ status: e.target.value || undefined })}
        >
          <option value="">全部狀態</option>
          <option value="pending">待確認</option>
          <option value="confirmed">已確認</option>
          <option value="rejected">已拒絕</option>
        </select>

        <select
          className="border border-gray-300 rounded px-2 py-1.5 text-sm"
          value={filters.category_id ?? ''}
          onChange={(e) =>
            handleFilter({ category_id: e.target.value ? Number(e.target.value) : undefined })
          }
        >
          <option value="">全部分類</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.code} {c.name}
            </option>
          ))}
        </select>

        <div className="flex gap-1 items-center text-sm">
          <input
            type="date"
            className="border border-gray-300 rounded px-2 py-1.5 text-sm"
            value={filters.date_from ?? ''}
            onChange={(e) => handleFilter({ date_from: e.target.value || undefined })}
          />
          <span className="text-gray-400">—</span>
          <input
            type="date"
            className="border border-gray-300 rounded px-2 py-1.5 text-sm"
            value={filters.date_to ?? ''}
            onChange={(e) => handleFilter({ date_to: e.target.value || undefined })}
          />
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="text-center py-8 text-gray-400">載入中…</div>
      ) : !data?.items.length ? (
        <div className="text-center py-8 text-gray-400">查無發票</div>
      ) : (
        <>
          <p className="text-xs text-gray-500">共 {data.total} 筆</p>
          <div className="grid gap-3">
            {data.items
              .filter(
                (inv) =>
                  !search ||
                  inv.seller_name?.includes(search) ||
                  inv.invoice_number?.includes(search),
              )
              .map((inv) => (
                <InvoiceCard key={inv.id} invoice={inv} />
              ))}
          </div>

          {/* Pagination */}
          {data.total > (filters.size ?? 20) && (
            <div className="flex justify-center gap-2">
              <button
                disabled={(filters.page ?? 1) <= 1}
                onClick={() => handleFilter({ page: (filters.page ?? 1) - 1 })}
                className="px-3 py-1 text-sm border rounded disabled:opacity-40"
              >
                上一頁
              </button>
              <span className="px-3 py-1 text-sm text-gray-600">第 {filters.page} 頁</span>
              <button
                disabled={
                  (filters.page ?? 1) * (filters.size ?? 20) >= data.total
                }
                onClick={() => handleFilter({ page: (filters.page ?? 1) + 1 })}
                className="px-3 py-1 text-sm border rounded disabled:opacity-40"
              >
                下一頁
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
