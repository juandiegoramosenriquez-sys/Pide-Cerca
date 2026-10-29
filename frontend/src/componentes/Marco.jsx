import { NavLink, Outlet } from 'react-router-dom'
import { Moon, Sun } from 'lucide-react'
import { useRolVisual, useTema } from '../contexto/Tema'
import { desbloquearSonido } from '../util/sonido'

export function BotonTema() {
  const { real, alternar } = useTema()
  return (
    <button className="barra-boton" onClick={alternar} aria-label={real === 'oscuro' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}>
      {real === 'oscuro' ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  )
}

export function Barra({ titulo, sub, derecha, children }) {
  return (
    <header className="barra">
      <div className="barra-fila">
        <div style={{ minWidth: 0 }}>
          <div className="barra-titulo">{titulo}</div>
          {sub && <div className="barra-sub">{sub}</div>}
        </div>
        <div className="espacio" />
        {derecha}
        <BotonTema />
      </div>
      {children}
    </header>
  )
}

export function Marco({ rol, enlaces, titulo, sub, derecha, angosto = false, extra, contexto }) {
  useRolVisual(rol)
  return (
    <div className="app" onClick={desbloquearSonido}>
      <Barra titulo={titulo} sub={sub} derecha={derecha}>
        <nav className="tabs-arriba solo-escritorio" aria-label="Secciones">
          {enlaces.map((e) => (
            <NavLink key={e.ruta} to={e.ruta} end={e.exacto} className={({ isActive }) => 'tab-arriba' + (isActive ? ' activa' : '')}>
              <e.icono size={18} />
              {e.texto}
              {e.globo > 0 && <span className="estado rec">{e.globo}</span>}
            </NavLink>
          ))}
        </nav>
      </Barra>
      <main className={'contenido' + (angosto ? ' angosto' : '')}>
        <Outlet context={contexto} />
      </main>
      {extra}
      <nav className="nav-abajo solo-movil-nav" aria-label="Secciones">
        {enlaces.map((e) => (
          <NavLink key={e.ruta} to={e.ruta} end={e.exacto} className={({ isActive }) => 'nav-item' + (isActive ? ' activa' : '')}>
            <e.icono size={22} />
            {e.texto}
            {e.globo > 0 && <span className="globo">{e.globo}</span>}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
