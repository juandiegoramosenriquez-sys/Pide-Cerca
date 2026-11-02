import { useCallback, useEffect, useState } from 'react'
import { Lock, LogOut, Monitor, Moon, Sun } from 'lucide-react'
import { api } from '../api'
import { useAviso } from '../contexto/Aviso'
import { useSesion } from '../contexto/Sesion'
import { useTema } from '../contexto/Tema'
import { useAjustes } from '../util/ajustes'
import { esDeHoy } from '../util/dias'
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

const TIPOS_AYUDA = [
  ['PEDIDO', 'Un pedido'],
  ['PUESTO', 'Un puesto'],
  ['PAGO', 'Un pago'],
  ['APP', 'La app'],
  ['OTRO', 'Otro']
]

export function AyudaCuenta() {
  const mostrar = useAviso()
  const ajustes = useAjustes()
  const [tipo, setTipo] = useState('PEDIDO')
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [lista, setLista] = useState(null)

  const cargar = useCallback(() => {
    api('/reclamos/mios')
      .then(setLista)
      .catch(() => setLista([]))
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  const permitidos = ajustes.reclamosPorDia || 1
  const agotado = lista !== null && lista.filter((r) => esDeHoy(r.fecha)).length >= permitidos

  async function enviar(e) {
    e.preventDefault()
    setError('')
    setEnviando(true)
    try {
      await api('/reclamos', { metodo: 'POST', cuerpo: { tipo, mensaje } })
      setMensaje('')
      mostrar('Recibimos tu reclamo. Te responderemos por aquí')
      cargar()
    } catch (err) {
      setError(err.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <>
      {agotado ? (
        <section className="tarjeta columna">
          <h2>Reportar un problema</h2>
          <div className="aviso info">
            Ya enviaste {permitidos === 1 ? 'tu reclamo' : `tus ${permitidos} reclamos`} de hoy. Podrás enviar otro mañana.
          </div>
        </section>
      ) : (
        <form className="tarjeta formulario" onSubmit={enviar}>
          <h2>Reportar un problema</h2>
          <span className="mini">
            Puedes enviar {ajustes.reclamosPorDia || 1} {(ajustes.reclamosPorDia || 1) === 1 ? 'reclamo' : 'reclamos'} por día.
          </span>
          <Error>{error}</Error>
          <div className="campo">
            <label htmlFor="ayuda-tipo">Sobre qué</label>
            <select id="ayuda-tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}>
              {TIPOS_AYUDA.map(([clave, texto]) => (
                <option key={clave} value={clave}>
                  {texto}
                </option>
              ))}
            </select>
          </div>
          <div className="campo">
            <label htmlFor="ayuda-mensaje">Cuéntanos qué pasó</label>
            <textarea id="ayuda-mensaje" maxLength={600} value={mensaje} onChange={(e) => setMensaje(e.target.value)} />
          </div>
          <BotonCarga cargando={enviando}>Enviar</BotonCarga>
        </form>
      )}
      {lista && lista.length > 0 && (
        <section className="columna">
          <h2>Tus reclamos</h2>
          {lista.map((r) => (
            <div key={r.id} className="tarjeta columna" style={{ gap: 4 }}>
              <div className="fila entre">
                <span className="mini">{fechaLarga(r.fecha)}</span>
                <span className={'estado ' + (r.estado === 'ABIERTO' ? 'rec' : 'ok')}>{r.estado === 'ABIERTO' ? 'En revisión' : 'Resuelto'}</span>
              </div>
              <p>{r.mensaje}</p>
              {r.respuesta && <p className="sub">Respuesta: {r.respuesta}</p>}
            </div>
          ))}
        </section>
      )}
    </>
  )
}

export function PantallaCuenta() {
  const { modo, cambiarModo } = useTema()
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
