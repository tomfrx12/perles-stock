import autresData from '../data/perles-autres.json'
import hamaData from '../data/perles-hama.json'
import artkalData from '../data/perles-artkal.json'
import hamaVariantes from '../data/hama-variantes.json'
import artkalVariantes from '../data/artkal-variantes.json'

export const perles = [
  ...autresData.map(p => ({ ...p, marque: 'autres', stock: 390 })),
  ...hamaData.map(p => ({ ...p, marque: 'hama', stock: 0 })),
  ...artkalData.map(p => ({ ...p, marque: 'artkal', stock: 0 })),
]

export const MARQUES = [
  { id: 'toutes', label: 'Toutes' },
  { id: 'hama',   label: 'Hama' },
  { id: 'artkal', label: 'Artkal' },
  { id: 'autres', label: 'Autres' },
]

export const compteParMarque = {
  toutes: perles.length,
  hama:   hamaData.length,
  artkal: artkalData.length,
  autres: autresData.length,
}

// Liens boutique par marque. À ajuster si la boutique change d'URL.
// Hama : variante exacte du sachet de 2000 perles mini (src/data/hama-variantes.json),
// sinon page produit si la couleur n'y est pas vendue.
const BOUTIQUES = {
  hama: code => {
    const variante = hamaVariantes[code]
    return `https://hama.dk/fr/products/2000-perles-mini-en-sachet${variante ? `?variant=${variante}` : ''}`
  },
  // Artkal : sac de 7500 perles mini (src/data/artkal-variantes.json), pas de lien si la couleur n'y est pas vendue.
  artkal: code => {
    const produit = artkalVariantes[code]
    return produit ? `https://www.artkalfusebeads.com/products/${produit}` : null
  },
}

export function lienBoutique(perle) {
  const build = BOUTIQUES[perle.marque]
  return build ? build(perle.code) : null
}
