import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, RefreshCw, Search } from 'lucide-react'
import { api } from '../../api'
import { Cargando, Error, Vacio } from '../../componentes/Ui'
import { distancia, iniciales } from '../../util/formato'

const CENTRO_LIMA = { lat: -12.0464, lng: -77.0428 }

function obtenerUbicacion() {
  return new Promise((resolver) => {
    if (!navigator.geolocation) return resolver(null)
    navigator.geolocation.getCurrentPosition(
      (p) => resolver({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => resolver(null),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
    )
  })
}

export default function Inicio() {
  const navegar = useNavigate()
  const [negocios, setNegocios] = useState(null)
  const [error, setError] = useState('')
  const [texto, setTexto] = useState('')
  const [tipo, setTipo] = useState('')
  const [ubicacion, setUbicacion] = useState(null)
  const [lejos, setLejos] = useState(false)
  const [recargar, setRecargar] = useState(0)

  useEffect(() => {
    obtenerUbicacion().then((u) => setUbicacion(u || false))
  }, [recargar])

  useEffect(() => {
    if (ubicacion === null) return
    let vigente = true
    const espera = setTimeout(async () => {
      try {
        const punto = ubicacion || CENTRO_LIMA
        let lista = await api('/negocios', { consulta: { q: texto.trim(), lat: punto.lat, lng: punto.lng } })
        const minimo = Math.min(...lista.map((n) => n.distanciaMetros ?? Infinity))
        const estaLejos = Boolean(ubicacion) && lista.length > 0 && minimo > 100000
        if (estaLejos) lista = await api('/negocios', { consulta: { q: texto.trim(), lat: CENTRO_LIMA.lat, lng: CENTRO_LIMA.lng } })
        if (!vigente) return
        setLejos(estaLejos)
        setNegocios(lista)
        setError('')
      } catch (e) {
        if (vigente) setError(e.message)
      }
    }, texto ? 350 : 0)
    return () => {
      vigente = false
      clearTimeout(espera)
    }
  }, [texto, ubicacion, recargar])

  const tipos = useMemo(() => [...new Set((negocios || []).map((n) => n.tipoComida).filter(Boolean))], [negocios])
  const visibles = (negocios || []).filter((n) => !tipo || n.tipoComida === tipo)

  const textoUbicacion = lejos
    ? 'Estás lejos: distancias desde el centro de Lima'
    : ubicacion
      ? 'Cerca de ti'
      : 'Ubicación aproximada: centro de Lima'

  return (
    <>
      <div className="fila entre">
        <div>
          <h1>¿Qué se te antoja hoy?</h1>
          <p className="sub fila" style={{ gap: 6 }}>
            <MapPin size={16} />
            {textoUbicacion}
          </p>
        </div>
        <button className="boton-icono" onClick={() => setRecargar((r) => r + 1)} aria-label="Actualizar">
          <RefreshCw size={20} />
        </button>
      </div>

      <div style={{ position: 'relative' }}>
        <Search size={20} style={{ position: 'absolute', left: 14, top: 16, color: 'var(--t3)' }} />
        <input
          className="buscador"
          style={{ paddingLeft: 44 }}
          placeholder="Buscar salchipapa, pollo, anticuchos…"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          aria-label="Buscar puestos"
        />
      </div>

      {tipos.length > 1 && (
        <div className="chips">
          <button className={'chip' + (!tipo ? ' activo' : '')} onClick={() => setTipo('')}>
            Todo
          </button>
          {tipos.map((t) => (
            <button key={t} className={'chip' + (tipo === t ? ' activo' : '')} onClick={() => setTipo(tipo === t ? '' : t)}>
              {t}
            </button>
          ))}
        </div>
      )}

      <Error>{error}</Error>

      {negocios === null ? (
        <Cargando />
      ) : visibles.length === 0 ? (
        <Vacio>No encontramos puestos con esa búsqueda. Prueba con otra palabra.</Vacio>
      ) : (
        <div className="lista">
          {visibles.map((n) => (
            <button key={n.id} className="tarjeta tocable fila" style={{ gap: 14 }} onClick={() => navegar(`/puesto/${n.id}`)}>
              <span className="inicial">{n.imagen ? <img src={n.imagen} alt="" /> : iniciales(n.nombre)}</span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.nombre}</h3>
                <span className="sub" style={{ display: 'block' }}>
                  {[n.tipoComida, n.tiempoEstimado ? `${n.tiempoEstimado} min` : null].filter(Boolean).join(' · ')}
                </span>
                {n.direccion && <span className="mini" style={{ display: 'block' }}>{n.direccion}</span>}
              </span>
              <span className="columna" style={{ alignItems: 'flex-end', gap: 6 }}>
                {distancia(n.distanciaMetros) && <span className="precio">{distancia(n.distanciaMetros)}</span>}
                <span className={'estado ' + (n.abierto ? 'ok' : 'ent')}>{n.abierto ? 'Abierto' : 'Cerrado'}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </>
  )
}
