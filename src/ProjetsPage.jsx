import { useState } from 'react'
import initialProjets from './data/pixel-arts.json'

const CATEGORIES = [
  'Pokémon Gen 1',
  'Pokémon Gen 2',
  'Pokémon Gen 3',
  'Pokémon Gen 4',
  'Pokémon Gen 5',
  'Pokémon Gen 6',
  'Pokémon Gen 7',
  'Pokémon Gen 8',
  'Pokémon Gen 9',
]

import ProjetCard from './components/ProjetCard'
import ProjetDetail from './components/ProjetDetail'

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

export default function ProjetsPage({ perles, stocks, batchUpdateStock, isAdmin, onGoToStock }) {
  const [projets, setProjets] = useState(loadProjets)
  const [statuts, setStatuts] = useState(loadStatuts)
  const [couleurs, setCouleurs] = useState(loadCouleurs)
  const [searchProjets, setSearchProjets] = useState('')
  const [selected, setSelected] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState({ nom: '', categorie: '' })
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  const projetCouleurs = selected ? (couleurs[selected.id] ?? []) : []

  function updateCouleurs(id, list) {
    const next = { ...couleurs, [id]: list }
    setCouleurs(next)
    saveCouleurs(next)
  }

  function selectProjet(projet) {
    setSelected(projet)
  }

  function ajouterCouleur(bead, count) {
    const existing = projetCouleurs.find(e => e.marque === bead.marque && e.code === bead.code)
    const next = existing
      ? projetCouleurs.map(e =>
          e.marque === bead.marque && e.code === bead.code
            ? { ...e, count: e.count + count }
            : e
        )
      : [...projetCouleurs, { marque: bead.marque, code: bead.code, count }]
    updateCouleurs(selected.id, next)
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
  }

  async function supprimerProjet(projet) {
    if (projet.image.startsWith('/uploads/')) {
      const filename = projet.image.split('/').pop()
      try {
        await fetch(`/api/upload/${filename}`, {
          method: 'DELETE',
          headers: { 'x-admin-pin': import.meta.env.VITE_ADMIN_PIN },
        })
      } catch {
        // le fichier reste sur le disque, on retire quand même le projet de l'UI
      }
    }
    const newProjets = projets.filter(p => p.id !== projet.id)
    setProjets(newProjets)
    localStorage.setItem('perles-projets-custom', JSON.stringify(newProjets.filter(p => p.id.startsWith('custom-'))))
  }

  async function ajouterProjet(e) {
    e.preventDefault()
    if (!addForm.nom.trim() || !selectedFile) return
    setUploading(true)
    setUploadError('')
    try {
      const formData = new FormData()
      formData.append('name', addForm.nom.trim())
      formData.append('image', selectedFile)
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (!res.ok) throw new Error('Erreur serveur')
      const { path: imagePath } = await res.json()
      const nouveau = {
        id: `custom-${Date.now()}`,
        nom: addForm.nom.trim(),
        image: imagePath,
        categorie: addForm.categorie || CATEGORIES[0],
      }
      const newProjets = [...projets, nouveau]
      setProjets(newProjets)
      localStorage.setItem('perles-projets-custom', JSON.stringify(newProjets.filter(p => p.id.startsWith('custom-'))))
      setAddForm({ nom: '', categorie: '' })
      setSelectedFile(null)
      setShowAdd(false)
    } catch {
      setUploadError("L'upload a échoué, réessaie.")
    } finally {
      setUploading(false)
    }
  }

  if (selected) {
    return (
      <ProjetDetail
        projet={selected}
        projetCouleurs={projetCouleurs}
        perles={perles}
        stocks={stocks}
        dejaTermine={statuts[selected.id] === 'terminé'}
        isAdmin={isAdmin}
        onGoToStock={onGoToStock}
        onBack={() => setSelected(null)}
        onAjouterCouleur={ajouterCouleur}
        onUpdateCount={updateCount}
        onRemoveCouleur={removeCouleur}
        onValider={valider}
      />
    )
  }

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
                .map(projet => (
                  <div key={projet.id} className="relative">
                    <ProjetCard
                      projet={projet}
                      termine={statuts[projet.id] === 'terminé'}
                      nbCouleurs={(couleurs[projet.id] ?? []).length}
                      onClick={() => selectProjet(projet)}
                    />
                    {isAdmin && projet.id.startsWith('custom-') && (
                      <button
                        onClick={e => { e.stopPropagation(); supprimerProjet(projet) }}
                        className="absolute top-1.5 right-1.5 z-10 w-5 h-5 flex items-center justify-center rounded-full bg-white/80 hover:bg-red-100 text-gray-400 hover:text-red-500 text-xs shadow-sm transition-colors cursor-pointer"
                        title="Supprimer"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
            </div>
          </section>
        ))}
      </div>

      {isAdmin && <div className="mt-10">
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
              <label className="text-xs text-gray-500 mb-1 block">Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={e => { setSelectedFile(e.target.files?.[0] ?? null); setUploadError('') }}
                className="w-full text-sm text-gray-600 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 cursor-pointer"
              />
              {uploadError && <p className="text-[11px] text-red-500 mt-1">{uploadError}</p>}
              {selectedFile && (
                <p className="text-[11px] text-gray-400 mt-1">{selectedFile.name}</p>
              )}
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Catégorie</label>
              <select
                value={addForm.categorie}
                onChange={e => setAddForm({ ...addForm, categorie: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-gray-500 bg-white"
                required
              >
                <option value="" disabled>Choisir une catégorie…</option>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={uploading || !selectedFile}
                className="px-4 py-1.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                {uploading ? 'Upload…' : 'Ajouter'}
              </button>
              <button
                type="button"
                onClick={() => { setShowAdd(false); setAddForm({ nom: '', categorie: '' }); setSelectedFile(null); setUploadError('') }}
                className="px-4 py-1.5 border border-gray-300 text-sm text-gray-600 rounded-lg hover:border-gray-500 cursor-pointer transition-colors"
              >
                Annuler
              </button>
            </div>
          </form>
        )}
      </div>}
    </div>
  )
}
