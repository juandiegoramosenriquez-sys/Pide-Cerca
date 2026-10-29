import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { api } from '../../api'
import { Cargando, Error, Vacio } from '../../componentes/Ui'
import { haceCuanto } from '../../util/formato'
import { useCliente } from './Cliente'

export default function Avisos() {
  const navegar = useNavigate()
  const { version, revisar } = useCliente()
  const [lista, setLista] = useState(null)
  const [error, setError] = useState('')
  const [recargar, setRecargar] = useState(0)

  useEffect(() => {
    api('/notificaciones')
      .then(setLista)
      .catch((e) => setError(e.message))
  }, [version, recargar])

  async function abrir(n) {
    if (!n.leida) {
      try {
        await api(`/notificaciones/${n.id}/leer`, { metodo: 'PUT' })
      } catch {
        return
      }
      revisar()
      setRecargar((r) => r + 1)
    }
    if (n.pedido?.id) navegar(`/pedido/${n.pedido.id}`)
  }

  async function leerTodas() {
    try {
      await api('/notificaciones/leer-todas', { metodo: 'PUT' })
      revisar()
      setRecargar((r) => r + 1)
    } catch (e) {
      setError(e.message)
    }
  }

  if (!lista) return error ? <Error>{error}</Error> : <Cargando />

  return (
    <>
      <div className="fila entre">
        <h1>Avisos</h1>
        {lista.some((n) => !n.leida) && (
          <button className="boton secundario chico" onClick={leerTodas}>
            Marcar todo como leído
          </button>
        )}
      </div>
      {lista.length === 0 && <Vacio>Aquí te avisaremos cuando tu pedido avance.</Vacio>}
      <div className="lista">
        {lista.map((n) => (
          <button
            key={n.id}
            className="tarjeta tocable fila"
            style={{ gap: 14, alignItems: 'flex-start', background: n.leida ? undefined : 'var(--cont)', color: n.leida ? undefined : 'var(--cont-t)' }}
            onClick={() => abrir(n)}
          >
            <Bell size={22} style={{ flexShrink: 0, marginTop: 2 }} />
            <span className="columna" style={{ gap: 2 }}>
              <h3>{n.titulo}</h3>
              <span>{n.mensaje}</span>
              <span className="mini">{haceCuanto(n.fecha)}</span>
            </span>
          </button>
        ))}
      </div>
    </>
  )
}
