import { useState, useRef } from 'react'
import { nearestBeadFromHex } from '../utils/color'

const MARQUE_LABELS = { hama: 'Hama', artkal: 'Artkal', autres: 'Autres' }

export default function CouleurForm({ perles, onAjouter }) {
  const [search, setSearch] = useState('')
  const [searchBead, setSearchBead] = useState(null)
  const [pickedHex, setPickedHex] = useState(null)
  const [addCount, setAddCount] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const searchRef = useRef(null)

  const query = search.trim().toLowerCase()
  const suggestions = query.length >= 1
    ? perles.filter(p =>
        p.code.toLowerCase().includes(query) ||
        p.nom.toLowerCase().includes(query)
      ).slice(0, 8)
    : []

  async function piperCouleur() {
    if (window.EyeDropper) {
      try {
        const { sRGBHex } = await new window.EyeDropper().open()
        setPickedHex(sRGBHex)
        setSearchBead(nearestBeadFromHex(sRGBHex, perles))
        setSearch('')
      } catch {} // annulé par l'utilisateur
    }
  }

  function handleAjouter() {
    if (!searchBead || !addCount || parseInt(addCount) < 1) return
    onAjouter(searchBead, parseInt(addCount))
    setSearch('')
    setSearchBead(null)
    setPickedHex(null)
    setAddCount('')
    searchRef.current?.focus()
  }

  return (
    <div className="mb-5 p-4 bg-gray-50 border border-gray-200 rounded-xl">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
        Ajouter une couleur
      </p>
      <div className="flex gap-2 flex-wrap">
        {typeof window !== 'undefined' && window.EyeDropper ? (
          <button
            type="button"
            onClick={piperCouleur}
            title="Pipetter une couleur sur l'écran"
            className="w-9 h-9 flex items-center justify-center border border-gray-300 rounded-lg hover:border-gray-500 transition-colors cursor-pointer text-base shrink-0"
          >
            🔬
          </button>
        ) : (
          <input
            type="color"
            title="Choisir une couleur"
            onChange={e => {
              setPickedHex(e.target.value)
              setSearchBead(nearestBeadFromHex(e.target.value, perles))
              setSearch('')
            }}
            className="w-9 h-9 border border-gray-300 rounded-lg cursor-pointer shrink-0 p-0.5"
          />
        )}

        {pickedHex && searchBead && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500 self-center">
            <div className="w-4 h-4 rounded border border-black/10 shrink-0" style={{ backgroundColor: pickedHex }} />
            <span className="font-mono">{pickedHex}</span>
            <span>→</span>
            <div className="w-4 h-4 rounded border border-black/10 shrink-0" style={{ backgroundColor: searchBead.hex }} />
            <span className="font-medium">{searchBead.code}</span>
          </div>
        )}

        <div className="relative flex-1 min-w-40">
          {searchBead ? (
            <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-1.5 bg-white">
              <div className="w-4 h-4 rounded shrink-0 border border-black/10" style={{ backgroundColor: searchBead.hex }} />
              <span className="text-sm font-medium text-gray-800">{searchBead.code}</span>
              <span className="text-xs text-gray-500 truncate">{searchBead.nom}</span>
              <button
                onClick={() => { setSearchBead(null); setSearch(''); setPickedHex(null) }}
                className="ml-auto text-gray-400 hover:text-gray-700 text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>
          ) : (
            <>
              <input
                ref={searchRef}
                type="text"
                placeholder="Code ou nom (ex: H18, Noir…)"
                value={search}
                onChange={e => { setSearch(e.target.value); setShowSuggestions(true) }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-gray-500"
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                  {suggestions.map(p => (
                    <button
                      key={`${p.marque}-${p.code}`}
                      onMouseDown={() => { setSearchBead(p); setSearch(''); setShowSuggestions(false) }}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-left cursor-pointer"
                    >
                      <div className="w-4 h-4 rounded shrink-0 border border-black/10" style={{ backgroundColor: p.hex }} />
                      <span className="text-xs font-bold text-gray-600 w-10 shrink-0">{p.code}</span>
                      <span className="text-xs text-gray-700 flex-1 truncate">{p.nom}</span>
                      <span className="text-[10px] text-gray-400">{MARQUE_LABELS[p.marque]}</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <input
          type="number"
          min="1"
          placeholder="Qté"
          value={addCount}
          onChange={e => setAddCount(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAjouter()}
          className="w-20 border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-center outline-none focus:border-gray-500"
        />

        <button
          onClick={handleAjouter}
          disabled={!searchBead || !addCount || parseInt(addCount) < 1}
          className="px-4 py-1.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          Ajouter
        </button>
      </div>
    </div>
  )
}
