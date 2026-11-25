import { isLight } from '../utils/color'
import { lienBoutique } from '../utils/perles'

export default function PerleCard({ perle, stock, isEditing, isAdmin, onIncrement, onDecrement, onEdit, onStartEdit, onCancelEdit }) {
  const light = isLight(perle.hex)
  const textColor = light ? '#111' : '#fff'
  const subColor  = light ? '#444' : '#ccc'
  const lien = lienBoutique(perle)
  const rupture = Number(stock) <= 0
  return (
    <div
      className="rounded-xl p-3 flex flex-col justify-between gap-1 min-h-30 shadow-sm"
      style={{ backgroundColor: perle.hex }}
    >
      <div className="flex items-center justify-between gap-1">
        {isAdmin && (
          <button
            onClick={onDecrement}
            className="w-5 h-5 rounded text-[11px] font-bold flex items-center justify-center cursor-pointer transition-opacity hover:opacity-80"
            style={{ backgroundColor: light ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.15)', color: textColor }}
          >
            −
          </button>
        )}

        {isAdmin && isEditing ? (
          <input
            type="text"
            defaultValue={stock}
            autoFocus
            onBlur={e => onEdit(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') e.target.blur()
              if (e.key === 'Escape') onCancelEdit()
            }}
            className="w-14 text-center text-[11px] font-semibold tabular-nums rounded px-0.5 bg-white/30 outline-none"
            style={{ color: textColor }}
          />
        ) : (
          <span
            className={`text-[11px] font-semibold tabular-nums ${isAdmin ? 'cursor-pointer' : ''}`}
            style={{ color: subColor }}
            onClick={isAdmin ? onStartEdit : undefined}
            title={isAdmin ? 'Cliquer pour modifier' : undefined}
          >
            {stock}
          </span>
        )}

        {isAdmin && (
          <button
            onClick={onIncrement}
            className="w-5 h-5 rounded text-[11px] font-bold flex items-center justify-center cursor-pointer transition-opacity hover:opacity-80"
            style={{ backgroundColor: light ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.15)', color: textColor }}
          >
            +
          </button>
        )}
      </div>

      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-bold tracking-wide" style={{ color: textColor }}>
          {perle.code}
        </span>
        <span className="text-[11px] leading-snug" style={{ color: textColor }}>
          {perle.nom}
        </span>
        <span className="text-[10px] font-mono mt-0.5" style={{ color: subColor }}>
          {perle.hex}
        </span>
        {lien && (
          <a
            href={lien}
            target="_blank"
            rel="noopener noreferrer"
            className={`mt-1 self-start rounded px-1.5 py-0.5 text-[10px] font-semibold transition-opacity hover:opacity-80 ${rupture ? '' : 'opacity-60'}`}
            style={{
              backgroundColor: rupture ? '#dc2626' : (light ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.15)'),
              color: rupture ? '#fff' : textColor,
            }}
            title={`Acheter ${perle.code} sur la boutique ${perle.marque}`}
          >
            {rupture ? 'Racheter' : 'Boutique'} ↗
          </a>
        )}
      </div>
    </div>
  )
}
