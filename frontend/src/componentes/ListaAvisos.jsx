import { useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import { api } from '../api'
import { Cargando, Error, Modal, Vacio } from './Ui'
import { fechaCompleta, haceCuanto } from '../util/formato'

export default function ListaAvisos({ version = 0, alActualizar, filtrar = () => true, alAbrirPedido, textoVacio }) {
  const [lista, setLista] = useState(null)
  const [error, setError] = useState('')
  const [recargar, setRecargar] = useState(0)
  const [abierto, setAbierto] = useState(null)

  useEffect(() => {
    api('/notificaciones')
      .then((todas) => setLista(todas.filter(filtrar)))
      .catch((e) => setError(e.message))
  }, [version, recargar])

  async function abrir(n) {
    setAbierto(n)
    if (!n.leida) {
      try {
        await api(`/notificaciones/${n.id}/leer`, { metodo: 'PUT' })
      } catch {
        return
      }
      alActualizar?.()
      setRecargar((r) => r + 1)
    }
  }

  async function leerTodas() {
    try {
      await Promise.all(lista.filter((n) => !n.leida).map((n) => api(`/notificaciones/${n.id}/leer`, { metodo: 'PUT' })))
      alActualizar?.()
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
      {lista.length === 0 ? (
        <Vacio>{textoVacio}</Vacio>
      ) : (
        <div className="lista">
          {lista.map((n) => (
            <button
              key={n.id}
              className="tarjeta tocable fila"
              style={{ gap: 14, alignItems: 'flex-start', background: n.leida ? undefined : 'var(--cont)', color: n.leida ? undefined : 'var(--cont-t)' }}
              onClick={() => abrir(n)}
            >
              <Bell size={22} style={{ flexShrink: 0, marginTop: 2 }} />
              <span className="columna" style={{ gap: 2, minWidth: 0, flex: 1 }}>
                <span className="fila entre" style={{ alignItems: 'flex-start' }}>
                  <h3>{n.titulo}</h3>
                  {!n.leida && <span className="estado rec">Sin leer</span>}
                </span>
                <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{n.mensaje}</span>
                <span className="mini">{haceCuanto(n.fecha)}</span>
              </span>
            </button>
          ))}
        </div>
      )}

      {abierto && (
        <Modal titulo={abierto.titulo} alCerrar={() => setAbierto(null)}>
          <p style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{abierto.mensaje}</p>
          <div className="columna" style={{ gap: 0 }}>
            <div className="ficha-dato">
              <span>Llegó</span>
              <b>{fechaCompleta(abierto.fecha)}</b>
            </div>
            {abierto.pedido?.id && (
              <div className="ficha-dato">
                <span>Pedido</span>
                <b>#{abierto.pedido.id}</b>
              </div>
            )}
          </div>
          {abierto.pedido?.id && alAbrirPedido && (
            <button className="boton principal ancho" onClick={() => alAbrirPedido(abierto.pedido.id)}>
              Ver el pedido
            </button>
          )}
          <button className="boton secundario ancho" onClick={() => setAbierto(null)}>
            Cerrar
          </button>
        </Modal>
      )}
    </>
  )
}
