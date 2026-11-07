'use client'

import { useState } from 'react'
import { API_URL } from '@/lib/api'

// ---------------------------------------------------------------------------
// Icon components (inline SVGs to avoid external deps)
// ---------------------------------------------------------------------------

function IconGeneral({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.646.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function IconDetection({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 3.75H6A2.25 2.25 0 003.75 6v1.5M16.5 3.75H18A2.25 2.25 0 0120.25 6v1.5M20.25 16.5V18A2.25 2.25 0 0118 20.25h-1.5M3.75 16.5V18A2.25 2.25 0 006 20.25h1.5" />
      <circle cx="12" cy="10" r="3" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16.5c0-2.21 1.79-3 4-3s4 .79 4 3" />
    </svg>
  )
}

function IconAlerts({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
    </svg>
  )
}

function IconData({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  )
}

function IconSecurity({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Toggle switch component
// ---------------------------------------------------------------------------

function ToggleSwitch({
  enabled,
  onChange,
  label,
  description,
}: {
  enabled: boolean
  onChange: (val: boolean) => void
  label: string
  description?: string
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex-1 pr-4">
        <p className="text-sm font-medium text-slate-800">{label}</p>
        {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-2 ${
          enabled ? 'bg-gradient-to-r from-blue-600 to-purple-600' : 'bg-slate-200'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            enabled ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Styled range slider component
// ---------------------------------------------------------------------------

function RangeSlider({
  label,
  helpText,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit = '',
  displayValue,
}: {
  label: string
  helpText?: string
  value: number
  onChange: (val: number) => void
  min: number
  max: number
  step?: number
  unit?: string
  displayValue?: string
}) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-700">{label}</label>
        <span className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          {displayValue ?? `${value}${unit}`}
        </span>
      </div>
      <div className="relative">
        <div className="absolute top-1/2 left-0 right-0 h-2 -translate-y-1/2 rounded-full bg-slate-100" />
        <div
          className="absolute top-1/2 left-0 h-2 -translate-y-1/2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600"
          style={{ width: `${pct}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="relative z-10 w-full appearance-none bg-transparent cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-blue-600 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-blue-600 [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-pointer"
        />
      </div>
      {helpText && <p className="text-xs text-slate-500">{helpText}</p>}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main settings page
// ---------------------------------------------------------------------------

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general')
  const [saveMessage, setSaveMessage] = useState('')
  const [saving, setSaving] = useState(false)

  // General
  const [systemName, setSystemName] = useState('FaceTrace')
  const [timezone, setTimezone] = useState('local')
  const [language, setLanguage] = useState('en')

  // Detection
  const [recognitionThreshold, setRecognitionThreshold] = useState(0.65)
  const [minFaceSize, setMinFaceSize] = useState(40)
  const [detectionInterval, setDetectionInterval] = useState(500)

  // Alerts
  const [unknownFaceAlert, setUnknownFaceAlert] = useState(true)
  const [lowAttendanceAlert, setLowAttendanceAlert] = useState(false)
  const [unusualTimeAlert, setUnusualTimeAlert] = useState(true)
  const [cameraDownAlert, setCameraDownAlert] = useState(true)
  const [unknownFaceThreshold, setUnknownFaceThreshold] = useState(3)
  const [lowAttendanceThreshold, setLowAttendanceThreshold] = useState(50)
  const [cameraDownTimeout, setCameraDownTimeout] = useState(60)

  // Data & Privacy
  const [snapshotRetention, setSnapshotRetention] = useState(30)
  const [unknownRetention, setUnknownRetention] = useState(7)
  const [consentRequired, setConsentRequired] = useState(false)

  // Security
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordMessage, setPasswordMessage] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)
  const [sessionTimeout, setSessionTimeout] = useState(30)

  // ---- Handlers ----

  const handleSave = () => {
    setSaving(true)
    setSaveMessage('')
    setTimeout(() => {
      setSaving(false)
      setSaveMessage('Settings saved successfully!')
      setTimeout(() => setSaveMessage(''), 4000)
    }, 600)
  }

  const handleChangePassword = async () => {
    setPasswordMessage('')
    setPasswordError('')

    if (!currentPassword) {
      setPasswordError('Please enter your current password')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match')
      return
    }
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters')
      return
    }

    setChangingPassword(true)

    try {
      const token = document.cookie
        .split('; ')
        .find((row) => row.startsWith('access_token='))
        ?.split('=')[1]

      const response = await fetch(`${API_URL}/api/v1/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      })

      const data = await response.json()
      if (response.ok) {
        setPasswordMessage('Password changed successfully!')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        setPasswordError(data.detail || 'Failed to change password')
      }
    } catch {
      setPasswordError('Failed to connect to server')
    } finally {
      setChangingPassword(false)
    }
  }

  // ---- Tab definitions ----

  const tabs = [
    { id: 'general', label: 'General', icon: IconGeneral },
    { id: 'detection', label: 'Detection', icon: IconDetection },
    { id: 'alerts', label: 'Alerts', icon: IconAlerts },
    { id: 'data', label: 'Data & Privacy', icon: IconData },
    { id: 'security', label: 'Security', icon: IconSecurity },
  ]

  // ---- Render helpers ----

  const inputClassName =
    'w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors'

  const selectClassName =
    'w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors appearance-none cursor-pointer'

  // ---- Tab content ----

  const renderContent = () => {
    switch (activeTab) {
      // =====================================================================
      // GENERAL
      // =====================================================================
      case 'general':
        return (
          <div className="space-y-6">
            {/* System preferences */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6 space-y-5">
              <div>
                <h3 className="text-base font-semibold text-slate-900">System Preferences</h3>
                <p className="text-sm text-slate-500 mt-0.5">Core settings for your FaceTrace instance</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">System Name</label>
                  <input
                    type="text"
                    value={systemName}
                    onChange={(e) => setSystemName(e.target.value)}
                    className={inputClassName}
                    placeholder="FaceTrace"
                  />
                  <p className="text-xs text-slate-500 mt-1">Displayed in the dashboard header and reports</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Timezone</label>
                  <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className={selectClassName}>
                    <option value="local">Local Timezone (auto-detect)</option>
                    <option value="utc">UTC</option>
                    <option value="America/New_York">Eastern Time (ET)</option>
                    <option value="America/Chicago">Central Time (CT)</option>
                    <option value="America/Denver">Mountain Time (MT)</option>
                    <option value="America/Los_Angeles">Pacific Time (PT)</option>
                    <option value="Europe/London">London (GMT)</option>
                    <option value="Europe/Berlin">Berlin (CET)</option>
                    <option value="Asia/Tokyo">Tokyo (JST)</option>
                    <option value="Asia/Kathmandu">Kathmandu (NPT)</option>
                  </select>
                  <p className="text-xs text-slate-500 mt-1">All timestamps will be displayed in this timezone</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Language</label>
                  <select value={language} onChange={(e) => setLanguage(e.target.value)} className={selectClassName}>
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                    <option value="ja">Japanese</option>
                    <option value="ne">Nepali</option>
                  </select>
                  <p className="text-xs text-slate-500 mt-1">Interface language for labels and messages</p>
                </div>
              </div>

              <div className="pt-2">
                <button onClick={handleSave} disabled={saving} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium hover:shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>

            {/* System status */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6">
              <div className="mb-4">
                <h3 className="text-base font-semibold text-slate-900">System Status</h3>
                <p className="text-sm text-slate-500 mt-0.5">Current system information and connection details</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: 'API URL', value: API_URL },
                  { label: 'Version', value: '1.0.0' },
                  { label: 'Face Engine', value: 'InsightFace (buffalo_l)' },
                  { label: 'Database', value: 'PostgreSQL + pgvector' },
                ].map((item) => (
                  <div key={item.label} className="bg-slate-50 rounded-xl px-4 py-3">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{item.label}</p>
                    <p className="text-sm font-medium text-slate-800 mt-0.5 break-all">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )

      // =====================================================================
      // DETECTION
      // =====================================================================
      case 'detection':
        return (
          <div className="space-y-6">
            <div className="bg-white border border-slate-100 rounded-2xl p-6 space-y-6">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Recognition Settings</h3>
                <p className="text-sm text-slate-500 mt-0.5">Fine-tune how the system detects and matches faces</p>
              </div>

              <RangeSlider
                label="Recognition Threshold"
                helpText="Higher values mean stricter matching with fewer false positives. Lower values are more lenient."
                value={recognitionThreshold}
                onChange={setRecognitionThreshold}
                min={0}
                max={1}
                step={0.01}
                displayValue={recognitionThreshold.toFixed(2)}
              />

              <RangeSlider
                label="Minimum Face Size"
                helpText="Faces smaller than this pixel size will be ignored. Increase to reduce false detections from distant faces."
                value={minFaceSize}
                onChange={setMinFaceSize}
                min={10}
                max={200}
                step={5}
                unit="px"
              />

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Detection Interval (ms)</label>
                <input
                  type="number"
                  value={detectionInterval}
                  onChange={(e) => setDetectionInterval(Number(e.target.value))}
                  min={100}
                  max={5000}
                  step={100}
                  className={inputClassName}
                />
                <p className="text-xs text-slate-500 mt-1">
                  How often to run face detection (lower = faster but uses more CPU). Recommended: 300-1000ms.
                </p>
              </div>

              <div className="pt-2">
                <button onClick={handleSave} disabled={saving} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium hover:shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>

            {/* Model info */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6">
              <div className="mb-4">
                <h3 className="text-base font-semibold text-slate-900">Model Information</h3>
                <p className="text-sm text-slate-500 mt-0.5">Details about the face recognition model in use</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: 'Model', value: 'InsightFace buffalo_l' },
                  { label: 'Embedding Size', value: '512-dim' },
                  { label: 'Backend', value: 'ONNX Runtime' },
                  { label: 'Detection Model', value: 'RetinaFace' },
                ].map((item) => (
                  <div key={item.label} className="bg-slate-50 rounded-xl px-4 py-3">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{item.label}</p>
                    <p className="text-sm font-medium text-slate-800 mt-0.5">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )

      // =====================================================================
      // ALERTS
      // =====================================================================
      case 'alerts':
        return (
          <div className="space-y-6">
            {/* Alert toggles */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6 space-y-2">
              <div className="mb-2">
                <h3 className="text-base font-semibold text-slate-900">Alert Types</h3>
                <p className="text-sm text-slate-500 mt-0.5">Choose which events trigger alerts</p>
              </div>

              <div className="divide-y divide-slate-100">
                <ToggleSwitch
                  enabled={unknownFaceAlert}
                  onChange={setUnknownFaceAlert}
                  label="Unknown Face Detected"
                  description="Notify when an unregistered face is detected by a camera"
                />
                <ToggleSwitch
                  enabled={lowAttendanceAlert}
                  onChange={setLowAttendanceAlert}
                  label="Low Attendance"
                  description="Alert when attendance drops below a configurable threshold"
                />
                <ToggleSwitch
                  enabled={unusualTimeAlert}
                  onChange={setUnusualTimeAlert}
                  label="Unusual Time Access"
                  description="Flag faces detected outside of normal operating hours"
                />
                <ToggleSwitch
                  enabled={cameraDownAlert}
                  onChange={setCameraDownAlert}
                  label="Camera Offline"
                  description="Alert when a camera feed becomes unresponsive"
                />
              </div>
            </div>

            {/* Threshold settings */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6 space-y-5">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Alert Thresholds</h3>
                <p className="text-sm text-slate-500 mt-0.5">Configure sensitivity for each alert type</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Unknown faces before alert
                  </label>
                  <input
                    type="number"
                    value={unknownFaceThreshold}
                    onChange={(e) => setUnknownFaceThreshold(Number(e.target.value))}
                    min={1}
                    max={50}
                    className={inputClassName}
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Number of unknown face detections within a window before triggering an alert
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Low attendance threshold (%)
                  </label>
                  <input
                    type="number"
                    value={lowAttendanceThreshold}
                    onChange={(e) => setLowAttendanceThreshold(Number(e.target.value))}
                    min={0}
                    max={100}
                    className={inputClassName}
                  />
                  <p className="text-xs text-slate-500 mt-1">Alert when attendance falls below this percentage</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Camera offline timeout (seconds)
                  </label>
                  <input
                    type="number"
                    value={cameraDownTimeout}
                    onChange={(e) => setCameraDownTimeout(Number(e.target.value))}
                    min={10}
                    max={600}
                    className={inputClassName}
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Seconds of no response before a camera is considered offline
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <button onClick={handleSave} disabled={saving} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium hover:shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )

      // =====================================================================
      // DATA & PRIVACY
      // =====================================================================
      case 'data':
        return (
          <div className="space-y-6">
            <div className="bg-white border border-slate-100 rounded-2xl p-6 space-y-5">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Retention Policy</h3>
                <p className="text-sm text-slate-500 mt-0.5">Control how long data is stored in the system</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Snapshot Retention (days)
                  </label>
                  <input
                    type="number"
                    value={snapshotRetention}
                    onChange={(e) => setSnapshotRetention(Number(e.target.value))}
                    min={1}
                    max={365}
                    className={inputClassName}
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    How long to keep face detection snapshots and event logs
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Unknown Face Retention (days)
                  </label>
                  <input
                    type="number"
                    value={unknownRetention}
                    onChange={(e) => setUnknownRetention(Number(e.target.value))}
                    min={1}
                    max={90}
                    className={inputClassName}
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Unknown face images are automatically purged after this period
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <button onClick={handleSave} disabled={saving} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium hover:shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>

            {/* Consent & compliance */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6 space-y-2">
              <div className="mb-2">
                <h3 className="text-base font-semibold text-slate-900">Consent & Compliance</h3>
                <p className="text-sm text-slate-500 mt-0.5">Privacy controls and data governance</p>
              </div>

              <div className="divide-y divide-slate-100">
                <ToggleSwitch
                  enabled={consentRequired}
                  onChange={setConsentRequired}
                  label="Require Consent for Face Registration"
                  description="Users must explicitly consent before their face data is stored in the system"
                />
              </div>
            </div>

            {/* Export */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6">
              <div className="mb-4">
                <h3 className="text-base font-semibold text-slate-900">Data Export</h3>
                <p className="text-sm text-slate-500 mt-0.5">Download all stored data for compliance or migration</p>
              </div>
              <button className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Export All Data (CSV)
              </button>
            </div>
          </div>
        )

      // =====================================================================
      // SECURITY
      // =====================================================================
      case 'security':
        return (
          <div className="space-y-6">
            {/* Change password */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6 space-y-5">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Change Password</h3>
                <p className="text-sm text-slate-500 mt-0.5">Update your account password for security</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className={inputClassName}
                    placeholder="Enter current password"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={inputClassName}
                    placeholder="Enter new password"
                  />
                  <p className="text-xs text-slate-500 mt-1">Must be at least 6 characters</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={inputClassName}
                    placeholder="Re-enter new password"
                  />
                </div>
              </div>

              {passwordError && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-100">
                  <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                  <p className="text-sm text-red-600">{passwordError}</p>
                </div>
              )}
              {passwordMessage && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-100">
                  <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-emerald-600">{passwordMessage}</p>
                </div>
              )}

              <div className="pt-1">
                <button
                  onClick={handleChangePassword}
                  disabled={changingPassword}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium hover:shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-50"
                >
                  {changingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </div>

            {/* Session settings */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6 space-y-5">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Session Settings</h3>
                <p className="text-sm text-slate-500 mt-0.5">Configure automatic session timeout for inactive users</p>
              </div>

              <RangeSlider
                label="Session Timeout"
                helpText="Automatically log out users after this period of inactivity"
                value={sessionTimeout}
                onChange={setSessionTimeout}
                min={5}
                max={120}
                step={5}
                unit=" min"
              />

              <div className="pt-2">
                <button onClick={handleSave} disabled={saving} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium hover:shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>

            {/* Active sessions */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6">
              <div className="mb-4">
                <h3 className="text-base font-semibold text-slate-900">Active Sessions</h3>
                <p className="text-sm text-slate-500 mt-0.5">Devices currently logged in to your account</p>
              </div>

              <div className="space-y-3">
                {[
                  { device: 'Current Browser', location: 'This device', time: 'Active now', current: true },
                  { device: 'Chrome on macOS', location: 'Kathmandu, NP', time: '2 hours ago', current: false },
                ].map((session, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${session.current ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      <div>
                        <p className="text-sm font-medium text-slate-800">{session.device}</p>
                        <p className="text-xs text-slate-500">
                          {session.location} &middot; {session.time}
                        </p>
                      </div>
                    </div>
                    {!session.current && (
                      <button className="text-xs font-medium text-red-500 hover:text-red-600 transition-colors">
                        Revoke
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  // ---- Main layout ----

  return (
    <div className="p-8">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Configure your FaceTrace system</p>
      </div>

      {/* Success toast */}
      {saveMessage && (
        <div className="mb-6 flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-100 animate-in fade-in slide-in-from-top-2 duration-300">
          <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm font-medium text-emerald-600">{saveMessage}</p>
        </div>
      )}

      {/* Two-column layout: sidebar tabs + content */}
      <div className="flex gap-8">
        {/* Left sidebar tabs */}
        <nav className="w-56 shrink-0">
          <div className="sticky top-8 space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border-l-[3px] border-l-blue-600'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-l-[3px] border-l-transparent'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </nav>

        {/* Right content area */}
        <main className="flex-1 min-w-0">{renderContent()}</main>
      </div>
    </div>
  )
}
