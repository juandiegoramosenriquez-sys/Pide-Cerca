import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Check } from 'lucide-react'
import { api } from '../../api'
import { useAviso } from '../../contexto/Aviso'
import { Cargando, Error, Estado, Modal, Vacio } from '../../componentes/Ui'
import { METODOS, esActivo, fechaCorta, minutosRestantes, soles } from '../../util/formato'
import { useCliente } from './Cliente'

const PASOS = ['Recibido', 'En proceso', 'Listo', 'Recogido']

function pasoDe(estado) {
  return { PENDIENTE: 0, ACEPTADO: 1, EN_PREPARACION: 1, LISTO_PARA_RECOGER: 2, RECOGIDO: 3 }[estado] ?? -1
}

function mensaje(pedido) {
  if (pedido.estado === 'PENDIENTE') return 'Esperando que el puesto acepte tu pedido'
  if (pedido.estado === 'LISTO_PARA_RECOGER') return '¡Listo! Acércate al puesto y di tu número'
  if (pedido.estado === 'RECOGIDO') return '¡Buen provecho! Gracias por usar PideCerca'
  if (pedido.estado === 'CANCELADO') return pedido.motivoCancelacion ? `Cancelado: ${pedido.motivoCancelacion}` : 'Pedido cancelado'
  const faltan = minutosRestantes(pedido)
  if (faltan === null) return 'Tu pedido se está preparando'
  return faltan > 0 ? `Estará listo en unos ${faltan} min` : 'Ya casi está listo'
}

export function SeguimientoPedido() {
  const { id } = useParams()
  const navegar = useNavigate()
  const mostrar = useAviso()
  const { version } = useCliente()
  const [pedido, setPedido] = useState(null)
  const [error, setError] = useState('')
  const [cancelando, setCancelando] = useState(false)

  useEffect(() => {
    let vigente = true
    async function cargar() {
      try {
        const p = await api(`/pedidos/${id}`)
        if (vigente) {
          setPedido(p)
          setError('')
        }
      } catch (e) {
        if (vigente) setError(e.message)
      }
    }
    cargar()
    const intervalo = setInterval(cargar, 8000)
    return () => {
      vigente = false
      clearInterval(intervalo)
    }
  }, [id, version])

  async function cancelar() {
    setCancelando(false)
    try {
      setPedido(await api(`/pedidos/${id}/cancelar`, { metodo: 'POST' }))
      mostrar('Pedido cancelado. Te devolveremos tu dinero')
    } catch (e) {
      setError(e.message)
    }
  }

  if (!pedido) return error ? <Error>{error}</Error> : <Cargando />

  const paso = pasoDe(pedido.estado)

  return (
    <>
      <button className="boton secundario chico" style={{ alignSelf: 'flex-start' }} onClick={() => navegar('/pedidos')}>
        <ArrowLeft size={18} />
        Mis pedidos
      </button>

      <section className="destacada columna" style={{ alignItems: 'center', textAlign: 'center', gap: 6 }}>
        <span style={{ opacity: 0.9 }}>Número de pedido</span>
        <span className="numero-grande" style={{ fontSize: 56 }}>#{pedido.id}</span>
        <Estado estado={pedido.estado} />
        <p style={{ fontWeight: 700, marginTop: 4 }}>{mensaje(pedido)}</p>
      </section>

      {pedido.estado !== 'CANCELADO' && (
        <div className="pasos" aria-label="Avance del pedido">
          {PASOS.map((texto, i) => (
            <div key={texto} className={'paso' + (i <= paso ? ' hecho' : '') + (i < paso ? ' sigue' : '')}>
              <i>{i <= paso ? <Check size={16} /> : i + 1}</i>
              {texto}
            </div>
          ))}
        </div>
      )}

      <section className="tarjeta columna" style={{ gap: 4 }}>
        <h2>{pedido.negocio?.nombre}</h2>
        {pedido.negocio?.direccion && <p className="sub">{pedido.negocio.direccion}</p>}
        {pedido.negocio?.telefono && <p className="mini">Tel. {pedido.negocio.telefono}</p>}
      </section>

      <section className="tarjeta columna">
        <ul className="productos-pedido">
          {pedido.detalles?.map((d) => (
            <li key={d.id}>
              <span className="cantidad">{d.cantidad}</span>
              <span style={{ flex: 1 }}>{d.producto?.nombre}</span>
              <span className="sub">{soles(d.subtotal)}</span>
            </li>
          ))}
        </ul>
        {pedido.notas && <p className="mini">Nota: {pedido.notas}</p>}
        <div className="fila entre">
          <span className="sub">
            {METODOS[pedido.pago?.metodo] || 'Pago'} · {pedido.pago?.estado === 'REEMBOLSADO' ? 'Reembolsado' : 'Pagado'}
          </span>
          <h2>{soles(pedido.total)}</h2>
        </div>
      </section>

      <Error>{error}</Error>

      {pedido.estado === 'PENDIENTE' && (
        <button className="boton peligro ancho" onClick={() => setCancelando(true)}>
          Cancelar pedido
        </button>
      )}

      {cancelando && (
        <Modal titulo="¿Cancelar tu pedido?" alCerrar={() => setCancelando(false)}>
          <p className="sub">Solo puedes cancelar mientras el puesto no lo acepte. Te devolveremos tu dinero.</p>
          <div className="dos">
            <button className="boton secundario" onClick={() => setCancelando(false)}>
              No, mantener
            </button>
            <button className="boton peligro" onClick={cancelar}>
              Sí, cancelar
            </button>
          </div>
        </Modal>
      )}
    </>
  )
}

export function MisPedidos() {
  const navegar = useNavigate()
  const { version } = useCliente()
  const [pedidos, setPedidos] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api('/pedidos/mios')
      .then(setPedidos)
      .catch((e) => setError(e.message))
  }, [version])

  if (!pedidos) return error ? <Error>{error}</Error> : <Cargando />

  const activos = pedidos.filter((p) => esActivo(p.estado))
  const anteriores = pedidos.filter((p) => !esActivo(p.estado))

  function Tarjeta({ p }) {
    return (
      <button className="tarjeta tocable columna" style={{ gap: 6 }} onClick={() => navegar(`/pedido/${p.id}`)}>
        <div className="fila entre">
          <span className="fila" style={{ gap: 10, minWidth: 0 }}>
            <span className="numero" style={{ fontSize: 24 }}>#{p.id}</span>
            <h3 style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.negocio?.nombre}</h3>
          </span>
          <Estado estado={p.estado} />
        </div>
        <span className="sub">{p.detalles?.map((d) => `${d.cantidad} ${d.producto?.nombre}`).join(', ')}</span>
        <div className="fila entre">
          <span className="mini">{fechaCorta(p.fecha)}</span>
          <b>{soles(p.total)}</b>
        </div>
      </button>
    )
  }

  return (
    <>
      <h1>Mis pedidos</h1>
      {pedidos.length === 0 && <Vacio>Aún no tienes pedidos. Cuando hagas el primero aparecerá aquí.</Vacio>}
      {activos.length > 0 && (
        <section className="columna">
          <h2>En curso</h2>
          {activos.map((p) => (
            <Tarjeta key={p.id} p={p} />
          ))}
        </section>
      )}
      {anteriores.length > 0 && (
        <section className="columna">
          <h2>Anteriores</h2>
          {anteriores.map((p) => (
            <Tarjeta key={p.id} p={p} />
          ))}
        </section>
      )}
    </>
  )
}
