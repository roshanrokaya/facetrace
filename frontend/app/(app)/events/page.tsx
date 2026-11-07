'use client'

import { useState, useEffect, useCallback } from 'react'
import { API_URL } from '@/lib/api'
import SearchInput from '@/components/ui/SearchInput'

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

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="px-6 py-4"><div className="h-4 w-4 bg-slate-200 rounded" /></td>
      <td className="px-6 py-4"><div className="h-4 w-20 bg-slate-200 rounded-lg" /></td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-slate-200" />
          <div className="h-4 w-28 bg-slate-200 rounded-lg" />
        </div>
      </td>
      <td className="px-6 py-4"><div className="h-4 w-16 bg-slate-200 rounded-lg" /></td>
      <td className="px-6 py-4"><div className="h-4 w-14 bg-slate-200 rounded-lg" /></td>
      <td className="px-6 py-4"><div className="h-5 w-20 bg-slate-200 rounded-full" /></td>
      <td className="px-6 py-4"><div className="h-3 w-24 bg-slate-200 rounded-full" /></td>
    </tr>
  )
}

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'recognized' | 'unknown'>('all')
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [deleting, setDeleting] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  // Pagination
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(20)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState('')
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1) // reset to page 1 on search change
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  // Reset page when filter changes
  useEffect(() => {
    setPage(1)
  }, [statusFilter])

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        per_page: String(perPage),
      })
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (debouncedSearch) params.set('search', debouncedSearch)

      const response = await fetch(`${API_URL}/api/v1/events/?${params}`)
      const data = await response.json()
      setEvents(data.events || [])
      setTotal(data.total || 0)
      setTotalPages(data.total_pages || 1)
    } catch (err) {
      console.error('Failed to fetch events:', err)
    } finally {
      setLoading(false)
    }
  }, [page, perPage, statusFilter, debouncedSearch])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  const allPageSelected = events.length > 0 && events.every(e => selected.has(e.id))

  const toggleSelect = (id: number) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (allPageSelected) {
      // Deselect all on this page
      setSelected(prev => {
        const next = new Set(prev)
        events.forEach(e => next.delete(e.id))
        return next
      })
    } else {
      // Select all on this page
      setSelected(prev => {
        const next = new Set(prev)
        events.forEach(e => next.add(e.id))
        return next
      })
    }
  }

  const deleteSelected = async () => {
    if (selected.size === 0) return
    setDeleting(true)
    try {
      const token = document.cookie.split(';').find(c => c.trim().startsWith('access_token='))?.split('=')[1]
      const response = await fetch(`${API_URL}/api/v1/events/bulk`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ ids: Array.from(selected) }),
      })
      if (response.ok) {
        setSelected(new Set())
        fetchEvents()
      }
    } catch (err) {
      console.error('Failed to delete events:', err)
    } finally {
      setDeleting(false)
    }
  }

  const resetAll = async () => {
    setDeleting(true)
    try {
      const token = document.cookie.split(';').find(c => c.trim().startsWith('access_token='))?.split('=')[1]
      const response = await fetch(`${API_URL}/api/v1/events/all`, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })
      if (response.ok) {
        setEvents([])
        setSelected(new Set())
        setTotal(0)
        setTotalPages(1)
        setPage(1)
        setShowResetConfirm(false)
      }
    } catch (err) {
      console.error('Failed to reset events:', err)
    } finally {
      setDeleting(false)
    }
  }

  // Generate page numbers to show
  const getPageNumbers = (): (number | '...')[] => {
    const pages: (number | '...')[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (page > 3) pages.push('...')
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
        pages.push(i)
      }
      if (page < totalPages - 2) pages.push('...')
      pages.push(totalPages)
    }
    return pages
  }

  const startItem = (page - 1) * perPage + 1
  const endItem = Math.min(page * perPage, total)

  return (
    <div className="p-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Event Log</h1>
              {!loading && (
                <span
                  className="rounded-full px-3 py-1 text-xs font-semibold text-white"
                  style={{ background: 'linear-gradient(135deg, #2563EB, #9333EA)' }}
                >
                  {total} events
                </span>
              )}
            </div>
            <p className="text-slate-500 text-sm">Track every face recognition event across all cameras in real time.</p>
            <div className="mt-2 h-1 w-16 rounded-full" style={{ background: 'linear-gradient(90deg, #2563EB, #9333EA)' }} />
          </div>

          {/* Reset All button */}
          {!loading && total > 0 && (
            <div className="relative">
              {showResetConfirm ? (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-2">
                  <span className="text-sm text-red-700 font-medium">Delete all {total} events?</span>
                  <button
                    onClick={resetAll}
                    disabled={deleting}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                  >
                    {deleting ? 'Deleting...' : 'Yes, Reset'}
                  </button>
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 text-sm font-semibold rounded-xl border border-red-200 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                  </svg>
                  Reset All
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm mb-6 flex flex-col sm:flex-row gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by person name..."
          className="flex-1"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition min-w-[160px]"
        >
          <option value="all">All Statuses</option>
          <option value="recognized">Recognized</option>
          <option value="unknown">Unknown</option>
        </select>
        <select
          value={perPage}
          onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1) }}
          className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition min-w-[120px]"
        >
          <option value={10}>10 per page</option>
          <option value={20}>20 per page</option>
          <option value={50}>50 per page</option>
          <option value={100}>100 per page</option>
        </select>

        {selected.size > 0 && (
          <button
            onClick={deleteSelected}
            disabled={deleting}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
            </svg>
            {deleting ? 'Deleting...' : `Delete ${selected.size} selected`}
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-6 py-4 w-10" />
                <th className="px-6 py-4 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Time</th>
                <th className="px-6 py-4 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Person</th>
                <th className="px-6 py-4 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Code</th>
                <th className="px-6 py-4 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Camera</th>
                <th className="px-6 py-4 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Similarity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {Array.from({ length: perPage > 10 ? 10 : perPage }).map((_, i) => (
                <SkeletonRow key={i} />
              ))}
            </tbody>
          </table>
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-16 shadow-sm flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-5">
            <svg className="w-8 h-8 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M9 9h.01M15 9h.01M9 15c.83.67 1.83 1 3 1s2.17-.33 3-1" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">No events found</h3>
          <p className="text-sm text-slate-500 max-w-sm">
            {search || statusFilter !== 'all'
              ? 'Try adjusting your search or filter to find what you are looking for.'
              : 'Events will appear here when face detection is running and people are recognized.'}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-6 py-4 w-10">
                  <input
                    type="checkbox"
                    checked={allPageSelected}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                <th className="px-6 py-4 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Time</th>
                <th className="px-6 py-4 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Person</th>
                <th className="px-6 py-4 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Code</th>
                <th className="px-6 py-4 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Camera</th>
                <th className="px-6 py-4 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Similarity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {events.map((event) => {
                const simPct = event.similarity ? Math.round(event.similarity * 100) : null
                const isSelected = selected.has(event.id)
                return (
                  <tr
                    key={event.id}
                    className={`transition-colors cursor-pointer ${
                      isSelected ? 'bg-blue-50/60' : 'hover:bg-slate-50/80'
                    }`}
                    onClick={() => toggleSelect(event.id)}
                  >
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(event.id)}
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-slate-700" title={new Date(event.first_seen).toLocaleString()}>
                        {relativeTime(event.first_seen)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {event.snapshot_url ? (
                          <img
                            src={`${API_URL}${event.snapshot_url}`}
                            alt={event.person_name || 'Unknown'}
                            className="w-10 h-10 rounded-full object-cover border-2 flex-shrink-0"
                            style={{
                              borderColor: event.is_unknown ? '#EF4444' : '#2563EB',
                            }}
                          />
                        ) : (
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                            style={{
                              background: event.is_unknown
                                ? 'linear-gradient(135deg, #EF4444, #F87171)'
                                : 'linear-gradient(135deg, #2563EB, #9333EA)',
                            }}
                          >
                            {event.is_unknown
                              ? '?'
                              : (event.person_name || '?')
                                  .split(' ')
                                  .map((n: string) => n[0])
                                  .join('')
                                  .slice(0, 2)
                                  .toUpperCase()}
                          </div>
                        )}
                        <span className="text-sm font-semibold text-slate-800">
                          {event.person_name || 'Unknown'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-mono">
                      {event.person_code || <span className="text-slate-300">&mdash;</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {event.camera_id != null ? (
                        <span className="inline-flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5" />
                            <rect x="2" y="6" width="14" height="12" rx="2" />
                          </svg>
                          Cam {event.camera_id}
                        </span>
                      ) : (
                        <span className="text-slate-300">&mdash;</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {event.is_unknown ? (
                        <span
                          className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold text-white"
                          style={{ background: 'linear-gradient(135deg, #EF4444, #F87171)' }}
                        >
                          Unknown
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold text-white"
                          style={{ background: 'linear-gradient(135deg, #22C55E, #4ADE80)' }}
                        >
                          Recognized
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {simPct !== null ? (
                        <div className="flex items-center gap-2.5">
                          <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${simPct}%`,
                                background:
                                  simPct >= 70
                                    ? 'linear-gradient(90deg, #22C55E, #4ADE80)'
                                    : simPct >= 40
                                    ? 'linear-gradient(90deg, #F59E0B, #FBBF24)'
                                    : 'linear-gradient(90deg, #EF4444, #F87171)',
                              }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-slate-600 tabular-nums w-10 text-right">
                            {simPct}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-300">&mdash;</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {/* Selection footer */}
          {selected.size > 0 && (
            <div className="border-t border-slate-100 px-6 py-3 bg-slate-50 flex items-center justify-between">
              <span className="text-sm text-slate-600">
                <strong>{selected.size}</strong> event{selected.size !== 1 ? 's' : ''} selected
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelected(new Set())}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Clear selection
                </button>
                <button
                  onClick={deleteSelected}
                  disabled={deleting}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  {deleting ? 'Deleting...' : 'Delete selected'}
                </button>
              </div>
            </div>
          )}

          {/* Pagination */}
          <div className="border-t border-slate-100 px-6 py-4 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Showing <span className="font-semibold text-slate-700">{startItem}</span> to{' '}
              <span className="font-semibold text-slate-700">{endItem}</span> of{' '}
              <span className="font-semibold text-slate-700">{total}</span> events
            </p>

            <div className="flex items-center gap-1">
              {/* Prev button */}
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                </svg>
              </button>

              {/* Page numbers */}
              {getPageNumbers().map((p, idx) =>
                p === '...' ? (
                  <span key={`dots-${idx}`} className="w-9 h-9 flex items-center justify-center text-sm text-slate-400">
                    ...
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p as number)}
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                      page === p
                        ? 'text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                    style={page === p ? { background: 'linear-gradient(135deg, #2563EB, #9333EA)' } : undefined}
                  >
                    {p}
                  </button>
                )
              )}

              {/* Next button */}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
