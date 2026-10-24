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
