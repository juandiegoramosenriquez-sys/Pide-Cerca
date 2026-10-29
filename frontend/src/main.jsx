import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AvisoProveedor } from './contexto/Aviso'
import { SesionProveedor } from './contexto/Sesion'
import { TemaProveedor } from './contexto/Tema'
import './estilos.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <TemaProveedor>
        <AvisoProveedor>
          <SesionProveedor>
            <App />
          </SesionProveedor>
        </AvisoProveedor>
      </TemaProveedor>
    </BrowserRouter>
  </StrictMode>
)

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}
