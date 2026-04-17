import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { listCategories, importCategories, deleteCategory } from '../api/categories'
import { Upload, Trash2, ChevronDown, ChevronRight } from 'lucide-react'
import type { Category } from '../types'

export default function SettingsPage() {
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [expanded, setExpanded] = useState<number | null>(null)

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: listCategories,
  })

  const importMutation = useMutation({
    mutationFn: (file: File) => importCategories(file),
    onSuccess: (result) => {
      toast.success(`匯入完成：新增 ${result.created}，更新 ${result.updated}，略過 ${result.skipped}`)
      qc.invalidateQueries({ queryKey: ['categories'] })
      if (fileRef.current) fileRef.current.value = ''
    },
    onError: () => toast.error('匯入失敗'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteCategory(id),
    onSuccess: () => {
      toast.success('分類已刪除')
      qc.invalidateQueries({ queryKey: ['categories'] })
    },
    onError: () => toast.error('刪除失敗'),
  })

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) importMutation.mutate(file)
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-xl font-bold text-gray-800">設定</h1>

      {/* CSV import */}
      <section className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-3">
        <h2 className="text-base font-semibold text-gray-700">匯入費用分類</h2>
        <p className="text-sm text-gray-500">
          上傳 CSV 檔案以新增或更新費用分類與比對規則。格式：<code className="bg-gray-100 px-1 rounded text-xs">code,name,account_code,rule_type,rule_value,priority</code>
        </p>
        <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg cursor-pointer hover:bg-blue-700 transition">
          <Upload size={15} />
          {importMutation.isPending ? '匯入中…' : '選擇 CSV 檔案'}
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFile}
            disabled={importMutation.isPending}
          />
        </label>
      </section>

      {/* Category list */}
      <section className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-700">費用分類清單</h2>
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-gray-400">載入中…</div>
        ) : categories.length === 0 ? (
          <div className="py-8 text-center text-gray-400 text-sm">尚無分類，請匯入 CSV</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {categories.map((cat: Category) => (
              <div key={cat.id}>
                <div className="flex items-center gap-2 px-5 py-3 hover:bg-gray-50">
                  <button
                    onClick={() => setExpanded(expanded === cat.id ? null : cat.id)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {expanded === cat.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-gray-800">{cat.code}</span>
                    <span className="text-sm text-gray-500 ml-2">{cat.name}</span>
                    {cat.account_code && (
                      <span className="text-xs text-gray-400 ml-2">({cat.account_code})</span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">{cat.rules.length} 條規則</span>
                  <button
                    onClick={() => {
                      if (confirm(`確定刪除分類「${cat.name}」？`)) deleteMutation.mutate(cat.id)
                    }}
                    className="text-red-400 hover:text-red-600 ml-2"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                {expanded === cat.id && cat.rules.length > 0 && (
                  <div className="px-10 pb-3 space-y-1">
                    {cat.rules.map((rule) => (
                      <div key={rule.id} className="flex gap-2 text-xs text-gray-500">
                        <span className="bg-gray-100 px-1.5 py-0.5 rounded font-mono">{rule.rule_type}</span>
                        <span className="truncate">{rule.rule_value}</span>
                        <span className="text-gray-300 ml-auto">優先 {rule.priority}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
