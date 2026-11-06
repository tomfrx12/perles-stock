function adminHeaders() {
  return {
    'Content-Type': 'application/json',
    'x-admin-token': localStorage.getItem('perles-admin-token') ?? '',
  }
}

async function request(url, options) {
  const res = await fetch(url, options)
  if (!res.ok) throw new Error(`Erreur serveur (${res.status})`)
  return res.json()
}

export async function fetchProjets() {
  await migrerLocalStorage()
  return request('/api/projets')
}

export function creerProjet(data) {
  return request('/api/projets', { method: 'POST', headers: adminHeaders(), body: JSON.stringify(data) })
}

export function modifierProjet(id, data) {
  return request(`/api/projets/${id}`, { method: 'PATCH', headers: adminHeaders(), body: JSON.stringify(data) })
}

export function supprimerProjet(id) {
  return request(`/api/projets/${id}`, { method: 'DELETE', headers: adminHeaders() })
}

export function validerProjet(id) {
  return request(`/api/projets/${id}/valider`, { method: 'POST', headers: adminHeaders() })
}

// Envoie une seule fois au serveur les projets qui étaient stockés dans le navigateur
async function migrerLocalStorage() {
  const raw = localStorage.getItem('perles-projets-custom')
  if (!raw) return
  const custom = JSON.parse(raw)
  const statuts = JSON.parse(localStorage.getItem('perles-projets-statuts') ?? '{}')
  const couleurs = JSON.parse(localStorage.getItem('perles-projets-couleurs') ?? '{}')
  for (const p of custom) {
    await creerProjet({
      nom: p.nom,
      image: p.image,
      categorie: p.categorie,
      numero: p.numero ?? null,
      couleurs: couleurs[p.id] ?? [],
      statut: statuts[p.id] ?? null,
    })
  }
  localStorage.removeItem('perles-projets-custom')
  localStorage.removeItem('perles-projets-statuts')
  localStorage.removeItem('perles-projets-couleurs')
}
