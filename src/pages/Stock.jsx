import { useState } from 'react'
import { useOutletContext, useSearchParams } from 'react-router-dom'
import { MARQUES, compteParMarque } from '../utils/perles'
import { stockKey } from '../utils/stock'
import PerleCard from '../components/PerleCard'

export default function Stock() {
  const { perles, stocks, isAdmin, updateStock, setStockDirect } = useOutletContext()
  const [params, setParams] = useSearchParams()
  const [editing, setEditing] = useState(null)

  const search = params.get('q') ?? ''
  const marqueParam = params.get('marque') ?? 'toutes'
  const marque = !isAdmin && marqueParam === 'autres' ? 'toutes' : marqueParam

  function update(next) {
    const p = new URLSearchParams(params)
    for (const [k, v] of Object.entries(next)) {
      if (!v || (k === 'marque' && v === 'toutes')) p.delete(k)
      else p.set(k, v)
    }
    setParams(p, { replace: true })
  }

  const marquesVisibles = isAdmin ? MARQUES : MARQUES.filter(m => m.id !== 'autres')

  const q = search.trim().toLowerCase()
  const perlesFiltrees = q
    ? perles.filter(p =>
        (marque === 'toutes' || p.marque === marque) &&
        (p.code.toLowerCase().includes(q) ||
         p.nom.toLowerCase().includes(q) ||
         p.hex.toLowerCase().includes(q))
      )
    : (marque === 'toutes' ? perles : perles.filter(p => p.marque === marque))

  const groupes = [...new Set(perlesFiltrees.map(p => p.groupe))]

  return (
    <>
      <nav className="flex flex-wrap items-center gap-2 mb-10">
        {marquesVisibles.map(m => (
          <button
            key={m.id}
            onClick={() => update({ marque: m.id, q: '' })}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors cursor-pointer ${
              marque === m.id && !q
                ? 'bg-gray-900 text-white border-gray-900'
                : q
                  ? 'bg-white text-gray-400 border-gray-200'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-gray-500'
            }`}
          >
            {m.label}
            <span className="ml-1.5 text-xs opacity-60">{compteParMarque[m.id]}</span>
          </button>
        ))}
        <input
          type="search"
          placeholder="Rechercher (code, nom, hex…)"
          value={search}
          onChange={e => update({ q: e.target.value })}
          className="ml-auto border border-gray-300 rounded-full px-4 py-1.5 text-sm outline-none focus:border-gray-500 w-56"
        />
      </nav>

      <main className="space-y-10">
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
                  return (
                    <PerleCard
                      key={k}
                      perle={perle}
                      stock={stocks[k] ?? 0}
                      isEditing={editing === k}
                      isAdmin={isAdmin}
                      onIncrement={() => updateStock(perle.marque, perle.code, 1)}
                      onDecrement={() => updateStock(perle.marque, perle.code, -1)}
                      onEdit={value => { setStockDirect(perle.marque, perle.code, value); setEditing(null) }}
                      onStartEdit={() => setEditing(k)}
                      onCancelEdit={() => setEditing(null)}
                    />
                  )
                })}
            </div>
          </section>
        ))}
      </main>
    </>
  )
}
