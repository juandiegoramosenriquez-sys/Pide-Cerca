import { BILLETERAS } from '../util/metodos'
import { Interruptor } from './Ui'

export const COBROS_INICIAL = { numeros: {}, repetir: {}, nombre: '', efectivo: true }

const limpio = (texto) => (texto || '').replace(/[\s-]/g, '')

export function errorCobros(valor) {
  const distinto = BILLETERAS.find((b) => limpio(valor.numeros[b.codigo]) && limpio(valor.numeros[b.codigo]) !== limpio(valor.repetir?.[b.codigo]))
  return distinto ? `Los dos números de ${distinto.nombre} deben ser iguales` : ''
}

export function desdeRespuesta(respuesta) {
  const numeros = {}
  ;(respuesta.metodos || []).forEach((m) => {
    numeros[m.codigo] = m.numero
  })
  return { numeros, repetir: { ...numeros }, nombre: respuesta.nombreCobro || '', efectivo: respuesta.aceptaEfectivo !== false, verificado: respuesta.verificado === true }
}

export function aSolicitud(valor) {
  return {
    metodos: BILLETERAS.map((b) => ({ codigo: b.codigo, numero: valor.numeros[b.codigo] || '' })).filter((m) => m.numero.trim()),
    nombreCobro: valor.nombre,
    aceptaEfectivo: valor.efectivo
  }
}

export default function CamposCobros({ valor, alCambiar }) {
  const conBilletera = BILLETERAS.some((b) => (valor.numeros[b.codigo] || '').trim())

  return (
    <>
      <div className="fila entre">
        <div>
          <b>Efectivo</b>
          <p className="mini">El cliente te paga al recoger</p>
        </div>
        <Interruptor encendido={valor.efectivo} etiqueta="Aceptar efectivo" alCambiar={() => alCambiar({ ...valor, efectivo: !valor.efectivo })} />
      </div>
      {BILLETERAS.map((b) => (
        <div key={b.codigo} className="campo">
          <label htmlFor={`cobro-${b.codigo}`}>Número de {b.nombre}</label>
          <input
            id={`cobro-${b.codigo}`}
            inputMode="tel"
            autoComplete="off"
            placeholder="9XX XXX XXX"
            value={valor.numeros[b.codigo] || ''}
            onChange={(e) => alCambiar({ ...valor, numeros: { ...valor.numeros, [b.codigo]: e.target.value } })}
          />
          {limpio(valor.numeros[b.codigo]) ? (
            <>
              <label htmlFor={`cobro-repetir-${b.codigo}`} style={{ marginTop: 8 }}>
                Repite el número de {b.nombre}
              </label>
              <input
                id={`cobro-repetir-${b.codigo}`}
                inputMode="tel"
                autoComplete="off"
                placeholder="9XX XXX XXX"
                value={valor.repetir?.[b.codigo] || ''}
                onPaste={(e) => e.preventDefault()}
                onChange={(e) => alCambiar({ ...valor, repetir: { ...valor.repetir, [b.codigo]: e.target.value } })}
              />
              {limpio(valor.repetir?.[b.codigo]) && limpio(valor.repetir?.[b.codigo]) !== limpio(valor.numeros[b.codigo]) ? (
                <span className="ayuda" style={{ color: 'var(--mal)' }}>
                  Los números no coinciden
                </span>
              ) : (
                <span className="ayuda">Escríbelo otra vez, sin copiar y pegar, para evitar errores.</span>
              )}
            </>
          ) : (
            <span className="ayuda">Déjalo vacío si no recibes pagos por {b.nombre}.</span>
          )}
        </div>
      ))}
      {conBilletera && (
        <div className="campo">
          <label htmlFor="cobro-nombre">Tu nombre como sale al pagar</label>
          <input id="cobro-nombre" maxLength={60} value={valor.nombre} onChange={(e) => alCambiar({ ...valor, nombre: e.target.value })} placeholder="Rosa Pérez" />
          <span className="ayuda">Así el cliente comprueba que le paga a la persona correcta.</span>
        </div>
      )}
    </>
  )
}
