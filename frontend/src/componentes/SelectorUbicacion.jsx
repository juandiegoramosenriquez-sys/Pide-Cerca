import { useEffect, useState } from 'react'
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { Crosshair, Loader2, Search } from 'lucide-react'
import 'leaflet/dist/leaflet.css'
import { buscarZona, pedirGps } from './Mapa'

const CENTRO_LIMA = [-12.0464, -77.0428]

const icono = L.divIcon({
  className: '',
  html: '<div class="pin-puesto"><span>Aquí</span></div>',
  iconSize: [44, 52],
  iconAnchor: [22, 50]
})

async function direccionDe(lat, lng) {
  try {
    const url = new URL('https://nominatim.openstreetmap.org/reverse')
    url.searchParams.set('lat', lat)
    url.searchParams.set('lon', lng)
    url.searchParams.set('format', 'json')
    url.searchParams.set('zoom', '18')
    const r = await fetch(url, { headers: { 'Accept-Language': 'es' } })
    if (!r.ok) return ''
    const d = await r.json()
    const a = d.address || {}
    const calle = [a.road || a.pedestrian || a.footway, a.house_number].filter(Boolean).join(' ')
    const zona = a.suburb || a.neighbourhood || a.quarter || a.city_district || a.district
    const ciudad = a.city || a.town || a.village
    return [calle, zona, ciudad].filter(Boolean).join(', ') || d.display_name || ''
  } catch {
    return ''
  }
}

function AlTocar({ alElegir }) {
  useMapEvents({ click: (e) => alElegir(e.latlng.lat, e.latlng.lng) })
  return null
}

function Seguir({ punto }) {
  const mapa = useMap()
  useEffect(() => {
    if (punto) mapa.setView(punto, Math.max(mapa.getZoom(), 17))
  }, [punto?.[0], punto?.[1]])
  return null
}

export default function SelectorUbicacion({ latitud, longitud, alCambiar }) {
  const [buscar, setBuscar] = useState('')
  const [ocupado, setOcupado] = useState('')
  const [error, setError] = useState('')
  const punto = latitud !== '' && latitud != null && longitud !== '' && longitud != null ? [Number(latitud), Number(longitud)] : null

  async function elegir(lat, lng) {
    const fijo = { latitud: Number(lat.toFixed(6)), longitud: Number(lng.toFixed(6)) }
    alCambiar(fijo)
    const direccion = await direccionDe(fijo.latitud, fijo.longitud)
    if (direccion) alCambiar({ ...fijo, direccion })
  }

  async function usarGps() {
    setError('')
    setOcupado('gps')
    try {
      const u = await pedirGps()
      await elegir(u.lat, u.lng)
    } catch (e) {
      setError(e.message)
    } finally {
      setOcupado('')
    }
  }

  async function irA(e) {
    e.preventDefault()
    if (!buscar.trim()) return
    setError('')
    setOcupado('buscar')
    try {
      const z = await buscarZona(buscar.trim())
      await elegir(z.lat, z.lng)
      setBuscar('')
    } catch (err) {
      setError(err.message)
    } finally {
      setOcupado('')
    }
  }

  return (
    <div className="columna" style={{ gap: 10 }}>
      <button type="button" className="boton principal ancho" onClick={usarGps} disabled={ocupado === 'gps'}>
        {ocupado === 'gps' ? <Loader2 className="giro" size={20} /> : <Crosshair size={20} />}
        Usar mi ubicación actual
      </button>

      <div className="fila" style={{ gap: 8 }}>
        <input
          className="buscador"
          placeholder="Buscar dirección"
          value={buscar}
          onChange={(e) => setBuscar(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && irA(e)}
          aria-label="Buscar dirección en el mapa"
        />
        <button type="button" className="boton secundario" onClick={irA} disabled={ocupado === 'buscar'} aria-label="Buscar en el mapa">
          {ocupado === 'buscar' ? <Loader2 className="giro" size={20} /> : <Search size={20} />}
        </button>
      </div>

      <div className="mapa" style={{ height: 260 }}>
        <MapContainer center={punto || CENTRO_LIMA} zoom={punto ? 17 : 13} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <AlTocar alElegir={elegir} />
          <Seguir punto={punto} />
          {punto && (
            <Marker
              position={punto}
              icon={icono}
              draggable
              eventHandlers={{
                dragend: (e) => {
                  const p = e.target.getLatLng()
                  elegir(p.lat, p.lng)
                }
              }}
            />
          )}
        </MapContainer>
      </div>

      <p className="mini">
        {punto ? 'Arrastra el pin si no está exacto.' : 'Toca el mapa donde está tu puesto.'}
      </p>
      {error && <div className="aviso error">{error}</div>}
    </div>
  )
}
