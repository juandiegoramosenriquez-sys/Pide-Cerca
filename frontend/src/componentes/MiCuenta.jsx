import { useState } from 'react'
import { Lock, LogOut, Monitor, Moon, Sun } from 'lucide-react'
import { api } from '../api'
import { useAviso } from '../contexto/Aviso'
import { useSesion } from '../contexto/Sesion'
import { useTema } from '../contexto/Tema'
import { fechaLarga } from '../util/formato'
import { BotonCarga, Error } from './Ui'

export function DatosCuenta() {
  const { usuario, setUsuario } = useSesion()
  const mostrar = useAviso()
  const [perfil, setPerfil] = useState({
    nombre: usuario?.nombre || '',
    apellido: usuario?.apellido || '',
    telefono: usuario?.telefono || ''
  })
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  async function guardar(e) {
    e.preventDefault()
    setError('')
    if (!perfil.nombre.trim()) return setError('Escribe tu nombre')
    setGuardando(true)
    try {
      setUsuario(await api('/usuarios/me', { metodo: 'PUT', cuerpo: perfil }))
      mostrar('Guardado')
    } catch (err) {
      setError(err.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <form className="tarjeta formulario" onSubmit={guardar}>
      <div className="seccion-titulo">
        <h2>Mis datos</h2>
        <span>{usuario?.correo}</span>
      </div>
      <div className="dos">
        <div className="campo">
          <label htmlFor="mc-nombre">Nombre</label>
          <input id="mc-nombre" value={perfil.nombre} onChange={(e) => setPerfil({ ...perfil, nombre: e.target.value })} autoComplete="given-name" />
        </div>
        <div className="campo">
          <label htmlFor="mc-apellido">Apellido</label>
          <input id="mc-apellido" value={perfil.apellido} onChange={(e) => setPerfil({ ...perfil, apellido: e.target.value })} autoComplete="family-name" />
        </div>
      </div>
      <div className="campo">
        <label htmlFor="mc-telefono">Celular</label>
        <input id="mc-telefono" inputMode="tel" value={perfil.telefono} onChange={(e) => setPerfil({ ...perfil, telefono: e.target.value })} autoComplete="tel" />
      </div>
      <Error>{error}</Error>
      <BotonCarga cargando={guardando} className="boton secundario ancho">
        Guardar
      </BotonCarga>
    </form>
  )
}

export function ClaveCuenta() {
  const { usuario, setUsuario } = useSesion()
  const mostrar = useAviso()
  const [claves, setClaves] = useState({ passwordActual: '', nuevaPassword: '' })
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const bloqueada = usuario?.proximoCambioPassword

  async function cambiar(e) {
    e.preventDefault()
    setError('')
    if (!claves.passwordActual) return setError('Escribe tu contraseña actual')
    if (claves.nuevaPassword.length < 6) return setError('La nueva contraseña necesita 6 caracteres o más')
    setGuardando(true)
    try {
      await api('/usuarios/me/password', { metodo: 'PUT', cuerpo: claves })
      setClaves({ passwordActual: '', nuevaPassword: '' })
      setUsuario(await api('/auth/me'))
      mostrar('Contraseña actualizada')
    } catch (err) {
      setError(err.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <form className="tarjeta formulario" onSubmit={cambiar}>
      <div className="seccion-titulo">
        <h2>Contraseña</h2>
        <span className="fila" style={{ gap: 4 }}>
          <Lock size={14} />
          1 vez cada 15 días
        </span>
      </div>
      {bloqueada ? (
        <div className="aviso info">Podrás cambiarla desde el {fechaLarga(bloqueada)}.</div>
      ) : (
        <>
          <div className="dos">
            <div className="campo">
              <label htmlFor="mc-actual">Actual</label>
              <input id="mc-actual" type="password" autoComplete="current-password" value={claves.passwordActual} onChange={(e) => setClaves({ ...claves, passwordActual: e.target.value })} />
            </div>
            <div className="campo">
              <label htmlFor="mc-nueva">Nueva</label>
              <input id="mc-nueva" type="password" autoComplete="new-password" value={claves.nuevaPassword} onChange={(e) => setClaves({ ...claves, nuevaPassword: e.target.value })} />
            </div>
          </div>
          <Error>{error}</Error>
          <BotonCarga cargando={guardando} className="boton secundario ancho">
            Cambiar contraseña
          </BotonCarga>
        </>
      )}
    </form>
  )
}

export function PantallaCuenta() {
  const { modo, cambiarModo, estilo, cambiarEstilo } = useTema()
  const modos = [
    { clave: 'claro', texto: 'Claro', icono: Sun },
    { clave: 'oscuro', texto: 'Oscuro', icono: Moon },
    { clave: 'auto', texto: 'Auto', icono: Monitor }
  ]

  return (
    <section className="tarjeta columna">
      <h2>Pantalla</h2>
      <div className="segmento" role="radiogroup" aria-label="Modo de pantalla">
        {modos.map((m) => (
          <button key={m.clave} type="button" role="radio" aria-checked={modo === m.clave} className={modo === m.clave ? 'activo' : ''} onClick={() => cambiarModo(m.clave)}>
            <m.icono size={18} />
            {m.texto}
          </button>
        ))}
      </div>
      <span className="mini" style={{ fontWeight: 700 }}>Estilo</span>
      <div className="estilos" role="radiogroup" aria-label="Estilo de la web">
        {[
          { clave: 'moderno', texto: 'Moderno', detalle: 'Suave y redondeado' },
          { clave: 'mercado', texto: 'Mercado', detalle: 'Como cartel de puesto' }
        ].map((e) => (
          <button key={e.clave} type="button" role="radio" aria-checked={estilo === e.clave} className={'estilo-opcion ' + e.clave + (estilo === e.clave ? ' activo' : '')} onClick={() => cambiarEstilo(e.clave)}>
            <span className="estilo-muestra" aria-hidden="true">
              <i />
              <b />
              <b />
            </span>
            <strong>{e.texto}</strong>
            <small>{e.detalle}</small>
          </button>
        ))}
      </div>
    </section>
  )
}

export function BotonSalir() {
  const { salir } = useSesion()
  return (
    <button className="boton peligro ancho" onClick={salir}>
      <LogOut size={20} />
      Cerrar sesión
    </button>
  )
}

export default function MiCuenta() {
  return (
    <div className="columna" style={{ gap: 16 }}>
      <DatosCuenta />
      <ClaveCuenta />
      <PantallaCuenta />
      <BotonSalir />
    </div>
  )
}
