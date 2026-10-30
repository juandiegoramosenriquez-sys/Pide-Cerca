import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CalendarClock, Clock, MapPin, Navigation, Plus, X } from 'lucide-react'
import { api } from '../../api'
import { useAviso } from '../../contexto/Aviso'
import { Foto } from '../../componentes/Foto'
import Mapa, { enlaceComoLlegar } from '../../componentes/Mapa'
import { urlImagen } from '../../util/imagen'
import { Cargando, Error, Modal } from '../../componentes/Ui'
import { haceCuanto, horarioTexto, iniciales, soles } from '../../util/formato'

function puntoGuardado() {
  try {
    const p = JSON.parse(localStorage.getItem('pidecerca_punto'))
    return p && p.nombre === 'Mi ubicación' ? p : null
  } catch {
    return null
  }
}
import { useCliente } from './Cliente'

export default function Puesto() {
  const { id } = useParams()
  const navegar = useNavigate()
  const mostrar = useAviso()
  const { carrito, agregar } = useCliente()
  const [negocio, setNegocio] = useState(null)
  const [productos, setProductos] = useState([])
  const [error, setError] = useState('')
  const [categoria, setCategoria] = useState('')
  const [elegido, setElegido] = useState(null)
  const [cuantos, setCuantos] = useState(1)
  const [pendiente, setPendiente] = useState(null)
  const [ver, setVer] = useState(null)

  useEffect(() => {
    Promise.all([api(`/negocios/${id}`), api(`/productos/negocio/${id}`)])
      .then(([n, p]) => {
        setNegocio(n)
        setProductos(p)
      })
      .catch((e) => setError(e.message))
  }, [id])

  useEffect(() => {
    const intervalo = setInterval(() => {
      api(`/negocios/${id}`)
        .then(setNegocio)
        .catch(() => {})
    }, 15000)
    return () => clearInterval(intervalo)
  }, [id])

  const categorias = useMemo(() => [...new Set(productos.map((p) => p.categoria?.nombre || 'Otros'))], [productos])
  const visibles = productos.filter((p) => !categoria || (p.categoria?.nombre || 'Otros') === categoria)

  function intentarAgregar(producto, cantidad) {
    if (carrito.negocio && carrito.negocio.id !== negocio.id && carrito.items.length) {
      setPendiente({ producto, cantidad })
      return
    }
    agregar(negocio, producto, cantidad)
    mostrar(`${cantidad} × ${producto.nombre} al carrito`)
  }

  if (error && !negocio) return <Error>{error}</Error>
  if (!negocio) return <Cargando />

  const puedePedir = negocio.abierto
  const fotoAvatar = urlImagen(negocio.imagen)
  const duena = negocio.propietario?.nombre

  return (
    <>
      <button className="boton secundario chico" style={{ alignSelf: 'flex-start' }} onClick={() => navegar(-1)}>
        <ArrowLeft size={18} />
        Volver
      </button>

      <section className="destacada columna" style={{ gap: 8 }}>
        {negocio.imagen && (
          <button type="button" className="portada-boton" onClick={() => setVer(urlImagen(negocio.imagen))} aria-label="Ver foto del puesto">
            <img className="portada" src={urlImagen(negocio.imagen)} alt="" />
          </button>
        )}
        <div className="fila" style={{ gap: 14 }}>
          <button
            type="button"
            className={'avatar-puesto' + (fotoAvatar ? ' con-foto' : '')}
            onClick={() => fotoAvatar && setVer(fotoAvatar)}
            aria-label={fotoAvatar ? 'Ver foto' : negocio.nombre}
          >
            {fotoAvatar ? <img src={fotoAvatar} alt="" /> : iniciales(negocio.nombre)}
          </button>
          <div style={{ minWidth: 0 }}>
            <h1>{negocio.nombre}</h1>
            <p style={{ opacity: 0.9 }}>{negocio.tipoComida}</p>
            {duena && <p style={{ opacity: 0.85, fontSize: 14 }}>Te atiende {duena}</p>}
          </div>
        </div>
        {negocio.descripcion && <p style={{ opacity: 0.9 }}>{negocio.descripcion}</p>}
        <div className="fila envolver" style={{ gap: 14, opacity: 0.92, fontSize: 15 }}>
          {negocio.tiempoEstimado && (
            <span className="fila" style={{ gap: 6 }}>
              <Clock size={16} />
              Listo en {negocio.tiempoEstimado} min
            </span>
          )}
          {horarioTexto(negocio) && (
            <span className="fila" style={{ gap: 6 }}>
              <CalendarClock size={16} />
              {horarioTexto(negocio)}
            </span>
          )}
          {negocio.direccion && (
            <span className="fila" style={{ gap: 6 }}>
              <MapPin size={16} />
              {negocio.direccion}
            </span>
          )}
        </div>
      </section>

      {!puedePedir && <div className="aviso alerta">Cerrado ahora. No recibe pedidos.</div>}

      {negocio.latitud != null && negocio.longitud != null && (
        <section className="tarjeta columna" style={{ gap: 10, padding: 12 }}>
          <div className="fila entre envolver" style={{ padding: '0 4px' }}>
            <h2>¿Dónde está?</h2>
            {negocio.ubicacionEnVivo && negocio.abierto ? (
              <span className="en-vivo">En vivo · {haceCuanto(negocio.ubicacionActualizada)}</span>
            ) : (
              <span className="mini">Ubicación fija del puesto</span>
            )}
          </div>
          <Mapa puestos={[negocio]} yo={puntoGuardado()} alto={240} />
          <a className="boton secundario ancho" href={enlaceComoLlegar(negocio.latitud, negocio.longitud)} target="_blank" rel="noreferrer">
            <Navigation size={20} />
            Cómo llegar
          </a>
        </section>
      )}

      {categorias.length > 1 && (
        <div className="chips">
          <button className={'chip' + (!categoria ? ' activo' : '')} onClick={() => setCategoria('')}>
            Todo
          </button>
          {categorias.map((c) => (
            <button key={c} className={'chip' + (categoria === c ? ' activo' : '')} onClick={() => setCategoria(c)}>
              {c}
            </button>
          ))}
        </div>
      )}

      <div className="grilla">
        {visibles.map((p) => {
          const disponible = p.disponible
          return (
            <div key={p.id} className={'producto' + (disponible ? '' : ' apagado')}>
              <button
                className="fila"
                style={{ gap: 14, flex: 1, minWidth: 0, border: 0, background: 'none', padding: 0, textAlign: 'left' }}
                onClick={() => {
                  setElegido(p)
                  setCuantos(1)
                }}
              >
                <Foto src={p.imagen} tamano={76} />
                <span style={{ minWidth: 0 }}>
                  <h3>{p.nombre}</h3>
                  {p.descripcion && <span className="mini" style={{ display: 'block' }}>{p.descripcion}</span>}
                  <span className="precio">{disponible ? soles(p.precio) : 'Agotado por hoy'}</span>
                </span>
              </button>
              {disponible && puedePedir && (
                <button className="mas" onClick={() => intentarAgregar(p, 1)} aria-label={`Agregar ${p.nombre}`}>
                  <Plus size={24} />
                </button>
              )}
            </div>
          )
        })}
        {visibles.length === 0 && <div className="vacio">Este puesto todavía no tiene productos.</div>}
      </div>

      {elegido && (
        <Modal titulo={elegido.nombre} alCerrar={() => setElegido(null)}>
          {elegido.imagen && <img src={urlImagen(elegido.imagen)} alt="" style={{ width: '100%', borderRadius: 16, maxHeight: 240, objectFit: 'cover' }} />}
          {elegido.descripcion && <p className="sub">{elegido.descripcion}</p>}
          <div className="fila entre">
            <span className="numero precio">{soles(elegido.precio)}</span>
            {elegido.disponible && puedePedir && (
              <div className="selector">
                <button onClick={() => setCuantos(Math.max(1, cuantos - 1))} aria-label="Quitar uno">−</button>
                <span>{cuantos}</span>
                <button onClick={() => setCuantos(Math.min(50, cuantos + 1))} aria-label="Agregar uno">+</button>
              </div>
            )}
          </div>
          <button
            className="boton principal ancho"
            disabled={!elegido.disponible || !puedePedir}
            onClick={() => {
              intentarAgregar(elegido, cuantos)
              setElegido(null)
            }}
          >
            {elegido.disponible && puedePedir ? `Agregar · ${soles(elegido.precio * cuantos)}` : 'No disponible ahora'}
          </button>
        </Modal>
      )}

      {pendiente && (
        <Modal titulo="¿Empezar un carrito nuevo?" alCerrar={() => setPendiente(null)}>
          <p className="sub">
            Tu carrito tiene productos de <b>{carrito.negocio?.nombre}</b>. Solo puedes pedir a un puesto a la vez.
          </p>
          <div className="dos">
            <button className="boton secundario" onClick={() => setPendiente(null)}>
              Mantener mi carrito
            </button>
            <button
              className="boton principal"
              onClick={() => {
                agregar(negocio, pendiente.producto, pendiente.cantidad)
                setPendiente(null)
                mostrar('Empezaste un carrito nuevo')
              }}
            >
              Vaciar y agregar
            </button>
          </div>
        </Modal>
      )}
      {ver && (
        <div className="visor" role="dialog" aria-modal="true" aria-label="Foto" onClick={() => setVer(null)}>
          <img src={ver} alt="" />
          <button type="button" className="visor-cerrar" onClick={() => setVer(null)} aria-label="Cerrar">
            <X size={24} />
          </button>
        </div>
      )}
    </>
  )
}
