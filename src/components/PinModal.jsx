import { useState } from 'react'

export default function PinModal({ onSuccess, onClose }) {
  const [pinInput, setPinInput] = useState('')
  const [error, setError] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    if (pinInput === import.meta.env.VITE_ADMIN_PIN) {
      localStorage.setItem('perles-admin', '1')
      onSuccess()
    } else {
      setError(true)
      setPinInput('')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl p-6 w-72" onClick={e => e.stopPropagation()}>
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Accès admin</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="password"
            autoFocus
            placeholder="Code PIN"
            value={pinInput}
            onChange={e => { setPinInput(e.target.value); setError(false) }}
            className={`border rounded-lg px-3 py-2 text-sm outline-none transition-colors ${
              error ? 'border-red-400 focus:border-red-500' : 'border-gray-300 focus:border-gray-500'
            }`}
          />
          {error && <p className="text-xs text-red-500">Code incorrect</p>}
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={onClose} className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 cursor-pointer">
              Annuler
            </button>
            <button type="submit" className="px-3 py-1.5 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-700 cursor-pointer">
              Valider
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
