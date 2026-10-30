import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { api } from '../../api'
import { useAviso } from '../../contexto/Aviso'
import { BotonCarga, Error, Vacio } from '../../componentes/Ui'
import { METODOS, soles } from '../../util/formato'
import { useCliente } from './Cliente'

function usePuestoAbierto(id) {
  const [abierto, setAbierto] = useState(true)
  useEffect(() => {
    if (!id) return
    let vigente = true
    const revisar = () =>
      api(`/negocios/${id}`)
        .then((n) => vigente && setAbierto(Boolean(n.abierto)))
        .catch(() => null)
    revisar()
    const intervalo = setInterval(revisar, 10000)
    return () => {
      vigente = false
      clearInterval(intervalo)
    }
  }, [id])
  return abierto
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
  { clave: 'YAPE', detalle: 'Paga con tu celular' },
  { clave: 'PLIN', detalle: 'Paga con tu celular' },
  { clave: 'TARJETA', detalle: 'Débito o crédito' },
  { clave: 'EFECTIVO', detalle: 'Pagas al recoger' }
]

export default function Carrito() {
  const navegar = useNavigate()
  const mostrar = useAviso()
  const { carrito, cantidad, total, cambiar, vaciar, setNotas, revisar } = useCliente()
  const [paso, setPaso] = useState('carrito')
  const [metodo, setMetodo] = useState('YAPE')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  const abierto = usePuestoAbierto(carrito.negocio?.id)

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
          {OPCIONES_PAGO.map((o) => (
            <button
              key={o.clave}
              role="radio"
              aria-checked={metodo === o.clave}
              className="tarjeta tocable fila"
              style={{ gap: 14, borderWidth: metodo === o.clave ? 2 : 1, borderColor: metodo === o.clave ? 'var(--acento)' : undefined }}
              onClick={() => setMetodo(o.clave)}
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
                <span className="mini">{o.detalle}</span>
              </span>
            </button>
          ))}
        </div>
        <div className="aviso info">Pago de prueba: no se cobra dinero real.</div>
        {resumen}
        {abierto ? <Error>{error}</Error> : <AvisoCerrado />}
        {abierto ? (
          <BotonCarga cargando={enviando} onClick={pagar}>
            Pagar {soles(total)}
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
              <button onClick={() => cambiar(i.producto.id, 1)} aria-label={`Agregar un ${i.producto.nombre}`}>+</button>
            </div>
            <button className="boton-icono" onClick={() => cambiar(i.producto.id, -i.cantidad)} aria-label={`Quitar ${i.producto.nombre}`}>
              <Trash2 size={20} />
            </button>
          </div>
        ))}
      </div>
      <div className="campo">
        <label htmlFor="notas">Nota para el puesto (opcional)</label>
        <textarea id="notas" placeholder="Sin cebolla, con harta crema…" value={carrito.notas} onChange={(e) => setNotas(e.target.value)} />
      </div>
      {resumen}
      {!abierto && <AvisoCerrado />}
      {abierto ? (
        <button className="boton principal ancho" onClick={() => setPaso('pago')}>
          Continuar al pago · {soles(total)}
        </button>
      ) : (
        <button className="boton principal ancho" onClick={() => navegar('/')}>
          Ver otros puestos
        </button>
      )}
    </>
  )
}
