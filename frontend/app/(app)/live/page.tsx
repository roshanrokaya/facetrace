'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { API_URL } from '@/lib/api'

interface Camera {
  id: number
  name: string
  rtsp_url: string
  is_active: boolean
}

interface BBox {
  x: number
  y: number
  w: number
  h: number
}

interface DetectedPerson {
  id?: number
  uid?: string
  name: string
  similarity: number
  recognized: boolean
  bbox?: BBox
}

interface DetectionEntry {
  /** Unique key for dedup: "recognized:<id>" or "unknown:<index>" */
  key: string
  person: DetectedPerson
  firstSeen: Date
  lastSeen: Date
  count: number
}

export default function LiveMonitorPage() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null)
  const isStreamingRef = useRef(false)
  const detectingRef = useRef(false) // prevent overlapping API calls

  const [cameras, setCameras] = useState<Camera[]>([])
  const [selectedCameraId, setSelectedCameraId] = useState<string>('webcam')
  const [isStreaming, setIsStreaming] = useState(false)
  const [interval, setInterval_] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('facetrace-interval')
      return saved ? Number(saved) : 1000
    }
    return 1000
  })
  const intervalRef = useRef(interval)
  const [entries, setEntries] = useState<DetectionEntry[]>([])
  const [latestFaceCount, setLatestFaceCount] = useState(0)
  const [stats, setStats] = useState({ total: 0, recognized: 0, unknown: 0 })
  const [loadingCameras, setLoadingCameras] = useState(true)

  // Track which person keys are currently visible to detect enter/exit
  const prevKeysRef = useRef<Set<string>>(new Set())

  // Keep intervalRef in sync and persist to localStorage
  useEffect(() => {
    intervalRef.current = interval
    localStorage.setItem('facetrace-interval', String(interval))
  }, [interval])

  useEffect(() => {
    fetchCameras()
    return () => {
      stopStream()
    }
  }, [])

  const fetchCameras = async () => {
    try {
      const response = await fetch(`${API_URL}/api/v1/cameras/`)
      const data = await response.json()
      setCameras(data.cameras || [])
    } catch (err) {
      console.error('Failed to fetch cameras:', err)
    } finally {
      setLoadingCameras(false)
    }
  }

  const startStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play()
          isStreamingRef.current = true
          setIsStreaming(true)
          setEntries([])
          setStats({ total: 0, recognized: 0, unknown: 0 })
          prevKeysRef.current = new Set()
          detectLoop()
        }
      }
    } catch (err) {
      console.error('Failed to access camera:', err)
    }
  }

  const stopStream = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
    isStreamingRef.current = false
    setIsStreaming(false)
  }

  /** Build a dedup key for a detected person */
  const personKey = (p: DetectedPerson, idx: number): string => {
    if (p.recognized && p.id) return `person:${p.id}`
    if (p.recognized && p.name && p.name !== 'Unknown') return `name:${p.name}`
    // Use backend-assigned uid to track the same unknown face across frames
    if (p.uid) return `unknown:${p.uid}`
    return `unknown:${idx}`
  }

  const detectLoop = useCallback(async () => {
    if (!isStreamingRef.current || !videoRef.current) return

    // Skip if previous API call is still in-flight
    if (detectingRef.current) {
      if (isStreamingRef.current) {
        setTimeout(detectLoop, intervalRef.current)
      }
      return
    }

    const video = videoRef.current
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      setTimeout(detectLoop, 100)
      return
    }

    // Use an offscreen canvas — scale down to max 480px wide for speed
    const scale = Math.min(1, 480 / video.videoWidth)
    const w = Math.round(video.videoWidth * scale)
    const h = Math.round(video.videoHeight * scale)
    const offscreen = document.createElement('canvas')
    offscreen.width = w
    offscreen.height = h
    const offCtx = offscreen.getContext('2d')!
    offCtx.drawImage(video, 0, 0, w, h)

    const imageData = offscreen.toDataURL('image/jpeg', 0.6)

    detectingRef.current = true

    try {
      const response = await fetch(`${API_URL}/api/v1/cameras/test-detection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageData }),
      })

      if (response.ok) {
        const data = await response.json()
        const persons: DetectedPerson[] = data.detected_persons || []
        const now = new Date()

        setLatestFaceCount(data.faces_detected)

        // Build current keys
        const currentKeys = new Set<string>()
        persons.forEach((p, i) => currentKeys.add(personKey(p, i)))

        // Update entries: merge with existing entries by key
        setEntries(prev => {
          const updated = [...prev]
          let newCount = 0
          let newRecognized = 0
          let newUnknown = 0

          for (let i = 0; i < persons.length; i++) {
            const p = persons[i]
            const key = personKey(p, i)

            const existingIdx = updated.findIndex(e => e.key === key)

            if (existingIdx >= 0) {
              const entry = updated.splice(existingIdx, 1)[0]
              entry.lastSeen = now
              entry.count += 1
              if (p.similarity > entry.person.similarity) {
                entry.person = { ...p }
              }
              updated.unshift(entry)
            } else {
              updated.unshift({
                key,
                person: { ...p },
                firstSeen: now,
                lastSeen: now,
                count: 1,
              })
              newCount++
              if (p.recognized) newRecognized++
              else newUnknown++
            }
          }

          if (newCount > 0) {
            setStats(s => ({
              total: s.total + newCount,
              recognized: s.recognized + newRecognized,
              unknown: s.unknown + newUnknown,
            }))
          }

          return updated.slice(0, 30)
        })

        prevKeysRef.current = currentKeys

        // Draw lightweight bounding boxes on the transparent overlay
        const overlay = overlayCanvasRef.current
        if (overlay && data.image_width && data.image_height) {
          const oCtx = overlay.getContext('2d')
          if (oCtx) {
            overlay.width = video.videoWidth
            overlay.height = video.videoHeight
            oCtx.clearRect(0, 0, overlay.width, overlay.height)

            // Scale factor: backend processed a scaled-down image
            const sx = video.videoWidth / data.image_width
            const sy = video.videoHeight / data.image_height

            for (const p of persons) {
              if (!p.bbox) continue
              const bx = p.bbox.x * sx
              const by = p.bbox.y * sy
              const bw = p.bbox.w * sx
              const bh = p.bbox.h * sy

              // Box color
              const color = p.recognized ? '#22c55e' : '#f59e0b'
              oCtx.strokeStyle = color
              oCtx.lineWidth = 2
              oCtx.strokeRect(bx, by, bw, bh)

              // Label background
              const label = p.recognized ? `${p.name} ${Math.round(p.similarity * 100)}%` : p.name
              oCtx.font = 'bold 14px sans-serif'
              const tw = oCtx.measureText(label).width
              oCtx.fillStyle = color
              oCtx.fillRect(bx, by - 22, tw + 10, 22)

              // Label text
              oCtx.fillStyle = '#fff'
              oCtx.fillText(label, bx + 5, by - 6)
            }
          }
        }
      }
    } catch (err) {
      console.error('Detection error:', err)
    } finally {
      detectingRef.current = false
    }

    if (isStreamingRef.current) {
      setTimeout(detectLoop, intervalRef.current)
    }
  }, [])

  /** Format a duration like "5s ago" or "2m ago" */
  const timeAgo = (date: Date): string => {
    const seconds = Math.round((Date.now() - date.getTime()) / 1000)
    if (seconds < 5) return 'just now'
    if (seconds < 60) return `${seconds}s ago`
    const mins = Math.floor(seconds / 60)
    return `${mins}m ago`
  }

  /** Check if an entry is still "active" (seen in last 3 seconds) */
  const isActive = (entry: DetectionEntry): boolean => {
    return Date.now() - entry.lastSeen.getTime() < 3000
  }

  return (
    <div className="p-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold text-slate-900">Live Monitor</h1>
          <span className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 text-sm font-medium rounded-full">
            <span className="relative flex h-2.5 w-2.5">
              <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${isStreaming ? 'animate-ping bg-emerald-500' : 'bg-slate-400'}`} />
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isStreaming ? 'bg-emerald-500' : 'bg-slate-400'}`} />
            </span>
            {isStreaming ? 'Live' : 'Offline'}
          </span>
        </div>
        <p className="mt-1 text-slate-500">Real-time face detection and recognition from your webcam feed</p>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Camera Feed (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-slate-100 rounded-2xl p-6">
            <div className="relative aspect-video bg-slate-900 rounded-xl overflow-hidden">
              <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover"
                autoPlay
                playsInline
                muted
              />
              <canvas
                ref={overlayCanvasRef}
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                style={{ display: isStreaming ? 'block' : 'none' }}
              />
              {!isStreaming && (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <svg className="w-16 h-16 text-slate-600 mb-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                  </svg>
                  <p className="text-slate-400 text-lg font-medium">Camera feed inactive</p>
                  <p className="text-slate-500 text-sm mt-1">Click Start to begin monitoring</p>
                </div>
              )}
            </div>

            {/* Controls Bar */}
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <button
                onClick={isStreaming ? stopStream : startStream}
                className={`inline-flex items-center gap-2 px-6 py-2.5 text-white font-medium rounded-xl transition-all ${
                  isStreaming
                    ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-red-200 shadow-lg'
                    : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-emerald-200 shadow-lg'
                }`}
              >
                {isStreaming ? (
                  <>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="1" /></svg>
                    Stop Monitoring
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                    Start Monitoring
                  </>
                )}
              </button>

              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-slate-600">Interval:</label>
                <select
                  value={interval}
                  onChange={(e) => setInterval_(Number(e.target.value))}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={200}>200ms (Ultra Fast)</option>
                  <option value={500}>500ms (Fast)</option>
                  <option value={1000}>1s (Normal)</option>
                  <option value={2000}>2s (Slow)</option>
                  <option value={5000}>5s (Very Slow)</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-slate-600">Camera:</label>
                <select
                  value={selectedCameraId}
                  onChange={(e) => setSelectedCameraId(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="webcam">Built-in Webcam</option>
                  {cameras.map((cam) => (
                    <option key={cam.id} value={String(cam.id)}>
                      {cam.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Bottom Stats Bar */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white border border-slate-100 rounded-2xl p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Unique Detections</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                </div>
              </div>
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Recognized</p>
                  <p className="text-2xl font-bold text-emerald-600">{stats.recognized}</p>
                </div>
              </div>
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                  <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Unknown</p>
                  <p className="text-2xl font-bold text-amber-600">{stats.unknown}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Detection Results Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-slate-100 rounded-2xl p-6 h-full">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-slate-900">Detected Faces</h2>
              <span className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-bold rounded-full">
                {latestFaceCount}
              </span>
            </div>

            <div className="space-y-3 max-h-[calc(100vh-320px)] overflow-y-auto pr-1">
              {entries.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                  </svg>
                  <p className="text-slate-400 text-sm">No faces detected yet</p>
                  <p className="text-slate-300 text-xs mt-1">Start monitoring to see results</p>
                </div>
              ) : (
                entries.map((entry) => {
                  const active = isActive(entry)
                  return (
                    <div
                      key={entry.key + entry.firstSeen.getTime()}
                      className={`border rounded-xl p-3 transition-colors ${
                        active
                          ? 'border-blue-200 bg-blue-50/50'
                          : 'border-slate-100 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-slate-400">
                          {entry.firstSeen.toLocaleTimeString()}
                        </span>
                        <div className="flex items-center gap-2">
                          {active && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600">
                              <span className="relative flex h-1.5 w-1.5">
                                <span className="absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75 animate-ping" />
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500" />
                              </span>
                              IN VIEW
                            </span>
                          )}
                          {entry.count > 1 && (
                            <span className="text-[10px] text-slate-400 font-medium">
                              {entry.count} frames
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 py-1">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold text-white ${
                          entry.person.recognized
                            ? 'bg-gradient-to-br from-blue-500 to-purple-500'
                            : 'bg-slate-400'
                        }`}>
                          {entry.person.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-slate-800 truncate">
                              {entry.person.name || 'Unknown'}
                            </p>
                            <span className={`flex-shrink-0 px-1.5 py-0.5 text-[10px] font-semibold rounded-md ${
                              entry.person.recognized
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-amber-50 text-amber-700'
                            }`}>
                              {entry.person.recognized ? 'Recognized' : 'Unknown'}
                            </span>
                          </div>
                          <div className="mt-1 flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  entry.person.similarity > 0.7
                                    ? 'bg-gradient-to-r from-blue-500 to-purple-500'
                                    : entry.person.similarity > 0.4
                                    ? 'bg-amber-400'
                                    : 'bg-slate-300'
                                }`}
                                style={{ width: `${Math.round(entry.person.similarity * 100)}%` }}
                              />
                            </div>
                            <span className="text-[11px] font-medium text-slate-500 tabular-nums">
                              {Math.round(entry.person.similarity * 100)}%
                            </span>
                          </div>
                        </div>
                      </div>
                      {!active && (
                        <p className="text-[10px] text-slate-400 mt-1">
                          Last seen {timeAgo(entry.lastSeen)}
                        </p>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
