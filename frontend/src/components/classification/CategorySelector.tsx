import { useQuery } from '@tanstack/react-query'
import { listCategories } from '../../api/categories'
import type { ClassificationSuggestion } from '../../types'
import ConfidenceBadge from '../shared/ConfidenceBadge'

interface CategorySelectorProps {
  value: number | null
  onChange: (categoryId: number | null) => void
  suggestion: ClassificationSuggestion | null
}

export default function CategorySelector({ value, onChange, suggestion }: CategorySelectorProps) {
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: listCategories,
  })

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <select
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">— 未分類 —</option>
          {categories.map((cat) => (
            <option
              key={cat.id}
              value={cat.id}
              className={suggestion?.category_id === cat.id ? 'font-bold' : ''}
            >
              {cat.code} {cat.name}
              {suggestion?.category_id === cat.id ? ' ★' : ''}
            </option>
          ))}
        </select>
      </div>

      {suggestion && (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>AI 建議：{suggestion.category_name ?? suggestion.category_code ?? '—'}</span>
          <ConfidenceBadge confidence={suggestion.confidence} source={suggestion.source} />
          {suggestion.reasoning && (
            <span className="italic text-gray-400 truncate max-w-xs" title={suggestion.reasoning}>
              {suggestion.reasoning}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
