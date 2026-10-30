export const ESTADOS = {
  PENDIENTE: { texto: 'Recibido', clase: 'rec' },
  ACEPTADO: { texto: 'En proceso', clase: 'pro' },
  EN_PREPARACION: { texto: 'En proceso', clase: 'pro' },
  LISTO_PARA_RECOGER: { texto: 'Listo', clase: 'ok' },
  RECOGIDO: { texto: 'Entregado', clase: 'ent' },
  CANCELADO: { texto: 'Cancelado', clase: 'can' }
}

export const METODOS = {
  YAPE: 'Yape',
  PLIN: 'Plin',
  TARJETA: 'Tarjeta',
  EFECTIVO: 'Efectivo'
}

export function soles(valor) {
  return 'S/ ' + Number(valor || 0).toFixed(2)
}

export function haceCuanto(valor, ahora = Date.now()) {
  if (!valor) return ''
  const minutos = Math.max(0, Math.floor((ahora - new Date(valor).getTime()) / 60000))
  if (minutos < 1) return 'ahora'
  if (minutos < 60) return `hace ${minutos} min`
  const horas = Math.floor(minutos / 60)
  if (horas < 24) return `hace ${horas} h`
  const dias = Math.floor(horas / 24)
  return dias === 1 ? 'ayer' : `hace ${dias} días`
}

export function fechaCorta(valor) {
  if (!valor) return ''
  const f = new Date(valor)
  return f.toLocaleDateString('es-PE', { day: 'numeric', month: 'short' }) + ' · ' + f.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
}

export function minutosRestantes(pedido, ahora = Date.now()) {
  const inicio = pedido.fechaAceptado || pedido.fecha
  if (!inicio || !pedido.tiempoPreparacion) return null
  return Math.ceil((new Date(inicio).getTime() + pedido.tiempoPreparacion * 60000 - ahora) / 60000)
}

export function avance(pedido, ahora = Date.now()) {
  const inicio = pedido.fechaAceptado || pedido.fecha
  if (!inicio || !pedido.tiempoPreparacion) return 0
  return Math.min(1, Math.max(0, (ahora - new Date(inicio).getTime()) / (pedido.tiempoPreparacion * 60000)))
}

export function distancia(metros) {
  if (metros === null || metros === undefined) return null
  return metros < 1000 ? `${Math.round(metros)} m` : `${(metros / 1000).toFixed(1)} km`
}

export function iniciales(texto = '') {
  return texto
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join('')
}

export function nombreCorto(usuario) {
  if (!usuario) return 'Cliente'
  return [usuario.nombre, usuario.apellido ? usuario.apellido.charAt(0) + '.' : ''].filter(Boolean).join(' ')
}

export function esActivo(estado) {
  return ['PENDIENTE', 'ACEPTADO', 'EN_PREPARACION', 'LISTO_PARA_RECOGER'].includes(estado)
}

export function fechaLarga(valor) {
  if (!valor) return ''
  return new Date(valor).toLocaleDateString('es-PE', { day: 'numeric', month: 'long' })
}

export function cuentaRegresiva(limite, ahora = Date.now()) {
  if (!limite) return null
  const segundos = Math.max(0, Math.ceil((new Date(limite).getTime() - ahora) / 1000))
  return { segundos, texto: `${Math.floor(segundos / 60)}:${String(segundos % 60).padStart(2, '0')}` }
}

export function cuando(valor, ahora = new Date()) {
  if (!valor) return ''
  const f = new Date(valor)
  const hora = f.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false })
  const dia = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const diferencia = Math.round((dia(ahora) - dia(f)) / 86400000)
  if (diferencia === 0) return `Hoy · ${hora}`
  if (diferencia === 1) return `Ayer · ${hora}`
  return `${f.toLocaleDateString('es-PE', { day: 'numeric', month: 'short' }).replace('.', '')} · ${hora}`
}

const DIAS_CORTOS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

export function hora12(valor) {
  if (!valor) return ''
  const [h, m] = valor.split(':').map(Number)
  const sufijo = h < 12 ? 'am' : 'pm'
  const hora = h % 12 === 0 ? 12 : h % 12
  return m ? `${hora}:${String(m).padStart(2, '0')} ${sufijo}` : `${hora} ${sufijo}`
}

export function diasTexto(dias) {
  if (!dias || !dias.includes('1')) return ''
  if (dias === '1111111') return 'Todos los días'
  const activos = dias.split('').map((d, i) => (d === '1' ? i : -1)).filter((i) => i >= 0)
  const seguidos = activos.every((d, i) => i === 0 || d === activos[i - 1] + 1)
  if (seguidos && activos.length > 2) return `${DIAS_CORTOS[activos[0]]} a ${DIAS_CORTOS[activos[activos.length - 1]]}`
  return activos.map((i) => DIAS_CORTOS[i]).join(', ')
}

export function horarioTexto(negocio) {
  if (!negocio?.diasAtencion) return negocio?.horario || ''
  const dias = diasTexto(negocio.diasAtencion)
  if (!dias) return ''
  return `${dias} · ${hora12(negocio.horaApertura)} a ${hora12(negocio.horaCierre)}`
}

export function horarioError(valor) {
  if (!valor?.diasAtencion) return ''
  if (!valor.diasAtencion.includes('1')) return 'Elige al menos un día'
  if (!valor.horaApertura || !valor.horaCierre) return 'Elige la hora en que abres y cierras'
  if (valor.horaApertura === valor.horaCierre) return 'La hora de cierre tiene que ser distinta a la de apertura'
  return ''
}
