const MARQUE_LABELS = { hama: 'Hama', artkal: 'Artkal', autres: 'Autres' }

export default function CouleurRow({ entry, perle, stockVal, ok, dejaTermine, onUpdateCount, onRemove }) {
  if (!perle) return null
  return (
    <div className={`flex items-center gap-3 rounded-lg px-3 py-2 ${ok ? 'bg-white border-gray-100' : 'bg-red-50 border-red-200'} border`}>
      <div className="w-5 h-5 rounded shrink-0 border border-black/10" style={{ backgroundColor: perle.hex }} />
      <span className="text-xs font-bold text-gray-600 w-12 shrink-0">{perle.code}</span>
      <span className="text-xs text-gray-700 flex-1 truncate">{perle.nom}</span>
      <span className="text-[10px] text-gray-400 w-10 shrink-0">{MARQUE_LABELS[perle.marque]}</span>
      {!dejaTermine ? (
        <input
          type="number"
          min="1"
          value={entry.count}
          onChange={e => onUpdateCount(e.target.value)}
          className="w-14 text-xs font-semibold text-center border border-gray-200 rounded px-1 py-0.5 tabular-nums outline-none focus:border-gray-400"
        />
      ) : (
        <span className="text-xs font-semibold tabular-nums w-14 text-right shrink-0">×{entry.count}</span>
      )}
      <span className={`text-xs tabular-nums w-20 text-right shrink-0 ${ok ? 'text-gray-400' : 'text-red-500 font-semibold'}`}>
        stock: {stockVal}{!ok && ' ⚠'}
      </span>
      {!dejaTermine && (
        <button
          onClick={onRemove}
          className="text-gray-300 hover:text-red-400 transition-colors cursor-pointer text-xs ml-1"
        >
          ✕
        </button>
      )}
    </div>
  )
}
