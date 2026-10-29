import { useState } from 'react'
import { LogOut, Monitor, Moon, Sun } from 'lucide-react'
import { api } from '../api'
import { useAviso } from '../contexto/Aviso'
import { useSesion } from '../contexto/Sesion'
import { useTema } from '../contexto/Tema'
import { Error } from './Ui'

export default function MiCuenta() {
  const { usuario, setUsuario, salir } = useSesion()
  const { modo, cambiarModo } = useTema()
  const mostrar = useAviso()
  const [perfil, setPerfil] = useState({
    nombre: usuario?.nombre || '',
    apellido: usuario?.apellido || '',
    telefono: usuario?.telefono || ''
  })
  const [claves, setClaves] = useState({ passwordActual: '', nuevaPassword: '' })
  const [error, setError] = useState('')

  async function guardarPerfil(e) {
    e.preventDefault()
    setError('')
    if (!perfil.nombre.trim()) return setError('Escribe tu nombre')
    try {
      setUsuario(await api('/usuarios/me', { metodo: 'PUT', cuerpo: perfil }))
      mostrar('Tus datos se guardaron')
    } catch (err) {
      setError(err.message)
    }
  }

  async function cambiarClave(e) {
    e.preventDefault()
    setError('')
    if (claves.nuevaPassword.length < 6) return setError('La nueva contraseña debe tener al menos 6 caracteres')
    try {
      await api('/usuarios/me/password', { metodo: 'PUT', cuerpo: claves })
      setClaves({ passwordActual: '', nuevaPassword: '' })
      mostrar('Contraseña actualizada')
    } catch (err) {
      setError(err.message)
    }
  }

  const modos = [
    { clave: 'claro', texto: 'Claro', icono: Sun },
    { clave: 'oscuro', texto: 'Oscuro', icono: Moon },
    { clave: 'auto', texto: 'Según la hora', icono: Monitor }
  ]

  return (
    <div className="columna">
      <Error>{error}</Error>

      <section className="tarjeta columna">
        <h2>Pantalla</h2>
        <div className="opcion-tema">
          {modos.map((m) => (
            <button key={m.clave} className={'chip' + (modo === m.clave ? ' activo' : '')} onClick={() => cambiarModo(m.clave)}>
              <span className="fila" style={{ gap: 6 }}>
                <m.icono size={18} />
                {m.texto}
              </span>
            </button>
          ))}
        </div>
      </section>

      <form className="tarjeta formulario" onSubmit={guardarPerfil}>
        <h2>Mis datos</h2>
        <p className="mini">{usuario?.correo}</p>
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
        <button className="boton secundario">Guardar mis datos</button>
      </form>

      <form className="tarjeta formulario" onSubmit={cambiarClave}>
        <h2>Cambiar contraseña</h2>
        <div className="dos">
          <div className="campo">
            <label htmlFor="mc-actual">Contraseña actual</label>
            <input id="mc-actual" type="password" autoComplete="current-password" value={claves.passwordActual} onChange={(e) => setClaves({ ...claves, passwordActual: e.target.value })} />
          </div>
          <div className="campo">
            <label htmlFor="mc-nueva">Nueva contraseña</label>
            <input id="mc-nueva" type="password" autoComplete="new-password" value={claves.nuevaPassword} onChange={(e) => setClaves({ ...claves, nuevaPassword: e.target.value })} />
          </div>
        </div>
        <button className="boton secundario">Cambiar contraseña</button>
      </form>

      <button className="boton peligro ancho" onClick={salir}>
        <LogOut size={20} />
        Cerrar sesión
      </button>
    </div>
  )
}
