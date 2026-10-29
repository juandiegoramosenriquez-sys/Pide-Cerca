import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api, configurarExpiracion, guardarToken, leerToken } from '../api'

const SesionContexto = createContext(null)

export function inicioDe(rol) {
  if (rol === 'ADMIN') return '/admin'
  if (rol === 'NEGOCIO') return '/negocio'
  return '/'
}

export function SesionProveedor({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [cargando, setCargando] = useState(true)

  const salir = useCallback(() => {
    guardarToken(null)
    setUsuario(null)
  }, [])

  useEffect(() => {
    configurarExpiracion(salir)
  }, [salir])

  useEffect(() => {
    async function iniciar() {
      if (!leerToken()) {
        setCargando(false)
        return
      }
      try {
        setUsuario(await api('/auth/me'))
      } catch {
        salir()
      } finally {
        setCargando(false)
      }
    }
    iniciar()
  }, [salir])

  function entrar(respuesta) {
    guardarToken(respuesta.token)
    setUsuario(respuesta.usuario)
    return respuesta.usuario
  }

  async function ingresar(correo, password) {
    return entrar(await api('/auth/login', { metodo: 'POST', cuerpo: { correo, password } }))
  }

  async function registrarCliente(datos) {
    return entrar(await api('/auth/registro', { metodo: 'POST', cuerpo: datos }))
  }

  async function registrarNegocio(datos) {
    return entrar(await api('/auth/registro-negocio', { metodo: 'POST', cuerpo: datos }))
  }

  return (
    <SesionContexto.Provider value={{ usuario, setUsuario, cargando, ingresar, registrarCliente, registrarNegocio, salir }}>
      {children}
    </SesionContexto.Provider>
  )
}

export function useSesion() {
  return useContext(SesionContexto)
}
