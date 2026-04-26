import { useRef, useState, useCallback, useEffect } from 'react'

interface UseCameraResult {
  videoRef: React.RefObject<HTMLVideoElement | null>
  stream: MediaStream | null
  error: string | null
  isActive: boolean
  startCamera: () => Promise<void>
  stopCamera: () => void
  capturePhoto: () => string | null
}

export function useCamera(): UseCameraResult {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isActive, setIsActive] = useState(false)

  const startCamera = useCallback(async () => {
    setError(null)
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('相機需要 HTTPS 連線才能使用，請改用 https:// 開頭的網址')
      }
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
      })
      setStream(s)
      setIsActive(true)
      if (videoRef.current) {
        videoRef.current.srcObject = s
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '無法開啟相機')
    }
  }, [])

  const stopCamera = useCallback(() => {
    stream?.getTracks().forEach((t) => t.stop())
    setStream(null)
    setIsActive(false)
  }, [stream])

  const capturePhoto = useCallback((): string | null => {
    const video = videoRef.current
    if (!video) return null
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.drawImage(video, 0, 0)
    // Remove "data:image/jpeg;base64," prefix
    return canvas.toDataURL('image/jpeg', 0.85).split(',')[1]
  }, [])

  // Assign stream to video when video element mounts
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [stream])

  return { videoRef, stream, error, isActive, startCamera, stopCamera, capturePhoto }
}
