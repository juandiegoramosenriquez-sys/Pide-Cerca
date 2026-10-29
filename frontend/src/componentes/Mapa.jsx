import { useEffect } from 'react'
import { Circle, MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

function iconoPuesto(texto, abierto = true) {
  return L.divIcon({
    className: '',
    html: `<div class="pin-puesto ${abierto ? '' : 'cerrado'}"><span>${texto}</span></div>`,
    iconSize: [44, 52],
    iconAnchor: [22, 50],
    popupAnchor: [0, -46]
  })
}

const iconoYo = L.divIcon({
  className: '',
  html: '<div class="pin-yo"></div>',
  iconSize: [22, 22],
  iconAnchor: [11, 11]
})

function Encuadre({ puntos, centro }) {
  const mapa = useMap()
  const clave = JSON.stringify(puntos)
  useEffect(() => {
    if (puntos.length > 1) mapa.fitBounds(L.latLngBounds(puntos), { padding: [40, 40], maxZoom: 16 })
    else if (puntos.length === 1) mapa.setView(puntos[0], Math.max(mapa.getZoom(), 16))
    else if (centro) mapa.setView(centro, 14)
  }, [clave])
  return null
}

export function inicialesPin(nombre = '') {
  return nombre
    .split(' ')
    .filter((p) => p.length > 2)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join('') || nombre.charAt(0).toUpperCase()
}

export default function Mapa({ puestos = [], yo, radio, alto = 320, alElegir }) {
  const conUbicacion = puestos.filter((p) => p.latitud != null && p.longitud != null)
  const puntos = conUbicacion.map((p) => [p.latitud, p.longitud])
  if (yo) puntos.push([yo.lat, yo.lng])
  const centro = yo ? [yo.lat, yo.lng] : puntos[0] || [-12.0464, -77.0428]

  return (
    <div className="mapa" style={{ height: alto }}>
      <MapContainer center={centro} zoom={15} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Encuadre puntos={puntos} centro={centro} />
        {yo && (
          <>
            <Marker position={[yo.lat, yo.lng]} icon={iconoYo} />
            {radio > 0 && <Circle center={[yo.lat, yo.lng]} radius={radio} pathOptions={{ color: '#EA580C', weight: 1, fillOpacity: 0.06 }} />}
          </>
        )}
        {conUbicacion.map((p) => (
          <Marker
            key={p.id}
            position={[p.latitud, p.longitud]}
            icon={iconoPuesto(inicialesPin(p.nombre), p.abierto !== false)}
            eventHandlers={alElegir ? { click: () => alElegir(p) } : undefined}
          >
            {!alElegir && <Popup>{p.nombre}</Popup>}
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}

export function enlaceComoLlegar(lat, lng) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking`
}

export async function buscarZona(texto) {
  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('q', texto + ', Perú')
  url.searchParams.set('format', 'json')
  url.searchParams.set('limit', '1')
  url.searchParams.set('countrycodes', 'pe')
  const respuesta = await fetch(url, { headers: { 'Accept-Language': 'es' } })
  if (!respuesta.ok) throw new Error('No pudimos buscar esa zona. Inténtalo otra vez')
  const lista = await respuesta.json()
  if (!lista.length) throw new Error('No encontramos esa zona. Prueba con otro nombre')
  return { lat: Number(lista[0].lat), lng: Number(lista[0].lon), nombre: lista[0].display_name.split(',').slice(0, 2).join(',') }
}

export function pedirGps() {
  return new Promise((resolver, rechazar) => {
    if (!navigator.geolocation) return rechazar(new Error('Tu navegador no permite usar el GPS'))
    navigator.geolocation.getCurrentPosition(
      (p) => resolver({ lat: p.coords.latitude, lng: p.coords.longitude }),
      (e) =>
        rechazar(
          new Error(
            e.code === 1
              ? 'Diste "No permitir" al GPS. Actívalo tocando el ícono de ubicación junto a la dirección de la página'
              : 'No pudimos obtener tu ubicación. Revisa que el GPS esté encendido'
          )
        ),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    )
  })
}
