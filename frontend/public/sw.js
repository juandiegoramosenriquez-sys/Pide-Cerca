const CACHE = 'pidecerca-v1'
const BASE = ['/', '/manifest.webmanifest', '/icono-192.png', '/icono-512.png']

self.addEventListener('install', (evento) => {
  evento.waitUntil(caches.open(CACHE).then((c) => c.addAll(BASE)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches.keys().then((claves) => Promise.all(claves.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (evento) => {
  const peticion = evento.request
  if (peticion.method !== 'GET' || new URL(peticion.url).origin !== self.location.origin) return
  evento.respondWith(
    fetch(peticion)
      .then((respuesta) => {
        const copia = respuesta.clone()
        caches.open(CACHE).then((c) => c.put(peticion, copia))
        return respuesta
      })
      .catch(() => caches.match(peticion).then((r) => r || caches.match('/')))
  )
})
