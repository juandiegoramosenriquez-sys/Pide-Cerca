import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, Tags, Trash2 } from 'lucide-react'
import { api } from '../../api'
import { useAviso } from '../../contexto/Aviso'
import { Foto, SubirFoto } from '../../componentes/Foto'
import { BotonCarga, Cargando, Error, Interruptor, Modal, Vacio } from '../../componentes/Ui'
import { soles } from '../../util/formato'

const VACIO = { nombre: '', precio: '', descripcion: '', imagen: '', categoriaId: '', disponible: true }

function FormProducto({ inicial, categorias, alGuardar, alEliminar, alCerrar }) {
  const [datos, setDatos] = useState(inicial)
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [confirmar, setConfirmar] = useState(false)
  const cambiar = (c, v) => setDatos((d) => ({ ...d, [c]: v }))

  async function enviar(e) {
    e.preventDefault()
    const precio = Number(String(datos.precio).replace(',', '.'))
    if (!datos.nombre.trim()) return setError('Escribe el nombre')
    if (!precio || precio <= 0) return setError('Escribe el precio')
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
        <SubirFoto valor={datos.imagen} alCambiar={(v) => cambiar('imagen', v)} />
        <div className="campo">
          <label htmlFor="p-nombre">Nombre</label>
          <input id="p-nombre" value={datos.nombre} onChange={(e) => cambiar('nombre', e.target.value)} placeholder="Salchipapa clásica" />
        </div>
        <div className="dos" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
          <div className="campo">
            <label htmlFor="p-precio">Precio S/</label>
            <input id="p-precio" inputMode="decimal" value={datos.precio} onChange={(e) => cambiar('precio', e.target.value)} placeholder="10.00" />
          </div>
          <div className="campo">
            <label htmlFor="p-cat">Categoría</label>
            <select id="p-cat" value={datos.categoriaId} onChange={(e) => cambiar('categoriaId', e.target.value)}>
              <option value="">Otros</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="campo">
          <label htmlFor="p-desc">Descripción</label>
          <input id="p-desc" value={datos.descripcion || ''} onChange={(e) => cambiar('descripcion', e.target.value)} placeholder="Papas, hot dog y cremas" />
        </div>
        <div className="fila entre tarjeta" style={{ padding: '12px 14px' }}>
          <h3>Disponible</h3>
          <Interruptor encendido={datos.disponible} alCambiar={() => cambiar('disponible', !datos.disponible)} etiqueta="Disponible" />
        </div>
        <Error>{error}</Error>
        <div className="acciones-modal">
          <BotonCarga cargando={guardando}>Guardar</BotonCarga>
          {inicial.id &&
            (confirmar ? (
              <div className="dos" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
                <button type="button" className="boton secundario" onClick={() => setConfirmar(false)}>
                  No
                </button>
                <button type="button" className="boton peligro" onClick={alEliminar}>
                  Sí, eliminar
                </button>
              </div>
            ) : (
              <button type="button" className="boton peligro chico" onClick={() => setConfirmar(true)}>
                <Trash2 size={18} />
                Eliminar
              </button>
            ))}
        </div>
      </form>
    </Modal>
  )
}

function Categorias({ categorias, alCrear, alCerrar }) {
  const [nombre, setNombre] = useState('')
  const propias = categorias.filter((c) => c.negocio)
  const generales = categorias.filter((c) => !c.negocio)
  return (
    <Modal titulo="Categorías" alCerrar={alCerrar}>
      <form
        className="fila"
        style={{ gap: 8 }}
        onSubmit={(e) => {
          e.preventDefault()
          if (nombre.trim()) alCrear(nombre.trim()).then(() => setNombre(''))
        }}
      >
        <input className="buscador" placeholder="Nueva categoría" value={nombre} onChange={(e) => setNombre(e.target.value)} aria-label="Nueva categoría" />
        <button className="boton principal" aria-label="Crear categoría">
          <Plus size={20} />
        </button>
      </form>
      {propias.length > 0 && (
        <div className="columna" style={{ gap: 8 }}>
          <span className="mini">Tuyas</span>
          <div className="chips" style={{ flexWrap: 'wrap' }}>
            {propias.map((c) => (
              <span key={c.id} className="chip activo">
                {c.nombre}
              </span>
            ))}
          </div>
        </div>
      )}
      <div className="columna" style={{ gap: 8 }}>
        <span className="mini">De PideCerca</span>
        <div className="chips" style={{ flexWrap: 'wrap' }}>
          {generales.map((c) => (
            <span key={c.id} className="chip">
              {c.nombre}
            </span>
          ))}
        </div>
      </div>
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
  const [verCategorias, setVerCategorias] = useState(false)

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

  const grupos = useMemo(() => {
    if (!productos) return []
    const mapa = new Map()
    productos.forEach((p) => {
      const nombre = p.categoria?.nombre || 'Otros'
      if (!mapa.has(nombre)) mapa.set(nombre, [])
      mapa.get(nombre).push(p)
    })
    return [...mapa.entries()].sort(([a], [b]) => (a === 'Otros') - (b === 'Otros') || a.localeCompare(b))
  }, [productos])

  async function alternar(p, e) {
    e.stopPropagation()
    try {
      const a = await api(`/productos/${p.id}/disponible`, { metodo: 'PUT', consulta: { valor: !p.disponible } })
      setProductos((lista) => lista.map((x) => (x.id === a.id ? a : x)))
      mostrar(a.disponible ? `${a.nombre}: disponible` : `${a.nombre}: agotado`)
    } catch (err) {
      mostrar(err.message)
    }
  }

  async function guardar(datos) {
    if (editando.id) await api(`/productos/${editando.id}`, { metodo: 'PUT', cuerpo: datos })
    else await api('/productos', { metodo: 'POST', cuerpo: datos })
    mostrar(editando.id ? 'Guardado' : 'Producto agregado')
    setEditando(null)
    cargar()
  }

  async function eliminar() {
    const p = editando
    setEditando(null)
    try {
      const r = await api(`/productos/${p.id}`, { metodo: 'DELETE' })
      mostrar(r?.resultado === 'DESACTIVADO' ? 'Marcado como agotado' : 'Producto eliminado')
      cargar()
    } catch (e) {
      mostrar(e.message)
    }
  }

  async function crearCategoria(nombre) {
    try {
      await api('/categorias', { metodo: 'POST', cuerpo: { nombre } })
      mostrar('Categoría creada')
      cargar()
    } catch (e) {
      mostrar(e.message)
    }
  }

  if (!productos) return error ? <Error>{error}</Error> : <Cargando />

  const disponibles = productos.filter((p) => p.disponible).length
  const visibles = grupos.filter(([nombre]) => !filtro || nombre === filtro)

  return (
    <>
      <div className="fila entre">
        <div>
          <h1>Mi menú</h1>
          <p className="sub">
            {disponibles} de {productos.length} disponibles
          </p>
        </div>
        <button className="boton-icono" style={{ width: 52, height: 52 }} onClick={() => setVerCategorias(true)} aria-label="Categorías" title="Categorías">
          <Tags size={22} />
        </button>
      </div>

      <button className="boton principal ancho" onClick={() => setEditando({ ...VACIO })}>
        <Plus size={22} />
        Agregar producto
      </button>

      {grupos.length > 1 && (
        <div className="chips">
          <button className={'chip' + (!filtro ? ' activo' : '')} onClick={() => setFiltro('')}>
            Todo
          </button>
          {grupos.map(([nombre, lista]) => (
            <button key={nombre} className={'chip' + (filtro === nombre ? ' activo' : '')} onClick={() => setFiltro(nombre)}>
              {nombre} · {lista.length}
            </button>
          ))}
        </div>
      )}

      {productos.length === 0 && <Vacio>Agrega tu primer producto con su foto y precio.</Vacio>}

      {visibles.map(([nombre, lista]) => (
        <section key={nombre} className="columna" style={{ gap: 10 }}>
          <div className="seccion-titulo">
            <h2>{nombre}</h2>
            <span>{lista.length}</span>
          </div>
          <div className="grilla">
            {lista.map((p) => (
              <div key={p.id} className={'producto' + (p.disponible ? '' : ' apagado')}>
                <button
                  className="fila"
                  style={{ flex: 1, minWidth: 0, gap: 14, border: 0, background: 'none', padding: 0, textAlign: 'left', color: 'inherit' }}
                  onClick={() => setEditando({ ...p, categoriaId: p.categoria?.id ? String(p.categoria.id) : '' })}
                  aria-label={`Editar ${p.nombre}`}
                >
                  <Foto src={p.imagen} tamano={68} />
                  <span className="producto-info">
                    <h3>{p.nombre}</h3>
                    <span className="precio">{p.disponible ? soles(p.precio) : 'Agotado'}</span>
                  </span>
                </button>
                <Interruptor encendido={p.disponible} alCambiar={(e) => alternar(p, e)} etiqueta={p.disponible ? 'Marcar agotado' : 'Marcar disponible'} />
              </div>
            ))}
          </div>
        </section>
      ))}

      {editando && (
        <FormProducto inicial={editando} categorias={categorias} alGuardar={guardar} alEliminar={eliminar} alCerrar={() => setEditando(null)} />
      )}

      {verCategorias && <Categorias categorias={categorias} alCrear={crearCategoria} alCerrar={() => setVerCategorias(false)} />}
    </>
  )
}
