import ListaAvisos from '../../componentes/ListaAvisos'
import { useNegocio } from './Negocio'

const sinPedido = (n) => !n.pedido

export default function AvisosNegocio() {
  const { avisosVersion, revisarAvisos } = useNegocio()

  return (
    <ListaAvisos
      version={avisosVersion}
      alActualizar={revisarAvisos}
      filtrar={sinPedido}
      textoVacio="Aquí te llegarán los avisos del administrador y las respuestas a tus reclamos."
    />
  )
}
