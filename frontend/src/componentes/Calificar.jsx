import { useEffect, useState } from 'react'
import { api } from '../api'
import { useAviso } from '../contexto/Aviso'
import { Estrellas } from './Estrellas'
import { BotonCarga, Error } from './Ui'

export default function Calificar({ pedidoId }) {
  const mostrar = useAviso()
  const [cargada, setCargada] = useState(false)
  const [hecha, setHecha] = useState(null)
  const [estrellas, setEstrellas] = useState(0)
  const [comentario, setComentario] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    api(`/pedidos/${pedidoId}/calificacion`)
      .then((c) => setHecha(c))
      .catch(() => {})
      .finally(() => setCargada(true))
  }, [pedidoId])

  async function enviar(e) {
    e.preventDefault()
    setError('')
    if (!estrellas) return setError('Elige de 1 a 5 estrellas')
    setEnviando(true)
    try {
      const c = await api(`/pedidos/${pedidoId}/calificar`, { metodo: 'POST', cuerpo: { estrellas, comentario } })
      setHecha(c)
      mostrar('Gracias por calificar')
    } catch (err) {
      setError(err.message)
    } finally {
      setEnviando(false)
    }
  }

  if (!cargada) return null

  if (hecha) {
    return (
      <section className="tarjeta columna" style={{ gap: 6 }}>
        <h2>Tu calificación</h2>
        <Estrellas valor={hecha.estrellas} tamano={22} />
        {hecha.comentario && <p className="sub">{hecha.comentario}</p>}
      </section>
    )
  }

  return (
    <form className="tarjeta formulario" onSubmit={enviar}>
      <h2>¿Cómo estuvo tu pedido?</h2>
      <Estrellas valor={estrellas} alCambiar={setEstrellas} />
      <div className="campo">
        <label htmlFor="calificacion-comentario">Comentario (opcional)</label>
        <textarea id="calificacion-comentario" maxLength={300} value={comentario} onChange={(e) => setComentario(e.target.value)} />
      </div>
      <Error>{error}</Error>
      <BotonCarga cargando={enviando}>Enviar calificación</BotonCarga>
    </form>
  )
}
