import { useEffect } from 'react'
import { Loader2, X } from 'lucide-react'
import { ESTADOS } from '../util/formato'

export function Cargando() {
  return (
    <div className="cargando" role="status" aria-label="Cargando">
      <Loader2 className="giro" size={30} />
    </div>
  )
}

export function Vacio({ children }) {
  return <div className="vacio">{children}</div>
}

export function Estado({ estado }) {
  const info = ESTADOS[estado] || { texto: estado, clase: 'ent' }
  return (
    <span className={'estado ' + info.clase}>
      {info.clase === 'can' ? '✕' : <span className="punto" />}
      {info.texto}
    </span>
  )
}

export function Error({ children }) {
  if (!children) return null
  return (
    <div className="aviso error" role="alert">
      {children}
    </div>
  )
}

export function Modal({ titulo, alCerrar, children }) {
  useEffect(() => {
    function tecla(e) {
      if (e.key === 'Escape') alCerrar()
    }
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  }, [alCerrar])

  return (
    <div className="fondo-modal" onMouseDown={(e) => e.target === e.currentTarget && alCerrar()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={titulo}>
        <div className="fila entre">
          <h2>{titulo}</h2>
          <button className="boton-icono" onClick={alCerrar} aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function Interruptor({ encendido, alCambiar, etiqueta }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={encendido}
      aria-label={etiqueta}
      className={'interruptor' + (encendido ? ' encendido' : '')}
      onClick={alCambiar}
    />
  )
}

export function BotonCarga({ cargando, children, className = 'boton principal ancho', ...resto }) {
  return (
    <button className={className} disabled={cargando} {...resto}>
      {cargando ? <Loader2 className="giro" size={22} /> : children}
    </button>
  )
}
