import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, Crosshair, List, Loader2, Map as IconoMapa, MapPin, Search, X } from 'lucide-react'
import { api } from '../../api'
import { Foto } from '../../componentes/Foto'
import Mapa, { buscarZona, pedirGps } from '../../componentes/Mapa'
import { Cargando, Error, Modal, Vacio } from '../../componentes/Ui'
import { distancia, iniciales } from '../../util/formato'

const CENTRO_LIMA = { lat: -12.0464, lng: -77.0428, nombre: 'Centro de Lima' }

const RADIOS = [
  { valor: 500, texto: '500 m' },
  { valor: 1000, texto: '1 km' },
  { valor: 3000, texto: '3 km' },
  { valor: 0, texto: 'Todos' }
]

function leerPreferencia(clave, porDefecto) {
  try {
    return JSON.parse(localStorage.getItem(clave)) ?? porDefecto
  } catch {
    return porDefecto
  }
}

function guardarPreferencia(clave, valor) {
  try {
    localStorage.setItem(clave, JSON.stringify(valor))
  } catch {
    return
  }
}

export default function Inicio() {
  const navegar = useNavigate()
  const [negocios, setNegocios] = useState(null)
  const [error, setError] = useState('')
  const [texto, setTexto] = useState('')
  const [tipo, setTipo] = useState('')
  const [punto, setPunto] = useState(() => leerPreferencia('pidecerca_punto', CENTRO_LIMA))
  const [radio, setRadio] = useState(() => leerPreferencia('pidecerca_radio', 0))
  const [vista, setVista] = useState(() => leerPreferencia('pidecerca_vista', 'lista'))
  const [zona, setZona] = useState('')
  const [buscandoZona, setBuscandoZona] = useState(false)
  const [usandoGps, setUsandoGps] = useState(false)
  const [buscando, setBuscando] = useState(false)
  const [verCerrados, setVerCerrados] = useState(false)

  useEffect(() => {
    if (punto.nombre !== 'Mi ubicación') return
    pedirGps()
      .then((u) => elegirPunto({ ...u, nombre: 'Mi ubicación' }))
      .catch(() => {})
  }, [])

  function elegirPunto(nuevo) {
    setPunto(nuevo)
    guardarPreferencia('pidecerca_punto', nuevo)
  }

  async function usarGps() {
    setError('')
    setUsandoGps(true)
    try {
      const u = await pedirGps()
      elegirPunto({ ...u, nombre: 'Mi ubicación' })
      if (!radio) cambiarRadio(1000)
    } catch (e) {
      setError(e.message)
    } finally {
      setUsandoGps(false)
    }
  }

  async function buscarPorZona(e) {
    e.preventDefault()
    if (!zona.trim()) return
    setError('')
    setBuscandoZona(true)
    try {
      elegirPunto(await buscarZona(zona.trim()))
      setZona('')
      if (!radio) cambiarRadio(3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setBuscandoZona(false)
    }
  }

  function cambiarRadio(valor) {
    setRadio(valor)
    guardarPreferencia('pidecerca_radio', valor)
  }

  function cambiarVista(valor) {
    setVista(valor)
    guardarPreferencia('pidecerca_vista', valor)
  }

  useEffect(() => {
    let vigente = true
    const espera = setTimeout(async () => {
      try {
        const lista = await api('/negocios', { consulta: { q: texto.trim(), lat: punto.lat, lng: punto.lng, radio: radio || undefined } })
        if (!vigente) return
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
  }, [texto, punto, radio])

  useEffect(() => {
    const intervalo = setInterval(() => {
      api('/negocios', { consulta: { q: texto.trim(), lat: punto.lat, lng: punto.lng, radio: radio || undefined } })
        .then(setNegocios)
        .catch(() => {})
    }, 20000)
    return () => clearInterval(intervalo)
  }, [texto, punto, radio])

  const tipos = useMemo(() => [...new Set((negocios || []).map((n) => n.tipoComida).filter(Boolean))], [negocios])
  const visibles = (negocios || []).filter((n) => !tipo || n.tipoComida === tipo).sort((a, b) => Number(Boolean(b.abierto)) - Number(Boolean(a.abierto)))
  const esGps = punto.nombre === 'Mi ubicación'
  const abiertos = visibles.filter((n) => n.abierto)
  const cerrados = visibles.filter((n) => !n.abierto)
  const mostrarCerrados = verCerrados || abiertos.length === 0
  const textoRadio = RADIOS.find((r) => r.valor === radio)?.texto
  const lugar = `${esGps ? 'Cerca de ti' : punto.nombre}${radio ? ' · ' + textoRadio : ''}`

  return (
    <>
      <h1>¿Qué se te antoja hoy?</h1>

      <div className="busqueda-compacta">
        <button type="button" className="busqueda-boton" onClick={() => setBuscando(true)}>
          <Search size={20} />
          <span className="busqueda-boton-texto">
            <b>{texto || 'Buscar comida o zona'}</b>
            <small>
              <MapPin size={13} />
              {lugar}
            </small>
          </span>
        </button>
        {texto && (
          <button type="button" className="boton-icono" onClick={() => setTexto('')} aria-label="Quitar búsqueda">
            <X size={20} />
          </button>
        )}
        <button
          type="button"
          className="boton-icono"
          onClick={() => cambiarVista(vista === 'lista' ? 'mapa' : 'lista')}
          aria-label={vista === 'lista' ? 'Ver en el mapa' : 'Ver en lista'}
        >
          {vista === 'lista' ? <IconoMapa size={20} /> : <List size={20} />}
        </button>
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
      ) : (
        <>
          {vista === 'mapa' && (
            <div className="mapa-borde">
              <Mapa puestos={visibles} yo={punto} radio={radio} alto={360} alElegir={(n) => navegar(`/puesto/${n.id}`)} />
            </div>
          )}

          {visibles.length === 0 ? (
            <Vacio>{radio ? 'No hay puestos tan cerca. Prueba con una distancia mayor.' : 'No encontramos puestos con esa búsqueda.'}</Vacio>
          ) : (
            <>
              <section className="columna" style={{ gap: 10 }}>
                <div className="seccion-titulo">
                  <h2 className="fila" style={{ gap: 8 }}>
                    <span className="punto-vivo" />
                    Abiertos ahora
                  </h2>
                  <span>{abiertos.length}</span>
                </div>
                {abiertos.length === 0 ? (
                  <Vacio>Ningún puesto abierto ahora por aquí.</Vacio>
                ) : (
                  <div className="lista">
                    {abiertos.map((n) => (
                      <TarjetaPuesto key={n.id} negocio={n} alElegir={() => navegar(`/puesto/${n.id}`)} />
                    ))}
                  </div>
                )}
              </section>

              {cerrados.length > 0 && (
                <section className="columna" style={{ gap: 10 }}>
                  <button type="button" className="seccion-plegable" onClick={() => setVerCerrados(!verCerrados)} aria-expanded={mostrarCerrados}>
                    <h2>Cerrados</h2>
                    <span className="fila" style={{ gap: 6 }}>
                      {cerrados.length}
                      <ChevronDown size={20} style={{ transform: mostrarCerrados ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
                    </span>
                  </button>
                  {mostrarCerrados && (
                    <div className="lista cerrados">
                      {cerrados.map((n) => (
                        <TarjetaPuesto key={n.id} negocio={n} alElegir={() => navegar(`/puesto/${n.id}`)} />
                      ))}
                    </div>
                  )}
                </section>
              )}
            </>
          )}
        </>
      )}

      {buscando && (
        <Modal titulo="Buscar" alCerrar={() => setBuscando(false)}>
          <form
            className="columna"
            style={{ gap: 14 }}
            onSubmit={(e) => {
              e.preventDefault()
              setBuscando(false)
            }}
          >
            <div style={{ position: 'relative' }}>
              <Search size={20} style={{ position: 'absolute', left: 14, top: 16, color: 'var(--t3)' }} />
              <input
                className="buscador"
                style={{ paddingLeft: 44 }}
                placeholder="Salchipapa, pollo, anticuchos…"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                aria-label="Buscar comida o puesto"
                autoFocus
              />
            </div>
          </form>

          <div className="columna" style={{ gap: 8 }}>
            <span className="mini" style={{ fontWeight: 700 }}>Dónde</span>
            <button type="button" className="boton secundario ancho" onClick={usarGps} disabled={usandoGps}>
              {usandoGps ? <Loader2 className="giro" size={20} /> : <Crosshair size={20} />}
              {esGps ? 'Cerca de ti · actualizar' : 'Usar mi ubicación'}
            </button>
            <form onSubmit={buscarPorZona} className="filtros-zona">
              <input className="buscador" placeholder="Otra zona: Miraflores, Av. Grau…" value={zona} onChange={(e) => setZona(e.target.value)} aria-label="Buscar por zona" />
              <button className="boton secundario" disabled={buscandoZona} aria-label="Buscar zona">
                {buscandoZona ? <Loader2 className="giro" size={20} /> : <MapPin size={20} />}
              </button>
            </form>
            {!esGps && <span className="mini">Buscando cerca de: {punto.nombre}</span>}
          </div>

          <div className="columna" style={{ gap: 8 }}>
            <span className="mini" style={{ fontWeight: 700 }}>Distancia</span>
            <div className="segmento chico" role="group" aria-label="Distancia">
              {RADIOS.map((r) => (
                <button key={r.valor} type="button" className={radio === r.valor ? 'activo' : ''} aria-pressed={radio === r.valor} onClick={() => cambiarRadio(r.valor)}>
                  {r.texto}
                </button>
              ))}
            </div>
          </div>

          <Error>{error}</Error>

          <button type="button" className="boton principal ancho" onClick={() => setBuscando(false)}>
            {abiertos.length ? `Ver ${abiertos.length} ${abiertos.length === 1 ? 'abierto' : 'abiertos'}` : 'Ver resultados'}
          </button>
        </Modal>
      )}
    </>
  )
}

function TarjetaPuesto({ negocio: n, alElegir }) {
  return (
    <button className="tarjeta tocable fila" style={{ gap: 14 }} onClick={alElegir}>
      <Foto src={n.imagen} tamano={60} texto={iniciales(n.nombre)} />
      <span style={{ flex: 1, minWidth: 0 }}>
        <h3 style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.nombre}</h3>
        <span className="sub" style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {[n.tipoComida, n.tiempoEstimado ? `${n.tiempoEstimado} min` : null].filter(Boolean).join(' · ')}
        </span>
        {n.ubicacionEnVivo && n.abierto ? (
          <span className="en-vivo">En vivo</span>
        ) : (
          n.direccion && (
            <span className="mini" style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {n.direccion}
            </span>
          )
        )}
      </span>
      {distancia(n.distanciaMetros) && <span className="precio">{distancia(n.distanciaMetros)}</span>}
    </button>
  )
}
