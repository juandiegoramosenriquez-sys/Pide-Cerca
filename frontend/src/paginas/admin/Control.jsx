import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Download, Send } from 'lucide-react'
import { api, descargar } from '../../api'
import { useAviso } from '../../contexto/Aviso'
import { BotonCarga, Cargando, Error, Estado, Vacio } from '../../componentes/Ui'
import { fechaCompleta, iniciales, soles } from '../../util/formato'

const SECCIONES = [
  ['puestos', 'Puestos'],
  ['clientes', 'Clientes'],
  ['dinero', 'Dinero'],
  ['reclamos', 'Reclamos'],
  ['avisos', 'Comunicados'],
  ['reglas', 'Reglas'],
  ['seguridad', 'Seguridad'],
  ['reportes', 'Reportes']
]

export function Control() {
  const [seccion, setSeccion] = useState('puestos')

  return (
    <>
      <h1>Control</h1>
      <div className="chips" role="tablist" aria-label="Secciones de control">
        {SECCIONES.map(([clave, texto]) => (
          <button key={clave} type="button" role="tab" aria-selected={seccion === clave} className={'chip' + (seccion === clave ? ' activo' : '')} onClick={() => setSeccion(clave)}>
            {texto}
          </button>
        ))}
      </div>
      {seccion === 'puestos' && <SeccionPuestos />}
      {seccion === 'clientes' && <SeccionClientes />}
      {seccion === 'dinero' && <SeccionDinero />}
      {seccion === 'reclamos' && <SeccionReclamos />}
      {seccion === 'avisos' && <SeccionComunicados />}
      {seccion === 'reglas' && <SeccionReglas />}
      {seccion === 'seguridad' && <SeccionSeguridad />}
      {seccion === 'reportes' && <SeccionReportes />}
    </>
  )
}

function useCarga(ruta) {
  const [datos, setDatos] = useState(null)
  const [error, setError] = useState('')

  const cargar = useCallback(async () => {
    try {
      setDatos(await api(ruta))
      setError('')
    } catch (e) {
      setError(e.message)
    }
  }, [ruta])

  useEffect(() => {
    cargar()
  }, [cargar])

  return { datos, error, cargar }
}

const PERIODOS = [
  ['hoy', 'Hoy'],
  ['semana', '7 días'],
  ['mes', 'Este mes']
]

function SeccionPuestos() {
  const [periodo, setPeriodo] = useState('hoy')
  const { datos: ranking, error } = useCarga(`/admin/ranking?periodo=${periodo}`)
  const { datos: problemas } = useCarga('/admin/problemas')

  return (
    <>
      <section className="columna">
        <h2>Ranking de ventas</h2>
        <div className="segmento" role="group" aria-label="Periodo">
          {PERIODOS.map(([clave, texto]) => (
            <button key={clave} type="button" className={periodo === clave ? 'activo' : ''} aria-pressed={periodo === clave} onClick={() => setPeriodo(clave)}>
              {texto}
            </button>
          ))}
        </div>
        {error && <Error>{error}</Error>}
        {!ranking ? (
          !error && <Cargando />
        ) : ranking.length === 0 ? (
          <Vacio>Todavía no hay puestos aprobados.</Vacio>
        ) : (
          <div className="filas">
            {ranking.map((f, i) => (
              <div key={f.id} className="fila-item">
                <span className="avatar">{i + 1}</span>
                <div className="fila-item-texto">
                  <b>{f.nombre}</b>
                  <span className="mini">
                    {f.pedidos} entregados · {f.cancelados} cancelados · {f.noRecogidos} no recogidos
                  </span>
                </div>
                <div className="fila-item-lado">
                  <b>{soles(f.ventas)}</b>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="columna">
        <h2>Puestos con problemas</h2>
        {!problemas ? (
          <Cargando />
        ) : problemas.conProblemas.length === 0 ? (
          <Vacio>Ningún puesto con problemas. Todo en orden.</Vacio>
        ) : (
          <div className="filas">
            {problemas.conProblemas.map((p) => (
              <div key={p.id} className="fila-item">
                <div className="fila-item-texto">
                  <b>{p.nombre}</b>
                  <span className="mini">{p.detalle}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="columna">
        <h2>Puestos inactivos</h2>
        {!problemas ? (
          <Cargando />
        ) : problemas.inactivos.length === 0 ? (
          <Vacio>Todos los puestos vendieron en los últimos 7 días.</Vacio>
        ) : (
          <div className="filas">
            {problemas.inactivos.map((p) => (
              <div key={p.id} className="fila-item">
                <div className="fila-item-texto">
                  <b>{p.nombre}</b>
                  <span className="mini">{p.detalle}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  )
}

function SeccionClientes() {
  const mostrar = useAviso()
  const navegar = useNavigate()
  const { datos, error, cargar } = useCarga('/admin/clientes')

  async function perdonar(c) {
    try {
      await api(`/admin/usuarios/${c.id}/perdonar-faltas`, { metodo: 'PUT' })
      mostrar(`Perdonaste las faltas de ${c.nombre}`)
      cargar()
    } catch (e) {
      mostrar(e.message)
    }
  }

  async function cambiarActivo(c) {
    try {
      await api(`/usuarios/${c.id}/activo`, { metodo: 'PUT', consulta: { valor: !c.activo } })
      mostrar(c.activo ? `${c.nombre} bloqueado` : `${c.nombre} desbloqueado`)
      cargar()
    } catch (e) {
      mostrar(e.message)
    }
  }

  if (!datos) return error ? <Error>{error}</Error> : <Cargando />

  return (
    <section className="columna">
      <h2>Clientes con más faltas y cancelaciones</h2>
      {datos.length === 0 && <Vacio>Todavía no hay clientes.</Vacio>}
      <div className="filas">
        {datos.map((c) => (
          <div key={c.id} className={'fila-item' + (c.activo ? '' : ' apagado')}>
            <div className="fila-item-texto">
              <b>
                <button type="button" style={{ background: 'none', border: 0, padding: 0, font: 'inherit', fontWeight: 700, color: 'inherit', textAlign: 'left' }} onClick={() => navegar(`/admin/clientes/${c.id}`)}>
                  {c.nombre}
                </button>
              </b>
              <span className="mini">
                {c.faltas} {c.faltas === 1 ? 'falta' : 'faltas'} · {c.noRecogidos} no recogidos · {c.cancelados} cancelados · {c.pedidos} pedidos
              </span>
            </div>
            <div className="fila-item-lado">
              {c.faltas > 0 && (
                <button className="boton chico secundario" onClick={() => perdonar(c)}>
                  Perdonar
                </button>
              )}
              <button className={'boton chico ' + (c.activo ? 'peligro' : 'secundario')} onClick={() => cambiarActivo(c)}>
                {c.activo ? 'Bloquear' : 'Desbloquear'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

const NOMBRE_METODO = { YAPE: 'Yape', PLIN: 'Plin', TARJETA: 'Tarjeta', EFECTIVO: 'Efectivo' }

function SeccionDinero() {
  const { datos, error } = useCarga('/admin/dinero')

  if (!datos) return error ? <Error>{error}</Error> : <Cargando />

  const metodos = Object.entries(datos.porMetodo || {})

  return (
    <>
      <div className="metricas">
        <div className="metrica">
          <span>Reembolsado</span>
          <b>{soles(datos.reembolsado)}</b>
        </div>
        <div className="metrica">
          <span>Reembolsos</span>
          <b>{datos.reembolsos}</b>
        </div>
        <div className="metrica">
          <span>No recogidos pagados</span>
          <b>{datos.noRecogidosPagados}</b>
        </div>
        <div className="metrica">
          <span>No recogidos en efectivo</span>
          <b>{datos.noRecogidosEfectivo}</b>
        </div>
      </div>
      <section className="tarjeta columna" style={{ gap: 8 }}>
        <h2>Ventas por método de pago</h2>
        {metodos.length === 0 && <span className="mini">Todavía no hay ventas.</span>}
        {metodos.map(([metodo, monto]) => (
          <div key={metodo} className="fila entre">
            <span>{NOMBRE_METODO[metodo] || metodo}</span>
            <b>{soles(monto)}</b>
          </div>
        ))}
        {datos.noRecogidosPagadosMonto > 0 && <span className="mini">Pagos no recogidos que se quedaron los puestos: {soles(datos.noRecogidosPagadosMonto)}</span>}
      </section>
    </>
  )
}

function SeccionReclamos() {
  const mostrar = useAviso()
  const { datos, error, cargar } = useCarga('/admin/reclamos')
  const [respuestas, setRespuestas] = useState({})

  async function resolver(r) {
    try {
      await api(`/admin/reclamos/${r.id}/resolver`, { metodo: 'PUT', cuerpo: { motivo: respuestas[r.id] || '' } })
      mostrar('Reclamo resuelto')
      cargar()
    } catch (e) {
      mostrar(e.message)
    }
  }

  if (!datos) return error ? <Error>{error}</Error> : <Cargando />

  const abiertos = datos.filter((r) => r.estado === 'ABIERTO')
  const resueltos = datos.filter((r) => r.estado !== 'ABIERTO')

  return (
    <>
      <section className="columna">
        <h2>Por resolver · {abiertos.length}</h2>
        {abiertos.length === 0 && <Vacio>No hay reclamos pendientes.</Vacio>}
        {abiertos.map((r) => (
          <div key={r.id} className="tarjeta columna" style={{ gap: 8 }}>
            <div className="fila entre">
              <b>{r.autor}</b>
              <span className="mini">{fechaCompleta(r.fecha)}</span>
            </div>
            <span className="mini">
              {r.tipo}
              {r.pedidoId ? ` · pedido #${r.pedidoId}` : ''}
            </span>
            <p>{r.mensaje}</p>
            <textarea
              placeholder="Tu respuesta (opcional)"
              value={respuestas[r.id] || ''}
              onChange={(e) => setRespuestas({ ...respuestas, [r.id]: e.target.value })}
              aria-label="Respuesta al reclamo"
            />
            <button className="boton principal" onClick={() => resolver(r)}>
              Marcar como resuelto
            </button>
          </div>
        ))}
      </section>
      {resueltos.length > 0 && (
        <section className="columna">
          <h2>Resueltos</h2>
          {resueltos.map((r) => (
            <div key={r.id} className="tarjeta columna" style={{ gap: 4 }}>
              <div className="fila entre">
                <b>{r.autor}</b>
                <span className="estado ok">Resuelto</span>
              </div>
              <p className="sub">{r.mensaje}</p>
              {r.respuesta && <span className="mini">Respuesta: {r.respuesta}</span>}
            </div>
          ))}
        </section>
      )}
    </>
  )
}

function SeccionComunicados() {
  const mostrar = useAviso()
  const { datos, cargar } = useCarga('/admin/comunicados')
  const { datos: puestos } = useCarga('/admin/negocios')
  const [destino, setDestino] = useState('CLIENTES')
  const [negocioId, setNegocioId] = useState('')
  const [titulo, setTitulo] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')

  async function enviar(e) {
    e.preventDefault()
    setError('')
    setEnviando(true)
    try {
      const c = await api('/admin/comunicados', { metodo: 'POST', cuerpo: { destino, negocioId: negocioId || null, titulo, mensaje } })
      mostrar(`Aviso enviado a ${c.enviados} ${c.enviados === 1 ? 'persona' : 'personas'}`)
      setTitulo('')
      setMensaje('')
      cargar()
    } catch (err) {
      setError(err.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <>
      <form className="tarjeta formulario" onSubmit={enviar}>
        <h2>Mandar un aviso</h2>
        <Error>{error}</Error>
        <div className="campo">
          <label htmlFor="com-destino">Para quién</label>
          <select id="com-destino" value={destino} onChange={(e) => setDestino(e.target.value)}>
            <option value="CLIENTES">Todos los clientes</option>
            <option value="NEGOCIOS">Todas las tías</option>
            <option value="TODOS">Todos</option>
            <option value="PUESTO">Un puesto</option>
          </select>
        </div>
        {destino === 'PUESTO' && (
          <div className="campo">
            <label htmlFor="com-puesto">Puesto</label>
            <select id="com-puesto" value={negocioId} onChange={(e) => setNegocioId(e.target.value)}>
              <option value="">Elige un puesto</option>
              {(puestos || []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="campo">
          <label htmlFor="com-titulo">Título</label>
          <input id="com-titulo" maxLength={80} value={titulo} onChange={(e) => setTitulo(e.target.value)} />
        </div>
        <div className="campo">
          <label htmlFor="com-mensaje">Mensaje</label>
          <textarea id="com-mensaje" maxLength={600} value={mensaje} onChange={(e) => setMensaje(e.target.value)} />
        </div>
        <BotonCarga cargando={enviando}>
          <Send size={18} />
          Enviar aviso
        </BotonCarga>
      </form>
      <section className="columna">
        <h2>Enviados</h2>
        {!datos ? (
          <Cargando />
        ) : datos.length === 0 ? (
          <Vacio>Todavía no mandaste ningún aviso.</Vacio>
        ) : (
          <div className="filas">
            {datos.map((c) => (
              <div key={c.id} className="fila-item">
                <div className="fila-item-texto">
                  <b>{c.titulo}</b>
                  <span className="mini">
                    {c.destinatario} · {c.enviados} {c.enviados === 1 ? 'persona' : 'personas'} · {fechaCompleta(c.fecha)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  )
}

const CAMPOS_REGLAS = [
  ['minutosParaRecoger', 'Minutos para recoger un pedido listo', 'min', 5, 120],
  ['faltasBloqueanEfectivo', 'Faltas que bloquean el efectivo', 'faltas', 1, 10],
  ['distanciaKm', 'Distancia máxima para pedir', 'km', 1, 50],
  ['maxPorProducto', 'Máximo por producto', 'unidades', 1, 50],
  ['maxPorPedido', 'Máximo por pedido', 'productos', 1, 100],
  ['intentosLoginMaximos', 'Intentos de ingreso antes de bloquear', 'intentos', 3, 20],
  ['minutosBloqueoLogin', 'Minutos de bloqueo por intentos', 'min', 1, 120]
]

function SeccionReglas() {
  const mostrar = useAviso()
  const [valores, setValores] = useState(null)
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    api('/ajustes')
      .then((a) => setValores({ ...a, distanciaKm: a.distanciaMaximaMetros / 1000 }))
      .catch((e) => setError(e.message))
  }, [])

  async function guardar(e) {
    e.preventDefault()
    setError('')
    setGuardando(true)
    try {
      await api('/admin/ajustes', {
        metodo: 'PUT',
        cuerpo: {
          minutosParaRecoger: Number(valores.minutosParaRecoger),
          faltasBloqueanEfectivo: Number(valores.faltasBloqueanEfectivo),
          distanciaMaximaMetros: Math.round(Number(valores.distanciaKm) * 1000),
          maxPorProducto: Number(valores.maxPorProducto),
          maxPorPedido: Number(valores.maxPorPedido),
          intentosLoginMaximos: Number(valores.intentosLoginMaximos),
          minutosBloqueoLogin: Number(valores.minutosBloqueoLogin)
        }
      })
      mostrar('Reglas guardadas')
    } catch (err) {
      setError(err.message)
    } finally {
      setGuardando(false)
    }
  }

  if (!valores) return error ? <Error>{error}</Error> : <Cargando />

  return (
    <form className="tarjeta formulario" onSubmit={guardar}>
      <h2>Reglas de la plataforma</h2>
      <p className="sub">Los cambios valen desde el próximo pedido.</p>
      <Error>{error}</Error>
      {CAMPOS_REGLAS.map(([clave, texto, unidad, minimo, maximo]) => (
        <div key={clave} className="campo">
          <label htmlFor={`regla-${clave}`}>
            {texto} ({unidad})
          </label>
          <input
            id={`regla-${clave}`}
            type="number"
            inputMode="decimal"
            min={minimo}
            max={maximo}
            step={clave === 'distanciaKm' ? 0.5 : 1}
            value={valores[clave]}
            onChange={(e) => setValores({ ...valores, [clave]: e.target.value })}
          />
        </div>
      ))}
      <BotonCarga cargando={guardando}>Guardar reglas</BotonCarga>
    </form>
  )
}

function SeccionSeguridad() {
  const { datos, error } = useCarga('/admin/seguridad')

  if (!datos) return error ? <Error>{error}</Error> : <Cargando />

  return (
    <>
      <section className="columna">
        <h2>Bloqueados ahora</h2>
        {datos.bloqueados.length === 0 && <Vacio>Nadie está bloqueado por intentos de ingreso.</Vacio>}
        <div className="filas">
          {datos.bloqueados.map((b) => (
            <div key={b.correo} className="fila-item">
              <div className="fila-item-texto">
                <b>{b.correo}</b>
                <span className="mini">{b.fallos} intentos fallidos</span>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="columna">
        <h2>Últimos ingresos</h2>
        {datos.intentos.length === 0 && <Vacio>Todavía no hay ingresos registrados.</Vacio>}
        <div className="filas">
          {datos.intentos.map((i, n) => (
            <div key={n} className="fila-item">
              <div className="fila-item-texto">
                <b>{i.correo}</b>
                <span className="mini">
                  {fechaCompleta(i.fecha)} · {i.ip}
                </span>
              </div>
              <div className="fila-item-lado">{i.exito ? <span className="estado ok">Entró</span> : <span className="estado mal">Falló</span>}</div>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}

function SeccionReportes() {
  const mostrar = useAviso()
  const [bajando, setBajando] = useState('')

  async function bajar(tipo) {
    setBajando(tipo)
    try {
      await descargar(`/admin/reporte?tipo=${tipo}`, `pidecerca-${tipo}.csv`)
    } catch (e) {
      mostrar(e.message)
    } finally {
      setBajando('')
    }
  }

  return (
    <section className="tarjeta columna">
      <h2>Reportes para Excel</h2>
      <p className="sub">Se descargan en un archivo que Excel abre directo.</p>
      {[
        ['pedidos', 'Pedidos'],
        ['puestos', 'Puestos'],
        ['usuarios', 'Usuarios']
      ].map(([tipo, texto]) => (
        <button key={tipo} className="boton secundario ancho" onClick={() => bajar(tipo)} disabled={bajando === tipo}>
          <Download size={18} />
          {texto}
        </button>
      ))}
    </section>
  )
}

function Dato({ etiqueta, children }) {
  return (
    <div className="ficha-dato">
      <span>{etiqueta}</span>
      <b>{children}</b>
    </div>
  )
}

export function FichaCliente() {
  const { id } = useParams()
  const navegar = useNavigate()
  const mostrar = useAviso()
  const { datos: ficha, error, cargar } = useCarga(`/admin/clientes/${id}/ficha`)

  async function perdonar() {
    try {
      await api(`/admin/usuarios/${id}/perdonar-faltas`, { metodo: 'PUT' })
      mostrar('Faltas perdonadas')
      cargar()
    } catch (e) {
      mostrar(e.message)
    }
  }

  if (!ficha) return error ? <Error>{error}</Error> : <Cargando />

  return (
    <>
      <button className="boton secundario chico" style={{ alignSelf: 'flex-start' }} onClick={() => navegar('/admin/control')}>
        <ArrowLeft size={18} />
        Control
      </button>

      <section className="tarjeta fila" style={{ gap: 14 }}>
        <span className="avatar">{iniciales(ficha.nombre)}</span>
        <div style={{ minWidth: 0 }}>
          <h1>{ficha.nombre}</h1>
          <span className="mini">{ficha.activo ? 'Cuenta activa' : 'Cuenta bloqueada'}</span>
        </div>
      </section>

      <section className="tarjeta columna" style={{ gap: 0 }}>
        <h2>Cuenta</h2>
        <Dato etiqueta="Correo">{ficha.correo}</Dato>
        <Dato etiqueta="Celular">{ficha.telefono || 'Sin dato'}</Dato>
        <Dato etiqueta="Se registró">{ficha.fechaRegistro ? fechaCompleta(ficha.fechaRegistro) : 'Sin dato'}</Dato>
        <Dato etiqueta="Faltas">{ficha.faltas}</Dato>
      </section>

      {ficha.faltas > 0 && (
        <button className="boton secundario" onClick={perdonar}>
          Perdonar faltas
        </button>
      )}

      <section className="tarjeta columna" style={{ gap: 0 }}>
        <h2>Actividad</h2>
        <Dato etiqueta="Pedidos">{ficha.pedidos}</Dato>
        <Dato etiqueta="Entregados">{ficha.entregados}</Dato>
        <Dato etiqueta="Cancelados">{ficha.cancelados}</Dato>
        <Dato etiqueta="No recogidos">{ficha.noRecogidos}</Dato>
        <Dato etiqueta="Gastó en total">{soles(ficha.gastado)}</Dato>
        <Dato etiqueta="Gasto por pedido">{soles(ficha.ticketPromedio)}</Dato>
        <Dato etiqueta="Puesto favorito">{ficha.puestoFavorito || 'Sin dato'}</Dato>
        <Dato etiqueta="Último pedido">{ficha.ultimoPedido ? fechaCompleta(ficha.ultimoPedido) : 'Sin pedidos'}</Dato>
      </section>

      <section className="columna">
        <h2>Últimos pedidos</h2>
        {ficha.ultimos.length === 0 && <Vacio>Todavía no hizo pedidos.</Vacio>}
        <div className="filas">
          {ficha.ultimos.map((p) => (
            <div key={p.id} className="fila-item">
              <span className="avatar">#{p.id}</span>
              <div className="fila-item-texto">
                <b>{p.puesto}</b>
                <span className="mini">{fechaCompleta(p.fecha)}</span>
              </div>
              <div className="fila-item-lado">
                <b>{soles(p.total)}</b>
                <Estado estado={p.estado} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {ficha.reclamos.length > 0 && (
        <section className="columna">
          <h2>Reclamos</h2>
          {ficha.reclamos.map((r) => (
            <div key={r.id} className="tarjeta columna" style={{ gap: 4 }}>
              <div className="fila entre">
                <span className="mini">{fechaCompleta(r.fecha)}</span>
                <span className={'estado ' + (r.estado === 'ABIERTO' ? 'rec' : 'ok')}>{r.estado === 'ABIERTO' ? 'En revisión' : 'Resuelto'}</span>
              </div>
              <p>{r.mensaje}</p>
            </div>
          ))}
        </section>
      )}
    </>
  )
}
