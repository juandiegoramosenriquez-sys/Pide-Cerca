import { useRef, useState } from 'react'
import { Camera, Loader2, UtensilsCrossed, X } from 'lucide-react'
import { subirFoto, urlImagen } from '../util/imagen'

export function Foto({ src, alt = '', tamano = 64, radio = 14, icono: Icono = UtensilsCrossed, texto }) {
  const [fallo, setFallo] = useState(false)
  const url = urlImagen(src)
  let contenido
  if (url && !fallo) contenido = <img src={url} alt={alt} loading="lazy" onError={() => setFallo(true)} />
  else if (texto) contenido = <b style={{ fontSize: Math.round(tamano * 0.34), fontWeight: 900 }}>{texto}</b>
  else contenido = <Icono size={Math.round(tamano * 0.38)} />
  return (
    <span className="foto" style={{ width: tamano, height: tamano, borderRadius: radio }}>
      {contenido}
    </span>
  )
}

export function SubirFoto({ valor, alCambiar, texto = 'Agregar foto', alto = 170 }) {
  const entrada = useRef(null)
  const [subiendo, setSubiendo] = useState(false)
  const [error, setError] = useState('')
  const url = urlImagen(valor)

  async function elegir(e) {
    const archivo = e.target.files?.[0]
    e.target.value = ''
    if (!archivo) return
    setError('')
    setSubiendo(true)
    try {
      alCambiar(await subirFoto(archivo))
    } catch (err) {
      setError(err.message)
    } finally {
      setSubiendo(false)
    }
  }

  return (
    <div className="columna" style={{ gap: 6 }}>
      <div className="subir-foto" style={{ height: alto }}>
        <button type="button" className="subir-foto-area" onClick={() => entrada.current?.click()} disabled={subiendo} aria-label={url ? 'Cambiar foto' : texto}>
          {url && <img src={url} alt="" />}
          <span className={'subir-foto-etiqueta' + (url ? ' sobre' : '')}>
            {subiendo ? <Loader2 className="giro" size={26} /> : <Camera size={26} />}
            {subiendo ? 'Subiendo…' : url ? 'Cambiar foto' : texto}
          </span>
        </button>
        {url && !subiendo && (
          <button type="button" className="subir-foto-quitar" onClick={() => alCambiar('')} aria-label="Quitar foto">
            <X size={18} />
          </button>
        )}
      </div>
      <input ref={entrada} type="file" accept="image/*" hidden onChange={elegir} />
      {error && <span className="ayuda" style={{ color: 'var(--mal)' }}>{error}</span>}
    </div>
  )
}
