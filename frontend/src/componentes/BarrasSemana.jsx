import { useMemo, useState } from 'react'
import { soles } from '../util/formato'

const DIAS = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá']
const DIAS_LARGO = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'set', 'oct', 'nov', 'dic']

function inicioDia(fecha) {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate())
}

export default function BarrasSemana({ pedidos, verbo, nombreDe, alAbrir }) {
  const [elegido, setElegido] = useState(6)

  const semana = useMemo(() => {
    const hoy = inicioDia(new Date())
    const dias = Array.from({ length: 7 }, (_, i) => {
      const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - (6 - i))
      const fin = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + 1)
      const delDia = pedidos.filter((p) => {
        const t = new Date(p.fecha).getTime()
        return t >= inicio.getTime() && t < fin.getTime()
      })
      return {
        etiqueta: DIAS[inicio.getDay()],
        nombre: `${DIAS_LARGO[inicio.getDay()]} ${inicio.getDate()} ${MESES[inicio.getMonth()]}`,
        total: delDia.reduce((s, p) => s + p.total, 0),
        pedidos: delDia,
        hoy: i === 6
      }
    })
    return { dias, maximo: Math.max(1, ...dias.map((d) => d.total)), total: dias.reduce((s, d) => s + d.total, 0) }
  }, [pedidos])

  const dia = semana.dias[elegido]

  return (
    <>
      <div className="fila entre">
        <span className="sub">{verbo} en la semana</span>
        <b>{soles(semana.total)}</b>
      </div>
      <div className="barras" role="group" aria-label="Últimos 7 días">
        {semana.dias.map((d, i) => (
          <button
            key={i}
            type="button"
            className={i === elegido ? 'elegida' : ''}
            onClick={() => setElegido(i)}
            aria-pressed={i === elegido}
            aria-label={`${d.nombre}: ${soles(d.total)}`}
          >
            <i className={d.hoy ? 'hoy' : ''} style={{ height: `${Math.max(4, (d.total / semana.maximo) * 100)}%` }} />
            <span>{d.etiqueta}</span>
          </button>
        ))}
      </div>
      <div className="dia-detalle">
        <div className="fila entre">
          <span style={{ textTransform: 'capitalize', fontWeight: 700 }}>{dia.hoy ? 'Hoy' : dia.nombre}</span>
          <b>{soles(dia.total)}</b>
        </div>
        {dia.pedidos.length === 0 ? (
          <span className="mini">Sin pedidos este día.</span>
        ) : (
          dia.pedidos.map((p) => (
            <button key={p.id} type="button" className="dia-fila" onClick={alAbrir ? () => alAbrir(p) : undefined} disabled={!alAbrir}>
              <span>
                <b>#{p.id}</b> {nombreDe(p)}
              </span>
              <span>{soles(p.total)}</span>
            </button>
          ))
        )}
      </div>
    </>
  )
}
