import { useEffect, useMemo, useState } from 'react'
import { api } from '../../api'
import { Cargando, Error, Estado } from '../../componentes/Ui'
import { fechaCorta, nombreCorto, soles } from '../../util/formato'

const DIAS = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá']

function inicioDia(fecha) {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()).getTime()
}

export default function Ventas() {
  const [pedidos, setPedidos] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api('/pedidos/negocio')
      .then(setPedidos)
      .catch((e) => setError(e.message))
  }, [])

  const datos = useMemo(() => {
    if (!pedidos) return null
    const hoy = inicioDia(new Date())
    const entregados = pedidos.filter((p) => p.estado === 'RECOGIDO')
    const deHoy = pedidos.filter((p) => new Date(p.fecha).getTime() >= hoy)
    const ventasHoy = deHoy.filter((p) => p.estado === 'RECOGIDO').reduce((s, p) => s + p.total, 0)
    const semana = Array.from({ length: 7 }, (_, i) => {
      const dia = hoy - (6 - i) * 86400000
      const total = entregados
        .filter((p) => {
          const t = new Date(p.fecha).getTime()
          return t >= dia && t < dia + 86400000
        })
        .reduce((s, p) => s + p.total, 0)
      return { etiqueta: DIAS[new Date(dia).getDay()], total, hoy: i === 6 }
    })
    const maximo = Math.max(1, ...semana.map((d) => d.total))
    const conteo = {}
    entregados.forEach((p) =>
      p.detalles?.forEach((d) => {
        const n = d.producto?.nombre || 'Producto'
        conteo[n] = (conteo[n] || 0) + d.cantidad
      })
    )
    const top = Object.entries(conteo)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
    return {
      ventasHoy,
      pedidosHoy: deHoy.filter((p) => p.estado === 'RECOGIDO').length,
      canceladosHoy: deHoy.filter((p) => p.estado === 'CANCELADO').length,
      semana,
      maximo,
      top,
      ultimos: pedidos.filter((p) => ['RECOGIDO', 'CANCELADO'].includes(p.estado)).slice(0, 15)
    }
  }, [pedidos])

  if (!datos) return error ? <Error>{error}</Error> : <Cargando />

  return (
    <>
      <h1>Mis ventas</h1>
      <section className="destacada columna" style={{ gap: 4 }}>
        <span style={{ fontWeight: 700, opacity: 0.9 }}>Vendiste hoy</span>
        <span className="numero-grande">{soles(datos.ventasHoy)}</span>
        <span style={{ opacity: 0.9 }}>
          {datos.pedidosHoy} pedidos entregados · {datos.canceladosHoy} cancelados
        </span>
      </section>

      <section className="tarjeta columna">
        <h2>Últimos 7 días</h2>
        <div className="barras" role="img" aria-label="Ventas de los últimos 7 días">
          {datos.semana.map((d, i) => (
            <div key={i} title={soles(d.total)}>
              <i className={d.hoy ? 'hoy' : ''} style={{ height: `${Math.max(4, (d.total / datos.maximo) * 100)}%` }} />
              <span>{d.etiqueta}</span>
            </div>
          ))}
        </div>
      </section>

      {datos.top.length > 0 && (
        <section className="tarjeta columna" style={{ gap: 8 }}>
          <h2>Lo más vendido</h2>
          {datos.top.map(([nombre, cantidad]) => (
            <div key={nombre} className="fila entre">
              <span>{nombre}</span>
              <b>{cantidad}</b>
            </div>
          ))}
        </section>
      )}

      <section className="columna">
        <h2>Historial</h2>
        <div className="tabla-caja">
          <table className="tabla">
            <thead>
              <tr>
                <th>#</th>
                <th>Fecha</th>
                <th>Cliente</th>
                <th>Total</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {datos.ultimos.map((p) => (
                <tr key={p.id}>
                  <td>
                    <b>#{p.id}</b>
                  </td>
                  <td>{fechaCorta(p.fecha)}</td>
                  <td>{nombreCorto(p.usuario)}</td>
                  <td>{soles(p.total)}</td>
                  <td>
                    <Estado estado={p.estado} />
                  </td>
                </tr>
              ))}
              {datos.ultimos.length === 0 && (
                <tr>
                  <td colSpan={5} className="mini">
                    Todavía no hay pedidos terminados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}
