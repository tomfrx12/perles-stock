export default function ProjetCard({ projet, termine, nbCouleurs, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group relative rounded-xl border border-gray-200 bg-white hover:border-gray-400 hover:shadow-md transition-all cursor-pointer text-left overflow-hidden"
    >
      <div className="bg-gray-100 flex items-center justify-center p-4 aspect-square">
        <img
          src={projet.image}
          alt={projet.nom}
          className="max-w-full max-h-full object-contain"
          style={{ imageRendering: 'pixelated' }}
        />
      </div>
      <div className="p-3">
        <p className="text-sm font-semibold text-gray-800">{projet.nom}</p>
        {termine ? (
          <span className="text-[11px] font-medium text-green-600">✓ Terminé</span>
        ) : nbCouleurs > 0 ? (
          <span className="text-[11px] text-gray-400">{nbCouleurs} couleur{nbCouleurs > 1 ? 's' : ''}</span>
        ) : null}
      </div>
    </button>
  )
}
