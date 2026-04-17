import { useEffect } from 'react'
import { Camera, RotateCcw, Upload } from 'lucide-react'
import { useCamera } from '../../hooks/useCamera'

interface CameraCaptureProps {
  onCapture: (base64: string) => void
  capturedImage: string | null
  onRetake: () => void
}

export default function CameraCapture({ onCapture, capturedImage, onRetake }: CameraCaptureProps) {
  const { videoRef, error, isActive, startCamera, stopCamera, capturePhoto } = useCamera()

  useEffect(() => {
    if (!capturedImage) {
      startCamera()
    }
    return () => stopCamera()
  }, [capturedImage])

  const handleCapture = () => {
    const b64 = capturePhoto()
    if (b64) {
      stopCamera()
      onCapture(b64)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const result = ev.target?.result as string
      const b64 = result.split(',')[1]
      if (b64) onCapture(b64)
    }
    reader.readAsDataURL(file)
  }

  if (capturedImage) {
    return (
      <div className="space-y-4">
        <img
          src={`data:image/jpeg;base64,${capturedImage}`}
          alt="Captured invoice"
          className="w-full rounded-lg border border-gray-300 object-contain max-h-80"
        />
        <button
          onClick={onRetake}
          className="flex items-center gap-2 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
        >
          <RotateCcw size={16} /> 重拍
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          <p className="font-medium">無法開啟相機</p>
          <p className="text-sm">{error}</p>
          <label className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700">
            <Upload size={16} /> 上傳圖片
            <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
          </label>
        </div>
      ) : (
        <>
          <div className="relative bg-black rounded-lg overflow-hidden" style={{ minHeight: '300px' }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            {!isActive && (
              <div className="absolute inset-0 flex items-center justify-center text-white">
                <Camera size={48} className="opacity-50" />
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleCapture}
              disabled={!isActive}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
            >
              <Camera size={16} /> 拍照
            </button>
            <label className="flex items-center gap-2 px-4 py-2 bg-gray-200 rounded-lg cursor-pointer hover:bg-gray-300">
              <Upload size={16} /> 上傳
              <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
            </label>
          </div>
        </>
      )}
    </div>
  )
}
