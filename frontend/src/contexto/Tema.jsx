import { createContext, useContext, useEffect, useState } from 'react'

const TemaContexto = createContext(null)

const COLOR_BARRA = {
  cliente: { claro: '#EA580C', oscuro: '#0B0806' },
  negocio: { claro: '#DC2626', oscuro: '#0B0606' },
  admin: { claro: '#1F2937', oscuro: '#08090B' }
}

function leer() {
  try {
    return localStorage.getItem('pidecerca_modo') || 'auto'
  } catch {
    return 'auto'
  }
}

function porHora() {
  const hora = new Date().getHours()
  return hora >= 6 && hora < 18 ? 'claro' : 'oscuro'
}

export function TemaProveedor({ children }) {
  const [modo, setModo] = useState(leer)
  const [rol, setRol] = useState('cliente')
  const [hora, setHora] = useState(porHora)

  useEffect(() => {
    if (modo !== 'auto') return
    const intervalo = setInterval(() => setHora(porHora()), 60000)
    return () => clearInterval(intervalo)
  }, [modo])

  const real = modo === 'auto' ? hora : modo

  useEffect(() => {
    const raiz = document.documentElement
    raiz.dataset.tema = real
    raiz.dataset.rol = rol
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', COLOR_BARRA[rol][real])
  }, [real, rol])

  function cambiarModo(nuevo) {
    setModo(nuevo)
    try {
      localStorage.setItem('pidecerca_modo', nuevo)
    } catch {
      return
    }
  }

  function alternar() {
    cambiarModo(real === 'oscuro' ? 'claro' : 'oscuro')
  }

  return <TemaContexto.Provider value={{ modo, real, cambiarModo, alternar, setRol }}>{children}</TemaContexto.Provider>
}

export function useTema() {
  return useContext(TemaContexto)
}

export function useRolVisual(rol) {
  const { setRol } = useTema()
  useEffect(() => {
    setRol(rol)
  }, [rol, setRol])
}
