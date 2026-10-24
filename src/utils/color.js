export function isLight(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 > 140
}

export function nearestBeadFromHex(hex, perles) {
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
