import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Bell, Home, ReceiptText, ShoppingBag, User } from 'lucide-react'
import { api } from '../../api'
import { useAviso } from '../../contexto/Aviso'
import { useSesion } from '../../contexto/Sesion'
import { Marco } from '../../componentes/Marco'
import { notificarSistema, sonarAviso } from '../../util/sonido'
import { soles } from '../../util/formato'

const ClienteContexto = createContext(null)

function leerCarrito() {
  try {
    const guardado = JSON.parse(localStorage.getItem('pidecerca_carrito') || 'null')
    if (guardado && Array.isArray(guardado.items)) return guardado
  } catch {
    return { negocio: null, items: [], notas: '' }
  }
  return { negocio: null, items: [], notas: '' }
}

export function useCliente() {
  return useContext(ClienteContexto)
}

export default function ClienteArea() {
  const { usuario } = useSesion()
  const mostrar = useAviso()
  const navegar = useNavigate()
  const ruta = useLocation().pathname
  const [carrito, setCarrito] = useState(leerCarrito)
  const [noLeidas, setNoLeidas] = useState(0)
  const [version, setVersion] = useState(0)
  const anterior = useRef(null)

  useEffect(() => {
    try {
      localStorage.setItem('pidecerca_carrito', JSON.stringify(carrito))
    } catch {
      return
    }
  }, [carrito])

  const revisar = useCallback(async () => {
    try {
      const { noLeidas: cuenta } = await api('/notificaciones/no-leidas')
      if (anterior.current !== null && cuenta > anterior.current) {
        const lista = await api('/notificaciones')
        const nueva = lista.find((n) => !n.leida)
        if (nueva) {
          sonarAviso()
          mostrar(nueva.titulo)
          notificarSistema(nueva.titulo, nueva.mensaje)
        }
        setVersion((v) => v + 1)
      }
      anterior.current = cuenta
      setNoLeidas(cuenta)
    } catch {
      return
    }
  }, [mostrar])

  useEffect(() => {
    revisar()
    const intervalo = setInterval(revisar, 10000)
    return () => clearInterval(intervalo)
  }, [revisar])

  const cantidad = carrito.items.reduce((s, i) => s + i.cantidad, 0)
  const total = carrito.items.reduce((s, i) => s + i.producto.precio * i.cantidad, 0)

  function agregar(negocio, producto, cuantos = 1) {
    setCarrito((c) => {
      const mismo = c.negocio && c.negocio.id === negocio.id
      const items = mismo ? [...c.items] : []
      const existente = items.find((i) => i.producto.id === producto.id)
      if (existente) existente.cantidad = Math.min(50, existente.cantidad + cuantos)
      else items.push({ producto, cantidad: cuantos })
      return { negocio: { id: negocio.id, nombre: negocio.nombre }, items, notas: mismo ? c.notas : '' }
    })
  }

  function cambiar(productoId, cambio) {
    setCarrito((c) => {
      const items = c.items
        .map((i) => (i.producto.id === productoId ? { ...i, cantidad: Math.min(50, i.cantidad + cambio) } : i))
        .filter((i) => i.cantidad > 0)
      return items.length ? { ...c, items } : { negocio: null, items: [], notas: '' }
    })
  }

  function vaciar() {
    setCarrito({ negocio: null, items: [], notas: '' })
  }

  function setNotas(notas) {
    setCarrito((c) => ({ ...c, notas }))
  }

  const enlaces = [
    { ruta: '/', texto: 'Inicio', icono: Home, exacto: true },
    { ruta: '/pedidos', texto: 'Pedidos', icono: ReceiptText },
    { ruta: '/avisos', texto: 'Avisos', icono: Bell, globo: noLeidas },
    { ruta: '/perfil', texto: 'Perfil', icono: User }
  ]

  const verBarraCarrito = cantidad > 0 && (ruta === '/' || ruta.startsWith('/puesto'))

  return (
    <ClienteContexto.Provider value={{ carrito, cantidad, total, agregar, cambiar, vaciar, setNotas, version, revisar }}>
      <Marco
        rol="cliente"
        enlaces={enlaces}
        titulo="PideCerca"
        sub={`Hola, ${usuario?.nombre || ''}`}
        extra={
          verBarraCarrito && (
            <button className="barra-carrito" onClick={() => navegar('/carrito')}>
              <span className="fila">
                <ShoppingBag size={22} />
                Ver carrito · {cantidad}
              </span>
              <span>{soles(total)}</span>
            </button>
          )
        }
      />
    </ClienteContexto.Provider>
  )
}
