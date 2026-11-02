import { RANGOS } from '../util/dias'

export default function SelectorDia({ rango, alCambiar, contar, etiqueta }) {
  return (
    <div className="segmento" role="tablist" aria-label={etiqueta}>
      {RANGOS.map((r) => (
        <button key={r.clave} type="button" role="tab" aria-selected={rango === r.clave} className={rango === r.clave ? 'activo' : ''} onClick={() => alCambiar(r.clave)}>
          {r.texto} · {contar(r.clave)}
        </button>
      ))}
    </div>
  )
}
