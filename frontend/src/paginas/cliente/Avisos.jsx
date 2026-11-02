import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { api } from '../../api'
import { Cargando, Error, Vacio } from '../../componentes/Ui'
import SelectorDia from '../../componentes/SelectorDia'
import { enRango } from '../../util/dias'
import { haceCuanto } from '../../util/formato'
import { useCliente } from './Cliente'

const VACIO = {
  hoy: 'No tienes avisos nuevos de hoy.',
  ayer: 'No tienes avisos nuevos de ayer.',
  antes: 'No tienes avisos.'
}

function esVisible(n, rango) {
  return enRango(rango, n.fecha) && (rango === 'antes' || !n.leida)
}

export default function Avisos() {
  const navegar = useNavigate()
  const { version, revisar } = useCliente()
  const [lista, setLista] = useState(null)
  const [error, setError] = useState('')
  const [recargar, setRecargar] = useState(0)
  const [rango, setRango] = useState('hoy')

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

  const visibles = lista.filter((n) => esVisible(n, rango))

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
      {lista.length === 0 ? (
        <Vacio>Aquí te avisaremos cuando tu pedido avance.</Vacio>
      ) : (
        <>
          <SelectorDia rango={rango} alCambiar={setRango} contar={(clave) => lista.filter((n) => esVisible(n, clave)).length} etiqueta="Avisos por día" />
          {visibles.length === 0 ? (
            <Vacio>{VACIO[rango]}</Vacio>
          ) : (
            <div className="lista">
              {visibles.map((n) => (
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
          )}
        </>
      )}
    </>
  )
}
