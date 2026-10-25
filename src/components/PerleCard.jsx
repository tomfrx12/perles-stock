import { isLight } from '../utils/color'

export default function PerleCard({ perle, stock, isEditing, isAdmin, onIncrement, onDecrement, onEdit, onStartEdit, onCancelEdit }) {
  const light = isLight(perle.hex)
  const textColor = light ? '#111' : '#fff'
  const subColor  = light ? '#444' : '#ccc'

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
      </div>
    </div>
  )
}
