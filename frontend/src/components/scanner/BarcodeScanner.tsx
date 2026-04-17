import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { CheckCircle, X } from 'lucide-react'

interface BarcodeScannerProps {
  onScan: (raw: string) => void
  onSkip: () => void
  scanned: string | null
}

export default function BarcodeScanner({ onScan, onSkip, scanned }: BarcodeScannerProps) {
  const containerId = 'barcode-scanner'
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (scanned) return

    const scanner = new Html5Qrcode(containerId)
    scannerRef.current = scanner

    scanner
      .start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 300, height: 100 },
          formatsToSupport: [
            // @ts-expect-error Html5QrcodeSupportedFormats
            Html5Qrcode.SUPPORTED_FORMATS?.CODE_39 ?? 6,
          ],
        },
        (text) => {
          scanner.stop().catch(() => {})
          onScan(text)
        },
        undefined,
      )
      .catch((err) => {
        setError(err?.message || '條碼掃描器啟動失敗')
      })

    return () => {
      scanner.stop().catch(() => {})
    }
  }, [scanned])

  if (scanned) {
    return (
      <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
        <CheckCircle size={20} className="text-green-600" />
        <span className="text-green-800 text-sm font-medium">條碼已讀取</span>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-gray-700">掃描紙本條碼（Code39）</p>
      {error ? (
        <p className="text-red-600 text-sm">{error}</p>
      ) : (
        <div id={containerId} className="rounded-lg overflow-hidden" />
      )}
      <button
        onClick={onSkip}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <X size={14} /> 略過此步驟
      </button>
    </div>
  )
}
