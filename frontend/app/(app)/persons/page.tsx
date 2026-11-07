'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { API_URL } from '@/lib/api'
import SearchInput from '@/components/ui/SearchInput'

interface Face {
  id: number
  image_path: string
}

interface Person {
  id: number
  code: string
  full_name: string
  group_id: string | null
  phone: string | null
  consent_given: boolean
  is_active: boolean
  face_count: number
  faces: Face[]
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function SkeletonCard() {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm animate-pulse">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-14 h-14 rounded-full bg-slate-200" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-slate-200 rounded w-3/4" />
          <div className="h-3 bg-slate-100 rounded w-1/2" />
        </div>
      </div>
      <div className="flex gap-2 mb-4">
        <div className="h-6 bg-slate-100 rounded-full w-16" />
        <div className="h-6 bg-slate-100 rounded-full w-20" />
      </div>
      <div className="h-3 bg-slate-100 rounded w-1/3 mb-4" />
      <div className="flex gap-2">
        <div className="h-9 bg-slate-100 rounded-xl flex-1" />
        <div className="h-9 bg-slate-100 rounded-xl flex-1" />
      </div>
    </div>
  )
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="px-6 py-4"><div className="w-10 h-10 rounded-full bg-slate-200" /></td>
      <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-20" /></td>
      <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-32" /></td>
      <td className="px-6 py-4"><div className="h-5 bg-slate-100 rounded-full w-16" /></td>
      <td className="px-6 py-4"><div className="h-5 bg-slate-100 rounded-full w-20" /></td>
      <td className="px-6 py-4"><div className="h-5 bg-slate-100 rounded-full w-16" /></td>
      <td className="px-6 py-4"><div className="flex gap-2"><div className="h-8 bg-slate-100 rounded-xl w-16" /><div className="h-8 bg-slate-100 rounded-xl w-16" /></div></td>
    </tr>
  )
}

export default function PersonsPage() {
  const [persons, setPersons] = useState<Person[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')

  useEffect(() => {
    fetchPersons()
  }, [])

  const fetchPersons = async () => {
    try {
      const response = await fetch(`${API_URL}/api/v1/persons`)
      if (response.ok) {
        const data = await response.json()
        setPersons(data.persons || [])
      }
    } catch (err) {
      console.error('Failed to fetch persons:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this person? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`${API_URL}/api/v1/persons/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setPersons((prev) => prev.filter((p) => p.id !== id))
      } else {
        alert('Failed to delete person')
      }
    } catch (err) {
      alert('Failed to connect to server')
    }
  }

  const filtered = persons.filter((p) => {
    const q = search.toLowerCase()
    return (
      p.full_name.toLowerCase().includes(q) ||
      p.code.toLowerCase().includes(q)
    )
  })

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold text-slate-900">Persons</h1>
            {!loading && (
              <span className="rounded-full px-3 py-1 text-xs font-semibold bg-slate-100 text-slate-600">
                {persons.length}
              </span>
            )}
          </div>
          <p className="text-slate-500">Manage enrolled individuals</p>
        </div>
        <Link
          href="/persons/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all shadow-sm hover:shadow-md"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Person
        </Link>
      </div>

      {/* Search + View Toggle */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by name or code..."
          className="flex-1"
        />
        <div className="flex bg-slate-100 rounded-xl p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'grid'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
            </svg>
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'table'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 5.25h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5" />
            </svg>
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {loading && viewMode === 'table' && (
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-slate-50/50">
              <tr>
                {['Photo', 'Code', 'Name', 'Group', 'Faces', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {Array.from({ length: 5 }).map((_, i) => (
                <SkeletonRow key={i} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {!loading && filtered.length === 0 && (
        <div className="bg-white border border-slate-100 rounded-2xl p-16 shadow-sm text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">
            {search ? 'No matching persons' : 'No persons enrolled yet'}
          </h3>
          <p className="text-slate-500 text-sm mb-6">
            {search
              ? 'Try adjusting your search terms.'
              : 'Get started by enrolling your first individual.'}
          </p>
          {!search && (
            <Link
              href="/persons/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add Person
            </Link>
          )}
        </div>
      )}

      {/* Grid View */}
      {!loading && filtered.length > 0 && viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((person) => (
            <div
              key={person.id}
              className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-shadow duration-200"
            >
              {/* Avatar + Name */}
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 bg-gradient-to-br from-blue-500 to-purple-500">
                  {person.faces && person.faces.length > 0 ? (
                    <img
                      src={`${API_URL}${person.faces[0].image_path}`}
                      alt={person.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white font-semibold text-sm">
                      {getInitials(person.full_name)}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-slate-900 truncate">{person.full_name}</h3>
                  <p className="text-sm text-slate-500 truncate">{person.code}</p>
                </div>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                {person.group_id && (
                  <span className="rounded-full px-3 py-1 text-xs font-semibold bg-purple-50 text-purple-700">
                    Group {person.group_id}
                  </span>
                )}
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    person.is_active
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {person.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* Face count */}
              <div className="flex items-center gap-1.5 text-sm text-slate-500 mb-5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
                {person.face_count || 0} {person.face_count === 1 ? 'face' : 'faces'} enrolled
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Link
                  href={`/persons/${person.id}/edit`}
                  className="flex-1 text-center px-3 py-2 text-sm font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Edit
                </Link>
                <button
                  onClick={() => handleDelete(person.id)}
                  className="flex-1 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table View */}
      {!loading && filtered.length > 0 && viewMode === 'table' && (
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Photo</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Code</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Group</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Faces</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((person) => (
                <tr key={person.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-gradient-to-br from-blue-500 to-purple-500">
                      {person.faces && person.faces.length > 0 ? (
                        <img
                          src={`${API_URL}${person.faces[0].image_path}`}
                          alt={person.full_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white font-semibold text-xs">
                          {getInitials(person.full_name)}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">{person.code}</td>
                  <td className="px-6 py-4 text-sm text-slate-700">{person.full_name}</td>
                  <td className="px-6 py-4">
                    {person.group_id ? (
                      <span className="rounded-full px-3 py-1 text-xs font-semibold bg-purple-50 text-purple-700">
                        Group {person.group_id}
                      </span>
                    ) : (
                      <span className="text-sm text-slate-400">&mdash;</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="rounded-full px-3 py-1 text-xs font-semibold bg-blue-50 text-blue-700">
                      {person.face_count || 0} {person.face_count === 1 ? 'face' : 'faces'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        person.is_active
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {person.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <Link
                        href={`/persons/${person.id}/edit`}
                        className="px-3 py-1.5 text-sm font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(person.id)}
                        className="px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
