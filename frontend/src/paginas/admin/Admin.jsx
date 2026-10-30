import { useCallback, useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Check, History, LayoutDashboard, LogOut, Store, Users, X } from 'lucide-react'
import { api } from '../../api'
import { useAviso } from '../../contexto/Aviso'
import { useSesion } from '../../contexto/Sesion'
import { Marco } from '../../componentes/Marco'
import { Cargando, Error, Estado, Modal, Vacio } from '../../componentes/Ui'
import { cuando, haceCuanto, iniciales, soles } from '../../util/formato'

export default function AdminArea() {
  const { usuario, salir } = useSesion()
  const [pendientes, setPendientes] = useState(0)

  const contar = useCallback(async () => {
    try {
      const r = await api('/admin/resumen')
      setPendientes(r.solicitudesPendientes || 0)
    } catch {
      return
    }
  }, [])

  useEffect(() => {
    contar()
    const i = setInterval(contar, 30000)
    return () => clearInterval(i)
  }, [contar])

  const enlaces = [
    { ruta: '/admin', texto: 'Resumen', icono: LayoutDashboard, exacto: true },
    { ruta: '/admin/puestos', texto: 'Puestos', icono: Store, globo: pendientes },
    { ruta: '/admin/usuarios', texto: 'Usuarios', icono: Users },
    { ruta: '/admin/registro', texto: 'Registro', icono: History }
  ]

  return (
    <Marco
      rol="admin"
      enlaces={enlaces}
      titulo="PideCerca · Admin"
      sub={`${usuario?.nombre || ''} ${usuario?.apellido || ''}`.trim()}
      contexto={{ contar }}
      derecha={
        <button className="barra-boton" onClick={salir} aria-label="Cerrar sesión">
          <LogOut size={20} />
          <span className="solo-escritorio">Salir</span>
        </button>
      }
    />
  )
}

const ESTADOS_ORDEN = [
  ['PENDIENTE', 'Recibidos'],
  ['EN_PREPARACION', 'En proceso'],
  ['LISTO_PARA_RECOGER', 'Listos'],
  ['RECOGIDO', 'Entregados'],
  ['CANCELADO', 'Cancelados']
]

export function Resumen() {
  const [datos, setDatos] = useState(null)
  const [pedidos, setPedidos] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([api('/admin/resumen'), api('/pedidos')])
      .then(([r, p]) => {
        setDatos(r)
        setPedidos(p.slice(0, 10))
      })
      .catch((e) => setError(e.message))
  }, [])

  if (!datos) return error ? <Error>{error}</Error> : <Cargando />

  const porEstado = datos.pedidosPorEstado || {}
  const enProceso = (porEstado.ACEPTADO || 0) + (porEstado.EN_PREPARACION || 0)
  const valor = (clave) => (clave === 'EN_PREPARACION' ? enProceso : porEstado[clave] || 0)
  const total = Math.max(1, ESTADOS_ORDEN.reduce((s, [c]) => s + valor(c), 0))
  const colores = { PENDIENTE: 'var(--rec-solido)', EN_PREPARACION: 'var(--pro-solido)', LISTO_PARA_RECOGER: 'var(--ok-solido)', RECOGIDO: 'var(--ent)', CANCELADO: 'var(--t3)' }

  return (
    <>
      <h1>Resumen de la plataforma</h1>
      {datos.solicitudesPendientes > 0 && (
        <div className="aviso alerta">
          Tienes {datos.solicitudesPendientes} puesto(s) esperando tu aprobación en la pestaña Puestos.
        </div>
      )}
      <div className="metricas">
        <div className="metrica destacada">
          <span>Ventas de hoy</span>
          <b>{soles(datos.ventasHoy)}</b>
        </div>
        <div className="metrica">
          <span>Pedidos de hoy</span>
          <b>{datos.pedidosHoy}</b>
        </div>
        <div className="metrica">
          <span>Puestos activos</span>
          <b>{datos.negociosActivos}</b>
        </div>
        <div className="metrica">
          <span>Clientes</span>
          <b>{datos.totalClientes}</b>
        </div>
      </div>

      <section className="tarjeta columna">
        <h2>Pedidos por estado</h2>
        {ESTADOS_ORDEN.map(([clave, texto]) => (
          <div key={clave} className="fila" style={{ gap: 12 }}>
            <span style={{ width: 110, flexShrink: 0 }}>{texto}</span>
            <div className="progreso" style={{ flex: 1, height: 12 }}>
              <div style={{ width: `${(valor(clave) / total) * 100}%`, background: colores[clave] }} />
            </div>
            <b style={{ width: 40, textAlign: 'right' }}>{valor(clave)}</b>
          </div>
        ))}
        <p className="mini">Ventas totales: {soles(datos.ventasTotales)} · {datos.totalPedidos} pedidos en total</p>
      </section>

      <section className="columna">
        <h2>Últimos pedidos</h2>
        <div className="filas">
          {pedidos.map((p) => (
            <div key={p.id} className="fila-item">
              <span className="avatar">#{p.id}</span>
              <div className="fila-item-texto">
                <b>{p.negocio?.nombre}</b>
                <span className="mini">{cuando(p.fecha)}</span>
              </div>
              <div className="fila-item-lado">
                <b>{soles(p.total)}</b>
                <Estado estado={p.estado} />
              </div>
            </div>
          ))}
          {pedidos.length === 0 && <p className="mini fila-item">Todavía no hay pedidos.</p>}
        </div>
      </section>
    </>
  )
}

export function Puestos() {
  const { contar } = useOutletContext() || {}
  const mostrar = useAviso()
  const [lista, setLista] = useState(null)
  const [error, setError] = useState('')
  const [rechazando, setRechazando] = useState(null)
  const [motivo, setMotivo] = useState('')
  const [suspendiendo, setSuspendiendo] = useState(null)

  const cargar = useCallback(async () => {
    try {
      setLista(await api('/admin/negocios'))
      setError('')
    } catch (e) {
      setError(e.message)
    }
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  async function accion(promesa, mensaje) {
    try {
      await promesa
      mostrar(mensaje)
      cargar()
      contar?.()
    } catch (e) {
      mostrar(e.message)
    }
  }

  if (!lista) return error ? <Error>{error}</Error> : <Cargando />

  const pendientes = lista.filter((n) => n.estadoAprobacion === 'PENDIENTE')
  const resto = lista.filter((n) => n.estadoAprobacion !== 'PENDIENTE')

  return (
    <>
      <h1>Puestos</h1>

      <section className="columna">
        <h2>Esperando aprobación ({pendientes.length})</h2>
        {pendientes.length === 0 && <Vacio>No hay solicitudes nuevas.</Vacio>}
        {pendientes.map((n) => (
          <article key={n.id} className="tarjeta columna" style={{ gap: 8, borderColor: 'var(--rec-solido)' }}>
            <div className="fila entre envolver">
              <h3>{n.nombre}</h3>
              <span className="estado rec">Por aprobar</span>
            </div>
            <p className="sub">{[n.tipoComida, n.direccion].filter(Boolean).join(' · ')}</p>
            <p className="mini">
              Dueño: {n.propietarioNombre} · {n.propietarioCorreo} · {n.propietarioTelefono} · se registró {haceCuanto(n.fechaSolicitud)}
            </p>
            <div className="fila envolver">
              <button className="boton listo chico" onClick={() => accion(api(`/admin/negocios/${n.id}/aprobar`, { metodo: 'POST' }), `${n.nombre} aprobado`)}>
                <Check size={18} />
                Aprobar
              </button>
              <button
                className="boton peligro chico"
                onClick={() => {
                  setRechazando(n)
                  setMotivo('')
                }}
              >
                <X size={18} />
                Rechazar
              </button>
            </div>
          </article>
        ))}
      </section>

      <section className="columna">
        <h2>Todos los puestos</h2>
        <div className="filas">
          {resto.map((n) => {
            const aprobado = n.estadoAprobacion === 'APROBADO'
            return (
              <div key={n.id} className={'fila-item' + (aprobado && !n.activo ? ' apagado' : '')}>
                <span className="avatar">{iniciales(n.nombre)}</span>
                <div className="fila-item-texto">
                  <b>{n.nombre}</b>
                  <span className="mini">
                    {n.propietarioNombre} · {n.propietarioCorreo}
                  </span>
                </div>
                <div className="fila-item-lado">
                  {!aprobado ? (
                    <span className="estado mal">Rechazado</span>
                  ) : n.activo ? (
                    <span className="estado ok">Activo</span>
                  ) : (
                    <span className="estado can">Suspendido</span>
                  )}
                  {!aprobado ? (
                    <button className="boton secundario chico" onClick={() => accion(api(`/admin/negocios/${n.id}/aprobar`, { metodo: 'POST' }), `${n.nombre} aprobado`)}>
                      Aprobar
                    </button>
                  ) : n.activo ? (
                    <button className="boton peligro chico" onClick={() => setSuspendiendo(n)}>
                      Suspender
                    </button>
                  ) : (
                    <button className="boton secundario chico" onClick={() => accion(api(`/negocios/${n.id}/habilitar`, { metodo: 'POST' }), `${n.nombre} reactivado`)}>
                      Reactivar
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {rechazando && (
        <Modal titulo={`Rechazar ${rechazando.nombre}`} alCerrar={() => setRechazando(null)}>
          <div className="campo">
            <label htmlFor="motivo">Motivo (lo verá la dueña del puesto)</label>
            <input id="motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Faltan datos de la dirección" />
          </div>
          <div className="dos">
            <button className="boton secundario" onClick={() => setRechazando(null)}>
              Volver
            </button>
            <button
              className="boton peligro"
              onClick={() => {
                const n = rechazando
                setRechazando(null)
                accion(api(`/admin/negocios/${n.id}/rechazar`, { metodo: 'POST', cuerpo: { motivo } }), `${n.nombre} rechazado`)
              }}
            >
              Rechazar
            </button>
          </div>
        </Modal>
      )}

      {suspendiendo && (
        <Modal titulo={`¿Suspender ${suspendiendo.nombre}?`} alCerrar={() => setSuspendiendo(null)}>
          <p className="sub">Los clientes dejarán de verlo y la dueña no podrá entrar hasta que lo reactives.</p>
          <div className="dos">
            <button className="boton secundario" onClick={() => setSuspendiendo(null)}>
              Volver
            </button>
            <button
              className="boton peligro"
              onClick={() => {
                const n = suspendiendo
                setSuspendiendo(null)
                accion(api(`/negocios/${n.id}/deshabilitar`, { metodo: 'POST' }), `${n.nombre} suspendido`)
              }}
            >
              Suspender
            </button>
          </div>
        </Modal>
      )}
    </>
  )
}

const ROLES = { CLIENTE: 'Cliente', NEGOCIO: 'Negocio', ADMIN: 'Administrador' }

export function Usuarios() {
  const mostrar = useAviso()
  const { usuario: yo } = useSesion()
  const [lista, setLista] = useState(null)
  const [error, setError] = useState('')
  const [texto, setTexto] = useState('')
  const [rol, setRol] = useState('')

  const cargar = useCallback(async () => {
    try {
      setLista(await api('/usuarios'))
    } catch (e) {
      setError(e.message)
    }
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  async function cambiarActivo(u) {
    try {
      await api(`/usuarios/${u.id}/activo`, { metodo: 'PUT', consulta: { valor: !u.activo } })
      mostrar(u.activo ? `${u.nombre} suspendido${u.rol === 'NEGOCIO' ? ' junto con su puesto' : ''}` : `${u.nombre} reactivado`)
      cargar()
    } catch (e) {
      mostrar(e.message)
    }
  }

  if (!lista) return error ? <Error>{error}</Error> : <Cargando />

  const filtro = texto.trim().toLowerCase()
  const visibles = lista.filter(
    (u) => (!rol || u.rol === rol) && (!filtro || `${u.nombre || ''} ${u.apellido || ''}`.toLowerCase().includes(filtro))
  )

  return (
    <>
      <h1>Usuarios</h1>
      <div className="aviso info">Correos y teléfonos ocultos por privacidad.</div>
      <div className="fila envolver">
        <input className="buscador" style={{ flex: '1 1 180px', minWidth: 0 }} placeholder="Buscar por nombre" value={texto} onChange={(e) => setTexto(e.target.value)} aria-label="Buscar usuario" />
        <div className="chips">
          {[['', 'Todos'], ['CLIENTE', 'Clientes'], ['NEGOCIO', 'Negocios']].map(([v, t]) => (
            <button key={v} className={'chip' + (rol === v ? ' activo' : '')} onClick={() => setRol(v)}>
              {t}
            </button>
          ))}
        </div>
      </div>
      <div className="filas">
        {visibles.map((u) => (
          <div key={u.id} className={'fila-item' + (u.activo ? '' : ' apagado')}>
            <span className="avatar">{iniciales(`${u.nombre || ''} ${u.apellido || ''}`)}</span>
            <div className="fila-item-texto">
              <b>
                {u.nombre} {u.apellido ? u.apellido.charAt(0) + '.' : ''}
              </b>
              <span className="mini">{[ROLES[u.rol] || u.rol, u.correo, u.telefono].filter(Boolean).join(' · ')}</span>
            </div>
            <div className="fila-item-lado">
              {u.activo ? <span className="estado ok">Activo</span> : <span className="estado can">Suspendido</span>}
              {u.id !== yo?.id && u.rol !== 'ADMIN' && (
                <button className={'boton chico ' + (u.activo ? 'peligro' : 'secundario')} onClick={() => cambiarActivo(u)}>
                  {u.activo ? 'Suspender' : 'Reactivar'}
                </button>
              )}
            </div>
          </div>
        ))}
        {visibles.length === 0 && <p className="mini fila-item">Nadie con ese nombre.</p>}
      </div>
    </>
  )
}

export function Registro() {
  const [lista, setLista] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api('/admin/registro')
      .then(setLista)
      .catch((e) => setError(e.message))
  }, [])

  if (!lista) return error ? <Error>{error}</Error> : <Cargando />

  return (
    <>
      <h1>Registro de acciones</h1>
      {lista.length === 0 && <Vacio>Todavía no hay acciones registradas.</Vacio>}
      <div className="filas">
        {lista.map((r) => (
          <div key={r.id} className="fila-item">
            <div className="fila-item-texto">
              <span>{r.detalle}</span>
              <span className="mini">{cuando(r.fecha)}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
