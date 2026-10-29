import { useCallback, useEffect, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { api } from '../../api'
import { useAviso } from '../../contexto/Aviso'
import { BotonCarga, Cargando, Error, Interruptor, Modal, Vacio } from '../../componentes/Ui'
import { iniciales, soles } from '../../util/formato'

const VACIO = { nombre: '', precio: '', descripcion: '', imagen: '', categoriaId: '', disponible: true }

function FormProducto({ inicial, categorias, alGuardar, alCerrar }) {
  const [datos, setDatos] = useState(inicial)
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const cambiar = (c, v) => setDatos((d) => ({ ...d, [c]: v }))

  async function enviar(e) {
    e.preventDefault()
    const precio = Number(String(datos.precio).replace(',', '.'))
    if (!datos.nombre.trim()) return setError('Escribe el nombre del producto')
    if (!precio || precio <= 0) return setError('Escribe un precio mayor que 0')
    setGuardando(true)
    try {
      await alGuardar({
        nombre: datos.nombre.trim(),
        precio,
        descripcion: datos.descripcion,
        imagen: datos.imagen,
        disponible: datos.disponible,
        categoria: datos.categoriaId ? { id: Number(datos.categoriaId) } : null
      })
    } catch (err) {
      setError(err.message)
      setGuardando(false)
    }
  }

  return (
    <Modal titulo={inicial.id ? 'Editar producto' : 'Nuevo producto'} alCerrar={alCerrar}>
      <form className="formulario" onSubmit={enviar}>
        <Error>{error}</Error>
        <div className="campo">
          <label htmlFor="p-nombre">Nombre</label>
          <input id="p-nombre" value={datos.nombre} onChange={(e) => cambiar('nombre', e.target.value)} placeholder="Salchipapa clásica" />
        </div>
        <div className="dos">
          <div className="campo">
            <label htmlFor="p-precio">Precio (S/)</label>
            <input id="p-precio" inputMode="decimal" value={datos.precio} onChange={(e) => cambiar('precio', e.target.value)} placeholder="10.00" />
          </div>
          <div className="campo">
            <label htmlFor="p-cat">Categoría</label>
            <select id="p-cat" value={datos.categoriaId} onChange={(e) => cambiar('categoriaId', e.target.value)}>
              <option value="">Sin categoría</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="campo">
          <label htmlFor="p-desc">Descripción (opcional)</label>
          <input id="p-desc" value={datos.descripcion || ''} onChange={(e) => cambiar('descripcion', e.target.value)} placeholder="Papas, hot dog y cremas" />
        </div>
        <div className="campo">
          <label htmlFor="p-img">Foto (enlace de imagen, opcional)</label>
          <input id="p-img" value={datos.imagen || ''} onChange={(e) => cambiar('imagen', e.target.value)} placeholder="https://…" />
        </div>
        <div className="tarjeta fila entre">
          <span>
            <h3>Disponible</h3>
            <span className="mini">Si lo apagas, los clientes lo ven como agotado</span>
          </span>
          <Interruptor encendido={datos.disponible} alCambiar={() => cambiar('disponible', !datos.disponible)} etiqueta="Disponible" />
        </div>
        <BotonCarga cargando={guardando}>Guardar</BotonCarga>
      </form>
    </Modal>
  )
}

export default function MenuNegocio() {
  const mostrar = useAviso()
  const [productos, setProductos] = useState(null)
  const [categorias, setCategorias] = useState([])
  const [error, setError] = useState('')
  const [filtro, setFiltro] = useState('')
  const [editando, setEditando] = useState(null)
  const [nuevaCategoria, setNuevaCategoria] = useState(null)
  const [borrando, setBorrando] = useState(null)

  const cargar = useCallback(async () => {
    try {
      const [p, c] = await Promise.all([api('/productos/mios'), api('/categorias/mias')])
      setProductos(p)
      setCategorias(c)
      setError('')
    } catch (e) {
      setError(e.message)
    }
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  async function alternar(p) {
    try {
      const a = await api(`/productos/${p.id}/disponible`, { metodo: 'PUT', consulta: { valor: !p.disponible } })
      setProductos((lista) => lista.map((x) => (x.id === a.id ? a : x)))
      mostrar(a.disponible ? `${a.nombre} ya se puede pedir` : `${a.nombre} marcado como agotado`)
    } catch (e) {
      mostrar(e.message)
    }
  }

  async function guardar(datos) {
    if (editando.id) await api(`/productos/${editando.id}`, { metodo: 'PUT', cuerpo: datos })
    else await api('/productos', { metodo: 'POST', cuerpo: datos })
    mostrar(editando.id ? 'Producto actualizado' : 'Producto agregado a tu menú')
    setEditando(null)
    cargar()
  }

  async function crearCategoria(e) {
    e.preventDefault()
    if (!nuevaCategoria.trim()) return
    try {
      await api('/categorias', { metodo: 'POST', cuerpo: { nombre: nuevaCategoria.trim() } })
      setNuevaCategoria(null)
      mostrar('Categoría creada')
      cargar()
    } catch (err) {
      mostrar(err.message)
    }
  }

  async function borrar() {
    const p = borrando
    setBorrando(null)
    try {
      const r = await api(`/productos/${p.id}`, { metodo: 'DELETE' })
      mostrar(r?.mensaje || 'Producto eliminado')
      cargar()
    } catch (e) {
      mostrar(e.message)
    }
  }

  if (!productos) return error ? <Error>{error}</Error> : <Cargando />

  const usadas = categorias.filter((c) => productos.some((p) => p.categoria?.id === c.id))
  const visibles = productos.filter((p) => !filtro || String(p.categoria?.id) === filtro)

  return (
    <>
      <div className="fila entre envolver">
        <div>
          <h1>Mi menú</h1>
          <p className="sub">
            {productos.length} productos · {productos.filter((p) => p.disponible).length} disponibles
          </p>
        </div>
        <button className="boton principal" onClick={() => setEditando({ ...VACIO, categoriaId: filtro })}>
          <Plus size={20} />
          Agregar producto
        </button>
      </div>

      {usadas.length > 1 && (
        <div className="chips">
          <button className={'chip' + (!filtro ? ' activo' : '')} onClick={() => setFiltro('')}>
            Todo
          </button>
          {usadas.map((c) => (
            <button key={c.id} className={'chip' + (filtro === String(c.id) ? ' activo' : '')} onClick={() => setFiltro(String(c.id))}>
              {c.nombre}
            </button>
          ))}
        </div>
      )}

      <div className="lista">
        {visibles.map((p) => (
          <div key={p.id} className="tarjeta fila" style={{ gap: 12, opacity: p.disponible ? 1 : 0.6 }}>
            <span className="inicial">{p.imagen ? <img src={p.imagen} alt="" /> : iniciales(p.nombre)}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3>{p.nombre}</h3>
              <span className="precio">{p.disponible ? soles(p.precio) : 'Agotado'}</span>
              <div className="fila" style={{ marginTop: 8, gap: 8 }}>
                <button
                  className="boton secundario chico"
                  onClick={() => setEditando({ ...p, categoriaId: p.categoria?.id ? String(p.categoria.id) : '' })}
                >
                  <Pencil size={16} />
                  Editar
                </button>
                <button className="boton-icono" style={{ width: 40, height: 40 }} onClick={() => setBorrando(p)} aria-label={`Eliminar ${p.nombre}`}>
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            <Interruptor encendido={p.disponible} alCambiar={() => alternar(p)} etiqueta={p.disponible ? 'Marcar agotado' : 'Marcar disponible'} />
          </div>
        ))}
        {visibles.length === 0 && <Vacio>Aún no tienes productos. Toca “Agregar producto” para armar tu menú.</Vacio>}
      </div>

      <section className="tarjeta columna">
        <div className="fila entre">
          <h2>Categorías</h2>
          <button className="boton secundario chico" onClick={() => setNuevaCategoria('')}>
            <Plus size={16} />
            Nueva
          </button>
        </div>
        <div className="chips" style={{ flexWrap: 'wrap' }}>
          {categorias.map((c) => (
            <span key={c.id} className="chip">
              {c.nombre}
            </span>
          ))}
        </div>
      </section>

      {editando && <FormProducto inicial={editando} categorias={categorias} alGuardar={guardar} alCerrar={() => setEditando(null)} />}

      {nuevaCategoria !== null && (
        <Modal titulo="Nueva categoría" alCerrar={() => setNuevaCategoria(null)}>
          <form className="formulario" onSubmit={crearCategoria}>
            <div className="campo">
              <label htmlFor="c-nombre">Nombre</label>
              <input id="c-nombre" value={nuevaCategoria} onChange={(e) => setNuevaCategoria(e.target.value)} placeholder="Especiales de la casa" />
            </div>
            <button className="boton principal ancho">Crear categoría</button>
          </form>
        </Modal>
      )}

      {borrando && (
        <Modal titulo="¿Eliminar producto?" alCerrar={() => setBorrando(null)}>
          <p className="sub">
            Vas a eliminar <b>{borrando.nombre}</b>. Si ya tiene pedidos, solo se marcará como agotado.
          </p>
          <div className="dos">
            <button className="boton secundario" onClick={() => setBorrando(null)}>
              Cancelar
            </button>
            <button className="boton peligro" onClick={borrar}>
              Sí, eliminar
            </button>
          </div>
        </Modal>
      )}
    </>
  )
}
