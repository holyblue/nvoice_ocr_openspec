import { Plus, Trash2 } from 'lucide-react'
import type { UseFormReturn } from 'react-hook-form'
import type { InvoiceFormValues } from './InvoiceForm'

interface ItemsTableProps {
  form: UseFormReturn<InvoiceFormValues>
}

export default function ItemsTable({ form }: ItemsTableProps) {
  const { register, watch, setValue } = form
  const items = watch('items') ?? []

  const addItem = () => {
    setValue('items', [
      ...items,
      { item_name: '', quantity: 1, unit_price: null, amount: null },
    ])
  }

  const removeItem = (index: number) => {
    setValue('items', items.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">品項明細</h3>
        <button
          type="button"
          onClick={addItem}
          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
        >
          <Plus size={14} /> 新增品項
        </button>
      </div>

      {items.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left p-2 border border-gray-200">品名</th>
                <th className="text-right p-2 border border-gray-200 w-16">數量</th>
                <th className="text-right p-2 border border-gray-200 w-24">單價</th>
                <th className="text-right p-2 border border-gray-200 w-24">小計</th>
                <th className="p-2 border border-gray-200 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((_, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="p-1 border border-gray-200">
                    <input
                      {...register(`items.${i}.item_name`)}
                      className="w-full px-1 py-0.5 border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-400 rounded"
                      placeholder="品名"
                    />
                  </td>
                  <td className="p-1 border border-gray-200">
                    <input
                      type="number"
                      {...register(`items.${i}.quantity`, { valueAsNumber: true })}
                      className="w-full px-1 py-0.5 border-0 bg-transparent text-right focus:outline-none focus:ring-1 focus:ring-blue-400 rounded"
                    />
                  </td>
                  <td className="p-1 border border-gray-200">
                    <input
                      type="number"
                      {...register(`items.${i}.unit_price`, { valueAsNumber: true })}
                      className="w-full px-1 py-0.5 border-0 bg-transparent text-right focus:outline-none focus:ring-1 focus:ring-blue-400 rounded"
                      placeholder="—"
                    />
                  </td>
                  <td className="p-1 border border-gray-200">
                    <input
                      type="number"
                      {...register(`items.${i}.amount`, { valueAsNumber: true })}
                      className="w-full px-1 py-0.5 border-0 bg-transparent text-right focus:outline-none focus:ring-1 focus:ring-blue-400 rounded"
                      placeholder="—"
                    />
                  </td>
                  <td className="p-1 border border-gray-200 text-center">
                    <button
                      type="button"
                      onClick={() => removeItem(i)}
                      className="text-red-400 hover:text-red-600"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {items.length === 0 && (
        <p className="text-xs text-gray-400 italic">無品項明細</p>
      )}
    </div>
  )
}
