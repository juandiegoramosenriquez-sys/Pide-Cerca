import { useEffect, useState } from 'react'
import { WifiOff } from 'lucide-react'

export default function SinConexion() {
  const [enLinea, setEnLinea] = useState(navigator.onLine)

  useEffect(() => {
    const conectar = () => setEnLinea(true)
    const desconectar = () => setEnLinea(false)
    window.addEventListener('online', conectar)
    window.addEventListener('offline', desconectar)
    return () => {
      window.removeEventListener('online', conectar)
      window.removeEventListener('offline', desconectar)
    }
  }, [])

  if (enLinea) return null

  return (
    <div className="sin-conexion" role="status">
      <WifiOff size={18} />
      Sin conexión. Revisa tu internet
    </div>
  )
}
