import { useState } from 'react'
import { Lock, MapPin, Store, User } from 'lucide-react'
import { api } from '../../api'
import { useAviso } from '../../contexto/Aviso'
import { SubirFoto } from '../../componentes/Foto'
import MiCuenta from '../../componentes/MiCuenta'
import SelectorUbicacion from '../../componentes/SelectorUbicacion'
import SelectorHorario, { horarioDe } from '../../componentes/SelectorHorario'
import { BotonCarga, Error, Interruptor } from '../../componentes/Ui'
import { fechaLarga, haceCuanto, horarioError } from '../../util/formato'
import { urlImagen } from '../../util/imagen'
import { useNegocio } from './Negocio'

const PESTANAS = [
  { clave: 'puesto', texto: 'Puesto', icono: Store },
  { clave: 'ubicacion', texto: 'Ubicación', icono: MapPin },
  { clave: 'cuenta', texto: 'Cuenta', icono: User }
]

function datosDe(negocio) {
  return {
    nombre: negocio.nombre || '',
    tipoComida: negocio.tipoComida || '',
    descripcion: negocio.descripcion || '',
    direccion: negocio.direccion || '',
    telefono: negocio.telefono || '',
    horario: negocio.horario || '',
    ...horarioDe(negocio),
    imagen: negocio.imagen || '',
    fotoDueno: negocio.fotoDueno || '',
    tiempoEstimado: negocio.tiempoEstimado || 15,
    latitud: negocio.latitud ?? '',
    longitud: negocio.longitud ?? ''
  }
}

function useGuardarPuesto() {
  const { negocio, setNegocio } = useNegocio()
  const mostrar = useAviso()
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  async function guardar(cambios) {
    const datos = { ...datosDe(negocio), ...cambios }
    setError('')
    if (!datos.nombre.trim()) return setError('Escribe el nombre del puesto')
    if (horarioError(datos)) return setError(horarioError(datos))
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
      mostrar('Guardado')
    } catch (err) {
      setError(err.message)
    } finally {
      setGuardando(false)
    }
  }

  return { guardar, guardando, error }
}

function PestanaPuesto() {
  const { negocio } = useNegocio()
  const [datos, setDatos] = useState(() => datosDe(negocio))
  const { guardar, guardando, error } = useGuardarPuesto()
  const cambiar = (c, v) => setDatos((d) => ({ ...d, [c]: v }))
  const nombreBloqueado = negocio.proximoCambioNombre

  return (
    <form
      className="columna"
      style={{ gap: 16 }}
      onSubmit={(e) => {
        e.preventDefault()
        guardar(datos)
      }}
    >
      <section className="tarjeta formulario">
        <h2>Fotos</h2>
        <div className="campo">
          <label>Tu puesto</label>
          <SubirFoto valor={datos.imagen} alCambiar={(v) => cambiar('imagen', v)} texto="Agregar foto del puesto" alto={180} />
        </div>
        <div className="campo">
          <label>Tú</label>
          <SubirFoto valor={datos.fotoDueno} alCambiar={(v) => cambiar('fotoDueno', v)} texto="Agregar tu foto (opcional)" alto={150} />
          <span className="ayuda">Los clientes confían más cuando ven quién atiende.</span>
        </div>
      </section>

      <section className="tarjeta formulario">
        <h2>Datos</h2>
        <div className="campo">
          <label htmlFor="mp-nombre" className="fila entre">
            Nombre
            {nombreBloqueado && (
              <span className="fila mini" style={{ gap: 4 }}>
                <Lock size={13} />
                hasta el {fechaLarga(nombreBloqueado)}
              </span>
            )}
          </label>
          <input id="mp-nombre" value={datos.nombre} onChange={(e) => cambiar('nombre', e.target.value)} disabled={Boolean(nombreBloqueado)} />
          {!nombreBloqueado && <span className="ayuda">1 vez cada 15 días</span>}
        </div>
        <div className="campo">
          <label htmlFor="mp-tipo">Qué vendes</label>
          <input id="mp-tipo" value={datos.tipoComida} onChange={(e) => cambiar('tipoComida', e.target.value)} placeholder="Salchipapas, pollo frito…" />
        </div>
        <div className="campo">
          <label htmlFor="mp-desc">Descripción</label>
          <textarea id="mp-desc" value={datos.descripcion} onChange={(e) => cambiar('descripcion', e.target.value)} />
        </div>
      </section>

      <section className="tarjeta formulario">
        <h2>Atención</h2>
        <div className="campo">
          <label>Horario</label>
          <SelectorHorario valor={datos} alCambiar={(h) => setDatos((d) => ({ ...d, ...h }))} />
        </div>
        <div className="dos" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
          <div className="campo">
            <label htmlFor="mp-min">Minutos</label>
            <input id="mp-min" inputMode="numeric" value={datos.tiempoEstimado} onChange={(e) => cambiar('tiempoEstimado', e.target.value)} />
          </div>
          <div className="campo">
            <label htmlFor="mp-tel">Teléfono</label>
            <input id="mp-tel" inputMode="tel" value={datos.telefono} onChange={(e) => cambiar('telefono', e.target.value)} />
          </div>
        </div>
      </section>

      <Error>{error}</Error>
      <BotonCarga cargando={guardando}>Guardar cambios</BotonCarga>
    </form>
  )
}

function PestanaUbicacion() {
  const { negocio, compartir, setCompartir, errorGps } = useNegocio()
  const mostrar = useAviso()
  const [datos, setDatos] = useState(() => datosDe(negocio))
  const { guardar, guardando, error } = useGuardarPuesto()
  const transmitiendo = compartir && negocio.abierto

  return (
    <div className="columna" style={{ gap: 16 }}>
      <section className="tarjeta columna">
        <div className="fila entre">
          <div>
            <h2>En vivo</h2>
            <p className="mini">Para carretillas</p>
          </div>
          <Interruptor
            encendido={compartir}
            etiqueta="Compartir mi ubicación en vivo"
            alCambiar={() => {
              setCompartir(!compartir)
              mostrar(!compartir ? 'Ubicación en vivo activada' : 'Ubicación en vivo apagada')
            }}
          />
        </div>
        {transmitiendo && <span className="en-vivo">Compartiendo · {haceCuanto(negocio.ubicacionActualizada) || 'ahora'}</span>}
        {compartir && !negocio.abierto && <div className="aviso alerta">Abre tu puesto para compartir.</div>}
        {errorGps && <div className="aviso error">{errorGps}</div>}
      </section>

      <form
        className="tarjeta formulario"
        onSubmit={(e) => {
          e.preventDefault()
          guardar({ latitud: datos.latitud, longitud: datos.longitud, direccion: datos.direccion })
        }}
      >
        <h2>Ubicación fija</h2>
        <SelectorUbicacion latitud={datos.latitud} longitud={datos.longitud} alCambiar={(c) => setDatos((d) => ({ ...d, ...c }))} />
        <div className="campo">
          <label htmlFor="mp-dir">Dirección</label>
          <input id="mp-dir" value={datos.direccion} onChange={(e) => setDatos((d) => ({ ...d, direccion: e.target.value }))} />
        </div>
        <Error>{error}</Error>
        <BotonCarga cargando={guardando}>Guardar ubicación</BotonCarga>
      </form>
    </div>
  )
}

export default function MiPuesto() {
  const { negocio } = useNegocio()
  const [pestana, setPestana] = useState('puesto')
  const foto = urlImagen(negocio.imagen)

  return (
    <>
      <section className={'perfil-cabecera' + (foto ? ' con-foto' : '')}>
        {foto && <img src={foto} alt="" />}
        <div className="perfil-cabecera-texto">
          <h1>{negocio.nombre}</h1>
          <div className="fila entre">
            <span>{negocio.tipoComida}</span>
            <span className={'estado ' + (negocio.abierto ? 'ok' : 'ent')}>{negocio.abierto ? 'Abierto' : 'Cerrado'}</span>
          </div>
        </div>
      </section>

      <div className="segmento" role="tablist" aria-label="Secciones de mi puesto">
        {PESTANAS.map((p) => (
          <button key={p.clave} type="button" role="tab" aria-selected={pestana === p.clave} className={pestana === p.clave ? 'activo' : ''} onClick={() => setPestana(p.clave)}>
            <p.icono size={18} />
            {p.texto}
          </button>
        ))}
      </div>

      {pestana === 'puesto' && <PestanaPuesto />}
      {pestana === 'ubicacion' && <PestanaUbicacion />}
      {pestana === 'cuenta' && <MiCuenta />}
    </>
  )
}
