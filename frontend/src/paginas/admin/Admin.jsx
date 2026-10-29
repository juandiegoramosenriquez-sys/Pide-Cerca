import { useCallback, useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Check, History, LayoutDashboard, LogOut, Store, Users, X } from 'lucide-react'
import { api } from '../../api'
import { useAviso } from '../../contexto/Aviso'
import { useSesion } from '../../contexto/Sesion'
import { Marco } from '../../componentes/Marco'
import { Cargando, Error, Estado, Modal, Vacio } from '../../componentes/Ui'
import { fechaCorta, haceCuanto, soles } from '../../util/formato'

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
        <div className="tabla-caja">
          <table className="tabla">
            <thead>
              <tr>
                <th>#</th>
                <th>Puesto</th>
                <th>Fecha</th>
                <th>Total</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {pedidos.map((p) => (
                <tr key={p.id}>
                  <td>
                    <b>#{p.id}</b>
                  </td>
                  <td>{p.negocio?.nombre}</td>
                  <td>{fechaCorta(p.fecha)}</td>
                  <td>{soles(p.total)}</td>
                  <td>
                    <Estado estado={p.estado} />
                  </td>
                </tr>
              ))}
              {pedidos.length === 0 && (
                <tr>
                  <td colSpan={5} className="mini">
                    Todavía no hay pedidos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
        <div className="tabla-caja">
          <table className="tabla">
            <thead>
              <tr>
                <th>Puesto</th>
                <th>Dueño</th>
                <th>Estado</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {resto.map((n) => {
                const aprobado = n.estadoAprobacion === 'APROBADO'
                return (
                  <tr key={n.id}>
                    <td>
                      <b>{n.nombre}</b>
                      <div className="mini">{n.tipoComida}</div>
                    </td>
                    <td>
                      {n.propietarioNombre}
                      <div className="mini">{n.propietarioCorreo}</div>
                    </td>
                    <td>
                      {!aprobado ? (
                        <span className="estado mal">Rechazado</span>
                      ) : n.activo ? (
                        <span className="estado ok">Activo</span>
                      ) : (
                        <span className="estado can">✕ Suspendido</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
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
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
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
          <p className="sub">Los clientes dejarán de verlo hasta que lo reactives.</p>
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
      mostrar(u.activo ? `${u.nombre} suspendido` : `${u.nombre} reactivado`)
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
        <input className="buscador" style={{ flex: 1, minWidth: 200 }} placeholder="Buscar por nombre" value={texto} onChange={(e) => setTexto(e.target.value)} aria-label="Buscar usuario" />
        <div className="chips">
          {[['', 'Todos'], ['CLIENTE', 'Clientes'], ['NEGOCIO', 'Negocios']].map(([v, t]) => (
            <button key={v} className={'chip' + (rol === v ? ' activo' : '')} onClick={() => setRol(v)}>
              {t}
            </button>
          ))}
        </div>
      </div>
      <div className="tabla-caja">
        <table className="tabla">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Rol</th>
              <th>Estado</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {visibles.map((u) => (
              <tr key={u.id}>
                <td>
                  <b>
                    {u.nombre} {u.apellido ? u.apellido.charAt(0) + '.' : ''}
                  </b>
                  <div className="mini">{u.telefono}</div>
                </td>
                <td>{u.correo}</td>
                <td>{ROLES[u.rol] || u.rol}</td>
                <td>{u.activo ? <span className="estado ok">Activo</span> : <span className="estado can">✕ Suspendido</span>}</td>
                <td style={{ textAlign: 'right' }}>
                  {u.id !== yo?.id && u.rol !== 'ADMIN' && (
                    <button className={'boton chico ' + (u.activo ? 'peligro' : 'secundario')} onClick={() => cambiarActivo(u)}>
                      {u.activo ? 'Suspender' : 'Reactivar'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
      <div>
        <h1>Registro de acciones</h1>
      </div>
      {lista.length === 0 && <Vacio>Todavía no hay acciones registradas.</Vacio>}
      <div className="tabla-caja">
        <table className="tabla">
          <tbody>
            {lista.map((r) => (
              <tr key={r.id}>
                <td className="mini" style={{ whiteSpace: 'nowrap' }}>
                  {fechaCorta(r.fecha)}
                </td>
                <td>{r.detalle}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
