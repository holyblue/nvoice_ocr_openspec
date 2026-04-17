export interface InvoiceItem {
  id: number
  item_name: string
  quantity: number
  unit_price: number | null
  amount: number | null
}

export interface ClassificationSuggestion {
  category_id: number | null
  category_code: string | null
  category_name: string | null
  source: 'rule' | 'llm' | 'manual'
  confidence: number
  reasoning: string | null
}

export type InvoiceStatus = 'pending' | 'confirmed' | 'rejected'

export interface Invoice {
  id: number
  invoice_number: string | null
  random_code: string | null
  purchase_date: string | null
  seller_name: string | null
  seller_tax_id: string | null
  buyer_tax_id: string | null
  amount_untaxed: number | null
  amount_tax: number | null
  amount_total: number | null
  category_id: number | null
  classification_source: string | null
  classification_confidence: number | null
  classification_reasoning: string | null
  bundle_id: number | null
  status: InvoiceStatus
  image_path: string | null
  created_at: string
  updated_at: string
  items: InvoiceItem[]
}

export type BundleStatus = 'open' | 'submitted' | 'archived'

export interface Bundle {
  id: number
  name: string
  description: string | null
  status: BundleStatus
  date_from: string | null
  date_to: string | null
  created_at: string
  updated_at: string
  invoice_count: number
  total_amount: number | null
}

export interface Category {
  id: number
  code: string
  name: string
  account_code: string | null
  rules: CategoryRule[]
}

export interface CategoryRule {
  id: number
  rule_type: string
  rule_value: string
  priority: number
}

export interface ScanRequest {
  image_base64: string
  qr_left: string | null
  qr_right: string | null
  barcode_raw: string | null
}

export interface InvoiceListResponse {
  total: number
  page: number
  size: number
  items: Invoice[]
}

export interface CategoryImportResult {
  created: number
  updated: number
  skipped: number
  warnings: string[]
}
