import { useNavigate } from 'react-router-dom'
import ListaAvisos from '../../componentes/ListaAvisos'
import { useCliente } from './Cliente'

export default function Avisos() {
  const navegar = useNavigate()
  const { version, revisar } = useCliente()

  return (
    <ListaAvisos
      version={version}
      alActualizar={revisar}
      alAbrirPedido={(id) => navegar(`/pedido/${id}`)}
      textoVacio="Aquí te avisaremos cuando tu pedido avance."
    />
  )
}
