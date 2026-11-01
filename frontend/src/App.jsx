import { lazy, useState } from 'react'
import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { inicioDe, useSesion } from './contexto/Sesion'
import { Cargando } from './componentes/Ui'
import { BotonSalir, ClaveCuenta, DatosCuenta, PantallaCuenta } from './componentes/MiCuenta'
import { iniciales } from './util/formato'
import { Lock, Monitor, User } from 'lucide-react'

const Ingresar = lazy(() => import('./paginas/acceso/Acceso').then((m) => ({ default: m.Ingresar })))
const RegistroCliente = lazy(() => import('./paginas/acceso/Acceso').then((m) => ({ default: m.RegistroCliente })))
const RegistroNegocio = lazy(() => import('./paginas/acceso/Acceso').then((m) => ({ default: m.RegistroNegocio })))
const ClienteArea = lazy(() => import('./paginas/cliente/Cliente'))
const Inicio = lazy(() => import('./paginas/cliente/Inicio'))
const Puesto = lazy(() => import('./paginas/cliente/Puesto'))
const Carrito = lazy(() => import('./paginas/cliente/Carrito'))
const MisPedidos = lazy(() => import('./paginas/cliente/Pedidos').then((m) => ({ default: m.MisPedidos })))
const SeguimientoPedido = lazy(() => import('./paginas/cliente/Pedidos').then((m) => ({ default: m.SeguimientoPedido })))
const Avisos = lazy(() => import('./paginas/cliente/Avisos'))
const NegocioArea = lazy(() => import('./paginas/negocio/Negocio'))
const PedidosNegocio = lazy(() => import('./paginas/negocio/Pedidos'))
const MenuNegocio = lazy(() => import('./paginas/negocio/Menu'))
const Ventas = lazy(() => import('./paginas/negocio/Ventas'))
const MiPuesto = lazy(() => import('./paginas/negocio/MiPuesto'))
const AdminArea = lazy(() => import('./paginas/admin/Admin'))
const FichaPuesto = lazy(() => import('./paginas/admin/Admin').then((m) => ({ default: m.FichaPuesto })))
const Puestos = lazy(() => import('./paginas/admin/Admin').then((m) => ({ default: m.Puestos })))
const Registro = lazy(() => import('./paginas/admin/Admin').then((m) => ({ default: m.Registro })))
const Resumen = lazy(() => import('./paginas/admin/Admin').then((m) => ({ default: m.Resumen })))
const Usuarios = lazy(() => import('./paginas/admin/Admin').then((m) => ({ default: m.Usuarios })))

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
          <Route path="puestos/:id" element={<FichaPuesto />} />
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
