'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { API_URL } from '@/lib/api'

interface Camera {
  id: number
  name: string
  location: string
  stream_url: string
  role: string
  is_active: boolean
}

const roleBadgeStyles: Record<string, string> = {
  entry: 'bg-emerald-50 text-emerald-700',
  exit: 'bg-amber-50 text-amber-700',
  general: 'bg-blue-50 text-blue-700',
}

function getRoleBadgeClass(role: string): string {
  return roleBadgeStyles[role?.toLowerCase()] || 'bg-slate-100 text-slate-600'
}

function SkeletonCard() {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm animate-pulse overflow-hidden">
      <div className="h-40 bg-slate-200" />
      <div className="p-6 space-y-3">
        <div className="h-5 bg-slate-200 rounded w-3/4" />
        <div className="h-3 bg-slate-100 rounded w-1/2" />
        <div className="flex gap-2">
          <div className="h-6 bg-slate-100 rounded-full w-16" />
          <div className="h-6 bg-slate-100 rounded-full w-16" />
        </div>
        <div className="h-3 bg-slate-100 rounded w-full" />
        <div className="flex gap-2 pt-2">
          <div className="h-9 bg-slate-100 rounded-xl flex-1" />
          <div className="h-9 bg-slate-100 rounded-xl flex-1" />
        </div>
      </div>
    </div>
  )
}

export default function CamerasPage() {
  const [cameras, setCameras] = useState<Camera[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCameras()
  }, [])

  const fetchCameras = async () => {
    try {
      const response = await fetch(`${API_URL}/api/v1/cameras`)
      if (response.ok) {
        const data = await response.json()
        setCameras(data.cameras || [])
      }
    } catch (err) {
      console.error('Failed to fetch cameras:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this camera? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`${API_URL}/api/v1/cameras/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setCameras((prev) => prev.filter((c) => c.id !== id))
      } else {
        alert('Failed to delete camera')
      }
    } catch (err) {
      alert('Failed to connect to server')
    }
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold text-slate-900">Cameras</h1>
            {!loading && (
              <span className="rounded-full px-3 py-1 text-xs font-semibold bg-slate-100 text-slate-600">
                {cameras.length}
              </span>
            )}
          </div>
          <p className="text-slate-500">Manage camera feeds</p>
        </div>
        <Link
          href="/cameras/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all shadow-sm hover:shadow-md"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Camera
        </Link>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && cameras.length === 0 && (
        <div className="bg-white border border-slate-100 rounded-2xl p-16 shadow-sm text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">No cameras configured yet</h3>
          <p className="text-slate-500 text-sm mb-6">
            Get started by adding your first camera feed.
          </p>
          <Link
            href="/cameras/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Camera
          </Link>
        </div>
      )}

      {/* Camera Cards Grid */}
      {!loading && cameras.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {cameras.map((camera) => (
            <div
              key={camera.id}
              className="bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-xl transition-shadow duration-200 overflow-hidden"
            >
              {/* Camera Preview Placeholder */}
              <div className="h-40 bg-slate-800 flex items-center justify-center relative">
                <svg className="w-12 h-12 text-slate-600" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
                {/* Status indicator overlay */}
                <div className="absolute top-3 right-3">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                    camera.is_active
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-slate-600/40 text-slate-400'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      camera.is_active ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                    }`} />
                    {camera.is_active ? 'Live' : 'Offline'}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6">
                {/* Name + Location */}
                <div className="mb-3">
                  <h3 className="font-semibold text-slate-900 text-lg">{camera.name}</h3>
                  <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                    </svg>
                    {camera.location || 'No location set'}
                  </p>
                </div>

                {/* Role Badge */}
                <div className="flex items-center gap-2 mb-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${getRoleBadgeClass(camera.role)}`}>
                    {camera.role || 'General'}
                  </span>
                </div>

                {/* Stream URL */}
                <div className="mb-5">
                  <p className="text-xs text-slate-400 mb-1">Stream URL</p>
                  <p className="text-sm text-slate-600 truncate font-mono bg-slate-50 px-3 py-1.5 rounded-lg">
                    {camera.stream_url || 'Not configured'}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Link
                    href={`/cameras/${camera.id}/edit`}
                    className="flex-1 text-center px-3 py-2 text-sm font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(camera.id)}
                    className="flex-1 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
