'use client'

import { useState, useEffect } from 'react'
import { API_URL } from '@/lib/api'

const reportTypes = [
  {
    type: 'events',
    title: 'Events Report',
    description: 'Complete log of all face recognition events including timestamps, person identification, and similarity scores.',
    iconPath: 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2M12 12h.01M8 12h.01M16 12h.01M12 16h.01M8 16h.01M16 16h.01',
    gradient: 'linear-gradient(135deg, #2563EB, #3B82F6)',
    badgeColor: 'bg-blue-50 text-blue-600',
  },
  {
    type: 'attendance',
    title: 'Attendance Report',
    description: 'Daily attendance records with first and last seen times for each recognized individual on campus.',
    iconPath: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
    gradient: 'linear-gradient(135deg, #9333EA, #A855F7)',
    badgeColor: 'bg-purple-50 text-purple-600',
  },
  {
    type: 'daily-summary',
    title: 'Daily Summary',
    description: 'Aggregated daily metrics including total footfall, unique visitors, unknown face count, and peak hours.',
    iconPath: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z',
    gradient: 'linear-gradient(135deg, #06B6D4, #22D3EE)',
    badgeColor: 'bg-cyan-50 text-cyan-600',
  },
]

const dayOptions = [7, 14, 30]

export default function ReportsPage() {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDays, setSelectedDays] = useState<Record<string, number>>({
    events: 7,
    attendance: 7,
    'daily-summary': 7,
  })
  const [downloading, setDownloading] = useState<string | null>(null)

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      const response = await fetch(`${API_URL}/api/v1/events/`)
      const data = await response.json()
      setEvents(data.events || [])
    } catch (err) {
      console.error('Failed to fetch events:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = (type: string) => {
    setDownloading(type)
    const days = selectedDays[type]
    window.open(`${API_URL}/api/v1/reports/${type}?days=${days}`)
    // Reset downloading state after a short delay
    setTimeout(() => setDownloading(null), 2000)
  }

  const exportCSV = () => {
    const headers = ['ID', 'Person Name', 'Person Code', 'Status', 'Similarity', 'First Seen', 'Last Seen']
    const rows = events.map(e => [
      e.id,
      e.person_name,
      e.person_code || '-',
      e.is_unknown ? 'Unknown' : 'Recognized',
      e.similarity ? `${(e.similarity * 100).toFixed(1)}%` : '-',
      e.first_seen,
      e.last_seen
    ])

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `events_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  return (
    <div className="p-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Reports</h1>
        <div className="mt-1 h-1 w-16 rounded-full bg-gradient-to-r from-blue-600 to-purple-600" />
        <p className="mt-3 text-slate-500 max-w-xl">
          Generate and download CSV reports for events, attendance, and daily summaries across any date range.
        </p>
      </div>

      {/* Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {reportTypes.map((report) => (
          <div
            key={report.type}
            className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col"
          >
            {/* Icon and Title */}
            <div className="flex items-start gap-4 mb-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: report.gradient }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                  <path d={report.iconPath} />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">{report.title}</h3>
                <p className="text-sm text-slate-500 mt-1 leading-relaxed">{report.description}</p>
              </div>
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Date Range Selector */}
            <div className="mb-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Date Range</p>
              <div className="flex gap-2">
                {dayOptions.map((days) => (
                  <button
                    key={days}
                    onClick={() =>
                      setSelectedDays((prev) => ({ ...prev, [report.type]: days }))
                    }
                    className={`px-3.5 py-1.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      selectedDays[report.type] === days
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {days}d
                  </button>
                ))}
              </div>
            </div>

            {/* Download Button */}
            <button
              onClick={() => handleDownload(report.type)}
              disabled={downloading === report.type}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ background: report.gradient }}
            >
              {downloading === report.type ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Download CSV
                </>
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Events Preview Table */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Recent Events Preview</h2>
            <p className="text-sm text-slate-500 mt-0.5">Latest recognition events from all cameras</p>
          </div>
          <button
            onClick={exportCSV}
            disabled={events.length === 0}
            className="px-4 py-2 rounded-xl text-sm font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export CSV
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
              <p className="text-sm text-slate-500 font-medium">Loading events...</p>
            </div>
          </div>
        ) : events.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-slate-400">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-12 h-12 mb-3 text-slate-300">
              <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" strokeLinecap="round" strokeLinejoin="round" />
              <rect x="9" y="3" width="6" height="4" rx="1" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="text-sm font-medium">No events recorded yet</p>
            <p className="text-xs text-slate-400 mt-1">Events will appear here when face detection is active</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Person
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Similarity
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {events.map((event) => (
                  <tr key={event.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-500">
                      {new Date(event.first_seen).toLocaleString()}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-slate-800">{event.person_name}</span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="text-sm text-slate-500 font-mono">{event.person_code || '-'}</span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {event.is_unknown ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 ring-1 ring-inset ring-red-200">
                          Unknown
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200">
                          Recognized
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {event.similarity ? (
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${(event.similarity * 100)}%`,
                                background: event.similarity > 0.8 ? '#10B981' : event.similarity > 0.6 ? '#3B82F6' : '#F59E0B',
                              }}
                            />
                          </div>
                          <span className="text-sm font-medium text-slate-700">{(event.similarity * 100).toFixed(1)}%</span>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
