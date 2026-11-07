'use client'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export default function SearchInput({ value, onChange, placeholder = 'Search...', className = '' }: SearchInputProps) {
  return (
    <div className={`relative ${className}`}>
      {!value && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
          <svg
            className="w-4 h-4 text-slate-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <span className="text-sm text-slate-400">{placeholder}</span>
        </div>
      )}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full py-2.5 px-4 text-sm text-slate-800 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
      />
    </div>
  )
}
