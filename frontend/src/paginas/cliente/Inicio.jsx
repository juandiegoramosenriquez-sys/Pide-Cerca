import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Crosshair, List, Loader2, Map as IconoMapa, MapPin, Search } from 'lucide-react'
import { api } from '../../api'
import { Foto } from '../../componentes/Foto'
import Mapa, { buscarZona, pedirGps } from '../../componentes/Mapa'
import { Cargando, Error, Vacio } from '../../componentes/Ui'
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

  return (
    <>
      <h1>¿Qué se te antoja hoy?</h1>

      <div style={{ position: 'relative' }}>
        <Search size={20} style={{ position: 'absolute', left: 14, top: 16, color: 'var(--t3)' }} />
        <input
          className="buscador"
          style={{ paddingLeft: 44 }}
          placeholder="Salchipapa, pollo, anticuchos…"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          aria-label="Buscar puestos"
        />
      </div>

      <section className="tarjeta filtros">
        <div className="fila entre">
          <span className="fila" style={{ gap: 6, fontWeight: 700, minWidth: 0 }}>
            <MapPin size={18} style={{ color: 'var(--acento)', flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{esGps ? 'Cerca de ti' : punto.nombre}</span>
          </span>
          <button className="boton secundario chico" onClick={usarGps} disabled={usandoGps}>
            {usandoGps ? <Loader2 className="giro" size={18} /> : <Crosshair size={18} />}
            {esGps ? 'Actualizar' : 'Mi GPS'}
          </button>
        </div>
        <form onSubmit={buscarPorZona} className="filtros-zona">
          <input className="buscador" placeholder="Otra zona: Miraflores, Av. Grau…" value={zona} onChange={(e) => setZona(e.target.value)} aria-label="Buscar por zona" />
          <button className="boton secundario" disabled={buscandoZona} aria-label="Buscar zona">
            {buscandoZona ? <Loader2 className="giro" size={20} /> : <Search size={20} />}
          </button>
        </form>
        <div className="segmento chico" role="group" aria-label="Distancia">
          {RADIOS.map((r) => (
            <button key={r.valor} type="button" className={radio === r.valor ? 'activo' : ''} aria-pressed={radio === r.valor} onClick={() => cambiarRadio(r.valor)}>
              {r.texto}
            </button>
          ))}
        </div>
      </section>

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

      <div className="resultados-cabecera">
        <h2>{negocios === null ? 'Puestos' : `${visibles.length} ${visibles.length === 1 ? 'puesto' : 'puestos'}`}</h2>
        <div className="segmento chico" role="group" aria-label="Vista">
          <button type="button" className={vista === 'lista' ? 'activo' : ''} aria-pressed={vista === 'lista'} onClick={() => cambiarVista('lista')}>
            <List size={16} />
            Lista
          </button>
          <button type="button" className={vista === 'mapa' ? 'activo' : ''} aria-pressed={vista === 'mapa'} onClick={() => cambiarVista('mapa')}>
            <IconoMapa size={16} />
            Mapa
          </button>
        </div>
      </div>

      <Error>{error}</Error>

      {negocios === null ? (
        <Cargando />
      ) : (
        <>
          {vista === 'mapa' && <Mapa puestos={visibles} yo={punto} radio={radio} alto={380} alElegir={(n) => navegar(`/puesto/${n.id}`)} />}

          {visibles.length === 0 ? (
            <Vacio>{radio ? 'No hay puestos tan cerca. Prueba con una distancia mayor.' : 'No encontramos puestos con esa búsqueda.'}</Vacio>
          ) : (
            <div className="lista">
              {visibles.map((n) => (
                <button key={n.id} className="tarjeta tocable fila" style={{ gap: 14 }} onClick={() => navegar(`/puesto/${n.id}`)}>
                  <Foto src={n.imagen} tamano={64} texto={iniciales(n.nombre)} />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.nombre}</h3>
                    <span className="sub" style={{ display: 'block' }}>
                      {[n.tipoComida, n.tiempoEstimado ? `${n.tiempoEstimado} min` : null].filter(Boolean).join(' · ')}
                    </span>
                    {n.ubicacionEnVivo && n.abierto ? (
                      <span className="en-vivo">En vivo</span>
                    ) : (
                      n.direccion && <span className="mini" style={{ display: 'block' }}>{n.direccion}</span>
                    )}
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
      )}
    </>
  )
}
