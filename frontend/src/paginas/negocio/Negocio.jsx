import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart3, BellRing, ClipboardList, Clock, LogOut, Store, UtensilsCrossed } from 'lucide-react'
import { api } from '../../api'
import { useAviso } from '../../contexto/Aviso'
import { useSesion } from '../../contexto/Sesion'
import { useRolVisual } from '../../contexto/Tema'
import { Barra, Marco } from '../../componentes/Marco'
import { Cargando } from '../../componentes/Ui'
import { notificarSistema, sonarAviso } from '../../util/sonido'

const NegocioContexto = createContext(null)

export function useNegocio() {
  return useContext(NegocioContexto)
}

function EnRevision({ negocio }) {
  useRolVisual('negocio')
  const { salir } = useSesion()
  const rechazado = negocio.estadoAprobacion === 'RECHAZADO'
  return (
    <div className="app">
      <Barra titulo={negocio.nombre} sub="Mi puesto" />
      <main className="contenido angosto">
        <section className="destacada columna" style={{ alignItems: 'center', textAlign: 'center', gap: 10 }}>
          <Clock size={44} />
          <h1>{rechazado ? 'Tu solicitud no fue aprobada' : 'Estamos revisando tu puesto'}</h1>
          <p style={{ opacity: 0.92 }}>
            {rechazado
              ? `Motivo: ${negocio.motivoRechazo}`
              : 'Te avisaremos aquí cuando tu puesto esté aprobado.'}
          </p>
        </section>
        <section className="tarjeta columna" style={{ gap: 6 }}>
          <h2>Datos enviados</h2>
          <p>{negocio.nombre}</p>
          {negocio.tipoComida && <p className="sub">{negocio.tipoComida}</p>}
          {negocio.direccion && <p className="sub">{negocio.direccion}</p>}
          {negocio.horario && <p className="sub">{negocio.horario}</p>}
        </section>
        <button className="boton secundario" onClick={() => window.location.reload()}>
          Volver a revisar
        </button>
        <button className="boton peligro" onClick={salir}>
          <LogOut size={20} />
          Cerrar sesión
        </button>
      </main>
    </div>
  )
}

export default function NegocioArea() {
  const mostrar = useAviso()
  const navegar = useNavigate()
  const [negocio, setNegocio] = useState(null)
  const [error, setError] = useState('')
  const [pedidos, setPedidos] = useState([])
  const [cargandoPedidos, setCargandoPedidos] = useState(true)
  const [recientes, setRecientes] = useState([])
  const [alerta, setAlerta] = useState(false)
  const conocidos = useRef(null)

  useEffect(() => {
    api('/negocios/mio')
      .then(setNegocio)
      .catch((e) => setError(e.message))
  }, [])

  const aprobado = negocio?.estadoAprobacion === 'APROBADO'
  const [compartir, setCompartirEstado] = useState(() => {
    try {
      return localStorage.getItem('pidecerca_en_vivo') === 'si'
    } catch {
      return false
    }
  })
  const [errorGps, setErrorGps] = useState('')
  const ultimoEnvio = useRef({ t: 0, lat: null, lng: null })

  const setCompartir = useCallback(
    async (valor) => {
      setCompartirEstado(valor)
      setErrorGps('')
      try {
        localStorage.setItem('pidecerca_en_vivo', valor ? 'si' : 'no')
      } catch {
        setErrorGps('')
      }
      if (!valor) {
        try {
          setNegocio(await api('/negocios/mio/ubicacion', { metodo: 'PUT', cuerpo: { enVivo: false } }))
        } catch {
          return
        }
      }
    },
    []
  )

  const activo = aprobado && compartir && negocio?.abierto

  useEffect(() => {
    if (!activo) return
    if (!navigator.geolocation) {
      setErrorGps('Tu navegador no permite usar el GPS')
      return
    }
    const vigilancia = navigator.geolocation.watchPosition(
      async (p) => {
        const { latitude: lat, longitude: lng } = p.coords
        const anterior = ultimoEnvio.current
        const movio = anterior.lat === null || Math.abs(anterior.lat - lat) > 0.00012 || Math.abs(anterior.lng - lng) > 0.00012
        if (!movio && Date.now() - anterior.t < 60000) return
        ultimoEnvio.current = { t: Date.now(), lat, lng }
        try {
          setNegocio(await api('/negocios/mio/ubicacion', { metodo: 'PUT', cuerpo: { latitud: lat, longitud: lng, enVivo: true } }))
          setErrorGps('')
        } catch (e) {
          setErrorGps(e.message)
        }
      },
      (e) =>
        setErrorGps(
          e.code === 1 ? 'Diste "No permitir" al GPS. Actívalo junto a la dirección de la página para compartir tu ubicación' : 'No pudimos obtener tu ubicación'
        ),
      { enableHighAccuracy: true, maximumAge: 15000, timeout: 30000 }
    )
    return () => navigator.geolocation.clearWatch(vigilancia)
  }, [activo])

  const recargar = useCallback(async () => {
    if (!aprobado) return
    try {
      const [datos, actual] = await Promise.all([api('/pedidos/negocio', { consulta: { activos: true } }), api('/negocios/mio')])
      setNegocio((n) => {
        if (n && n.abierto && !actual.abierto && actual.motivoCierre) {
          sonarAviso()
          mostrar(actual.motivoCierre)
        }
        return n && n.abierto === actual.abierto && n.motivoCierre === actual.motivoCierre ? n : actual
      })
      const nuevos = datos.filter((p) => p.estado === 'PENDIENTE').map((p) => p.id)
      if (conocidos.current) {
        const llegaron = nuevos.filter((id) => !conocidos.current.has(id))
        if (llegaron.length) {
          sonarAviso()
          setAlerta(true)
          setRecientes((r) => [...r, ...llegaron])
          notificarSistema('PideCerca · ¡Nuevo pedido!', `Tienes ${llegaron.length} pedido(s) nuevo(s)`)
        }
      }
      conocidos.current = new Set(datos.map((p) => p.id))
      setPedidos(datos)
    } catch (e) {
      mostrar(e.message)
    } finally {
      setCargandoPedidos(false)
    }
  }, [aprobado, mostrar])

  const abierto = aprobado && negocio?.abierto

  useEffect(() => {
    if (!abierto || !('wakeLock' in navigator)) return
    let candado = null
    const pedir = () => {
      if (document.visibilityState !== 'visible') return
      navigator.wakeLock
        .request('screen')
        .then((c) => (candado = c))
        .catch(() => null)
    }
    pedir()
    document.addEventListener('visibilitychange', pedir)
    return () => {
      document.removeEventListener('visibilitychange', pedir)
      candado?.release().catch(() => null)
    }
  }, [abierto])

  useEffect(() => {
    recargar()
    const intervalo = setInterval(recargar, 8000)
    return () => clearInterval(intervalo)
  }, [recargar])

  const reemplazar = useCallback((actualizado) => {
    setPedidos((lista) =>
      ['RECOGIDO', 'CANCELADO'].includes(actualizado.estado)
        ? lista.filter((p) => p.id !== actualizado.id)
        : lista.map((p) => (p.id === actualizado.id ? actualizado : p))
    )
    setRecientes((r) => r.filter((id) => id !== actualizado.id))
  }, [])

  if (error && !negocio) {
    return (
      <div className="contenido angosto">
        <div className="aviso error">{error}</div>
      </div>
    )
  }
  if (!negocio) return <Cargando />
  if (!aprobado) return <EnRevision negocio={negocio} />

  const nuevos = pedidos.filter((p) => p.estado === 'PENDIENTE').length

  const enlaces = [
    { ruta: '/negocio', texto: 'Pedidos', icono: ClipboardList, exacto: true, globo: nuevos },
    { ruta: '/negocio/menu', texto: 'Menú', icono: UtensilsCrossed },
    { ruta: '/negocio/ventas', texto: 'Ventas', icono: BarChart3 },
    { ruta: '/negocio/puesto', texto: 'Mi puesto', icono: Store }
  ]

  return (
    <NegocioContexto.Provider
      value={{ negocio, setNegocio, pedidos, cargandoPedidos, recargar, reemplazar, recientes, setAlerta, compartir, setCompartir, errorGps }}
    >
      <Marco
        rol="negocio"
        enlaces={enlaces}
        titulo={negocio.nombre}
        sub={negocio.tipoComida || 'Mi puesto'}
        derecha={<BotonAbierto />}
        extra={
          alerta && (
            <button
              className="alerta-flotante"
              onClick={() => {
                setAlerta(false)
                navegar('/negocio')
              }}
            >
              <BellRing size={24} />
              ¡Nuevo pedido!
            </button>
          )
        }
      />
    </NegocioContexto.Provider>
  )
}

function BotonAbierto() {
  const { negocio, setNegocio } = useNegocio()
  const mostrar = useAviso()
  const [ocupado, setOcupado] = useState(false)

  async function alternar() {
    setOcupado(true)
    try {
      const n = await api('/negocios/mio/abierto', { metodo: 'PUT', consulta: { valor: !negocio.abierto } })
      setNegocio(n)
      mostrar(n.abierto ? 'Tu puesto está abierto. Ya recibes pedidos' : 'Tu puesto está cerrado')
    } catch (e) {
      mostrar(e.message)
    } finally {
      setOcupado(false)
    }
  }

  return (
    <button
      className="barra-boton"
      onClick={alternar}
      disabled={ocupado}
      aria-label={negocio.abierto ? 'Cerrar mi puesto' : 'Abrir mi puesto'}
      style={negocio.abierto ? { background: 'var(--ok-solido)', color: '#fff', border: 0 } : undefined}
    >
      <span className="punto" />
      {negocio.abierto ? 'Abierto' : 'Cerrado'}
    </button>
  )
}
