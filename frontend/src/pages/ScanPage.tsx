import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Camera, Upload, CheckCircle, QrCode, Barcode } from 'lucide-react'
import CameraCapture from '../components/scanner/CameraCapture'
import QRScanner from '../components/scanner/QRScanner'
import BarcodeScanner from '../components/scanner/BarcodeScanner'
import InvoiceForm from '../components/invoice/InvoiceForm'
import { useInvoiceStore } from '../stores/invoiceStore'
import { scanInvoice, updateInvoice } from '../api/invoices'
import type { InvoiceFormValues } from '../components/invoice/InvoiceForm'

type Step = 'input' | 'processing' | 'review' | 'done'
type ActiveScanner = 'qr-left' | 'qr-right' | 'barcode' | null
type CaptureTab = 'camera' | 'upload'

export default function ScanPage() {
  const navigate = useNavigate()
  const {
    draft,
    setImageBase64,
    setQrLeft,
    setQrRight,
    setBarcodeRaw,
    setScannedInvoice,
    getScanRequest,
    resetDraft,
  } = useInvoiceStore()

  const [step, setStep] = useState<Step>('input')
  const [activeScanner, setActiveScanner] = useState<ActiveScanner>(null)
  const [captureTab, setCaptureTab] = useState<CaptureTab>('camera')
  const [isLoading, setIsLoading] = useState(false)

  const handleScan = async () => {
    setStep('processing')
    setIsLoading(true)
    try {
      const req = getScanRequest()
      const invoice = await scanInvoice(req)
      setScannedInvoice(invoice)
      setStep('review')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      if ((err as { response?: { status?: number } })?.response?.status === 409) {
        toast.error('此發票已存在（重複）')
      } else {
        toast.error(msg ?? 'OCR 失敗，請重試')
      }
      setStep('input')
    } finally {
      setIsLoading(false)
    }
  }

  const handleReviewSubmit = async (values: InvoiceFormValues) => {
    if (!draft.scannedInvoice) return
    setIsLoading(true)
    try {
      await updateInvoice(draft.scannedInvoice.id, {
        ...values,
        status: 'confirmed',
        category_id: values.category_id ?? undefined,
      })
      toast.success('發票已確認儲存')
      resetDraft()
      navigate('/invoices')
    } catch {
      toast.error('儲存失敗，請重試')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleScanner = (scanner: NonNullable<ActiveScanner>) => {
    setActiveScanner((prev) => (prev === scanner ? null : scanner))
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const result = ev.target?.result as string
      const b64 = result.split(',')[1]
      if (b64) setImageBase64(b64)
    }
    reader.readAsDataURL(file)
  }

  const progressSteps: { key: Step; label: string }[] = [
    { key: 'input', label: '拍照' },
    { key: 'processing', label: '辨識中' },
    { key: 'review', label: '確認' },
    { key: 'done', label: '完成' },
  ]
  const stepIndex = progressSteps.findIndex((s) => s.key === step)

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-xl font-bold text-gray-800">掃描發票</h1>

      {/* Progress bar */}
      <div className="flex items-center gap-0">
        {progressSteps.map((s, i) => (
          <div key={s.key} className="flex items-center flex-1">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                i <= stepIndex
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-white border-gray-300 text-gray-400'
              }`}
            >
              {i + 1}
            </div>
            <span
              className={`ml-1 text-xs font-medium transition-colors ${
                i <= stepIndex ? 'text-blue-600' : 'text-gray-400'
              }`}
            >
              {s.label}
            </span>
            {i < progressSteps.length - 1 && <div className="flex-1 h-px bg-gray-200 mx-2" />}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        {step === 'input' && (
          <div className="space-y-5">
            {/* Photo area: preview when captured, tabs+capture when not */}
            {draft.imageBase64 ? (
              <div className="space-y-2">
                <img
                  src={`data:image/jpeg;base64,${draft.imageBase64}`}
                  alt="Captured invoice"
                  className="w-full rounded-lg border border-gray-300 object-contain max-h-72"
                />
                <button
                  onClick={() => setImageBase64('')}
                  className="text-xs text-gray-500 hover:text-gray-700 underline"
                >
                  重拍 / 換圖
                </button>
              </div>
            ) : (
              <>
                {/* Capture tabs */}
                <div className="flex rounded-lg overflow-hidden border border-gray-200">
                  <button
                    onClick={() => setCaptureTab('camera')}
                    className={`flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                      captureTab === 'camera'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Camera size={15} /> 拍照
                  </button>
                  <button
                    onClick={() => setCaptureTab('upload')}
                    className={`flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                      captureTab === 'upload'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Upload size={15} /> 上傳圖片
                  </button>
                </div>

                {captureTab === 'camera' ? (
                  <CameraCapture
                    onCapture={setImageBase64}
                    capturedImage={null}
                    onRetake={() => {}}
                  />
                ) : (
                  <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-gray-300 rounded-lg p-10 cursor-pointer hover:border-blue-400 transition-colors">
                    <Upload size={32} className="text-gray-400" />
                    <span className="text-sm text-gray-500">點擊選取圖片</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </label>
                )}
              </>
            )}

            {/* QR / Barcode section */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-600">QR Code / 條碼掃描</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => toggleScanner('qr-left')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    draft.qrLeft
                      ? 'bg-green-50 border-green-300 text-green-700'
                      : activeScanner === 'qr-left'
                        ? 'bg-blue-50 border-blue-400 text-blue-700'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {draft.qrLeft ? <CheckCircle size={13} /> : <QrCode size={13} />}
                  左側 QR Code
                </button>

                <button
                  onClick={() => toggleScanner('qr-right')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    draft.qrRight
                      ? 'bg-green-50 border-green-300 text-green-700'
                      : activeScanner === 'qr-right'
                        ? 'bg-blue-50 border-blue-400 text-blue-700'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {draft.qrRight ? <CheckCircle size={13} /> : <QrCode size={13} />}
                  右側 QR Code（選填）
                </button>

                <button
                  onClick={() => toggleScanner('barcode')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    draft.barcodeRaw
                      ? 'bg-green-50 border-green-300 text-green-700'
                      : activeScanner === 'barcode'
                        ? 'bg-blue-50 border-blue-400 text-blue-700'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {draft.barcodeRaw ? <CheckCircle size={13} /> : <Barcode size={13} />}
                  紙本條碼（選填）
                </button>
              </div>

              {/* Inline scanners — only one active at a time */}
              {activeScanner === 'qr-left' && (
                <QRScanner
                  side="left"
                  onScan={(raw) => {
                    setQrLeft(raw)
                    setActiveScanner(null)
                  }}
                  onSkip={() => setActiveScanner(null)}
                  scanned={null}
                />
              )}
              {activeScanner === 'qr-right' && (
                <QRScanner
                  side="right"
                  onScan={(raw) => {
                    setQrRight(raw)
                    setActiveScanner(null)
                  }}
                  onSkip={() => setActiveScanner(null)}
                  scanned={null}
                />
              )}
              {activeScanner === 'barcode' && (
                <BarcodeScanner
                  onScan={(raw) => {
                    setBarcodeRaw(raw)
                    setActiveScanner(null)
                  }}
                  onSkip={() => setActiveScanner(null)}
                  scanned={null}
                />
              )}
            </div>

            {/* Submit */}
            <div className="space-y-1.5">
              <button
                onClick={handleScan}
                disabled={!draft.imageBase64}
                className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm font-medium"
              >
                開始辨識
              </button>
              {!draft.imageBase64 && (
                <p className="text-center text-xs text-gray-400">請先拍攝發票照片</p>
              )}
            </div>
          </div>
        )}

        {step === 'processing' && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-600 text-sm">正在進行 OCR 辨識與分類…</p>
          </div>
        )}

        {step === 'review' && draft.scannedInvoice && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-gray-700">確認與儲存</h2>
            <InvoiceForm
              invoice={draft.scannedInvoice}
              onSubmit={handleReviewSubmit}
              isLoading={isLoading}
            />
            <button
              type="button"
              onClick={() => {
                resetDraft()
                setStep('input')
              }}
              className="w-full py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition text-sm"
            >
              放棄，重新掃描
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
