import { useState } from 'react'
import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { inicioDe, useSesion } from './contexto/Sesion'
import { Cargando } from './componentes/Ui'
import { BotonSalir, ClaveCuenta, DatosCuenta, PantallaCuenta } from './componentes/MiCuenta'
import { iniciales } from './util/formato'
import { Lock, Monitor, User } from 'lucide-react'
import { Ingresar, RegistroCliente, RegistroNegocio } from './paginas/acceso/Acceso'
import ClienteArea from './paginas/cliente/Cliente'
import Inicio from './paginas/cliente/Inicio'
import Puesto from './paginas/cliente/Puesto'
import Carrito from './paginas/cliente/Carrito'
import { MisPedidos, SeguimientoPedido } from './paginas/cliente/Pedidos'
import Avisos from './paginas/cliente/Avisos'
import NegocioArea from './paginas/negocio/Negocio'
import PedidosNegocio from './paginas/negocio/Pedidos'
import MenuNegocio from './paginas/negocio/Menu'
import Ventas from './paginas/negocio/Ventas'
import MiPuesto from './paginas/negocio/MiPuesto'
import AdminArea, { Puestos, Registro, Resumen, Usuarios } from './paginas/admin/Admin'

function SoloInvitados() {
  const { usuario } = useSesion()
  return usuario ? <Navigate to={inicioDe(usuario.rol)} replace /> : <Outlet />
}

function SoloRol({ rol }) {
  const { usuario } = useSesion()
  if (!usuario) return <Navigate to="/ingresar" replace />
  if (usuario.rol !== rol) return <Navigate to={inicioDe(usuario.rol)} replace />
  return <Outlet />
}

const PESTANAS_PERFIL = [
  { clave: 'datos', texto: 'Datos', icono: User },
  { clave: 'clave', texto: 'Contraseña', icono: Lock },
  { clave: 'pantalla', texto: 'Pantalla', icono: Monitor }
]

function PerfilCliente() {
  const { usuario } = useSesion()
  const [pestana, setPestana] = useState('datos')
  const nombre = `${usuario?.nombre || ''} ${usuario?.apellido || ''}`.trim()

  return (
    <>
      <section className="perfil-cabecera cliente">
        <div className="perfil-cabecera-texto">
          <span className="avatar">{iniciales(nombre)}</span>
          <div style={{ minWidth: 0 }}>
            <h1>{nombre}</h1>
            <span style={{ opacity: 0.9, overflowWrap: 'anywhere' }}>{usuario?.correo}</span>
          </div>
        </div>
      </section>

      <div className="segmento" role="tablist" aria-label="Secciones de mi perfil">
        {PESTANAS_PERFIL.map((p) => (
          <button key={p.clave} type="button" role="tab" aria-selected={pestana === p.clave} className={pestana === p.clave ? 'activo' : ''} onClick={() => setPestana(p.clave)}>
            <p.icono size={18} />
            {p.texto}
          </button>
        ))}
      </div>

      {pestana === 'datos' && <DatosCuenta />}
      {pestana === 'clave' && <ClaveCuenta />}
      {pestana === 'pantalla' && <PantallaCuenta />}
      <BotonSalir />
    </>
  )
}

export default function App() {
  const { cargando } = useSesion()
  if (cargando) return <Cargando />

  return (
    <Routes>
      <Route element={<SoloInvitados />}>
        <Route path="/ingresar" element={<Ingresar />} />
        <Route path="/registro" element={<RegistroCliente />} />
        <Route path="/registro-negocio" element={<RegistroNegocio />} />
      </Route>

      <Route element={<SoloRol rol="ADMIN" />}>
        <Route path="/admin" element={<AdminArea />}>
          <Route index element={<Resumen />} />
          <Route path="puestos" element={<Puestos />} />
          <Route path="usuarios" element={<Usuarios />} />
          <Route path="registro" element={<Registro />} />
        </Route>
      </Route>

      <Route element={<SoloRol rol="NEGOCIO" />}>
        <Route path="/negocio" element={<NegocioArea />}>
          <Route index element={<PedidosNegocio />} />
          <Route path="menu" element={<MenuNegocio />} />
          <Route path="ventas" element={<Ventas />} />
          <Route path="puesto" element={<MiPuesto />} />
        </Route>
      </Route>

      <Route element={<SoloRol rol="CLIENTE" />}>
        <Route element={<ClienteArea />}>
          <Route path="/" element={<Inicio />} />
          <Route path="/puesto/:id" element={<Puesto />} />
          <Route path="/carrito" element={<Carrito />} />
          <Route path="/pedidos" element={<MisPedidos />} />
          <Route path="/pedido/:id" element={<SeguimientoPedido />} />
          <Route path="/avisos" element={<Avisos />} />
          <Route path="/perfil" element={<PerfilCliente />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
