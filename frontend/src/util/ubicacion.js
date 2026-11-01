export const AVISO_METROS = 3000
export const LIMITE_METROS = 5000

export function puntoGuardado() {
  try {
    const p = JSON.parse(localStorage.getItem('pidecerca_punto'))
    return p && p.nombre === 'Mi ubicación' ? p : null
  } catch {
    return null
  }
}

function metrosEntre(lat1, lon1, lat2, lon2) {
  const rad = Math.PI / 180
  const a =
    Math.sin(((lat2 - lat1) * rad) / 2) ** 2 +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(((lon2 - lon1) * rad) / 2) ** 2
  return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function metrosAlPuesto(negocio) {
  const yo = puntoGuardado()
  if (!yo || negocio?.latitud == null || negocio?.longitud == null) return null
  return metrosEntre(yo.lat, yo.lng, negocio.latitud, negocio.longitud)
}

export function aPie(metros) {
  const minutos = Math.max(1, Math.round(metros / 83))
  if (minutos < 60) return `${minutos} min`
  const horas = Math.floor(minutos / 60)
  const resto = minutos % 60
  return resto ? `${horas} h ${resto} min` : `${horas} h`
}
