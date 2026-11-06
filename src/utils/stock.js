export const stockKey = (marque, code) => `${marque}-${code}`

export function evalStock(value, currentStock) {
  const v = value.trim()
  if (/^[+-]\d+$/.test(v)) return Math.max(0, currentStock + parseInt(v))
  if (/^\d+\s*[+\-*/]\s*\d+(\.\d+)?$/.test(v)) {
    // eslint-disable-next-line no-new-func
    return Math.max(0, Math.round(Function('"use strict";return(' + v + ')')()))
  }
  return Math.max(0, parseInt(v) || 0)
}

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

export function patchStock(updates) {
  return request('/api/stock', { method: 'PATCH', headers: adminHeaders(), body: JSON.stringify(updates) })
}

export function fetchStock() {
  return request('/api/stock')
}
