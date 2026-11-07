'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { API_URL } from '@/lib/api'

interface DetectedPerson {
  name: string
  similarity: number
  recognized: boolean
}

export default function TestDetectionPage() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)

  const [mode, setMode] = useState<'upload' | 'camera'>('upload')
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [resultImage, setResultImage] = useState<string | null>(null)
  const [facesDetected, setFacesDetected] = useState(0)
  const [detectedPersons, setDetectedPersons] = useState<DetectedPerson[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [cameraReady, setCameraReady] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  // --- Camera helpers ---
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play()
          setCameraReady(true)
        }
      }
    } catch {
      setError('Failed to access camera. Please allow camera permissions.')
    }
  }

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
    setCameraReady(false)
  }

  const captureAndDetect = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    ctx.drawImage(video, 0, 0)

    const imageData = canvas.toDataURL('image/jpeg', 0.8)
    await runDetection(imageData)
  }, [])

  // --- Upload helpers ---
  const handleImageUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file.')
      return
    }
    const reader = new FileReader()
    reader.onloadend = () => {
      setSelectedImage(reader.result as string)
      setResultImage(null)
      setFacesDetected(0)
      setDetectedPersons([])
      setError('')
    }
    reader.readAsDataURL(file)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleImageUpload(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleImageUpload(file)
  }

  // --- Detection API ---
  const runDetection = async (imageData: string) => {
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_URL}/api/v1/cameras/test-detection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageData, return_image: true }),
      })

      if (response.ok) {
        const data = await response.json()
        setResultImage(data.image)
        setFacesDetected(data.faces_detected)
        setDetectedPersons(data.detected_persons || [])
      } else {
        const data = await response.json().catch(() => ({}))
        setError(data.error || 'Detection failed. Please try again.')
      }
    } catch {
      setError('Failed to connect to the detection server.')
    } finally {
      setIsLoading(false)
    }
  }

  // --- Mode switching ---
  const switchMode = (newMode: 'upload' | 'camera') => {
    if (newMode === mode) return
    if (mode === 'camera') stopCamera()
    setMode(newMode)
    setResultImage(null)
    setFacesDetected(0)
    setDetectedPersons([])
    setError('')
    if (newMode === 'camera') {
      setTimeout(startCamera, 100)
    }
  }

  return (
    <div className="p-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Test Detection</h1>
        <p className="mt-1 text-slate-500">Upload an image or use your camera to test face detection and recognition</p>
      </div>

      {/* Mode Tabs */}
      <div className="mb-6">
        <div className="inline-flex bg-slate-100 rounded-xl p-1">
          <button
            onClick={() => switchMode('upload')}
            className={`inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl transition-all ${
              mode === 'upload'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
            </svg>
            Upload Image
          </button>
          <button
            onClick={() => switchMode('camera')}
            className={`inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl transition-all ${
              mode === 'camera'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
            Live Camera
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-6 flex items-center gap-3 bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Input */}
        <div className="space-y-6">
          {mode === 'upload' ? (
            <div className="bg-white border border-slate-100 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Upload Image</h2>

              {/* Drop Zone */}
              <div
                ref={dropZoneRef}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative cursor-pointer border-2 border-dashed rounded-xl p-10 text-center transition-all ${
                  isDragging
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
                </svg>
                <p className="text-slate-600 font-medium">Drop an image or click to browse</p>
                <p className="text-slate-400 text-sm mt-1">Supports JPG, PNG, WebP</p>
              </div>

              {/* Image Preview */}
              {selectedImage && (
                <div className="mt-5">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-slate-600">Selected Image</h3>
                    <button
                      onClick={() => {
                        setSelectedImage(null)
                        setResultImage(null)
                        setFacesDetected(0)
                        setDetectedPersons([])
                      }}
                      className="text-xs text-slate-400 hover:text-red-500 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                  <img
                    src={selectedImage}
                    alt="Selected"
                    className="w-full rounded-xl border border-slate-100"
                  />
                  <button
                    onClick={() => runDetection(selectedImage)}
                    disabled={isLoading}
                    className="mt-4 w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-xl shadow-lg shadow-blue-200 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Detecting...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                        </svg>
                        Run Detection
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white border border-slate-100 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Camera Capture</h2>

              <div className="relative aspect-video bg-slate-900 rounded-xl overflow-hidden">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  playsInline
                  muted
                />
                <canvas ref={canvasRef} className="hidden" />
                {!cameraReady && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <svg className="w-12 h-12 text-slate-600 mb-3 animate-pulse" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                    </svg>
                    <p className="text-slate-400 text-sm">Initializing camera...</p>
                  </div>
                )}
              </div>

              <button
                onClick={captureAndDetect}
                disabled={!cameraReady || isLoading}
                className="mt-4 w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-xl shadow-lg shadow-blue-200 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Detecting...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" />
                    </svg>
                    Capture &amp; Detect
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Results */}
        <div className="space-y-6">
          {/* Annotated Image Result */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Detection Results</h2>
              {resultImage && (
                <span className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-bold rounded-full">
                  {facesDetected}
                </span>
              )}
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <svg className="w-12 h-12 animate-spin text-blue-500 mb-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <p className="text-slate-500 font-medium">Analyzing image...</p>
                <p className="text-slate-400 text-sm mt-1">Detecting and identifying faces</p>
              </div>
            ) : resultImage ? (
              <div>
                <img
                  src={resultImage}
                  alt="Detection Result"
                  className="w-full rounded-xl border border-slate-100"
                />
                <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                  </svg>
                  {facesDetected} face{facesDetected !== 1 ? 's' : ''} detected
                </div>
              </div>
            ) : (
              <div className="text-center py-16">
                <svg className="w-16 h-16 text-slate-200 mx-auto mb-4" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
                </svg>
                <p className="text-slate-400">
                  {mode === 'upload'
                    ? 'Upload an image and run detection to see results'
                    : 'Capture a frame to see detection results'}
                </p>
              </div>
            )}
          </div>

          {/* Detected Persons List */}
          {detectedPersons.length > 0 && (
            <div className="bg-white border border-slate-100 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Identified Persons</h2>
              <div className="space-y-3">
                {detectedPersons.map((person, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white ${person.recognized ? 'bg-gradient-to-br from-blue-500 to-purple-500' : 'bg-slate-400'}`}>
                      {person.name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-800 truncate">
                          {person.name || 'Unknown Person'}
                        </p>
                        <span className={`flex-shrink-0 px-2 py-0.5 text-[11px] font-semibold rounded-lg ${
                          person.recognized
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {person.recognized ? 'Recognized' : 'Unknown'}
                        </span>
                      </div>
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              person.similarity > 0.7
                                ? 'bg-gradient-to-r from-blue-500 to-purple-500'
                                : person.similarity > 0.4
                                ? 'bg-amber-400'
                                : 'bg-slate-300'
                            }`}
                            style={{ width: `${Math.round(person.similarity * 100)}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-slate-500 tabular-nums w-10 text-right">
                          {Math.round(person.similarity * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
