let contexto = null

function obtener() {
  const Audio = window.AudioContext || window.webkitAudioContext
  if (!Audio) return null
  contexto = contexto || new Audio()
  return contexto
}

export function desbloquearSonido() {
  try {
    const c = obtener()
    if (c && c.state === 'suspended') c.resume()
  } catch {
    return
  }
}

export function sonarAviso() {
  try {
    const c = obtener()
    if (!c) return
    const ahora = c.currentTime
    ;[0, 0.18, 0.36].forEach((retraso, i) => {
      const osc = c.createOscillator()
      const vol = c.createGain()
      osc.type = 'sine'
      osc.frequency.value = i === 2 ? 1175 : 880
      vol.gain.setValueAtTime(0.0001, ahora + retraso)
      vol.gain.exponentialRampToValueAtTime(0.35, ahora + retraso + 0.02)
      vol.gain.exponentialRampToValueAtTime(0.0001, ahora + retraso + 0.16)
      osc.connect(vol).connect(c.destination)
      osc.start(ahora + retraso)
      osc.stop(ahora + retraso + 0.18)
    })
  } catch {
    return
  }
  try {
    navigator.vibrate?.([200, 100, 200])
  } catch {
    return
  }
}

export function notificarSistema(titulo, cuerpo) {
  try {
    if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(titulo, { body: cuerpo, icon: '/icono-192.png' })
    }
  } catch {
    return
  }
}

export function pedirPermisoNotificaciones() {
  try {
    if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission().catch(() => {})
  } catch {
    return
  }
}
