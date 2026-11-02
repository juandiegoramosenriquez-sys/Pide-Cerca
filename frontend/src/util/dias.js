export const RANGOS = [
  { clave: 'hoy', texto: 'Hoy', dias: 0 },
  { clave: 'ayer', texto: 'Ayer', dias: 1 },
  { clave: 'antes', texto: 'Antes', dias: null }
]

function inicioDia(fecha) {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()).getTime()
}

export function diasAtras(valor) {
  return Math.round((inicioDia(new Date()) - inicioDia(new Date(valor))) / 86400000)
}

export function enRango(rango, valor) {
  const dias = RANGOS.find((r) => r.clave === rango).dias
  return dias === null || diasAtras(valor) === dias
}
