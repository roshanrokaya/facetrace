'use client'

import { useState, useEffect, useMemo } from 'react'
import { API_URL, getAuthToken } from '@/lib/api'

type Alert = {
  id: number
  type: string
  event_id: number | null
  person_id: number | null
  message: string
  status: string
  snapshot_url: string | null
  created_at: string
}

type FilterTab = 'all' | 'open' | 'acknowledged'

const typeConfig: Record<string, { color: string; border: string; bgLight: string; icon: string; label: string }> = {
  unknown: {
    color: '#EF4444',
    border: 'border-l-red-500',
    bgLight: 'bg-red-50',
    icon: 'M12 9v4M12 17h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
    label: 'Unknown Face',
  },
  low_attendance: {
    color: '#F59E0B',
    border: 'border-l-amber-500',
    bgLight: 'bg-amber-50',
    icon: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM17 11l2 2 4-4',
    label: 'Low Attendance',
  },
  unusual_time: {
    color: '#9333EA',
    border: 'border-l-purple-500',
    bgLight: 'bg-purple-50',
    icon: 'M12 6v6l4 2M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z',
    label: 'Unusual Time',
  },
  camera_down: {
    color: '#64748B',
    border: 'border-l-slate-500',
    bgLight: 'bg-slate-50',
    icon: 'M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10M1 1l22 22',
    label: 'Camera Down',
  },
}

function getTypeConfig(type: string) {
  return typeConfig[type] || typeConfig.unknown
}

function formatTypeName(type: string): string {
  return type
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function relativeTime(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = Math.max(0, now - then)
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

const getToken = getAuthToken

function SkeletonCard() {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-slate-200" />
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-5 w-20 bg-slate-200 rounded-full" />
            <div className="h-4 w-16 bg-slate-100 rounded-lg" />
          </div>
          <div className="h-4 w-3/4 bg-slate-200 rounded-lg" />
        </div>
        <div className="h-9 w-28 bg-slate-200 rounded-xl" />
      </div>
    </div>
  )
}

// ─── Alert Detail Modal ──────────────────────────────────────────

function AlertDetailModal({
  alert,
  onClose,
  onAcknowledge,
  acknowledging,
}: {
  alert: Alert
  onClose: () => void
  onAcknowledge: (id: number) => void
  acknowledging: boolean
}) {
  const cfg = getTypeConfig(alert.type)
  const isAck = alert.status === 'acknowledged'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-slide-in-right"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 pb-0">
          <div className="flex items-center justify-between mb-4">
            <span
              className="rounded-full px-4 py-1.5 text-xs font-bold text-white uppercase tracking-wide"
              style={{ background: isAck ? '#94A3B8' : cfg.color }}
            >
              {cfg.label || formatTypeName(alert.type)}
            </span>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition"
            >
              <svg className="w-4 h-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Snapshot */}
        {alert.snapshot_url && (
          <div className="px-6 mb-4">
            <img
              src={`${API_URL}${alert.snapshot_url}`}
              alt="Detected face"
              className="w-full h-48 object-cover rounded-2xl border-2"
              style={{ borderColor: cfg.color }}
            />
          </div>
        )}

        {/* Details */}
        <div className="px-6 pb-6">
          <p className="text-slate-700 text-sm leading-relaxed mb-5">{alert.message}</p>

          <div className="bg-slate-50 rounded-2xl p-4 space-y-3 mb-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Alert ID</span>
              <span className="text-sm font-medium text-slate-700">#{alert.id}</span>
            </div>
            <div className="border-t border-slate-100" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Time</span>
              <span className="text-sm font-medium text-slate-700">
                {alert.created_at ? new Date(alert.created_at).toLocaleString() : '—'}
              </span>
            </div>
            <div className="border-t border-slate-100" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Status</span>
              <span className={`text-sm font-semibold ${isAck ? 'text-slate-400' : 'text-red-500'}`}>
                {isAck ? 'Acknowledged' : 'Open'}
              </span>
            </div>
            {alert.event_id && (
              <>
                <div className="border-t border-slate-100" />
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Event ID</span>
                  <span className="text-sm font-medium text-slate-700">#{alert.event_id}</span>
                </div>
              </>
            )}
          </div>

          {/* Action */}
          {isAck ? (
            <div className="flex items-center justify-center gap-2 text-emerald-600 bg-emerald-50 py-3 rounded-xl">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span className="text-sm font-semibold">Alert Acknowledged</span>
            </div>
          ) : (
            <button
              onClick={() => onAcknowledge(alert.id)}
              disabled={acknowledging}
              className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all hover:scale-[1.02] hover:shadow-lg disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #2563EB, #3B82F6)' }}
            >
              {acknowledging ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Acknowledging...
                </span>
              ) : (
                'Acknowledge Alert'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [acknowledging, setAcknowledging] = useState<number | null>(null)
  const [tab, setTab] = useState<FilterTab>('all')
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null)

  useEffect(() => {
    fetchAlerts()
  }, [])

  const fetchAlerts = async () => {
    try {
      const token = getToken()
      console.log('[Alerts] Fetching with token:', token ? 'yes' : 'NO TOKEN')
      const response = await fetch(`${API_URL}/api/v1/alerts/`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      console.log('[Alerts] Response status:', response.status)
      if (!response.ok) {
        console.error('[Alerts] Response not ok:', response.status, response.statusText)
        return
      }
      const data = await response.json()
      console.log('[Alerts] Fetched alerts:', data.alerts?.length ?? 0)
      setAlerts(data.alerts || [])
    } catch (err) {
      console.error('Failed to fetch alerts:', err)
    } finally {
      setLoading(false)
    }
  }

  const acknowledgeAlert = async (id: number) => {
    setAcknowledging(id)
    try {
      const token = getToken()
      const response = await fetch(`${API_URL}/api/v1/alerts/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: 'acknowledged' }),
      })

      if (response.ok) {
        setAlerts((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status: 'acknowledged' } : a))
        )
        if (selectedAlert?.id === id) {
          setSelectedAlert((prev) => prev ? { ...prev, status: 'acknowledged' } : null)
        }
      }
    } catch (err) {
      console.error('Failed to acknowledge alert:', err)
    } finally {
      setAcknowledging(null)
    }
  }

  const filtered = useMemo(() => {
    if (tab === 'open') return alerts.filter((a) => a.status === 'open')
    if (tab === 'acknowledged') return alerts.filter((a) => a.status === 'acknowledged')
    return alerts
  }, [alerts, tab])

  const openCount = useMemo(() => alerts.filter((a) => a.status === 'open').length, [alerts])

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'open', label: 'Open' },
    { key: 'acknowledged', label: 'Acknowledged' },
  ]

  return (
    <div className="p-8">
      {/* Detail Modal */}
      {selectedAlert && (
        <AlertDetailModal
          alert={selectedAlert}
          onClose={() => setSelectedAlert(null)}
          onAcknowledge={acknowledgeAlert}
          acknowledging={acknowledging === selectedAlert.id}
        />
      )}

      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Alerts</h1>
          {!loading && openCount > 0 && (
            <span
              className="rounded-full px-3 py-1 text-xs font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #EF4444, #F87171)' }}
            >
              {openCount} open
            </span>
          )}
          {!loading && openCount === 0 && (
            <span className="rounded-full px-3 py-1 text-xs font-semibold text-emerald-700 bg-emerald-100">
              All clear
            </span>
          )}
        </div>
        <p className="text-slate-500 text-sm">Review and respond to system alerts, security events, and anomalies.</p>
        <div className="mt-2 h-1 w-16 rounded-full" style={{ background: 'linear-gradient(90deg, #2563EB, #9333EA)' }} />
      </div>

      {/* Filter Tabs */}
      <div className="bg-white border border-slate-100 rounded-2xl p-1.5 shadow-sm mb-6 inline-flex gap-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
              tab === t.key
                ? 'text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
            style={tab === t.key ? { background: 'linear-gradient(135deg, #2563EB, #9333EA)' } : {}}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Alert Cards */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-16 shadow-sm flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-5">
            <svg className="w-8 h-8 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.7 21a2 2 0 0 1-3.4 0" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">All clear &mdash; no alerts</h3>
          <p className="text-sm text-slate-500 max-w-sm">
            {tab !== 'all'
              ? `No ${tab} alerts right now. Try switching tabs.`
              : 'There are no alerts at the moment. Alerts will appear here when the system detects anomalies.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((alert) => {
            const cfg = getTypeConfig(alert.type)
            const isAck = alert.status === 'acknowledged'
            const isAcking = acknowledging === alert.id

            return (
              <div
                key={alert.id}
                onClick={() => setSelectedAlert(alert)}
                className={`bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden cursor-pointer ${
                  isAck ? 'opacity-75' : ''
                }`}
              >
                <div className={`flex items-start gap-4 p-6 border-l-4 ${cfg.border}`}>
                  {/* Face snapshot or icon */}
                  {alert.snapshot_url ? (
                    <img
                      src={`${API_URL}${alert.snapshot_url}`}
                      alt="Detected face"
                      className="w-14 h-14 rounded-xl object-cover flex-shrink-0 border-2"
                      style={{ borderColor: isAck ? '#CBD5E1' : cfg.color }}
                    />
                  ) : (
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bgLight}`}
                    >
                      <svg
                        className="w-5 h-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={isAck ? '#94A3B8' : cfg.color}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d={cfg.icon} />
                      </svg>
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span
                        className="rounded-full px-3 py-1 text-xs font-semibold text-white"
                        style={{ background: isAck ? '#94A3B8' : cfg.color }}
                      >
                        {formatTypeName(alert.type)}
                      </span>
                      <span className="text-xs text-slate-400" title={new Date(alert.created_at).toLocaleString()}>
                        {relativeTime(alert.created_at)}
                      </span>
                    </div>
                    <p className={`text-sm leading-relaxed ${isAck ? 'text-slate-400' : 'text-slate-700'}`}>
                      {alert.message}
                    </p>
                  </div>

                  {/* Action */}
                  <div className="flex-shrink-0 ml-2">
                    {isAck ? (
                      <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium py-2 px-3">
                        <svg className="w-4 h-4 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Acknowledged
                      </div>
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); acknowledgeAlert(alert.id) }}
                        disabled={isAcking}
                        className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ background: 'linear-gradient(135deg, #2563EB, #3B82F6)' }}
                      >
                        {isAcking ? (
                          <span className="flex items-center gap-2">
                            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Working...
                          </span>
                        ) : (
                          'Acknowledge'
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
