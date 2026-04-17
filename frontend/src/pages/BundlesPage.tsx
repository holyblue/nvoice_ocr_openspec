import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { listBundles, createBundle } from '../api/bundles'
import BundleList from '../components/bundle/BundleList'
import type { Bundle } from '../types'
import { Plus, X } from 'lucide-react'

export default function BundlesPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const { data: bundles = [], isLoading } = useQuery({
    queryKey: ['bundles'],
    queryFn: listBundles,
  })

  const createMutation = useMutation({
    mutationFn: () => createBundle({ name: name.trim(), description: description.trim() || undefined }),
    onSuccess: (bundle: Bundle) => {
      toast.success('報帳單已建立')
      qc.invalidateQueries({ queryKey: ['bundles'] })
      setShowCreate(false)
      setName('')
      setDescription('')
      navigate(`/bundles/${bundle.id}`)
    },
    onError: () => toast.error('建立失敗'),
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">報帳單管理</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
        >
          <Plus size={16} /> 新增
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">新增報帳單</h2>
            <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600">
              <X size={16} />
            </button>
          </div>
          <input
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="報帳單名稱 *"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="備註（選填）"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <button
            onClick={() => createMutation.mutate()}
            disabled={!name.trim() || createMutation.isPending}
            className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition text-sm"
          >
            建立
          </button>
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="text-center py-8 text-gray-400">載入中…</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <BundleList
            bundles={bundles}
            onSelect={(b) => navigate(`/bundles/${b.id}`)}
          />
        </div>
      )}
    </div>
  )
}
