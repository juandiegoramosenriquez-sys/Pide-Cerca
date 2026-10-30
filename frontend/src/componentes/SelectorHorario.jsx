import { diasTexto, horaLarga, horarioError, horarioTexto } from '../util/formato'

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
      <SelectorHora etiqueta="Abre" valor={valor.horaApertura} alCambiar={(v) => cambiar({ horaApertura: v })} />
      <SelectorHora etiqueta="Cierra" valor={valor.horaCierre} alCambiar={(v) => cambiar({ horaCierre: v })} />
      {horarioError(valor) ? (
        <div className="horario-resumen error">{horarioError(valor)}</div>
      ) : (
        <div className="horario-resumen">
          {diasTexto(valor.diasAtencion)}
          <small>
            De {horaLarga(valor.horaApertura)} a {horaLarga(valor.horaCierre)}
            {valor.horaCierre < valor.horaApertura ? ' del día siguiente' : ''}
          </small>
        </div>
      )}
    </div>
  )
}

const HORAS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
const MINUTOS = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55']

function SelectorHora({ etiqueta, valor, alCambiar }) {
  const [h24, minutos] = (valor || '00:00').split(':')
  const hora = Number(h24) % 12 === 0 ? 12 : Number(h24) % 12
  const periodo = Number(h24) < 12 ? 'am' : 'pm'
  const opcionesMin = MINUTOS.includes(minutos) ? MINUTOS : [...MINUTOS, minutos].sort()
  const armar = (h, m, p) => {
    const base = h % 12
    alCambiar(`${String(p === 'pm' ? base + 12 : base).padStart(2, '0')}:${m}`)
  }
  const id = 'hora-' + etiqueta

  return (
    <div className="campo">
      <label htmlFor={id}>
        {etiqueta} <span className="hora-momento">{momentoDelDia(valor)}</span>
      </label>
      <div className="hora-fila">
        <select id={id} value={hora} onChange={(e) => armar(Number(e.target.value), minutos, periodo)} aria-label={`${etiqueta}: hora`}>
          {HORAS.map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>
        <b>:</b>
        <select value={minutos} onChange={(e) => armar(hora, e.target.value, periodo)} aria-label={`${etiqueta}: minutos`}>
          {opcionesMin.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <div className="segmento chico" role="group" aria-label={`${etiqueta}: am o pm`}>
          {['am', 'pm'].map((p) => (
            <button key={p} type="button" className={periodo === p ? 'activo' : ''} aria-pressed={periodo === p} onClick={() => armar(hora, minutos, p)}>
              {p}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function momentoDelDia(valor) {
  const h = Number((valor || '0').split(':')[0])
  if (h >= 5 && h < 12) return 'de la mañana'
  if (h >= 12 && h < 19) return 'de la tarde'
  if (h >= 19) return 'de la noche'
  return 'de la madrugada'
}
