import autresData from '../data/perles-autres.json'
import hamaData from '../data/perles-hama.json'
import artkalData from '../data/perles-artkal.json'

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
