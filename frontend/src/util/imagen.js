import { api } from '../api'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'
const ORIGEN = API_URL.replace(/\/api\/?$/, '')

export function urlImagen(valor) {
  if (!valor) return null
  if (valor.startsWith('/api/')) return ORIGEN + valor
  return valor
}

function cargar(archivo) {
  return new Promise((resolver, rechazar) => {
    const lector = new FileReader()
    lector.onload = () => {
      const img = new Image()
      img.onload = () => resolver(img)
      img.onerror = () => rechazar(new Error('No pudimos abrir esa foto'))
      img.src = lector.result
    }
    lector.onerror = () => rechazar(new Error('No pudimos leer esa foto'))
    lector.readAsDataURL(archivo)
  })
}

export async function comprimir(archivo, lado = 800) {
  if (!archivo.type.startsWith('image/')) throw new Error('Elige una foto')
  const img = await cargar(archivo)
  const escala = Math.min(1, lado / Math.max(img.width, img.height))
  const lienzo = document.createElement('canvas')
  lienzo.width = Math.round(img.width * escala)
  lienzo.height = Math.round(img.height * escala)
  lienzo.getContext('2d').drawImage(img, 0, 0, lienzo.width, lienzo.height)
  return lienzo.toDataURL('image/jpeg', 0.75)
}

export async function subirFoto(archivo) {
  const datos = await comprimir(archivo)
  const respuesta = await api('/imagenes', { metodo: 'POST', cuerpo: { datos } })
  return respuesta.url
}
