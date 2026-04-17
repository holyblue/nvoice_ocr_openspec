export interface ExportInvoiceFilters {
  bundle_id?: number
  status?: string
  category_id?: number
  date_from?: string
  date_to?: string
  include_items?: boolean
}

function buildQueryString(params: Record<string, string | number | boolean | undefined>) {
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) q.append(k, String(v))
  }
  return q.toString()
}

export const downloadBundleExcel = (bundleId: number) => {
  window.location.href = `/api/v1/export/bundle/${bundleId}/excel`
}

export const downloadBundleCsv = (bundleId: number) => {
  window.location.href = `/api/v1/export/bundle/${bundleId}/csv`
}

export const downloadInvoicesExcel = (filters: ExportInvoiceFilters = {}) => {
  const qs = buildQueryString(filters as Record<string, string | number | boolean | undefined>)
  window.location.href = `/api/v1/export/invoices/excel${qs ? '?' + qs : ''}`
}
