import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Check } from 'lucide-react'
import { api } from '../../api'
import { useAviso } from '../../contexto/Aviso'
import BarrasSemana from '../../componentes/BarrasSemana'
import Calificar from '../../componentes/Calificar'
import Cuenta from '../../componentes/Cuenta'
import { BotonCarga, Cargando, Error, Estado, Modal, Vacio } from '../../componentes/Ui'
import { METODOS, esActivo, fechaCompleta, fechaCorta, minutosRestantes, soles } from '../../util/formato'
import { useCliente } from './Cliente'

const PASOS = ['Recibido', 'En proceso', 'Listo', 'Recogido']

function pasoDe(estado) {
  return { PENDIENTE: 0, ESPERANDO_PAGO: 0, ACEPTADO: 1, EN_PREPARACION: 1, LISTO_PARA_RECOGER: 2, RECOGIDO: 3 }[estado] ?? -1
}

function esEfectivo(pedido) {
  return pedido.pago?.metodo === 'EFECTIVO'
}

function textoPago(pedido) {
  if (esEfectivo(pedido)) {
    if (pedido.estado === 'CANCELADO' || pedido.estado === 'NO_RECOGIDO') return 'Sin cobro'
    return pedido.estado === 'RECOGIDO' ? 'Pagado al recoger' : 'Pagas al recoger'
  }
  if (pedido.pago?.estado === 'PENDIENTE') return 'Por pagar'
  if (pedido.pago?.estado === 'FALLIDO') return 'Sin cobro'
  return pedido.pago?.estado === 'REEMBOLSADO' ? 'Reembolsado' : 'Pagado'
}

function mensaje(pedido) {
  if (pedido.estado === 'PENDIENTE') return 'Esperando que el puesto acepte tu pedido'
  if (pedido.estado === 'ESPERANDO_PAGO') return pedido.pagoObservado
      ? 'El puesto no encontró tu pago. Muestra tu comprobante en el puesto'
      : pedido.pagoAvisado
        ? 'Esperando que el puesto confirme tu pago'
        : '¡Aceptado! Paga para que lo preparen'
  if (pedido.estado === 'LISTO_PARA_RECOGER') return '¡Listo! Acércate y di tu código'
  if (pedido.estado === 'RECOGIDO') return '¡Buen provecho! Gracias por usar PideCerca'
  if (pedido.estado === 'NO_RECOGIDO') return 'No recogiste tu pedido a tiempo'
  if (pedido.estado === 'CANCELADO') return pedido.motivoCancelacion ? `${pedido.motivoCancelacion}. ${pedido.pago?.estado === 'REEMBOLSADO' ? 'Te devolvimos tu dinero' : 'No se te cobró nada'}` : 'Pedido cancelado'
  const faltan = minutosRestantes(pedido)
  if (faltan === null) return 'Tu pedido se está preparando'
  return faltan > 0 ? `Estará listo en unos ${faltan} min` : 'Ya casi está listo'
}

function PagarPedido({ pedido, alActualizar }) {
  const mostrar = useAviso()
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  const [referencia, setReferencia] = useState('')
  const datos = pedido.datosPago
  const billetera = METODOS[datos.metodo] || datos.metodo
  const numero = datos.numero || ''
  const formateado = `${numero.slice(0, 3)} ${numero.slice(3, 6)} ${numero.slice(6)}`.trim()

  async function copiar() {
    try {
      await navigator.clipboard.writeText(numero)
      mostrar('Número copiado')
    } catch {
      mostrar(`No se pudo copiar. Anótalo: ${formateado}`)
    }
  }

  async function avisar(e) {
    e.preventDefault()
    setError('')
    setEnviando(true)
    try {
      alActualizar(await api(`/pedidos/${pedido.id}/avisar-pago`, { metodo: 'POST', cuerpo: { referencia } }))
      mostrar('Avisamos al puesto. Espera su confirmación')
    } catch (err) {
      setError(err.message)
    } finally {
      setEnviando(false)
    }
  }

  if (pedido.pagoAvisado) {
    return (
      <section className="tarjeta columna comprobante" style={{ gap: 0 }}>
        <h2>Mi comprobante</h2>
        <p className="mini" style={{ marginBottom: 8 }}>
          Si el puesto te lo pide, muéstrale esta pantalla.
        </p>
        <div className="ficha-dato">
          <span>Pedido</span>
          <b>#{pedido.id}</b>
        </div>
        <div className="ficha-dato">
          <span>Puesto</span>
          <b>{pedido.negocio?.nombre}</b>
        </div>
        <div className="ficha-dato">
          <span>Monto</span>
          <b>{soles(datos.monto)}</b>
        </div>
        <div className="ficha-dato">
          <span>Pagado por</span>
          <b>{billetera}</b>
        </div>
        <div className="ficha-dato">
          <span>N.º de operación</span>
          <b>{pedido.referenciaPago}</b>
        </div>
        <div className="ficha-dato">
          <span>Avisaste a las</span>
          <b>{fechaCompleta(pedido.fechaAvisoPago)}</b>
        </div>
        {pedido.pagoObservado ? (
          <div className="aviso alerta" style={{ marginTop: 12 }}>
            El puesto no encontró tu pago. Si ya pagaste, muestra este comprobante en el puesto.
          </div>
        ) : (
          <div className="aviso info" style={{ marginTop: 12 }}>
            Avisamos al puesto. Espera a que confirme tu pago.
          </div>
        )}
      </section>
    )
  }

  return (
    <form className="tarjeta columna" style={{ gap: 0 }} onSubmit={avisar}>
      <h2>Paga con {billetera}</h2>
      <div className="ficha-dato">
        <span>A nombre de</span>
        <b className="fila" style={{ gap: 8, justifyContent: 'flex-end' }}>
          {datos.nombre}
          {datos.verificado && <span className="estado ok">Verificado</span>}
        </b>
      </div>
      <div className="ficha-dato">
        <span>Número</span>
        <b className="fila" style={{ gap: 8 }}>
          {formateado}
          <button type="button" className="boton chico secundario" onClick={copiar}>
            Copiar
          </button>
        </b>
      </div>
      <div className="ficha-dato">
        <span>Monto</span>
        <b>{soles(datos.monto)}</b>
      </div>
      <span className="mini" style={{ margin: '8px 0 14px' }}>
        Antes de pagar, revisa que el nombre sea el mismo.
      </span>
      <div className="campo">
        <label htmlFor="operacion">Número de operación</label>
        <input id="operacion" inputMode="numeric" autoComplete="off" maxLength={20} placeholder="Lo ves en tu billetera después de pagar" value={referencia} onChange={(e) => setReferencia(e.target.value)} />
      </div>
      <div style={{ marginTop: 14 }}>
        <Error>{error}</Error>
        <BotonCarga cargando={enviando} disabled={referencia.trim().length < 4}>
          Ya pagué
        </BotonCarga>
      </div>
    </form>
  )
}

export function SeguimientoPedido() {
  const { id } = useParams()
  const navegar = useNavigate()
  const mostrar = useAviso()
  const { version, agregarVarios } = useCliente()
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
      mostrar('Pedido cancelado. No se te cobró nada')
    } catch (e) {
      setError(e.message)
    }
  }

  if (!pedido) return error ? <Error>{error}</Error> : <Cargando />

  const paso = pasoDe(pedido.estado)

  function volverAPedir() {
    agregarVarios(pedido.negocio, (pedido.detalles || []).map((d) => ({ producto: d.producto, cantidad: d.cantidad })))
    navegar('/carrito')
  }

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
        {pedido.estado === 'PENDIENTE' && <Cuenta limite={pedido.limiteAceptar} texto="Responde en" />}
        {pedido.estado === 'LISTO_PARA_RECOGER' && <Cuenta limite={pedido.limiteRecoger} texto="Recógelo en" />}
        {pedido.estado === 'ESPERANDO_PAGO' && !pedido.pagoAvisado && <Cuenta limite={pedido.limitePago} texto="Tienes" />}
        {pedido.codigo && esActivo(pedido.estado) && (
          <div className="codigo-entrega">
            <span>Código de entrega</span>
            <div className="codigo-digitos" aria-label={'Código ' + pedido.codigo}>
              {pedido.codigo.split('').map((d, i) => (
                <b key={i}>{d}</b>
              ))}
            </div>
          </div>
        )}
      </section>

      {!['CANCELADO', 'NO_RECOGIDO'].includes(pedido.estado) && (
        <div className="pasos" aria-label="Avance del pedido">
          {PASOS.map((texto, i) => (
            <div key={texto} className={'paso' + (i <= paso ? ' hecho' : '') + (i < paso ? ' sigue' : '')}>
              <i>{i <= paso ? <Check size={16} /> : i + 1}</i>
              {texto}
            </div>
          ))}
        </div>
      )}

      {pedido.estado === 'ESPERANDO_PAGO' && pedido.datosPago && <PagarPedido pedido={pedido} alActualizar={setPedido} />}

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
            {METODOS[pedido.pago?.metodo] || 'Pago'} · {textoPago(pedido)}
          </span>
          <h2>{soles(pedido.total)}</h2>
        </div>
      </section>

      {pedido.estado === 'RECOGIDO' && <Calificar pedidoId={pedido.id} />}

      <Error>{error}</Error>

      {!esActivo(pedido.estado) && (
        <button className="boton secundario ancho" onClick={volverAPedir}>
          Volver a pedir
        </button>
      )}

      {(pedido.estado === 'PENDIENTE' || (pedido.estado === 'ESPERANDO_PAGO' && !pedido.pagoAvisado)) && (
        <button className="boton peligro ancho" onClick={() => setCancelando(true)}>
          Cancelar pedido
        </button>
      )}

      {cancelando && (
        <Modal titulo="¿Cancelar tu pedido?" alCerrar={() => setCancelando(false)}>
          <p className="sub">Puedes cancelar mientras no hayas pagado. No se te cobrará nada.</p>
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
        <section className="tarjeta columna">
          <div className="fila entre">
            <h2>Tus gastos</h2>
            <span className="mini">Últimos 7 días</span>
          </div>
          <BarrasSemana
            pedidos={pedidos.filter((p) => p.estado === 'RECOGIDO')}
            verbo="Gastaste"
            nombreDe={(p) => p.negocio?.nombre}
            alAbrir={(p) => navegar(`/pedido/${p.id}`)}
          />
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
