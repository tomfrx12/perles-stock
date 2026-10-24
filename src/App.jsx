import { useState } from 'react'
import autresData from './data/perles-autres.json'
import hamaData from './data/perles-hama.json'
import artkalData from './data/perles-artkal.json'
import ProjetsPage from './ProjetsPage'

const STOCK_ILLIMITE = ['H01', 'H07']

const perles = [
  ...autresData.map(p => ({
    ...p,
    marque: 'autres',
    stock: STOCK_ILLIMITE.includes(p.code) ? 1390 : 390,
  })),
  ...hamaData.map(p => ({ ...p, marque: 'hama', stock: 0 })),
  ...artkalData.map(p => ({ ...p, marque: 'artkal', stock: 0 })),
]

const MARQUES = [
  { id: 'toutes', label: 'Toutes' },
  { id: 'hama',   label: 'Hama' },
  { id: 'artkal', label: 'Artkal' },
  { id: 'autres', label: 'Autres' },
]

const stockKey = (marque, code) => `${marque}-${code}`

const defaultStock = Object.fromEntries(
  perles.map(p => [stockKey(p.marque, p.code), p.stock])
)

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

function isLight(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 > 140
}

function evalStock(value, currentStock) {
  const v = value.trim()
  if (/^[+-]\d+$/.test(v)) return Math.max(0, currentStock + parseInt(v))
  if (/^\d+\s*[+\-*/]\s*\d+(\.\d+)?$/.test(v)) {
    // eslint-disable-next-line no-new-func
    return Math.max(0, Math.round(Function('"use strict";return(' + v + ')')()))
  }
  return Math.max(0, parseInt(v) || 0)
}

export default function App() {
  const [page, setPage] = useState('stock')
  const [marque, setMarque] = useState('toutes')
  const [search, setSearch] = useState('')
  const [stocks, setStocks] = useState(loadStock)
  const [editing, setEditing] = useState(null)

  const perlesFiltrees = search.trim()
    ? perles.filter(p =>
        p.code.toLowerCase().includes(search.trim().toLowerCase()) ||
        p.nom.toLowerCase().includes(search.trim().toLowerCase()) ||
        p.hex.toLowerCase().includes(search.trim().toLowerCase())
      )
    : (marque === 'toutes' ? perles : perles.filter(p => p.marque === marque))

  const groupes = [...new Set(perlesFiltrees.map(p => p.groupe))]

  const compteParMarque = {
    toutes: perles.length,
    hama:   hamaData.length,
    artkal: artkalData.length,
    autres: autresData.length,
  }

  function updateStock(marque, code, delta) {
    const k = stockKey(marque, code)
    setStocks(prev => {
      const next = { ...prev, [k]: Math.max(0, (prev[k] ?? 0) + delta) }
      saveStock(next)
      return next
    })
  }

  function setStockDirect(marque, code, value) {
    const k = stockKey(marque, code)
    const n = evalStock(value, stocks[k] ?? 0)
    setStocks(prev => {
      const next = { ...prev, [k]: n }
      saveStock(next)
      return next
    })
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

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="max-w-5xl mx-auto px-4 py-10">

        <header className="mb-8 flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Stock de Perles</h1>
            <p className="text-gray-400 mt-1 text-sm">
              {compteParMarque.hama} Hama · {compteParMarque.artkal} Artkal · {compteParMarque.autres} Autres
            </p>
          </div>
          <nav className="flex gap-1 bg-gray-100 rounded-xl p-1">
            {[{ id: 'stock', label: 'Stock' }, { id: 'projets', label: 'Projets' }].map(p => (
              <button
                key={p.id}
                onClick={() => setPage(p.id)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  page === p.id
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {p.label}
              </button>
            ))}
          </nav>
        </header>

        {page === 'stock' && (
          <nav className="flex flex-wrap items-center gap-2 mb-10">
            {MARQUES.map(m => (
              <button
                key={m.id}
                onClick={() => { setMarque(m.id); setSearch('') }}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors cursor-pointer ${
                  marque === m.id && !search.trim()
                    ? 'bg-gray-900 text-white border-gray-900'
                    : search.trim()
                      ? 'bg-white text-gray-400 border-gray-200'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-gray-500'
                }`}
              >
                {m.label}
                <span className="ml-1.5 text-xs opacity-60">
                  {compteParMarque[m.id]}
                </span>
              </button>
            ))}
            <input
              type="search"
              placeholder="Rechercher (code, nom, hex…)"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="ml-auto border border-gray-300 rounded-full px-4 py-1.5 text-sm outline-none focus:border-gray-500 w-56"
            />
          </nav>
        )}

        {page === 'projets' && (
          <main>
            <ProjetsPage perles={perles} stocks={stocks} batchUpdateStock={batchUpdateStock} />
          </main>
        )}

        {page === 'stock' && <main className="space-y-10">
          {groupes.map(groupe => (
            <section key={groupe}>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3 pb-2 border-b border-gray-200">
                {groupe}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {perlesFiltrees
                  .filter(p => p.groupe === groupe)
                  .map(perle => {
                    const k = stockKey(perle.marque, perle.code)
                    const stock = stocks[k] ?? 0
                    const light = isLight(perle.hex)
                    const textColor = light ? '#111' : '#fff'
                    const subColor  = light ? '#444' : '#ccc'
                    const isEditing = editing === k

                    return (
                      <div
                        key={k}
                        className="rounded-xl p-3 flex flex-col justify-between gap-1 min-h-30 shadow-sm"
                        style={{ backgroundColor: perle.hex }}
                      >
                        {/* Contrôles stock */}
                        <div className="flex items-center justify-between gap-1">
                          <button
                            onClick={() => updateStock(perle.marque, perle.code, -1)}
                            className="w-5 h-5 rounded text-[11px] font-bold flex items-center justify-center cursor-pointer transition-opacity hover:opacity-80"
                            style={{ backgroundColor: light ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.15)', color: textColor }}
                          >
                            −
                          </button>

                          {isEditing ? (
                            <input
                              type="text"
                              defaultValue={stock}
                              autoFocus
                              onBlur={e => {
                                setStockDirect(perle.marque, perle.code, e.target.value)
                                setEditing(null)
                              }}
                              onKeyDown={e => {
                                if (e.key === 'Enter') e.target.blur()
                                if (e.key === 'Escape') setEditing(null)
                              }}
                              className="w-14 text-center text-[11px] font-semibold tabular-nums rounded px-0.5 bg-white/30 outline-none"
                              style={{ color: textColor }}
                            />
                          ) : (
                            <span
                              className="text-[11px] font-semibold tabular-nums cursor-pointer"
                              style={{ color: subColor }}
                              onClick={() => setEditing(k)}
                              title="Cliquer pour modifier"
                            >
                              {stock}
                            </span>
                          )}

                          <button
                            onClick={() => updateStock(perle.marque, perle.code, 1)}
                            className="w-5 h-5 rounded text-[11px] font-bold flex items-center justify-center cursor-pointer transition-opacity hover:opacity-80"
                            style={{ backgroundColor: light ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.15)', color: textColor }}
                          >
                            +
                          </button>
                        </div>

                        {/* Infos couleur */}
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-bold tracking-wide" style={{ color: textColor }}>
                            {perle.code}
                          </span>
                          <span className="text-[11px] leading-snug" style={{ color: textColor }}>
                            {perle.nom}
                          </span>
                          <span className="text-[10px] font-mono mt-0.5" style={{ color: subColor }}>
                            {perle.hex}
                          </span>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </section>
          ))}
        </main>}
      </div>
    </div>
  )
}
