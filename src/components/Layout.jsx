import { useState, useEffect } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { Sun, Moon } from 'lucide-react'
import { perles, compteParMarque } from '../utils/perles'
import { stockKey, evalStock } from '../utils/stock'
import PinModal from './PinModal'

const defaultStock = Object.fromEntries(perles.map(p => [stockKey(p.marque, p.code), p.stock]))

function loadStock() {
  try {
    const saved = JSON.parse(localStorage.getItem('perles-stock') ?? '{}')
    return { ...defaultStock, ...saved }
  } catch {
    return { ...defaultStock }
  }
}

function saveStock(stocks) {
  localStorage.setItem('perles-stock', JSON.stringify(stocks))
}

const PAGES = [
  { to: '/', label: 'Stock', end: true },
  { to: '/projets', label: 'Projets' },
]

export default function Layout() {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('perles-theme')
    return saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches
  })
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('perles-theme', dark ? 'dark' : 'light')
  }, [dark])

  const [stocks, setStocks] = useState(loadStock)
  const [isAdmin, setIsAdmin] = useState(() => localStorage.getItem('perles-admin') === '1')
  const [showPin, setShowPin] = useState(false)

  const perlesVisibles = isAdmin ? perles : perles.filter(p => p.marque !== 'autres')

  function lockAdmin() {
    localStorage.removeItem('perles-admin')
    setIsAdmin(false)
  }

  function batchUpdateStock(updates) {
    setStocks(prev => {
      const next = { ...prev }
      for (const { marque, code, delta } of updates) {
        const k = stockKey(marque, code)
        next[k] = Math.max(0, (next[k] ?? 0) + delta)
      }
      saveStock(next)
      return next
    })
  }

  function updateStock(marque, code, delta) {
    batchUpdateStock([{ marque, code, delta }])
  }

  function setStockDirect(marque, code, value) {
    const k = stockKey(marque, code)
    setStocks(prev => {
      const next = { ...prev, [k]: evalStock(value, prev[k] ?? 0) }
      saveStock(next)
      return next
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {showPin && (
        <PinModal
          onSuccess={() => { setIsAdmin(true); setShowPin(false) }}
          onClose={() => setShowPin(false)}
        />
      )}
      <div className="max-w-5xl mx-auto px-4 py-10">

        <header className="mb-8 flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Stock de Perles</h1>
            <p className="text-gray-400 mt-1 text-sm">
              {compteParMarque.hama} Hama · {compteParMarque.artkal} Artkal
              {' · '}
              {isAdmin ? (
                <button
                  onClick={lockAdmin}
                  className="hover:text-gray-600 transition-colors cursor-pointer"
                  title="Verrouiller le mode admin"
                >
                  {compteParMarque.autres} Autres 🔓
                </button>
              ) : (
                <button
                  onClick={() => setShowPin(true)}
                  className="hover:text-gray-500 transition-colors cursor-pointer"
                  title=""
                >
                  …
                </button>
              )}
            </p>
          </div>
          <nav className="flex gap-1 bg-gray-100 rounded-xl p-1">
            {PAGES.map(p => (
              <NavLink
                key={p.to}
                to={p.to}
                end={p.end}
                className={({ isActive }) => `px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {p.label}
              </NavLink>
            ))}
            <button
              onClick={() => setDark(d => !d)}
              title={dark ? 'Mode clair' : 'Mode sombre'}
              aria-label={dark ? 'Mode clair' : 'Mode sombre'}
              className="px-3 py-1.5 rounded-lg text-sm text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
            >
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </nav>
        </header>

        <Outlet context={{ perles: perlesVisibles, stocks, isAdmin, updateStock, setStockDirect, batchUpdateStock }} />

      </div>
    </div>
  )
}
