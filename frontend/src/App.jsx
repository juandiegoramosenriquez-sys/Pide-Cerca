import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { inicioDe, useSesion } from './contexto/Sesion'
import { Cargando } from './componentes/Ui'
import MiCuenta from './componentes/MiCuenta'
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

function PerfilCliente() {
  return (
    <>
      <h1>Mi perfil</h1>
      <MiCuenta />
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
