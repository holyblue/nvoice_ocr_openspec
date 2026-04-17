import { create } from 'zustand'
import type { Bundle } from '../types'

interface BundleStore {
  selectedBundle: Bundle | null
  setSelectedBundle: (bundle: Bundle | null) => void
}

export const useBundleStore = create<BundleStore>((set) => ({
  selectedBundle: null,
  setSelectedBundle: (bundle) => set({ selectedBundle: bundle }),
}))
