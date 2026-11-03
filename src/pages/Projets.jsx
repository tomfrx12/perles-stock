import { useState, useEffect } from 'react'
import { useOutletContext, useNavigate } from 'react-router-dom'
import { slugify } from '../utils/slug'
import { fetchProjets, creerProjet, supprimerProjet as apiSupprimerProjet } from '../utils/projets'
import ProjetCard from '../components/ProjetCard'

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

export default function Projets() {
  const { isAdmin } = useOutletContext()
  const navigate = useNavigate()
  const [projets, setProjets] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [searchProjets, setSearchProjets] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState({ numero: '', nom: '', categorie: '' })
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  useEffect(() => {
    fetchProjets()
      .then(setProjets)
      .catch(() => setLoadError('Impossible de charger les projets.'))
      .finally(() => setLoading(false))
  }, [])

  function selectProjet(projet) {
    navigate(`/projets/${slugify(projet.nom)}`)
  }

  async function supprimerProjet(projet) {
    if (!confirm(`Supprimer « ${projet.nom} » ?`)) return
    try {
      await apiSupprimerProjet(projet.id)
      setProjets(prev => prev.filter(p => p.id !== projet.id))
    } catch {
      alert('La suppression a échoué.')
    }
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
      const nouveau = await creerProjet({
        numero: addForm.numero ? parseInt(addForm.numero) : null,
        nom: addForm.nom.trim(),
        image: imagePath,
        categorie: addForm.categorie || CATEGORIES[0],
      })
      setProjets(prev => [...prev, nouveau])
      setAddForm({ numero: '', nom: '', categorie: '' })
      setSelectedFile(null)
      setShowAdd(false)
    } catch {
      setUploadError("L'ajout a échoué, réessaie.")
    } finally {
      setUploading(false)
    }
  }

  if (loading) return <p className="text-sm text-gray-400">Chargement…</p>
  if (loadError) return <p className="text-sm text-red-500">{loadError}</p>

  const projetsFiltres = searchProjets.trim()
    ? projets.filter(p => p.nom.toLowerCase().includes(searchProjets.trim().toLowerCase()))
    : projets
  const projetsTries = [...projetsFiltres].sort((a, b) => (a.numero ?? Infinity) - (b.numero ?? Infinity))
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
              {projetsTries
                .filter(p => p.categorie === cat)
                .map(projet => (
                  <div key={projet.id} className="relative">
                    <ProjetCard
                      projet={projet}
                      termine={projet.statut === 'terminé'}
                      nbCouleurs={(projet.couleurs ?? []).length}
                      onClick={() => selectProjet(projet)}
                    />
                    {isAdmin && (
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
            <div className="flex gap-3">
              <div className="w-24">
                <label className="text-xs text-gray-500 mb-1 block">Numéro</label>
                <input
                  type="number"
                  min="1"
                  placeholder="ex : 25"
                  value={addForm.numero}
                  onChange={e => setAddForm({ ...addForm, numero: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-gray-500"
                />
              </div>
              <div className="flex-1">
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
                onClick={() => { setShowAdd(false); setAddForm({ numero: '', nom: '', categorie: '' }); setSelectedFile(null); setUploadError('') }}
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
