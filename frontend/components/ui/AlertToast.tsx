'use client'

import { useEffect, useState } from 'react'

export type ToastAlert = {
  id: number
  type: string
  message: string
  snapshot_url?: string | null
}

const typeConfig: Record<string, { color: string; label: string }> = {
  unknown: { color: '#EF4444', label: 'Unknown Face' },
  low_attendance: { color: '#F59E0B', label: 'Low Attendance' },
  unusual_time: { color: '#9333EA', label: 'Unusual Time' },
  camera_down: { color: '#64748B', label: 'Camera Down' },
}

function ToastItem({ alert, onDismiss }: { alert: ToastAlert; onDismiss: () => void }) {
  const cfg = typeConfig[alert.type] || { color: '#2563EB', label: alert.type }

  useEffect(() => {
    const timer = setTimeout(onDismiss, 8000)
    return () => clearTimeout(timer)
  }, [onDismiss])

  return (
    <div
      className="animate-slide-in-right bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden max-w-sm w-full"
      style={{ borderLeft: `4px solid ${cfg.color}` }}
    >
      <div className="p-4 flex items-start gap-3">
        {alert.snapshot_url ? (
          <img
            src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${alert.snapshot_url}`}
            alt="Detected face"
            className="w-12 h-12 rounded-xl object-cover shrink-0 border-2"
            style={{ borderColor: cfg.color }}
          />
        ) : (
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: `${cfg.color}15` }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={cfg.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 9v4M12 17h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
            </svg>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-[10px] font-bold text-white px-2 py-0.5 rounded-full uppercase tracking-wide"
              style={{ background: cfg.color }}
            >
              {cfg.label}
            </span>
          </div>
          <p className="text-sm text-slate-700 leading-snug">{alert.message}</p>
        </div>
        <button
          onClick={onDismiss}
          className="text-slate-400 hover:text-slate-600 transition shrink-0 mt-0.5"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default function AlertToast({ alerts, onDismiss }: { alerts: ToastAlert[]; onDismiss: (id: number) => void }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-3">
      {alerts.map((alert) => (
        <ToastItem key={alert.id} alert={alert} onDismiss={() => onDismiss(alert.id)} />
      ))}
    </div>
  )
}
