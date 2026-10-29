import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Store } from 'lucide-react'
import { inicioDe, useSesion } from '../../contexto/Sesion'
import { useRolVisual } from '../../contexto/Tema'
import { BotonTema } from '../../componentes/Marco'
import { BotonCarga, Error } from '../../componentes/Ui'
import { pedirPermisoNotificaciones } from '../../util/sonido'

function Cabecera() {
  return (
    <div className="fila entre">
      <div className="logo">
        Pide<span>Cerca</span>
      </div>
      <div style={{ color: 'var(--t2)' }}>
        <BotonTema />
      </div>
    </div>
  )
}

function CampoClave({ id, valor, alCambiar, etiqueta = 'Contraseña', nueva = false }) {
  const [ver, setVer] = useState(false)
  return (
    <div className="campo">
      <label htmlFor={id}>{etiqueta}</label>
      <div style={{ position: 'relative' }}>
        <input
          id={id}
          type={ver ? 'text' : 'password'}
          autoComplete={nueva ? 'new-password' : 'current-password'}
          value={valor}
          onChange={(e) => alCambiar(e.target.value)}
          style={{ paddingRight: 52 }}
        />
        <button
          type="button"
          onClick={() => setVer(!ver)}
          aria-label={ver ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          style={{ position: 'absolute', right: 6, top: 4, width: 44, height: 44, border: 0, background: 'none', color: 'var(--t2)' }}
        >
          {ver ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>
    </div>
  )
}

function AvisoPrivacidad({ acepto, alCambiar }) {
  return (
    <label className="casilla">
      <input type="checkbox" checked={acepto} onChange={(e) => alCambiar(e.target.checked)} />
      <span>
        Acepto que PideCerca use mis datos solo para gestionar mis pedidos, según la Ley N.° 29733 de Protección de Datos Personales.
        No compartimos tus datos con terceros.
      </span>
    </label>
  )
}

export function Ingresar() {
  useRolVisual('cliente')
  const { ingresar } = useSesion()
  const navegar = useNavigate()
  const [correo, setCorreo] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function enviar(e) {
    e.preventDefault()
    setError('')
    if (!correo.trim() || !password) return setError('Escribe tu correo y tu contraseña')
    setEnviando(true)
    try {
      const usuario = await ingresar(correo.trim(), password)
      pedirPermisoNotificaciones()
      navegar(inicioDe(usuario.rol), { replace: true })
    } catch (err) {
      setError(err.message)
      setEnviando(false)
    }
  }

  return (
    <div className="acceso">
      <div className="acceso-caja">
        <Cabecera />
        <div>
          <h1>Pide antes, recoge sin esperar</h1>
          <p className="sub">Entra para ver los puestos de comida cerca de ti.</p>
        </div>
        <form className="tarjeta formulario" onSubmit={enviar}>
          <Error>{error}</Error>
          <div className="campo">
            <label htmlFor="correo">Correo</label>
            <input id="correo" type="email" autoComplete="username" placeholder="tucorreo@gmail.com" value={correo} onChange={(e) => setCorreo(e.target.value)} />
          </div>
          <CampoClave id="clave" valor={password} alCambiar={setPassword} />
          <BotonCarga cargando={enviando}>Entrar</BotonCarga>
        </form>
        <div className="columna" style={{ gap: 8, textAlign: 'center' }}>
          <p className="sub">
            ¿No tienes cuenta? <Link to="/registro">Regístrate gratis</Link>
          </p>
          <Link to="/registro-negocio" className="boton secundario">
            <Store size={20} />
            Tengo un puesto de comida
          </Link>
        </div>
      </div>
    </div>
  )
}

export function RegistroCliente() {
  useRolVisual('cliente')
  const { registrarCliente } = useSesion()
  const navegar = useNavigate()
  const [datos, setDatos] = useState({ nombre: '', apellido: '', correo: '', telefono: '', password: '' })
  const [acepto, setAcepto] = useState(false)
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  function cambiar(campo, valor) {
    setDatos((d) => ({ ...d, [campo]: valor }))
  }

  async function enviar(e) {
    e.preventDefault()
    setError('')
    if (!datos.nombre.trim()) return setError('Escribe tu nombre')
    if (!datos.correo.includes('@')) return setError('Escribe un correo válido')
    if (datos.password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres')
    if (!acepto) return setError('Para crear tu cuenta debes aceptar el aviso de privacidad')
    setEnviando(true)
    try {
      await registrarCliente({ ...datos, correo: datos.correo.trim(), aceptoPrivacidad: true })
      pedirPermisoNotificaciones()
      navegar('/', { replace: true })
    } catch (err) {
      setError(err.message)
      setEnviando(false)
    }
  }

  return (
    <div className="acceso">
      <div className="acceso-caja">
        <Cabecera />
        <div>
          <h1>Crea tu cuenta</h1>
          <p className="sub">Es gratis y solo toma un minuto.</p>
        </div>
        <form className="tarjeta formulario" onSubmit={enviar}>
          <Error>{error}</Error>
          <div className="dos">
            <div className="campo">
              <label htmlFor="r-nombre">Nombre</label>
              <input id="r-nombre" autoComplete="given-name" value={datos.nombre} onChange={(e) => cambiar('nombre', e.target.value)} />
            </div>
            <div className="campo">
              <label htmlFor="r-apellido">Apellido</label>
              <input id="r-apellido" autoComplete="family-name" value={datos.apellido} onChange={(e) => cambiar('apellido', e.target.value)} />
            </div>
          </div>
          <div className="campo">
            <label htmlFor="r-correo">Correo</label>
            <input id="r-correo" type="email" autoComplete="email" placeholder="tucorreo@gmail.com" value={datos.correo} onChange={(e) => cambiar('correo', e.target.value)} />
          </div>
          <div className="campo">
            <label htmlFor="r-telefono">Celular</label>
            <input id="r-telefono" inputMode="tel" autoComplete="tel" placeholder="987654321" value={datos.telefono} onChange={(e) => cambiar('telefono', e.target.value)} />
          </div>
          <CampoClave id="r-clave" valor={datos.password} alCambiar={(v) => cambiar('password', v)} etiqueta="Contraseña (mínimo 6)" nueva />
          <AvisoPrivacidad acepto={acepto} alCambiar={setAcepto} />
          <BotonCarga cargando={enviando}>Crear mi cuenta</BotonCarga>
        </form>
        <p className="sub" style={{ textAlign: 'center' }}>
          ¿Ya tienes cuenta? <Link to="/ingresar">Inicia sesión</Link>
        </p>
      </div>
    </div>
  )
}

export function RegistroNegocio() {
  useRolVisual('negocio')
  const { registrarNegocio } = useSesion()
  const navegar = useNavigate()
  const [dueno, setDueno] = useState({ nombre: '', apellido: '', correo: '', telefono: '', password: '' })
  const [puesto, setPuesto] = useState({ nombre: '', tipoComida: '', direccion: '', horario: '' })
  const [acepto, setAcepto] = useState(false)
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function enviar(e) {
    e.preventDefault()
    setError('')
    if (!dueno.nombre.trim()) return setError('Escribe tu nombre')
    if (!dueno.correo.includes('@')) return setError('Escribe un correo válido')
    if (dueno.password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres')
    if (!puesto.nombre.trim()) return setError('Escribe el nombre de tu puesto')
    if (!acepto) return setError('Debes aceptar el aviso de privacidad')
    setEnviando(true)
    try {
      await registrarNegocio({
        propietario: { ...dueno, correo: dueno.correo.trim(), aceptoPrivacidad: true },
        negocio: { ...puesto, telefono: dueno.telefono }
      })
      navegar('/negocio', { replace: true })
    } catch (err) {
      setError(err.message)
      setEnviando(false)
    }
  }

  return (
    <div className="acceso">
      <div className="acceso-caja">
        <Cabecera />
        <div>
          <h1>Registra tu puesto</h1>
          <p className="sub">Recibe pedidos desde el celular. Revisaremos tus datos y te avisaremos cuando tu puesto esté aprobado.</p>
        </div>
        <form className="tarjeta formulario" onSubmit={enviar}>
          <Error>{error}</Error>
          <h2>Tus datos</h2>
          <div className="dos">
            <div className="campo">
              <label htmlFor="n-nombre">Nombre</label>
              <input id="n-nombre" autoComplete="given-name" value={dueno.nombre} onChange={(e) => setDueno({ ...dueno, nombre: e.target.value })} />
            </div>
            <div className="campo">
              <label htmlFor="n-apellido">Apellido</label>
              <input id="n-apellido" autoComplete="family-name" value={dueno.apellido} onChange={(e) => setDueno({ ...dueno, apellido: e.target.value })} />
            </div>
          </div>
          <div className="campo">
            <label htmlFor="n-correo">Correo</label>
            <input id="n-correo" type="email" autoComplete="email" value={dueno.correo} onChange={(e) => setDueno({ ...dueno, correo: e.target.value })} />
          </div>
          <div className="campo">
            <label htmlFor="n-telefono">Celular</label>
            <input id="n-telefono" inputMode="tel" autoComplete="tel" value={dueno.telefono} onChange={(e) => setDueno({ ...dueno, telefono: e.target.value })} />
          </div>
          <CampoClave id="n-clave" valor={dueno.password} alCambiar={(v) => setDueno({ ...dueno, password: v })} etiqueta="Contraseña (mínimo 6)" nueva />

          <h2>Tu puesto</h2>
          <div className="campo">
            <label htmlFor="n-puesto">Nombre del puesto</label>
            <input id="n-puesto" placeholder="Salchipapas Tía Rosa" value={puesto.nombre} onChange={(e) => setPuesto({ ...puesto, nombre: e.target.value })} />
          </div>
          <div className="campo">
            <label htmlFor="n-tipo">¿Qué vendes?</label>
            <input id="n-tipo" placeholder="Salchipapas, hamburguesas, anticuchos…" value={puesto.tipoComida} onChange={(e) => setPuesto({ ...puesto, tipoComida: e.target.value })} />
          </div>
          <div className="campo">
            <label htmlFor="n-direccion">¿Dónde está tu puesto?</label>
            <input id="n-direccion" placeholder="Av. Abancay 410, frente al parque" value={puesto.direccion} onChange={(e) => setPuesto({ ...puesto, direccion: e.target.value })} />
          </div>
          <div className="campo">
            <label htmlFor="n-horario">Horario</label>
            <input id="n-horario" placeholder="Lun a Dom · 6 pm a 11 pm" value={puesto.horario} onChange={(e) => setPuesto({ ...puesto, horario: e.target.value })} />
          </div>
          <AvisoPrivacidad acepto={acepto} alCambiar={setAcepto} />
          <BotonCarga cargando={enviando}>Enviar solicitud</BotonCarga>
        </form>
        <p className="sub" style={{ textAlign: 'center' }}>
          ¿Ya tienes cuenta? <Link to="/ingresar">Inicia sesión</Link>
        </p>
      </div>
    </div>
  )
}
