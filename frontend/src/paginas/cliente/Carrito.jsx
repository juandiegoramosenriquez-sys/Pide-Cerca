import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { api } from '../../api'
import { useAviso } from '../../contexto/Aviso'
import { BotonCarga, Error, Vacio } from '../../componentes/Ui'
import { METODOS, distancia, soles } from '../../util/formato'
import { BILLETERAS } from '../../util/metodos'
import { AVISO_METROS, aPie, metrosAlPuesto, puntoGuardado } from '../../util/ubicacion'
import { useCliente } from './Cliente'

function usePuesto(id) {
  const [datos, setDatos] = useState({ abierto: true, negocio: null })
  useEffect(() => {
    if (!id) return
    let vigente = true
    const revisar = () =>
      api(`/negocios/${id}`)
        .then((n) => vigente && setDatos({ abierto: Boolean(n.abierto), negocio: n }))
        .catch(() => null)
    revisar()
    const intervalo = setInterval(revisar, 10000)
    return () => {
      vigente = false
      clearInterval(intervalo)
    }
  }, [id])
  return datos
}

function AvisoLejos({ metros, muyLejos, limite }) {
  return (
    <div className={'aviso columna ' + (muyLejos ? 'error' : 'alerta')} style={{ gap: 2, alignItems: 'flex-start' }}>
      <b>{muyLejos ? 'Este puesto está muy lejos' : `Este puesto está a ${distancia(metros)}`}</b>
      <span>
        {muyLejos
          ? `Está a ${distancia(metros)}, unos ${aPie(metros)} a pie. Pide en un puesto a menos de ${distancia(limite)}.`
          : `Son unos ${aPie(metros)} a pie. Revisa que te quede bien antes de pagar.`}
      </span>
    </div>
  )
}

function AvisoCerrado() {
  return (
    <div className="aviso error columna" style={{ gap: 2, alignItems: 'flex-start' }}>
      <b>Este puesto cerró</b>
      <span>No se te cobró nada. Prueba con otro puesto cercano.</span>
    </div>
  )
}

const OPCIONES_PAGO = [
  ...BILLETERAS.map((b) => ({ clave: b.codigo, detalle: 'Pagas cuando el puesto acepte tu pedido' })),
  { clave: 'EFECTIVO', detalle: 'Pagas al recoger' }
]

function recibe(puesto, clave) {
  if (!puesto) return true
  return clave === 'EFECTIVO' ? puesto.aceptaEfectivo !== false : (puesto.metodosDigitales || []).includes(clave)
}

export default function Carrito() {
  const navegar = useNavigate()
  const mostrar = useAviso()
  const { carrito, cantidad, total, cambiar, vaciar, setNotas, revisar, ajustes } = useCliente()
  const [faltas, setFaltas] = useState(0)
  const [paso, setPaso] = useState('carrito')
  const [metodo, setMetodo] = useState('YAPE')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  const { abierto, negocio: puesto } = usePuesto(carrito.negocio?.id)
  const opciones = OPCIONES_PAGO.filter((o) => recibe(puesto, o.clave))
  const metros = metrosAlPuesto(puesto || carrito.negocio)
  const muyLejos = metros !== null && metros > ajustes.distanciaMaximaMetros
  const lejos = metros !== null && metros > AVISO_METROS && !muyLejos
  const puedePagar = abierto && !muyLejos
  const efectivoBloqueado = faltas >= ajustes.faltasBloqueanEfectivo

  useEffect(() => {
    api('/auth/me')
      .then((u) => setFaltas(u.faltas || 0))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (efectivoBloqueado && metodo === 'EFECTIVO') setMetodo(opciones.find((o) => o.clave !== 'EFECTIVO')?.clave || 'EFECTIVO')
  }, [efectivoBloqueado, metodo])

  useEffect(() => {
    if (puesto && opciones.length && !opciones.some((o) => o.clave === metodo)) setMetodo(opciones[0].clave)
  }, [puesto])

  if (!carrito.items.length) {
    return (
      <>
        <h1>Tu carrito</h1>
        <Vacio>Tu carrito está vacío. Elige un puesto cercano y agrega lo que se te antoje.</Vacio>
        <button className="boton principal" onClick={() => navegar('/')}>
          Ver puestos cercanos
        </button>
      </>
    )
  }

  async function pagar() {
    setError('')
    setEnviando(true)
    try {
      const pedido = await api('/pedidos', {
        metodo: 'POST',
        cuerpo: {
          negocioId: carrito.negocio.id,
          latitud: puntoGuardado()?.lat,
          longitud: puntoGuardado()?.lng,
          metodoPago: metodo,
          notas: carrito.notas,
          items: carrito.items.map((i) => ({ productoId: i.producto.id, cantidad: i.cantidad }))
        }
      })
      vaciar()
      revisar()
      mostrar('¡Pedido enviado!')
      navegar(`/pedido/${pedido.id}`, { replace: true })
    } catch (e) {
      setError(e.message)
      setEnviando(false)
    }
  }

  const resumen = (
    <section className="tarjeta columna" style={{ gap: 8 }}>
      <div className="fila entre">
        <span className="sub">Productos</span>
        <span>{cantidad}</span>
      </div>
      <div className="fila entre">
        <span className="sub">Recojo en el puesto</span>
        <span>Gratis</span>
      </div>
      <div className="fila entre">
        <h2>Total</h2>
        <span className="numero">{soles(total)}</span>
      </div>
    </section>
  )

  if (paso === 'pago') {
    return (
      <>
        <button className="boton secundario chico" style={{ alignSelf: 'flex-start' }} onClick={() => setPaso('carrito')}>
          <ArrowLeft size={18} />
          Volver al carrito
        </button>
        <h1>¿Cómo quieres pagar?</h1>
        <div className="lista" role="radiogroup" aria-label="Método de pago">
          {opciones.map((o) => (
            <button
              key={o.clave}
              role="radio"
              aria-checked={metodo === o.clave}
              className="tarjeta tocable fila"
              style={{ gap: 14, borderWidth: metodo === o.clave ? 2 : 1, borderColor: metodo === o.clave ? 'var(--acento)' : undefined }}
              onClick={() => !(o.clave === 'EFECTIVO' && efectivoBloqueado) && setMetodo(o.clave)}
              disabled={o.clave === 'EFECTIVO' && efectivoBloqueado}
            >
              <span
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  border: '2px solid ' + (metodo === o.clave ? 'var(--acento)' : 'var(--t3)'),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                {metodo === o.clave && <span style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--acento)' }} />}
              </span>
              <span>
                <h3>{METODOS[o.clave]}</h3>
                <span className="mini">{o.clave === 'EFECTIVO' && efectivoBloqueado ? 'No disponible: no recogiste pedidos antes' : o.detalle}</span>
              </span>
            </button>
          ))}
        </div>
        <div className="aviso info">
          {metodo === 'EFECTIVO'
            ? 'Pagas en efectivo cuando recojas tu pedido.'
            : 'No pagas ahora. Cuando el puesto acepte tu pedido te mostraremos a quién pagar.'}
        </div>
        {resumen}
        {!abierto && <AvisoCerrado />}
        {abierto && muyLejos && <AvisoLejos metros={metros} muyLejos limite={ajustes.distanciaMaximaMetros} />}
        {puedePagar && <Error>{error}</Error>}
        {puedePagar ? (
          <BotonCarga cargando={enviando} onClick={pagar}>
            Hacer pedido · {soles(total)}
          </BotonCarga>
        ) : (
          <button className="boton principal ancho" onClick={() => navegar('/')}>
            Ver otros puestos
          </button>
        )}
      </>
    )
  }

  return (
    <>
      <div>
        <h1>Tu carrito</h1>
        <p className="sub">{carrito.negocio?.nombre}</p>
      </div>
      <div className="lista">
        {carrito.items.map((i) => (
          <div key={i.producto.id} className="tarjeta fila" style={{ gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3>{i.producto.nombre}</h3>
              <span className="precio">{soles(i.producto.precio * i.cantidad)}</span>
            </div>
            <div className="selector">
              <button onClick={() => cambiar(i.producto.id, -1)} aria-label={`Quitar un ${i.producto.nombre}`}>−</button>
              <span>{i.cantidad}</span>
              <button
                onClick={() => cambiar(i.producto.id, 1)}
                disabled={i.cantidad >= ajustes.maxPorProducto || cantidad >= ajustes.maxPorPedido}
                aria-label={`Agregar un ${i.producto.nombre}`}
              >
                +
              </button>
            </div>
            <button className="boton-icono" onClick={() => cambiar(i.producto.id, -i.cantidad)} aria-label={`Quitar ${i.producto.nombre}`}>
              <Trash2 size={20} />
            </button>
          </div>
        ))}
      </div>
      <span className="mini">Máximo {ajustes.maxPorProducto} por producto y {ajustes.maxPorPedido} por pedido.</span>
      <div className="campo">
        <label htmlFor="notas">Nota para el puesto (opcional)</label>
        <textarea id="notas" placeholder="Sin cebolla, con harta crema…" value={carrito.notas} onChange={(e) => setNotas(e.target.value)} />
      </div>
      {resumen}
      {!abierto && <AvisoCerrado />}
      {abierto && (muyLejos || lejos) && <AvisoLejos metros={metros} muyLejos={muyLejos} limite={ajustes.distanciaMaximaMetros} />}
      {puedePagar ? (
        <>
          <button className="boton principal ancho" onClick={() => setPaso('pago')}>
            Continuar al pago · {soles(total)}
          </button>
          {lejos && (
            <button className="boton secundario ancho" onClick={() => navegar('/')}>
              Buscar uno más cerca
            </button>
          )}
        </>
      ) : (
        <button className="boton principal ancho" onClick={() => navegar('/')}>
          Ver otros puestos
        </button>
      )}
    </>
  )
}
