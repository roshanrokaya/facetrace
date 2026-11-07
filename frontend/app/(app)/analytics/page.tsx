'use client'

import { useState, useEffect } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'
import { API_URL } from '@/lib/api'

export default function AnalyticsPage() {
  const [footfall, setFootfall] = useState<any[]>([])
  const [dwellTime, setDwellTime] = useState<any>(null)
  const [cameraAnalytics, setCameraAnalytics] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFootfall()
    fetchDwellTime()
    fetchCameraAnalytics()
  }, [])

  const fetchFootfall = async () => {
    try {
      const response = await fetch(`${API_URL}/api/v1/analytics/footfall`)
      const data = await response.json()
      setFootfall(data.footfall || [])
    } catch (err) {
      console.error('Failed to fetch footfall:', err)
    }
  }

  const fetchDwellTime = async () => {
    try {
      const response = await fetch(`${API_URL}/api/v1/analytics/dwell-time`)
      const data = await response.json()
      setDwellTime(data)
    } catch (err) {
      console.error('Failed to fetch dwell time:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchCameraAnalytics = async () => {
    try {
      const response = await fetch(`${API_URL}/api/v1/analytics/cameras`)
      const data = await response.json()
      setCameraAnalytics(data.cameras || [])
    } catch (err) {
      console.error('Failed to fetch camera analytics:', err)
    }
  }

  // Format footfall data for chart - show last 14 days with readable labels
  const footfallChartData = footfall.slice(-14).map((item: any) => ({
    date: item.date.slice(5), // MM-DD format
    entries: item.count
  }))

  // Format dwell time data for chart
  const dwellChartData = dwellTime?.dwell_times?.slice(0, 10).map((d: any) => ({
    name: `P${d.person_id}`,
    hours: parseFloat((d.duration_seconds / 3600).toFixed(2)),
    visits: d.visit_count
  })) || []

  const totalEntriesToday = footfall.length > 0 ? footfall[footfall.length - 1].count : 0

  return (
    <div className="p-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Analytics</h1>
        <div className="mt-1 h-1 w-16 rounded-full bg-gradient-to-r from-blue-600 to-purple-600" />
        <p className="mt-3 text-slate-500 max-w-xl">
          Campus foot traffic insights, dwell time analysis, and camera performance metrics at a glance.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
            <p className="text-sm text-slate-500 font-medium">Loading analytics...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* People Today */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #2563EB, #3B82F6)' }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-600">Today</span>
              </div>
              <p className="text-4xl font-black text-slate-800 mb-1">
                {dwellTime?.total_persons_today ?? 0}
              </p>
              <p className="text-sm font-medium text-slate-500">People on Campus</p>
            </div>

            {/* Avg Dwell Time */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #9333EA, #A855F7)' }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-purple-50 text-purple-600">Average</span>
              </div>
              <p className="text-4xl font-black text-slate-800 mb-1">
                {dwellTime?.average_dwell_time ?? '0m'}
              </p>
              <p className="text-sm font-medium text-slate-500">Avg Dwell Time</p>
            </div>

            {/* Total Entries */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #06B6D4, #22D3EE)' }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                    <polyline points="17 6 23 6 23 12" />
                  </svg>
                </div>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-cyan-50 text-cyan-600">Today</span>
              </div>
              <p className="text-4xl font-black text-slate-800 mb-1">
                {totalEntriesToday}
              </p>
              <p className="text-sm font-medium text-slate-500">Total Entries</p>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Footfall Chart */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Footfall Trend</h2>
                  <p className="text-sm text-slate-500 mt-0.5">Daily entry count over time</p>
                </div>
                <span className="text-xs font-medium px-3 py-1 rounded-full bg-indigo-50 text-indigo-600">
                  Last 14 Days
                </span>
              </div>
              {footfallChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={footfallChartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="analyticsFootfallStroke" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#2563EB" />
                        <stop offset="100%" stopColor="#9333EA" />
                      </linearGradient>
                      <linearGradient id="analyticsFootfallFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2563EB" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="#9333EA" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: '#6B7280', fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: '#6B7280', fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '12px',
                        border: 'none',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
                        padding: '10px 14px',
                      }}
                      labelStyle={{ fontWeight: 700, color: '#10152F' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="entries"
                      stroke="url(#analyticsFootfallStroke)"
                      strokeWidth={3}
                      fill="url(#analyticsFootfallFill)"
                      dot={{ r: 5, fill: '#FFFFFF', stroke: '#9333EA', strokeWidth: 2 }}
                      activeDot={{ r: 7, fill: '#9333EA', stroke: '#FFFFFF', strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex flex-col items-center justify-center text-slate-400">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-12 h-12 mb-3 text-slate-300">
                    <path d="M3 3v18h18" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M7 16l4-8 4 4 6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <p className="text-sm font-medium">No footfall data available</p>
                  <p className="text-xs text-slate-400 mt-1">Data will appear once detections begin</p>
                </div>
              )}
            </div>

            {/* Dwell Time Chart */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Dwell Time</h2>
                  <p className="text-sm text-slate-500 mt-0.5">Hours spent by person</p>
                </div>
                <span className="text-xs font-medium px-3 py-1 rounded-full bg-emerald-50 text-emerald-600">
                  Top 10 Today
                </span>
              </div>
              {dwellChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dwellChartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="analyticsDwellGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10B981" />
                        <stop offset="100%" stopColor="#059669" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: '#6B7280', fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: '#6B7280', fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '12px',
                        border: 'none',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
                        padding: '10px 14px',
                      }}
                      labelStyle={{ fontWeight: 700, color: '#10152F' }}
                      formatter={(value: any) => [`${value} hrs`, 'Dwell Time']}
                    />
                    <Bar
                      dataKey="hours"
                      fill="url(#analyticsDwellGradient)"
                      radius={[8, 8, 0, 0]}
                      maxBarSize={48}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex flex-col items-center justify-center text-slate-400">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-12 h-12 mb-3 text-slate-300">
                    <rect x="3" y="12" width="4" height="8" rx="1" strokeLinecap="round" />
                    <rect x="10" y="8" width="4" height="12" rx="1" strokeLinecap="round" />
                    <rect x="17" y="4" width="4" height="16" rx="1" strokeLinecap="round" />
                  </svg>
                  <p className="text-sm font-medium">No dwell time data available</p>
                  <p className="text-xs text-slate-400 mt-1">Dwell analysis will appear here</p>
                </div>
              )}
            </div>
          </div>

          {/* Camera Analytics Table */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Camera Performance</h2>
                <p className="text-sm text-slate-500 mt-0.5">Recognition metrics per camera over the last 7 days</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-xs text-slate-500">Low unknown rate</span>
                <div className="w-3 h-3 rounded-full bg-amber-500 ml-3" />
                <span className="text-xs text-slate-500">High unknown rate</span>
              </div>
            </div>
            {cameraAnalytics.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Camera
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Total Events
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Unknown Count
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Unknown Rate
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {cameraAnalytics.map((camera: any) => {
                      const rate = parseFloat(camera.unknown_rate) || 0
                      const barColor = rate > 30 ? '#F59E0B' : rate > 15 ? '#3B82F6' : '#10B981'
                      return (
                        <tr key={camera.camera_id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                                <svg viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                                  <circle cx="12" cy="13" r="4" />
                                </svg>
                              </div>
                              <span className="text-sm font-semibold text-slate-800">Camera {camera.camera_id}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-sm font-medium text-slate-700">{camera.total_events.toLocaleString()}</span>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-sm font-medium text-slate-700">{camera.unknown_count.toLocaleString()}</span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex-1 max-w-[120px] h-2 rounded-full bg-slate-100 overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-500"
                                  style={{ width: `${Math.min(rate, 100)}%`, backgroundColor: barColor }}
                                />
                              </div>
                              <span className="text-sm font-semibold text-slate-700 w-12 text-right">{camera.unknown_rate}%</span>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="h-48 flex flex-col items-center justify-center text-slate-400">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-12 h-12 mb-3 text-slate-300">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="12" cy="13" r="4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="text-sm font-medium">No camera data available</p>
                <p className="text-xs text-slate-400 mt-1">Camera analytics will appear once cameras are active</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
