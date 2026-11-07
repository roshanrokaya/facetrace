'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { API_URL } from '@/lib/api'

const kpiCards = [
  {
    key: 'today_entries',
    label: "Today's Entries",
    icon: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
    gradient: 'from-blue-600 to-blue-400',
    shadow: 'shadow-blue-500/20',
    bg: 'bg-blue-50',
    text: 'text-blue-600',
  },
  {
    key: 'unique_people',
    label: 'Unique People',
    icon: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
    gradient: 'from-purple-600 to-purple-400',
    shadow: 'shadow-purple-500/20',
    bg: 'bg-purple-50',
    text: 'text-purple-600',
  },
  {
    key: 'unknown_faces',
    label: 'Unknown Faces',
    icon: 'M12 9v4M12 17h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
    gradient: 'from-cyan-600 to-cyan-400',
    shadow: 'shadow-cyan-500/20',
    bg: 'bg-cyan-50',
    text: 'text-cyan-600',
  },
  {
    key: 'open_alerts',
    label: 'Open Alerts',
    icon: 'M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0',
    gradient: 'from-amber-500 to-orange-400',
    shadow: 'shadow-amber-500/20',
    bg: 'bg-amber-50',
    text: 'text-amber-600',
  },
]

function KpiIcon({ path }: { path: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d={path} />
    </svg>
  )
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-xl border border-slate-100 shadow-xl px-4 py-3">
      <p className="text-xs font-semibold text-slate-900 mb-1">{label}</p>
      <p className="text-sm text-blue-600 font-bold">{payload[0].value} entries</p>
    </div>
  )
}

export default function DashboardPage() {
  const [stats, setStats] = useState({
    today_entries: 0,
    unique_people: 0,
    unknown_faces: 0,
    open_alerts: 0,
  })
  const [footfall, setFootfall] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
    fetchFootfall()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_URL}/api/v1/analytics/summary`)
      const data = await response.json()
      setStats(data)
    } catch (err) {
      console.error('Failed to fetch stats:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchFootfall = async () => {
    try {
      const response = await fetch(`${API_URL}/api/v1/analytics/footfall`)
      const data = await response.json()
      setFootfall((data.footfall || []).slice(-7))
    } catch (err) {
      console.error('Failed to fetch footfall:', err)
    }
  }

  const chartData = footfall.map((item: any) => ({
    date: new Date(item.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
    entries: item.count,
  }))

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="p-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl p-8 lg:p-10 mb-8 text-white" style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 40%, #1E40AF 100%)' }}>
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full opacity-20 blur-3xl bg-purple-500" />
        <div className="absolute -bottom-32 left-1/4 w-96 h-96 rounded-full opacity-15 blur-3xl bg-cyan-400" />
        <div className="absolute top-0 right-0 w-full h-full opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />

        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <p className="text-blue-300 text-sm font-medium tracking-wider uppercase mb-2">{today}</p>
            <h1 className="text-3xl lg:text-4xl font-black tracking-tight mb-2">Welcome back</h1>
            <p className="text-slate-300 max-w-lg text-sm leading-relaxed">
              Your FaceTrace dashboard. Monitor real-time entries, track recognition events, and review analytics.
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/live">
              <button className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-white/10 hover:bg-white/20 border border-white/10 backdrop-blur-sm text-white transition-all">
                Live Monitor
              </button>
            </Link>
            <Link href="/test-detection">
              <button className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:-translate-y-0.5" style={{ background: 'linear-gradient(135deg, #7C3AED, #2563EB)' }}>
                Test Detection
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        {kpiCards.map((card) => (
          <div
            key={card.key}
            className={`group bg-white rounded-2xl p-6 border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${card.shadow}`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-11 h-11 rounded-xl ${card.bg} ${card.text} flex items-center justify-center`}>
                <KpiIcon path={card.icon} />
              </div>
              <div className={`w-8 h-1 rounded-full bg-gradient-to-r ${card.gradient} opacity-0 group-hover:opacity-100 transition-opacity`} />
            </div>
            <p className="text-3xl font-black text-slate-900 mb-1 tracking-tight">
              {loading ? (
                <span className="inline-block w-12 h-8 bg-slate-100 rounded-lg animate-pulse" />
              ) : (
                stats[card.key as keyof typeof stats]
              )}
            </p>
            <p className="text-sm font-medium text-slate-500">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Footfall Chart */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Footfall Trend</h2>
            <p className="text-sm text-slate-500 mt-0.5">Daily entry count over the last 7 days</p>
          </div>
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
            Last 7 Days
          </span>
        </div>

        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="footfallStroke" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#2563EB" />
                  <stop offset="100%" stopColor="#7C3AED" />
                </linearGradient>
                <linearGradient id="footfallFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563EB" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#7C3AED" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
                dy={8}
              />
              <YAxis
                tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
                dx={-8}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#E2E8F0', strokeDasharray: '4 4' }} />
              <Area
                type="monotone"
                dataKey="entries"
                stroke="url(#footfallStroke)"
                strokeWidth={3}
                fill="url(#footfallFill)"
                dot={{ r: 5, fill: '#FFFFFF', stroke: '#7C3AED', strokeWidth: 2.5 }}
                activeDot={{ r: 7, fill: '#7C3AED', stroke: '#FFFFFF', strokeWidth: 3 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[320px] flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-4">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 text-slate-300">
                <path d="M18 20V10M12 20V4M6 20v-6" />
              </svg>
            </div>
            <p className="text-slate-500 font-medium">No footfall data yet</p>
            <p className="text-sm text-slate-400 mt-1">Detections will appear here once recognition is running</p>
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
        {[
          { href: '/persons', label: 'Manage Persons', desc: 'Enroll and manage individuals', icon: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', color: 'text-blue-600 bg-blue-50' },
          { href: '/analytics', label: 'View Analytics', desc: 'Detailed reports and insights', icon: 'M18 20V10M12 20V4M6 20v-6', color: 'text-purple-600 bg-purple-50' },
          { href: '/cameras', label: 'Camera Setup', desc: 'Configure camera feeds', icon: 'M23 7l-7 5 7 5V7zM14 5H3a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2z', color: 'text-cyan-600 bg-cyan-50' },
        ].map((link) => (
          <Link key={link.href} href={link.href}>
            <div className="group bg-white rounded-2xl p-5 border border-slate-100 hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl ${link.color} flex items-center justify-center shrink-0`}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                    <path d={link.icon} />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{link.label}</p>
                  <p className="text-xs text-slate-500 truncate">{link.desc}</p>
                </div>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all ml-auto shrink-0">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
