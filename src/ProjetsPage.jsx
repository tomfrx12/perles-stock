import { useState, useRef } from 'react'
import initialProjets from './data/pixel-arts.json'

function nearestBeadFromHex(hex, perles) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  let best = perles[0], bestDist = Infinity
  for (const p of perles) {
    const pr = parseInt(p.hex.slice(1, 3), 16)
    const pg = parseInt(p.hex.slice(3, 5), 16)
    const pb = parseInt(p.hex.slice(5, 7), 16)
    const d = (r - pr) ** 2 + (g - pg) ** 2 + (b - pb) ** 2
    if (d < bestDist) { bestDist = d; best = p }
  }
  return best
}

function isLight(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 > 140
}

function loadProjets() {
  const custom = JSON.parse(localStorage.getItem('perles-projets-custom') ?? '[]')
  return [...initialProjets, ...custom]
}

function loadStatuts() {
  return JSON.parse(localStorage.getItem('perles-projets-statuts') ?? '{}')
}

function loadCouleurs() {
  return JSON.parse(localStorage.getItem('perles-projets-couleurs') ?? '{}')
}

function saveCouleurs(c) {
  localStorage.setItem('perles-projets-couleurs', JSON.stringify(c))
}

const MARQUE_LABELS = { hama: 'Hama', artkal: 'Artkal', autres: 'Autres' }

export default function ProjetsPage({ perles, stocks, batchUpdateStock }) {
  const [projets, setProjets] = useState(loadProjets)
  const [statuts, setStatuts] = useState(loadStatuts)
  const [couleurs, setCouleurs] = useState(loadCouleurs)
  const [searchProjets, setSearchProjets] = useState('') // { [projetId]: [{marque,code,count}] }
  const [selected, setSelected] = useState(null)
  const [confirming, setConfirming] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState({ nom: '', image: '', categorie: '' })

  // État du formulaire d'ajout de couleur
  const [search, setSearch] = useState('')
  const [searchBead, setSearchBead] = useState(null)
  const [pickedHex, setPickedHex] = useState(null)
  const [addCount, setAddCount] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const searchRef = useRef(null)

  const projetCouleurs = selected ? (couleurs[selected.id] ?? []) : []
  const totalPerles = projetCouleurs.reduce((s, e) => s + e.count, 0)
  const insuffisant = projetCouleurs.filter(e =>
    (stocks[`${e.marque}-${e.code}`] ?? 0) < e.count
  )

  // Suggestions de perles filtrées
  const query = search.trim().toLowerCase()
  const suggestions = query.length >= 1
    ? perles.filter(p =>
        p.code.toLowerCase().includes(query) ||
        p.nom.toLowerCase().includes(query)
      ).slice(0, 8)
    : []

  function updateCouleurs(id, list) {
    const next = { ...couleurs, [id]: list }
    setCouleurs(next)
    saveCouleurs(next)
  }

  function selectProjet(projet) {
    setSelected(projet)
    setConfirming(false)
    setSearch('')
    setSearchBead(null)
    setPickedHex(null)
    setAddCount('')
  }

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

  function ajouterCouleur() {
    if (!searchBead || !addCount || parseInt(addCount) < 1) return
    const count = parseInt(addCount)
    const existing = projetCouleurs.find(e => e.marque === searchBead.marque && e.code === searchBead.code)
    let next
    if (existing) {
      next = projetCouleurs.map(e =>
        e.marque === searchBead.marque && e.code === searchBead.code
          ? { ...e, count: e.count + count }
          : e
      )
    } else {
      next = [...projetCouleurs, { marque: searchBead.marque, code: searchBead.code, count }]
    }
    updateCouleurs(selected.id, next)
    setSearch('')
    setSearchBead(null)
    setPickedHex(null)
    setAddCount('')
    searchRef.current?.focus()
  }

  function updateCount(idx, val) {
    const n = Math.max(1, parseInt(val) || 1)
    const next = projetCouleurs.map((e, i) => i === idx ? { ...e, count: n } : e)
    updateCouleurs(selected.id, next)
  }

  function removeCouleur(idx) {
    const next = projetCouleurs.filter((_, i) => i !== idx)
    updateCouleurs(selected.id, next)
  }

  function valider() {
    if (!selected || projetCouleurs.length === 0) return
    batchUpdateStock(
      projetCouleurs.map(e => ({ marque: e.marque, code: e.code, delta: -e.count }))
    )
    const newStatuts = { ...statuts, [selected.id]: 'terminé' }
    setStatuts(newStatuts)
    localStorage.setItem('perles-projets-statuts', JSON.stringify(newStatuts))
    setSelected(null)
    setConfirming(false)
  }

  function ajouterProjet(e) {
    e.preventDefault()
    if (!addForm.nom.trim() || !addForm.image.trim()) return
    const image = addForm.image.trim().startsWith('/') ? addForm.image.trim() : `/${addForm.image.trim()}`
    const nouveau = {
      id: `custom-${Date.now()}`,
      nom: addForm.nom.trim(),
      image,
      categorie: addForm.categorie.trim() || 'Personnalisé',
    }
    const newProjets = [...projets, nouveau]
    setProjets(newProjets)
    localStorage.setItem('perles-projets-custom', JSON.stringify(newProjets.filter(p => p.id.startsWith('custom-'))))
    setAddForm({ nom: '', image: '', categorie: '' })
    setShowAdd(false)
  }

  // ── Detail view ────────────────────────────────────────────────────────────
  if (selected) {
    const dejaTermine = statuts[selected.id] === 'terminé'

    return (
      <div>
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => { setSelected(null); setConfirming(false) }}
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
          >
            ← Retour
          </button>
          <span className="text-gray-300">|</span>
          <h2 className="text-xl font-bold">{selected.nom}</h2>
          <span className="text-sm text-gray-400">{selected.categorie}</span>
          {dejaTermine && (
            <span className="text-xs font-medium bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
              Terminé
            </span>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Image */}
          <div className="flex-shrink-0">
            <img
              src={selected.image}
              alt={selected.nom}
              className="rounded-lg border border-gray-200 bg-gray-100"
              style={{ imageRendering: 'pixelated', maxWidth: '280px', width: '100%' }}
            />
          </div>

          {/* Couleurs */}
          <div className="flex-1 min-w-0">

            {/* Formulaire d'ajout */}
            {!dejaTermine && (
              <div className="mb-5 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Ajouter une couleur
                </p>
                <div className="flex gap-2 flex-wrap">
                  {/* Bouton pipette */}
                  {typeof window !== 'undefined' && window.EyeDropper ? (
                    <button
                      type="button"
                      onClick={piperCouleur}
                      title="Pipetter une couleur sur l'écran"
                      className="w-9 h-9 flex items-center justify-center border border-gray-300 rounded-lg hover:border-gray-500 transition-colors cursor-pointer text-base flex-shrink-0"
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
                      className="w-9 h-9 border border-gray-300 rounded-lg cursor-pointer flex-shrink-0 p-0.5"
                    />
                  )}

                  {/* Aperçu couleur pipettée → perle */}
                  {pickedHex && searchBead && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 self-center">
                      <div className="w-4 h-4 rounded border border-black/10 flex-shrink-0" style={{ backgroundColor: pickedHex }} />
                      <span className="font-mono">{pickedHex}</span>
                      <span>→</span>
                      <div className="w-4 h-4 rounded border border-black/10 flex-shrink-0" style={{ backgroundColor: searchBead.hex }} />
                      <span className="font-medium">{searchBead.code}</span>
                    </div>
                  )}

                  {/* Recherche perle */}
                  <div className="relative flex-1 min-w-40">
                    {searchBead ? (
                      <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-1.5 bg-white">
                        <div className="w-4 h-4 rounded flex-shrink-0 border border-black/10" style={{ backgroundColor: searchBead.hex }} />
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
                                <div className="w-4 h-4 rounded flex-shrink-0 border border-black/10" style={{ backgroundColor: p.hex }} />
                                <span className="text-xs font-bold text-gray-600 w-10 flex-shrink-0">{p.code}</span>
                                <span className="text-xs text-gray-700 flex-1 truncate">{p.nom}</span>
                                <span className="text-[10px] text-gray-400">{MARQUE_LABELS[p.marque]}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Quantité */}
                  <input
                    type="number"
                    min="1"
                    placeholder="Qté"
                    value={addCount}
                    onChange={e => setAddCount(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && ajouterCouleur()}
                    className="w-20 border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-center outline-none focus:border-gray-500"
                  />

                  <button
                    onClick={ajouterCouleur}
                    disabled={!searchBead || !addCount || parseInt(addCount) < 1}
                    className="px-4 py-1.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    Ajouter
                  </button>
                </div>
              </div>
            )}

            {/* Liste des couleurs */}
            {projetCouleurs.length > 0 ? (
              <>
                <div className="flex items-baseline gap-3 mb-3">
                  <p className="text-sm text-gray-500">
                    <span className="font-semibold text-gray-900">{projetCouleurs.length}</span> couleur{projetCouleurs.length > 1 ? 's' : ''} ·{' '}
                    <span className="font-semibold text-gray-900">{totalPerles.toLocaleString()}</span> perles
                  </p>
                  {insuffisant.length > 0 && (
                    <span className="text-xs font-medium bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                      ⚠ Stock insuffisant : {insuffisant.length}
                    </span>
                  )}
                </div>

                <div className="space-y-1 max-h-96 overflow-y-auto pr-1">
                  {projetCouleurs.map((entry, idx) => {
                    const perle = perles.find(p => p.marque === entry.marque && p.code === entry.code)
                    if (!perle) return null
                    const stockVal = stocks[`${entry.marque}-${entry.code}`] ?? 0
                    const ok = stockVal >= entry.count
                    return (
                      <div
                        key={`${entry.marque}-${entry.code}`}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2 ${ok ? 'bg-white border-gray-100' : 'bg-red-50 border-red-200'} border`}
                      >
                        <div className="w-5 h-5 rounded flex-shrink-0 border border-black/10" style={{ backgroundColor: perle.hex }} />
                        <span className="text-xs font-bold text-gray-600 w-12 flex-shrink-0">{perle.code}</span>
                        <span className="text-xs text-gray-700 flex-1 truncate">{perle.nom}</span>
                        <span className="text-[10px] text-gray-400 w-10 flex-shrink-0">{MARQUE_LABELS[perle.marque]}</span>
                        {!dejaTermine ? (
                          <input
                            type="number"
                            min="1"
                            value={entry.count}
                            onChange={e => updateCount(idx, e.target.value)}
                            className="w-14 text-xs font-semibold text-center border border-gray-200 rounded px-1 py-0.5 tabular-nums outline-none focus:border-gray-400"
                          />
                        ) : (
                          <span className="text-xs font-semibold tabular-nums w-14 text-right flex-shrink-0">×{entry.count}</span>
                        )}
                        <span className={`text-xs tabular-nums w-20 text-right flex-shrink-0 ${ok ? 'text-gray-400' : 'text-red-500 font-semibold'}`}>
                          stock: {stockVal}{!ok && ' ⚠'}
                        </span>
                        {!dejaTermine && (
                          <button
                            onClick={() => removeCouleur(idx)}
                            className="text-gray-300 hover:text-red-400 transition-colors cursor-pointer text-xs ml-1"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>

                {!dejaTermine && (
                  <div className="mt-6">
                    {!confirming ? (
                      <button
                        onClick={() => setConfirming(true)}
                        className="px-5 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors cursor-pointer"
                      >
                        Valider ce projet
                      </button>
                    ) : (
                      <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-sm text-amber-800 flex-1">
                          Cela va déduire <strong>{totalPerles.toLocaleString()}</strong> perles du stock.
                          {insuffisant.length > 0 && ' Certaines couleurs sont en stock insuffisant.'}
                        </p>
                        <button
                          onClick={valider}
                          className="px-4 py-1.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 cursor-pointer transition-colors"
                        >
                          Confirmer
                        </button>
                        <button
                          onClick={() => setConfirming(false)}
                          className="px-4 py-1.5 bg-white border border-gray-300 text-sm text-gray-600 rounded-lg hover:border-gray-500 cursor-pointer transition-colors"
                        >
                          Annuler
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {dejaTermine && (
                  <p className="mt-4 text-sm text-green-600 font-medium">✓ Ce projet a déjà été validé.</p>
                )}
              </>
            ) : (
              !dejaTermine && (
                <p className="text-sm text-gray-400">
                  Aucune couleur ajoutée. Utilise le formulaire ci-dessus pour saisir les perles nécessaires.
                </p>
              )
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── List view ──────────────────────────────────────────────────────────────
  const projetsFiltres = searchProjets.trim()
    ? projets.filter(p => p.nom.toLowerCase().includes(searchProjets.trim().toLowerCase()))
    : projets
  const categories = [...new Set(projetsFiltres.map(p => p.categorie))]

  return (
    <div>
      <input
        type="search"
        placeholder="Rechercher un projet…"
        value={searchProjets}
        onChange={e => setSearchProjets(e.target.value)}
        className="mb-6 w-full max-w-xs border border-gray-300 rounded-full px-4 py-1.5 text-sm outline-none focus:border-gray-500"
      />
      <div className="space-y-10">
        {categories.map(cat => (
          <section key={cat}>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3 pb-2 border-b border-gray-200">
              {cat}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {projetsFiltres
                .filter(p => p.categorie === cat)
                .map(projet => {
                  const termine = statuts[projet.id] === 'terminé'
                  const nbCouleurs = (couleurs[projet.id] ?? []).length
                  return (
                    <button
                      key={projet.id}
                      onClick={() => selectProjet(projet)}
                      className="group relative rounded-xl border border-gray-200 bg-white hover:border-gray-400 hover:shadow-md transition-all cursor-pointer text-left overflow-hidden"
                    >
                      <div className="bg-gray-100 flex items-center justify-center p-4 aspect-square">
                        <img
                          src={projet.image}
                          alt={projet.nom}
                          className="max-w-full max-h-full object-contain"
                          style={{ imageRendering: 'pixelated' }}
                        />
                      </div>
                      <div className="p-3">
                        <p className="text-sm font-semibold text-gray-800">{projet.nom}</p>
                        {termine ? (
                          <span className="text-[11px] font-medium text-green-600">✓ Terminé</span>
                        ) : nbCouleurs > 0 ? (
                          <span className="text-[11px] text-gray-400">{nbCouleurs} couleur{nbCouleurs > 1 ? 's' : ''}</span>
                        ) : null}
                      </div>
                    </button>
                  )
                })}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-10">
        {!showAdd ? (
          <button
            onClick={() => setShowAdd(true)}
            className="px-4 py-2 border border-dashed border-gray-300 text-sm text-gray-500 rounded-lg hover:border-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
          >
            + Ajouter un pixel art
          </button>
        ) : (
          <form
            onSubmit={ajouterProjet}
            className="p-5 border border-gray-200 rounded-xl bg-white max-w-md space-y-3"
          >
            <h3 className="text-sm font-semibold text-gray-800">Nouveau pixel art</h3>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Nom</label>
              <input
                type="text"
                placeholder="ex : Pikachu"
                value={addForm.nom}
                onChange={e => setAddForm({ ...addForm, nom: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-gray-500"
                required
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Chemin de l'image</label>
              <input
                type="text"
                placeholder="ex : /pixel-art/pokemon/gen-1/25_Pikachu.png"
                value={addForm.image}
                onChange={e => setAddForm({ ...addForm, image: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-mono outline-none focus:border-gray-500"
                required
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Fichier à placer dans <code className="font-mono">public/</code>
              </p>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Catégorie</label>
              <input
                type="text"
                placeholder="ex : Pokémon Gen 1"
                value={addForm.categorie}
                onChange={e => setAddForm({ ...addForm, categorie: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-gray-500"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                className="px-4 py-1.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 cursor-pointer transition-colors"
              >
                Ajouter
              </button>
              <button
                type="button"
                onClick={() => { setShowAdd(false); setAddForm({ nom: '', image: '', categorie: '' }) }}
                className="px-4 py-1.5 border border-gray-300 text-sm text-gray-600 rounded-lg hover:border-gray-500 cursor-pointer transition-colors"
              >
                Annuler
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
