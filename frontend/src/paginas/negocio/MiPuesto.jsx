import { useState } from 'react'
import { MapPin } from 'lucide-react'
import { api } from '../../api'
import { useAviso } from '../../contexto/Aviso'
import Mapa from '../../componentes/Mapa'
import MiCuenta from '../../componentes/MiCuenta'
import { BotonCarga, Error, Interruptor } from '../../componentes/Ui'
import { haceCuanto } from '../../util/formato'
import { useNegocio } from './Negocio'

function UbicacionEnVivo() {
  const { negocio, compartir, setCompartir, errorGps } = useNegocio()
  const mostrar = useAviso()
  const transmitiendo = compartir && negocio.abierto

  return (
    <section className="tarjeta columna">
      <div className="fila entre" style={{ alignItems: 'flex-start' }}>
        <div>
          <h2>Ubicación en vivo</h2>
          <p className="sub">Si tu puesto se mueve (carretilla), los clientes verán dónde estás en el mapa mientras tengas el puesto abierto.</p>
        </div>
        <Interruptor
          encendido={compartir}
          etiqueta="Compartir mi ubicación en vivo"
          alCambiar={() => {
            setCompartir(!compartir)
            mostrar(!compartir ? 'Compartirás tu ubicación mientras tu puesto esté abierto' : 'Dejaste de compartir tu ubicación')
          }}
        />
      </div>
      {transmitiendo && <span className="en-vivo">Compartiendo · actualizada {haceCuanto(negocio.ubicacionActualizada) || 'en un momento'}</span>}
      {compartir && !negocio.abierto && <div className="aviso alerta">Abre tu puesto (botón de arriba) para empezar a compartir tu ubicación.</div>}
      {errorGps && <div className="aviso error">{errorGps}</div>}
      {negocio.latitud != null && negocio.longitud != null ? (
        <Mapa puestos={[negocio]} alto={220} />
      ) : (
        <p className="mini">Todavía no hay ubicación guardada. Usa el botón “Usar mi ubicación” de abajo o activa la ubicación en vivo.</p>
      )}
      <p className="mini">Mantén esta web abierta en tu celular para que la ubicación se actualice.</p>
    </section>
  )
}

export default function MiPuesto() {
  const { negocio, setNegocio } = useNegocio()
  const mostrar = useAviso()
  const [datos, setDatos] = useState(() => ({
    nombre: negocio.nombre || '',
    tipoComida: negocio.tipoComida || '',
    descripcion: negocio.descripcion || '',
    direccion: negocio.direccion || '',
    telefono: negocio.telefono || '',
    horario: negocio.horario || '',
    imagen: negocio.imagen || '',
    tiempoEstimado: negocio.tiempoEstimado || 15,
    latitud: negocio.latitud ?? '',
    longitud: negocio.longitud ?? ''
  }))
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [ubicando, setUbicando] = useState(false)
  const cambiar = (c, v) => setDatos((d) => ({ ...d, [c]: v }))

  function ubicar() {
    if (!navigator.geolocation) return setError('Tu navegador no permite obtener la ubicación')
    setUbicando(true)
    navigator.geolocation.getCurrentPosition(
      (p) => {
        cambiar('latitud', Number(p.coords.latitude.toFixed(6)))
        cambiar('longitud', Number(p.coords.longitude.toFixed(6)))
        setUbicando(false)
        mostrar('Ubicación lista. Toca “Guardar cambios”')
      },
      () => {
        setUbicando(false)
        setError('No pudimos obtener tu ubicación. Revisa los permisos del navegador')
      },
      { enableHighAccuracy: true, timeout: 15000 }
    )
  }

  async function guardar(e) {
    e.preventDefault()
    setError('')
    if (!datos.nombre.trim()) return setError('El nombre del puesto es obligatorio')
    setGuardando(true)
    try {
      const n = await api('/negocios/mio', {
        metodo: 'PUT',
        cuerpo: {
          ...datos,
          tiempoEstimado: Number(datos.tiempoEstimado) || null,
          latitud: datos.latitud === '' ? null : Number(datos.latitud),
          longitud: datos.longitud === '' ? null : Number(datos.longitud)
        }
      })
      setNegocio(n)
      mostrar('Datos de tu puesto guardados')
    } catch (err) {
      setError(err.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <>
      <h1>Mi puesto</h1>
      <UbicacionEnVivo />
      <form className="tarjeta formulario" onSubmit={guardar}>
        <Error>{error}</Error>
        <div className="dos">
          <div className="campo">
            <label htmlFor="mp-nombre">Nombre del puesto</label>
            <input id="mp-nombre" value={datos.nombre} onChange={(e) => cambiar('nombre', e.target.value)} />
          </div>
          <div className="campo">
            <label htmlFor="mp-tipo">¿Qué vendes?</label>
            <input id="mp-tipo" value={datos.tipoComida} onChange={(e) => cambiar('tipoComida', e.target.value)} />
          </div>
        </div>
        <div className="campo">
          <label htmlFor="mp-desc">Descripción</label>
          <textarea id="mp-desc" value={datos.descripcion} onChange={(e) => cambiar('descripcion', e.target.value)} />
        </div>
        <div className="dos">
          <div className="campo">
            <label htmlFor="mp-dir">Dirección o referencia</label>
            <input id="mp-dir" value={datos.direccion} onChange={(e) => cambiar('direccion', e.target.value)} />
          </div>
          <div className="campo">
            <label htmlFor="mp-tel">Teléfono del puesto</label>
            <input id="mp-tel" inputMode="tel" value={datos.telefono} onChange={(e) => cambiar('telefono', e.target.value)} />
          </div>
        </div>
        <div className="dos">
          <div className="campo">
            <label htmlFor="mp-hor">Horario</label>
            <input id="mp-hor" value={datos.horario} onChange={(e) => cambiar('horario', e.target.value)} />
          </div>
          <div className="campo">
            <label htmlFor="mp-min">Minutos que sueles tardar</label>
            <input id="mp-min" inputMode="numeric" value={datos.tiempoEstimado} onChange={(e) => cambiar('tiempoEstimado', e.target.value)} />
          </div>
        </div>
        <div className="campo">
          <label htmlFor="mp-img">Foto del puesto (enlace, opcional)</label>
          <input id="mp-img" value={datos.imagen} onChange={(e) => cambiar('imagen', e.target.value)} placeholder="https://…" />
        </div>
        <div className="tarjeta fila entre envolver" style={{ background: 'var(--tarj-2)' }}>
          <div>
            <h3>Ubicación del puesto</h3>
            <p className="mini">
              {datos.latitud !== '' && datos.longitud !== '' ? `${datos.latitud}, ${datos.longitud}` : 'Sin ubicación: los clientes no te verán como cercano'}
            </p>
          </div>
          <BotonCarga type="button" className="boton secundario" cargando={ubicando} onClick={ubicar}>
            <MapPin size={20} />
            Usar mi ubicación
          </BotonCarga>
        </div>
        <BotonCarga cargando={guardando}>Guardar cambios</BotonCarga>
      </form>

      <MiCuenta />
    </>
  )
}
