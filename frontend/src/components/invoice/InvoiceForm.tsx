import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useEffect } from 'react'
import type { Invoice, ClassificationSuggestion } from '../../types'
import CategorySelector from '../classification/CategorySelector'
import ItemsTable from './ItemsTable'

const itemSchema = z.object({
  item_name: z.string(),
  quantity: z.number(),
  unit_price: z.number().nullable(),
  amount: z.number().nullable(),
})

const schema = z.object({
  invoice_number: z.string().nullable(),
  random_code: z.string().nullable(),
  purchase_date: z.string().nullable(),
  seller_name: z.string().nullable(),
  seller_tax_id: z.string().nullable(),
  buyer_tax_id: z.string().nullable(),
  amount_untaxed: z.number().nullable(),
  amount_tax: z.number().nullable(),
  amount_total: z.number().nullable(),
  category_id: z.number().nullable(),
  items: z.array(itemSchema),
})

export type InvoiceFormValues = z.infer<typeof schema>

interface InvoiceFormProps {
  invoice: Invoice
  suggestion?: ClassificationSuggestion | null
  onSubmit: (values: InvoiceFormValues) => void
  isLoading?: boolean
}

export default function InvoiceForm({ invoice, suggestion, onSubmit, isLoading }: InvoiceFormProps) {
  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      invoice_number: invoice.invoice_number,
      random_code: invoice.random_code,
      purchase_date: invoice.purchase_date,
      seller_name: invoice.seller_name,
      seller_tax_id: invoice.seller_tax_id,
      buyer_tax_id: invoice.buyer_tax_id,
      amount_untaxed: invoice.amount_untaxed,
      amount_tax: invoice.amount_tax,
      amount_total: invoice.amount_total,
      category_id: invoice.category_id,
      items: invoice.items.map((it) => ({
        item_name: it.item_name,
        quantity: it.quantity,
        unit_price: it.unit_price,
        amount: it.amount,
      })),
    },
  })

  const { register, handleSubmit, watch, setValue, formState: { errors } } = form

  // Auto-calculate amount_total from untaxed + tax
  const untaxed = watch('amount_untaxed')
  const tax = watch('amount_tax')
  useEffect(() => {
    if (untaxed != null && tax != null) {
      setValue('amount_total', untaxed + tax)
    }
  }, [untaxed, tax, setValue])

  const categoryId = watch('category_id')

  const field = (label: string, name: keyof InvoiceFormValues, type = 'text') => (
    <div>
      <label className="block text-xs text-gray-500 mb-0.5">{label}</label>
      <input
        type={type}
        {...register(name as string, type === 'number' ? { valueAsNumber: true } : {})}
        className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {errors[name] && (
        <p className="text-red-500 text-xs mt-0.5">{String(errors[name]?.message)}</p>
      )}
    </div>
  )

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {field('發票號碼', 'invoice_number')}
        {field('隨機碼', 'random_code')}
        {field('購買日期', 'purchase_date', 'date')}
        {field('買方統編', 'buyer_tax_id')}
        {field('賣方名稱', 'seller_name')}
        {field('賣方統編', 'seller_tax_id')}
        {field('未稅金額', 'amount_untaxed', 'number')}
        {field('稅額', 'amount_tax', 'number')}
        {field('含稅總額', 'amount_total', 'number')}
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-0.5">費用分類</label>
        <CategorySelector
          value={categoryId}
          onChange={(id) => setValue('category_id', id)}
          suggestion={suggestion ?? null}
        />
      </div>

      <ItemsTable form={form} />

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition text-sm font-medium"
      >
        {isLoading ? '儲存中…' : '確認並儲存'}
      </button>
    </form>
  )
}
