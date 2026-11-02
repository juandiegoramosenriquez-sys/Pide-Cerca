import { useEffect, useState } from 'react'
import { api } from '../api'

const POR_DEFECTO = { minutosParaRecoger: 15, faltasBloqueanEfectivo: 2, distanciaMaximaMetros: 5000, maxPorProducto: 10, maxPorPedido: 30 }

let guardados = null

export function useAjustes() {
  const [ajustes, setAjustes] = useState(guardados || POR_DEFECTO)

  useEffect(() => {
    let vigente = true
    api('/ajustes')
      .then((a) => {
        guardados = a
        if (vigente) setAjustes(a)
      })
      .catch(() => {})
    return () => {
      vigente = false
    }
  }, [])

  return ajustes
}
