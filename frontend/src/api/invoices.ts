import client from './client'
import type {
  Invoice,
  InvoiceListResponse,
  InvoiceItem,
  ScanRequest,
  ClassificationSuggestion,
} from '../types'

export interface InvoiceFilters {
  bundle_id?: number
  status?: string
  category_id?: number
  date_from?: string
  date_to?: string
  page?: number
  size?: number
}

export interface InvoiceUpdate {
  invoice_number?: string
  purchase_date?: string
  seller_name?: string
  seller_tax_id?: string
  buyer_tax_id?: string
  amount_untaxed?: number
  amount_tax?: number
  amount_total?: number
  category_id?: number | null
  classification_source?: string
  bundle_id?: number | null
  status?: string
}

export const scanInvoice = (req: ScanRequest) =>
  client.post<Invoice>('/invoices/scan', req).then((r) => r.data)

export const listInvoices = (filters: InvoiceFilters = {}) =>
  client.get<InvoiceListResponse>('/invoices/', { params: filters }).then((r) => r.data)

export const getInvoice = (id: number) =>
  client.get<Invoice>(`/invoices/${id}`).then((r) => r.data)

export const updateInvoice = (id: number, data: InvoiceUpdate) =>
  client.put<Invoice>(`/invoices/${id}`, data).then((r) => r.data)

export const deleteInvoice = (id: number) =>
  client.delete(`/invoices/${id}`)

export const classifyInvoice = (id: number) =>
  client.post<ClassificationSuggestion>(`/invoices/${id}/classify`).then((r) => r.data)

export const getInvoiceImageUrl = (id: number) => `/api/v1/invoices/${id}/image`
