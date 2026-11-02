function inicioDia(fecha) {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()).getTime()
}

export function esDeHoy(valor) {
  return inicioDia(new Date(valor)) === inicioDia(new Date())
}
