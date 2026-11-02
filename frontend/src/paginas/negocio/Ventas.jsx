import { useEffect, useMemo, useState } from 'react'
import { api } from '../../api'
import BarrasSemana from '../../componentes/BarrasSemana'
import SelectorDia from '../../componentes/SelectorDia'
import { enRango } from '../../util/dias'
import { Cargando, Error, Estado } from '../../componentes/Ui'
import { fechaCorta, nombreCorto, soles } from '../../util/formato'
import { useNegocio } from './Negocio'

function ingresa(p) {
  return p.estado === 'RECOGIDO' || (p.estado === 'NO_RECOGIDO' && p.pago?.metodo !== 'EFECTIVO')
}

const VACIO = {
  hoy: 'Hoy no hay pedidos terminados.',
  ayer: 'Ayer no hubo pedidos terminados.',
  antes: 'Todavía no hay pedidos terminados.'
}

function inicioDia(fecha) {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()).getTime()
}

export default function Ventas() {
  const [pedidos, setPedidos] = useState(null)
  const [error, setError] = useState('')
  const [rango, setRango] = useState('hoy')
  const { negocio } = useNegocio()

  useEffect(() => {
    api('/pedidos/negocio')
      .then(setPedidos)
      .catch((e) => setError(e.message))
  }, [])

  const datos = useMemo(() => {
    if (!pedidos) return null
    const hoy = inicioDia(new Date())
    const entregados = pedidos.filter((p) => ingresa(p))
    const deHoy = pedidos.filter((p) => new Date(p.fecha).getTime() >= hoy)
    const ventasHoy = deHoy.filter((p) => ingresa(p)).reduce((s, p) => s + p.total, 0)
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
      pedidosHoy: deHoy.filter((p) => ingresa(p)).length,
      canceladosHoy: deHoy.filter((p) => p.estado === 'CANCELADO').length,
      entregados,
      top,
      terminados: pedidos.filter((p) => ['RECOGIDO', 'CANCELADO', 'NO_RECOGIDO'].includes(p.estado))
    }
  }, [pedidos])

  if (!datos) return error ? <Error>{error}</Error> : <Cargando />

  const historial = datos.terminados.filter((p) => enRango(rango, p.fecha))

  return (
    <>
      <h1>Mis ventas</h1>
      {negocio?.totalCalificaciones > 0 && (
        <p className="sub">
          Tus clientes te califican con ★ {negocio.promedioCalificacion} ({negocio.totalCalificaciones})
        </p>
      )}
      <section className="destacada columna" style={{ gap: 4 }}>
        <span style={{ fontWeight: 700, opacity: 0.9 }}>Vendiste hoy</span>
        <span className="numero-grande">{soles(datos.ventasHoy)}</span>
        <span style={{ opacity: 0.9 }}>
          {datos.pedidosHoy} pedidos entregados · {datos.canceladosHoy} cancelados
        </span>
      </section>

      <section className="tarjeta columna">
        <h2>Últimos 7 días</h2>
        <BarrasSemana pedidos={datos.entregados} verbo="Vendiste" nombreDe={(p) => nombreCorto(p.usuario)} />
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
        <SelectorDia rango={rango} alCambiar={setRango} contar={(clave) => datos.terminados.filter((p) => enRango(clave, p.fecha)).length} etiqueta="Historial por día" />
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
              {historial.map((p) => (
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
              {historial.length === 0 && (
                <tr>
                  <td colSpan={5} className="mini">
                    {VACIO[rango]}
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
