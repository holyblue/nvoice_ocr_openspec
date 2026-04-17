import { create } from 'zustand'
import type { Invoice, ScanRequest } from '../types'

interface InvoiceDraft {
  imageBase64: string | null
  qrLeft: string | null
  qrRight: string | null
  barcodeRaw: string | null
  scannedInvoice: Invoice | null
}

interface InvoiceStore {
  draft: InvoiceDraft
  setImageBase64: (b64: string) => void
  setQrLeft: (raw: string) => void
  setQrRight: (raw: string) => void
  setBarcodeRaw: (raw: string) => void
  setScannedInvoice: (invoice: Invoice) => void
  resetDraft: () => void
  getScanRequest: () => ScanRequest
}

const INITIAL_DRAFT: InvoiceDraft = {
  imageBase64: null,
  qrLeft: null,
  qrRight: null,
  barcodeRaw: null,
  scannedInvoice: null,
}

export const useInvoiceStore = create<InvoiceStore>((set, get) => ({
  draft: INITIAL_DRAFT,

  setImageBase64: (b64) => set((s) => ({ draft: { ...s.draft, imageBase64: b64 } })),
  setQrLeft: (raw) => set((s) => ({ draft: { ...s.draft, qrLeft: raw } })),
  setQrRight: (raw) => set((s) => ({ draft: { ...s.draft, qrRight: raw } })),
  setBarcodeRaw: (raw) => set((s) => ({ draft: { ...s.draft, barcodeRaw: raw } })),
  setScannedInvoice: (invoice) =>
    set((s) => ({ draft: { ...s.draft, scannedInvoice: invoice } })),
  resetDraft: () => set({ draft: INITIAL_DRAFT }),

  getScanRequest: () => {
    const { draft } = get()
    return {
      image_base64: draft.imageBase64 ?? '',
      qr_left: draft.qrLeft,
      qr_right: draft.qrRight,
      barcode_raw: draft.barcodeRaw,
    }
  },
}))
