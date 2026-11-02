import { Star } from 'lucide-react'

export function Estrellas({ valor, alCambiar, tamano = 28 }) {
  return (
    <div className="estrellas" role={alCambiar ? 'radiogroup' : 'img'} aria-label={`${valor} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((n) =>
        alCambiar ? (
          <button key={n} type="button" role="radio" aria-checked={valor === n} aria-label={`${n} ${n === 1 ? 'estrella' : 'estrellas'}`} onClick={() => alCambiar(n)}>
            <Star size={tamano} fill={n <= valor ? 'currentColor' : 'none'} />
          </button>
        ) : (
          <Star key={n} size={tamano} fill={n <= valor ? 'currentColor' : 'none'} />
        )
      )}
    </div>
  )
}
