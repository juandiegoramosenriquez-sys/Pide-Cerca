import { createContext, useCallback, useContext, useRef, useState } from 'react'

const AvisoContexto = createContext(() => {})

export function AvisoProveedor({ children }) {
  const [texto, setTexto] = useState('')
  const reloj = useRef(null)

  const mostrar = useCallback((mensaje) => {
    setTexto(mensaje)
    clearTimeout(reloj.current)
    reloj.current = setTimeout(() => setTexto(''), 3500)
  }, [])

  return (
    <AvisoContexto.Provider value={mostrar}>
      {children}
      {texto && (
        <div className="toast" role="status">
          {texto}
        </div>
      )}
    </AvisoContexto.Provider>
  )
}

export function useAviso() {
  return useContext(AvisoContexto)
}
