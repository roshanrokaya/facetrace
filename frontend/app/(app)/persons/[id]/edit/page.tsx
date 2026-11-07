'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { API_URL } from '@/lib/api'

export default function EditPersonPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState({
    code: '',
    full_name: '',
    group_id: '',
    phone: '',
  })
  const [existingFaces, setExistingFaces] = useState<any[]>([])
  const [newFaceImages, setNewFaceImages] = useState<File[]>([])
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchPerson()
  }, [])

  const fetchPerson = async () => {
    try {
      const response = await fetch(`${API_URL}/api/v1/persons/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setFormData({
          code: data.code || '',
          full_name: data.full_name || '',
          group_id: data.group_id || '',
          phone: data.phone || '',
        })
        // Load existing faces (mock data for now)
        setExistingFaces(data.faces || [])
      }
    } catch (err) {
      setError('Failed to load person data')
    } finally {
      setLoading(false)
    }
  }

  const handleNewImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      const newImages = Array.from(files)
      setNewFaceImages([...newFaceImages, ...newImages])

      // Create previews
      newImages.forEach(file => {
        const reader = new FileReader()
        reader.onloadend = () => {
          setNewImagePreviews(prev => [...prev, reader.result as string])
        }
        reader.readAsDataURL(file)
      })
    }
  }

  const removeNewImage = (index: number) => {
    setNewFaceImages(newFaceImages.filter((_, i) => i !== index))
    setNewImagePreviews(newImagePreviews.filter((_, i) => i !== index))
  }

  const deleteExistingFace = async (faceId: number) => {
    if (!confirm('Are you sure you want to delete this face?')) {
      return
    }

    try {
      const response = await fetch(`${API_URL}/api/v1/persons/${params.id}/faces/${faceId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setExistingFaces(existingFaces.filter(f => f.id !== faceId))
      } else {
        alert('Failed to delete face')
      }
    } catch (err) {
      alert('Failed to connect to server')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      // First update person details
      const response = await fetch(`${API_URL}/api/v1/persons/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.detail || 'Failed to update person')
        setSaving(false)
        return
      }

      // Then upload new faces if any
      if (newFaceImages.length > 0) {
        for (const file of newFaceImages) {
          const formData = new FormData()
          formData.append('file', file)

          const faceResponse = await fetch(`${API_URL}/api/v1/persons/${params.id}/faces`, {
            method: 'POST',
            body: formData,
          })

          if (!faceResponse.ok) {
            setError('Failed to upload some faces')
            setSaving(false)
            return
          }
        }
      }

      router.push('/persons')
    } catch (err) {
      setError('Failed to connect to server')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Edit Person</h1>
      <div className="bg-white p-6 rounded-lg shadow max-w-2xl">
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
              Code (Roll Number / Staff ID) *
            </label>
            <input
              type="text"
              id="code"
              required
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              id="full_name"
              required
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="group_id" className="block text-sm font-medium text-gray-700 mb-2">
              Group / Class / Department
            </label>
            <input
              type="text"
              id="group_id"
              value={formData.group_id}
              onChange={(e) => setFormData({ ...formData, group_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="border-t pt-6">
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Existing Face Photos
            </label>
            {existingFaces.length === 0 ? (
              <p className="text-gray-500 text-sm">No face photos uploaded yet.</p>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                {existingFaces.map((face) => (
                  <div key={face.id} className="relative">
                    <div className="w-full h-32 bg-gray-200 rounded-md overflow-hidden">
                      {face.image_path ? (
                        <img
                          src={`${API_URL}${face.image_path}`}
                          alt={`Face ${face.id}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-sm text-gray-500">Face {face.id}</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteExistingFace(face.id)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t pt-6">
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Add New Face Photos
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleNewImageUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Select Images
              </button>
              <p className="text-sm text-gray-500 mt-2">
                Upload 3-5 clear face photos (front-facing, good lighting)
              </p>
            </div>

            {newImagePreviews.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-4">
                {newImagePreviews.map((preview, index) => (
                  <div key={index} className="relative">
                    <img
                      src={preview}
                      alt={`New Face ${index + 1}`}
                      className="w-full h-32 object-cover rounded-md"
                    />
                    <button
                      type="button"
                      onClick={() => removeNewImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p className="text-sm text-gray-500 mt-2">
              New images to add: {newFaceImages.length}
            </p>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <Link href="/persons">
              <button
                type="button"
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
