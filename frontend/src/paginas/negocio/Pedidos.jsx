import { useEffect, useState } from 'react'
import { Check, Clock, Loader2, Plus, StickyNote } from 'lucide-react'
import { api } from '../../api'
import { useAviso } from '../../contexto/Aviso'
import { Cargando, Estado, Modal, Vacio } from '../../componentes/Ui'
import { ESTADOS, METODOS, avance, haceCuanto, minutosRestantes, nombreCorto, soles } from '../../util/formato'
import { useNegocio } from './Negocio'

const GRUPOS = [
  { clave: 'rec', titulo: 'Recibidos', color: 'var(--rec-solido)', vacio: 'Aquí aparecerán los pedidos nuevos' },
  { clave: 'pro', titulo: 'En proceso', color: 'var(--pro-solido)', vacio: 'Nada en la cocina por ahora' },
  { clave: 'ok', titulo: 'Listos', color: 'var(--ok-solido)', vacio: 'Ningún pedido esperando' }
]

const TIEMPOS = [5, 10, 15, 20]
const MOTIVOS = ['Se acabó un producto', 'Tengo demasiados pedidos', 'Ya estoy cerrando']

function useAhora() {
  const [ahora, setAhora] = useState(Date.now())
  useEffect(() => {
    const i = setInterval(() => setAhora(Date.now()), 15000)
    return () => clearInterval(i)
  }, [])
  return ahora
}

function useEsMovil() {
  const [movil, setMovil] = useState(() => window.innerWidth <= 860)
  useEffect(() => {
    const cambio = () => setMovil(window.innerWidth <= 860)
    window.addEventListener('resize', cambio)
    return () => window.removeEventListener('resize', cambio)
  }, [])
  return movil
}

function TarjetaPedido({ pedido, ahora }) {
  const { negocio, reemplazar, recientes } = useNegocio()
  const mostrar = useAviso()
  const [ocupado, setOcupado] = useState(false)
  const [minutos, setMinutos] = useState(pedido.tiempoPreparacion || negocio.tiempoEstimado || 15)
  const [rechazando, setRechazando] = useState(false)
  const [motivo, setMotivo] = useState(MOTIVOS[0])
  const grupo = ESTADOS[pedido.estado]?.clase

  async function ejecutar(accion, mensaje) {
    setOcupado(true)
    try {
      reemplazar(await accion())
      mostrar(mensaje)
    } catch (e) {
      mostrar(e.message)
    } finally {
      setOcupado(false)
    }
  }

  const aceptar = () =>
    ejecutar(async () => {
      await api(`/pedidos/${pedido.id}/aceptar`, { metodo: 'POST', cuerpo: { minutos } })
      return api(`/pedidos/${pedido.id}/preparar`, { metodo: 'POST' })
    }, `Pedido #${pedido.id} aceptado. ¡A cocinar!`)

  const listo = () => ejecutar(() => api(`/pedidos/${pedido.id}/listo`, { metodo: 'POST' }), `Le avisamos al cliente que el #${pedido.id} está listo`)
  const entregado = () => ejecutar(() => api(`/pedidos/${pedido.id}/recogido`, { metodo: 'POST' }), `Pedido #${pedido.id} entregado`)
  const masTiempo = () =>
    ejecutar(
      () => api(`/pedidos/${pedido.id}/tiempo`, { metodo: 'PUT', cuerpo: { minutos: (pedido.tiempoPreparacion || 15) + 5 } }),
      'Le avisamos al cliente que necesitas 5 minutos más'
    )
  const rechazar = () => {
    setRechazando(false)
    ejecutar(() => api(`/pedidos/${pedido.id}/rechazar`, { metodo: 'POST', cuerpo: { motivo } }), `Pedido #${pedido.id} rechazado. Se devolverá el dinero`)
  }

  const faltan = minutosRestantes(pedido, ahora)

  return (
    <article className={'pedido ' + (grupo === 'rec' ? 'rec ' : '') + (recientes.includes(pedido.id) ? 'nuevo-llegado' : '')}>
      <div className="fila entre">
        <span className="numero">#{pedido.id}</span>
        <Estado estado={pedido.estado} />
      </div>
      <p className="sub">
        {nombreCorto(pedido.usuario)} · {haceCuanto(pedido.fecha, ahora)}
      </p>
      <ul className="productos-pedido">
        {pedido.detalles?.map((d) => (
          <li key={d.id}>
            <span className="cantidad">{d.cantidad}</span>
            {d.producto?.nombre}
          </li>
        ))}
      </ul>
      {pedido.notas && (
        <div className="aviso alerta">
          <StickyNote size={18} />
          {pedido.notas}
        </div>
      )}
      <div className="fila entre">
        <span className="sub">Pagado con {METODOS[pedido.pago?.metodo] || 'app'}</span>
        <h3>{soles(pedido.total)}</h3>
      </div>

      {grupo === 'rec' && (
        <>
          <span className="sub">¿En cuánto estará listo?</span>
          <div className="tiempos">
            {TIEMPOS.map((m) => (
              <button key={m} className={minutos === m ? 'activo' : ''} onClick={() => setMinutos(m)}>
                {m} min
              </button>
            ))}
          </div>
          <button className="boton principal ancho" onClick={aceptar} disabled={ocupado}>
            {ocupado ? <Loader2 className="giro" size={22} /> : <Check size={22} />}
            Aceptar · {minutos} min
          </button>
          <button className="boton peligro ancho chico" onClick={() => setRechazando(true)} disabled={ocupado}>
            Rechazar
          </button>
        </>
      )}

      {grupo === 'pro' && (
        <>
          <div className="fila entre">
            <span className="sub fila" style={{ gap: 6 }}>
              <Clock size={16} />
              {faltan === null ? 'Preparando' : faltan > 0 ? `Faltan ${faltan} min` : `Atrasado ${Math.abs(faltan)} min`}
            </span>
            <button className="boton secundario chico" onClick={masTiempo} disabled={ocupado}>
              <Plus size={16} />5 min
            </button>
          </div>
          <div className={'progreso' + (faltan !== null && faltan < 0 ? ' tarde' : '')}>
            <div style={{ width: `${Math.round(avance(pedido, ahora) * 100)}%` }} />
          </div>
          <button className="boton listo ancho" onClick={listo} disabled={ocupado}>
            {ocupado ? <Loader2 className="giro" size={22} /> : <Check size={22} />}
            Ya está listo
          </button>
        </>
      )}

      {grupo === 'ok' && (
        <>
          <div className="aviso info">Entrega al decir #{pedido.id}</div>
          <button className="boton principal ancho" onClick={entregado} disabled={ocupado}>
            {ocupado ? <Loader2 className="giro" size={22} /> : <Check size={22} />}
            Entregado al cliente
          </button>
        </>
      )}

      {rechazando && (
        <Modal titulo={`¿Rechazar el pedido #${pedido.id}?`} alCerrar={() => setRechazando(false)}>
          <p className="sub">¿Por qué?</p>
          <div className="lista" role="radiogroup">
            {MOTIVOS.map((m) => (
              <label key={m} className="tarjeta casilla" style={{ cursor: 'pointer', color: 'var(--t1)' }}>
                <input type="radio" name={`motivo-${pedido.id}`} checked={motivo === m} onChange={() => setMotivo(m)} />
                {m}
              </label>
            ))}
          </div>
          <div className="dos">
            <button className="boton secundario" onClick={() => setRechazando(false)}>
              Volver
            </button>
            <button className="boton peligro" onClick={rechazar}>
              Sí, rechazar
            </button>
          </div>
        </Modal>
      )}
    </article>
  )
}

export default function PedidosNegocio() {
  const { negocio, pedidos, cargandoPedidos, setAlerta } = useNegocio()
  const [filtro, setFiltro] = useState('')
  const ahora = useAhora()
  const movil = useEsMovil()

  useEffect(() => {
    setAlerta(false)
  }, [setAlerta])

  const de = (clave) =>
    pedidos
      .filter((p) => ESTADOS[p.estado]?.clase === clave)
      .sort((a, b) => (clave === 'rec' ? b.id - a.id : a.id - b.id))

  return (
    <>
      <h1>Pedidos de hoy</h1>
      {!negocio.abierto && <div className="aviso alerta">Tu puesto está cerrado. Toca “Cerrado” para abrir.</div>}

      <div className="contadores">
        {GRUPOS.map((g) => (
          <button
            key={g.clave}
            className={'contador' + (movil && filtro === g.clave ? ' marcado' : '')}
            onClick={() => setFiltro(filtro === g.clave ? '' : g.clave)}
          >
            <b style={{ color: g.color }}>{de(g.clave).length}</b>
            {g.titulo}
          </button>
        ))}
      </div>

      {cargandoPedidos ? (
        <Cargando />
      ) : movil ? (
        <div className="lista">
          {GRUPOS.filter((g) => !filtro || filtro === g.clave)
            .flatMap((g) => de(g.clave))
            .map((p) => (
              <TarjetaPedido key={p.id} pedido={p} ahora={ahora} />
            ))}
          {pedidos.length === 0 && <Vacio>Sin pedidos por ahora. Sonará un aviso.</Vacio>}
        </div>
      ) : (
        <div className="columnas">
          {GRUPOS.map((g) => (
            <section key={g.clave} className="lista">
              <div className="columna-cab" style={{ borderColor: g.color }}>
                <span>{g.titulo}</span>
                <span className={'estado ' + g.clave}>{de(g.clave).length}</span>
              </div>
              {de(g.clave).map((p) => (
                <TarjetaPedido key={p.id} pedido={p} ahora={ahora} />
              ))}
              {de(g.clave).length === 0 && <Vacio>{g.vacio}</Vacio>}
            </section>
          ))}
        </div>
      )}
    </>
  )
}
