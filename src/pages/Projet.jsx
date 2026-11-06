import { useState, useEffect } from 'react'
import { useOutletContext, useNavigate, useParams, Navigate, Link } from 'react-router-dom'
import { slugify } from '../utils/slug'
import { fetchProjets, modifierProjet, validerProjet } from '../utils/projets'
import CouleurForm from '../components/CouleurForm'
import CouleurRow from '../components/CouleurRow'

export default function Projet() {
  const { perles, stocks, isAdmin, applyServerStock } = useOutletContext()
  const navigate = useNavigate()
  const { slug } = useParams()
  const [projets, setProjets] = useState(null)
  const [error, setError] = useState('')
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    fetchProjets()
      .then(setProjets)
      .catch(() => setError('Impossible de charger le projet.'))
  }, [])

  if (error) return <p className="text-sm text-red-500">{error}</p>
  if (!projets) return <p className="text-sm text-gray-400">Chargement…</p>

  const projet = projets.find(p => slugify(p.nom) === slug)
  if (!projet) return <Navigate to="/projets" replace />

  const projetCouleurs = projet.couleurs ?? []
  const dejaTermine = projet.statut === 'terminé'
  const totalPerles = projetCouleurs.reduce((s, e) => s + e.count, 0)
  const insuffisant = projetCouleurs.filter(e => (stocks[`${e.marque}-${e.code}`] ?? 0) < e.count)

  // Mise à jour immédiate de l'affichage, puis enregistrement côté serveur
  async function update(data) {
    const avant = projets
    setProjets(prev => prev.map(p => p.id === projet.id ? { ...p, ...data } : p))
    try {
      await modifierProjet(projet.id, data)
    } catch {
      setProjets(avant)
      alert("L'enregistrement a échoué.")
      throw new Error('save failed')
    }
  }

  function updateCouleurs(list) {
    update({ couleurs: list }).catch(() => {})
  }

  function ajouterCouleur(bead, count) {
    const existing = projetCouleurs.find(e => e.marque === bead.marque && e.code === bead.code)
    updateCouleurs(existing
      ? projetCouleurs.map(e => e === existing ? { ...e, count: e.count + count } : e)
      : [...projetCouleurs, { marque: bead.marque, code: bead.code, count }])
  }

  function updateCount(idx, val) {
    const n = Math.max(1, parseInt(val) || 1)
    updateCouleurs(projetCouleurs.map((e, i) => i === idx ? { ...e, count: n } : e))
  }

  function removeCouleur(idx) {
    updateCouleurs(projetCouleurs.filter((_, i) => i !== idx))
  }

  async function valider() {
    if (projetCouleurs.length === 0) return
    const avant = projets
    setProjets(prev => prev.map(p => p.id === projet.id ? { ...p, statut: 'terminé' } : p))
    try {
      const { stock } = await validerProjet(projet.id)
      applyServerStock(stock)
      navigate('/projets')
    } catch {
      setProjets(avant)
      alert("La validation a échoué.")
    }
  }

  function goToStock(code, marque) {
    navigate(`/?${new URLSearchParams({ q: code, marque })}`)
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link
          to="/projets"
          className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          ← Retour
        </Link>
        <span className="text-gray-300">|</span>
        <h2 className="text-xl font-bold">
          {projet.numero != null && (
            <span className="text-gray-400 font-normal mr-2">#{String(projet.numero).padStart(3, '0')}</span>
          )}
          {projet.nom}
        </h2>
        <span className="text-sm text-gray-400">{projet.categorie}</span>
        {dejaTermine && (
          <span className="text-xs font-medium bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
            Terminé
          </span>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="shrink-0">
          <img
            src={projet.image}
            alt={projet.nom}
            className="rounded-lg border border-gray-200 bg-gray-100"
            style={{ imageRendering: 'pixelated', maxWidth: '280px', width: '100%' }}
          />
        </div>

        <div className="flex-1 min-w-0">
          {isAdmin && !dejaTermine && (
            <CouleurForm perles={perles} onAjouter={ajouterCouleur} />
          )}

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
                  const stockVal = stocks[`${entry.marque}-${entry.code}`] ?? 0
                  return (
                    <CouleurRow
                      key={`${entry.marque}-${entry.code}`}
                      entry={entry}
                      perle={perle}
                      stockVal={stockVal}
                      ok={stockVal >= entry.count}
                      dejaTermine={dejaTermine}
                      isAdmin={isAdmin}
                      onUpdateCount={val => updateCount(idx, val)}
                      onRemove={() => removeCouleur(idx)}
                      onGoToStock={() => goToStock(entry.code, entry.marque)}
                    />
                  )
                })}
              </div>

              {isAdmin && !dejaTermine && (
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
