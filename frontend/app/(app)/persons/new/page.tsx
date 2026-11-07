'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { API_URL } from '@/lib/api'

export default function NewPersonPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState({
    code: '',
    full_name: '',
    group_id: '',
    phone: '',
    consent_given: false
  })
  const [faceImages, setFaceImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      const newImages = Array.from(files)
      setFaceImages([...faceImages, ...newImages])

      // Create previews
      newImages.forEach(file => {
        const reader = new FileReader()
        reader.onloadend = () => {
          setImagePreviews(prev => [...prev, reader.result as string])
        }
        reader.readAsDataURL(file)
      })
    }
  }

  const removeImage = (index: number) => {
    setFaceImages(faceImages.filter((_, i) => i !== index))
    setImagePreviews(imagePreviews.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.consent_given) {
      setError('Consent must be given to enroll a person')
      return
    }

    if (faceImages.length < 3) {
      setError('Please upload at least 3 face images for enrollment')
      return
    }

    if (faceImages.length > 5) {
      setError('Please upload no more than 5 face images')
      return
    }

    // Get auth token from cookie
    const token = document.cookie
      .split('; ')
      .find((row) => row.startsWith('access_token='))
      ?.split('=')[1]

    if (!token) {
      setError('Not authenticated. Please log in.')
      return
    }

    setLoading(true)

    try {
      // Create FormData for file upload
      const formDataToSend = new FormData()
      formDataToSend.append('code', formData.code)
      formDataToSend.append('full_name', formData.full_name)
      formDataToSend.append('group_id', formData.group_id || '')
      formDataToSend.append('phone', formData.phone || '')
      formDataToSend.append('consent_given', formData.consent_given.toString())

      faceImages.forEach((file, index) => {
        formDataToSend.append(`face_${index}`, file)
      })

      const response = await fetch(`${API_URL}/api/v1/persons`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formDataToSend,
      })

      if (response.ok) {
        router.push('/persons')
      } else {
        const data = await response.json()
        setError(data.detail || 'Failed to create person')
      }
    } catch (err) {
      setError('Failed to connect to server')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Enroll New Person</h1>
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
              placeholder="e.g., STD001 or STF001"
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
              placeholder="e.g., John Doe"
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
              placeholder="e.g., BCA 6th Sem or Computer Science"
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
              placeholder="e.g., +977 9800000000"
            />
          </div>

          <div className="border-t pt-6">
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="consent"
                  type="checkbox"
                  required
                  checked={formData.consent_given}
                  onChange={(e) => setFormData({ ...formData, consent_given: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>
              <div className="ml-3">
                <label htmlFor="consent" className="text-sm text-gray-700">
                  I consent to the collection and use of my facial data for face recognition purposes in the Face Trace system. I understand that my data will be stored securely and used only for campus entry tracking and analytics.
                </label>
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Face Images (3-5 images required)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
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

            {imagePreviews.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative">
                    <img
                      src={preview}
                      alt={`Face ${index + 1}`}
                      className="w-full h-32 object-cover rounded-md"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p className="text-sm text-gray-500 mt-2">
              Uploaded: {faceImages.length}/5 images
            </p>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? 'Creating...' : 'Create Person'}
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
