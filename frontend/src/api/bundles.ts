import client from './client'
import type { Bundle } from '../types'

export interface BundleCreate {
  name: string
  description?: string
  date_from?: string
  date_to?: string
}

export interface BundleUpdate {
  name?: string
  description?: string
  status?: string
  date_from?: string
  date_to?: string
}

export const createBundle = (data: BundleCreate) =>
  client.post<Bundle>('/bundles/', data).then((r) => r.data)

export const listBundles = () =>
  client.get<Bundle[]>('/bundles/').then((r) => r.data)

export const getBundle = (id: number) =>
  client.get<Bundle>(`/bundles/${id}`).then((r) => r.data)

export const updateBundle = (id: number, data: BundleUpdate) =>
  client.put<Bundle>(`/bundles/${id}`, data).then((r) => r.data)

export const deleteBundle = (id: number) =>
  client.delete(`/bundles/${id}`)

export const addInvoiceToBundle = (bundleId: number, invoiceId: number) =>
  client.post(`/bundles/${bundleId}/invoices`, { invoice_id: invoiceId }).then((r) => r.data)

export const removeInvoiceFromBundle = (bundleId: number, invoiceId: number) =>
  client.delete(`/bundles/${bundleId}/invoices/${invoiceId}`)
