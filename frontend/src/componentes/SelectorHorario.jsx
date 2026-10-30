import { horarioTexto } from '../util/formato'

const DIAS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
const NOMBRES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

const RAPIDOS = [
  { texto: 'Lun a Vie', dias: '1111100' },
  { texto: 'Lun a Sáb', dias: '1111110' },
  { texto: 'Todos', dias: '1111111' }
]

export const HORARIO_INICIAL = { diasAtencion: '1111110', horaApertura: '17:00', horaCierre: '23:00' }

export function horarioDe(negocio) {
  return {
    diasAtencion: negocio?.diasAtencion || HORARIO_INICIAL.diasAtencion,
    horaApertura: negocio?.horaApertura || HORARIO_INICIAL.horaApertura,
    horaCierre: negocio?.horaCierre || HORARIO_INICIAL.horaCierre
  }
}

export default function SelectorHorario({ valor, alCambiar }) {
  const dias = valor.diasAtencion.split('')
  const cambiar = (cambio) => {
    const nuevo = { ...valor, ...cambio }
    alCambiar({ ...nuevo, horario: horarioTexto(nuevo) })
  }
  const alternarDia = (i) => {
    const copia = [...dias]
    copia[i] = copia[i] === '1' ? '0' : '1'
    cambiar({ diasAtencion: copia.join('') })
  }

  return (
    <div className="horario">
      <div className="horario-dias" role="group" aria-label="Días de atención">
        {DIAS.map((d, i) => (
          <button
            key={i}
            type="button"
            className={dias[i] === '1' ? 'activo' : ''}
            aria-pressed={dias[i] === '1'}
            aria-label={NOMBRES[i]}
            onClick={() => alternarDia(i)}
          >
            {d}
          </button>
        ))}
      </div>
      <div className="chips">
        {RAPIDOS.map((r) => (
          <button key={r.dias} type="button" className={'chip' + (valor.diasAtencion === r.dias ? ' activo' : '')} onClick={() => cambiar({ diasAtencion: r.dias })}>
            {r.texto}
          </button>
        ))}
      </div>
      <div className="dos" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
        <div className="campo">
          <label htmlFor="h-abre">Abre</label>
          <input id="h-abre" type="time" value={valor.horaApertura} onChange={(e) => e.target.value && cambiar({ horaApertura: e.target.value })} />
        </div>
        <div className="campo">
          <label htmlFor="h-cierra">Cierra</label>
          <input id="h-cierra" type="time" value={valor.horaCierre} onChange={(e) => e.target.value && cambiar({ horaCierre: e.target.value })} />
        </div>
      </div>
      <div className="horario-resumen">{horarioTexto(valor) || 'Elige al menos un día'}</div>
    </div>
  )
}
