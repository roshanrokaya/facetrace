'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useRef, useCallback } from 'react'
import { API_URL, getAuthToken } from '@/lib/api'
import AlertToast, { ToastAlert } from '@/components/ui/AlertToast'

const WS_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/^http/, 'ws')

const navSections = [
  {
    label: 'Overview',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' },
      { href: '/live', label: 'Live Monitor', icon: 'M1 1l22 22M21 21H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3m18 0v13' },
    ],
  },
  {
    label: 'Management',
    items: [
      { href: '/persons', label: 'Persons', icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75' },
      { href: '/cameras', label: 'Cameras', icon: 'M23 7l-7 5 7 5V7zM14 5H3a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2z' },
      { href: '/events', label: 'Events', icon: 'M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z' },
    ],
  },
  {
    label: 'Insights',
    items: [
      { href: '/analytics', label: 'Analytics', icon: 'M18 20V10M12 20V4M6 20v-6' },
      { href: '/reports', label: 'Reports', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z' },
      { href: '/alerts', label: 'Alerts', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0 1 18 14.158V11a6.002 6.002 0 0 0-4-5.659V5a2 2 0 1 0-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 1 1-6 0v-1m6 0H9' },
    ],
  },
  {
    label: 'System',
    items: [
      { href: '/test-detection', label: 'Test Detection', icon: 'M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' },
      { href: '/settings', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 0 0-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 0 0-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 0 0-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 0 0-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 0 0 1.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
    ],
  },
]

function NavIcon({ path, active }: { path: string; active: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`w-[18px] h-[18px] shrink-0 transition-colors ${active ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'}`}
    >
      <path d={path} />
    </svg>
  )
}

// ─── Notification helpers ────────────────────────────────────────

function requestNotificationPermission() {
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission()
  }
}

function showBrowserNotification(title: string, body: string) {
  if (typeof window === 'undefined' || !('Notification' in window)) return
  if (Notification.permission !== 'granted') return
  try {
    new Notification(title, {
      body,
      icon: '/alert-icon.png',
      tag: 'facetrace-alert',
    })
  } catch {}
}

function playAlertSound() {
  try {
    const audio = new Audio('/alert-sound.wav')
    audio.volume = 0.6
    audio.play().catch(() => {})
  } catch {}
}

// ─── Component ───────────────────────────────────────────────────

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [openAlertCount, setOpenAlertCount] = useState(0)
  const [toasts, setToasts] = useState<ToastAlert[]>([])
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectRef = useRef<ReturnType<typeof setTimeout>>()

  // Request browser notification permission on mount
  useEffect(() => {
    requestNotificationPermission()
  }, [])

  // WebSocket connection for real-time alerts
  useEffect(() => {
    let mounted = true

    function connect() {
      if (!mounted) return
      const ws = new WebSocket(`${WS_URL}/api/v1/ws/events`)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('[WS] Connected to alert stream')
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.type === 'alert' && data.alert) {
            const alert = data.alert

            // Update sidebar badge count
            setOpenAlertCount((prev) => prev + 1)

            // Show toast notification
            setToasts((prev) => [...prev, alert])

            // Play alert sound
            playAlertSound()

            // Browser push notification
            const typeLabels: Record<string, string> = {
              unknown: 'Unknown Face Detected',
              low_attendance: 'Low Attendance Warning',
              unusual_time: 'Unusual Time Entry',
              camera_down: 'Camera Offline',
            }
            showBrowserNotification(
              typeLabels[alert.type] || 'FaceTrace Alert',
              alert.message
            )
          }
        } catch {}
      }

      ws.onclose = () => {
        console.log('[WS] Disconnected, reconnecting in 3s...')
        if (mounted) {
          reconnectRef.current = setTimeout(connect, 3000)
        }
      }

      ws.onerror = () => {
        ws.close()
      }
    }

    connect()

    // Keep-alive ping every 30s
    const pingInterval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send('ping')
      }
    }, 30000)

    return () => {
      mounted = false
      clearInterval(pingInterval)
      clearTimeout(reconnectRef.current)
      wsRef.current?.close()
    }
  }, [])

  // Initial alert count fetch
  useEffect(() => {
    const fetchAlertCount = async () => {
      try {
        const token = getAuthToken()
        const response = await fetch(`${API_URL}/api/v1/alerts/?status=open&limit=0`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        if (response.ok) {
          const data = await response.json()
          setOpenAlertCount((data.alerts || []).length)
        }
      } catch {}
    }
    fetchAlertCount()
    // Still poll every 60s as a fallback (WebSocket is primary now)
    const interval = setInterval(fetchAlertCount, 60000)
    return () => clearInterval(interval)
  }, [])

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const handleLogout = () => {
    document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="flex h-screen bg-[#F4F6FB]">
      {/* Toast Notifications */}
      <AlertToast alerts={toasts} onDismiss={dismissToast} />

      {/* Sidebar */}
      <aside className="w-[260px] flex flex-col bg-[#0F1629] border-r border-white/5">
        {/* Logo */}
        <div className="px-6 py-5 flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20"
            style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-5 h-5">
              <path d="M12 2a4 4 0 0 1 4 4v1a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z" />
              <path d="M5 10a7 7 0 0 0 14 0" />
            </svg>
          </div>
          <div>
            <h1 className="text-white font-bold text-[15px] tracking-tight leading-none">FaceTrace</h1>
            <p className="text-slate-500 text-[10px] font-medium mt-0.5 tracking-wide uppercase">FaceTrace</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 pb-4 overflow-y-auto space-y-5 mt-2">
          {navSections.map((section) => (
            <div key={section.label}>
              <p className="px-4 mb-2 text-[10px] font-bold text-slate-600 uppercase tracking-[0.1em]">
                {section.label}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`group flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 ${
                        active
                          ? 'bg-white/[0.08] text-white'
                          : 'text-slate-400 hover:bg-white/[0.05] hover:text-slate-200'
                      }`}
                    >
                      <NavIcon path={item.icon} active={active} />
                      <span>{item.label}</span>
                      {item.label === 'Alerts' && openAlertCount > 0 ? (
                        <span className="ml-auto inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold text-white bg-red-500 animate-pulse">
                          {openAlertCount}
                        </span>
                      ) : active ? (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-gradient-to-r from-blue-400 to-purple-400" />
                      ) : null}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-white/5">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] font-medium text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
