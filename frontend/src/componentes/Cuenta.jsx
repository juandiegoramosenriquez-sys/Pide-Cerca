import { useEffect, useState } from 'react'
import { Timer } from 'lucide-react'
import { cuentaRegresiva } from '../util/formato'

export default function Cuenta({ limite, texto, alTerminar }) {
  const [ahora, setAhora] = useState(Date.now())
  useEffect(() => {
    const i = setInterval(() => setAhora(Date.now()), 1000)
    return () => clearInterval(i)
  }, [])
  const cuenta = cuentaRegresiva(limite, ahora)
  useEffect(() => {
    if (cuenta?.segundos === 0) alTerminar?.()
  }, [cuenta?.segundos === 0])
  if (!cuenta) return null
  return (
    <span className={'cuenta' + (cuenta.segundos <= 60 ? ' urgente' : '')}>
      <Timer size={16} />
      {texto} {cuenta.texto}
    </span>
  )
}
