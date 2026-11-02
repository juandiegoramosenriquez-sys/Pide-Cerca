package com.pidecerca.backend;

import com.pidecerca.backend.dto.CrearPedidoRequest;
import com.pidecerca.backend.dto.ItemPedidoRequest;
import com.pidecerca.backend.entity.Ajustes;
import com.pidecerca.backend.entity.EstadoAprobacion;
import com.pidecerca.backend.entity.EstadoPedido;
import com.pidecerca.backend.entity.Negocio;
import com.pidecerca.backend.entity.Pago;
import com.pidecerca.backend.entity.Pedido;
import com.pidecerca.backend.entity.Usuario;
import com.pidecerca.backend.exception.ApiException;
import com.pidecerca.backend.repository.NegocioRepository;
import com.pidecerca.backend.repository.PagoRepository;
import com.pidecerca.backend.repository.PedidoRepository;
import com.pidecerca.backend.repository.ProductoRepository;
import com.pidecerca.backend.repository.UsuarioRepository;
import com.pidecerca.backend.service.AjustesService;
import com.pidecerca.backend.service.NegocioService;
import com.pidecerca.backend.service.NotificacionService;
import com.pidecerca.backend.service.PedidoService;
import com.pidecerca.backend.service.UsuarioActualService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class PedidoServiceTest {

    private PedidoRepository pedidoRepository;
    private ProductoRepository productoRepository;
    private NegocioRepository negocioRepository;
    private NotificacionService notificacionService;
    private UsuarioActualService usuarioActualService;
    private UsuarioRepository usuarioRepository;
    private PedidoService servicio;
    private Negocio negocio;
    private Usuario cliente;

    @BeforeEach
    void preparar() {
        pedidoRepository = mock(PedidoRepository.class);
        productoRepository = mock(ProductoRepository.class);
        negocioRepository = mock(NegocioRepository.class);
        notificacionService = mock(NotificacionService.class);
        usuarioActualService = mock(UsuarioActualService.class);
        usuarioRepository = mock(UsuarioRepository.class);
        AjustesService ajustesService = mock(AjustesService.class);

        when(ajustesService.obtener()).thenReturn(new Ajustes());
        when(pedidoRepository.save(any(Pedido.class))).thenAnswer(i -> i.getArgument(0));

        servicio = new PedidoService(
                pedidoRepository,
                mock(PagoRepository.class),
                productoRepository,
                negocioRepository,
                mock(NegocioService.class),
                notificacionService,
                usuarioActualService,
                usuarioRepository,
                ajustesService);

        Usuario duena = new Usuario();
        duena.setCorreo("tia@correo.com");

        negocio = new Negocio();
        negocio.setActivo(true);
        negocio.setAbierto(true);
        negocio.setEstadoAprobacion(EstadoAprobacion.APROBADO);
        negocio.setPropietario(duena);
        when(negocioRepository.findById(1L)).thenReturn(Optional.of(negocio));

        cliente = new Usuario();
        cliente.setCorreo("ana@correo.com");
    }

    private CrearPedidoRequest pedido(String metodo, Double latitud, Double longitud, ItemPedidoRequest... items) {
        return new CrearPedidoRequest(1L, null, metodo, latitud, longitud, List.of(items));
    }

    private static ItemPedidoRequest item(long producto, int cantidad) {
        return new ItemPedidoRequest(producto, cantidad);
    }

    private String mensajeDe(Runnable accion) {
        return assertThrows(ApiException.class, accion::run).getMessage();
    }

    @Test
    void elEfectivoSeBloqueaCuandoElClienteLlegaAlLimiteDeFaltas() {
        cliente.setFaltas(2);
        String mensaje = mensajeDe(() -> servicio.crear(cliente, pedido("EFECTIVO", null, null, item(1, 1))));
        assertTrue(mensaje.contains("efectivo"));
    }

    @Test
    void conMenosFaltasElEfectivoNoSeBloquea() {
        cliente.setFaltas(1);
        String mensaje = mensajeDe(() -> servicio.crear(cliente, pedido("EFECTIVO", null, null, item(1, 1))));
        assertFalse(mensaje.contains("efectivo"));
    }

    @Test
    void conFaltasSePuedePagarDigital() {
        cliente.setFaltas(5);
        String mensaje = mensajeDe(() -> servicio.crear(cliente, pedido("YAPE", null, null, item(1, 1))));
        assertFalse(mensaje.contains("efectivo"));
    }

    @Test
    void noSePuedePedirMasDelMaximoPorProducto() {
        String mensaje = mensajeDe(() -> servicio.crear(cliente, pedido("YAPE", null, null, item(1, 11))));
        assertTrue(mensaje.contains("entre 1 y 10"));
    }

    @Test
    void noSePuedePedirMasDelMaximoPorPedido() {
        String mensaje = mensajeDe(() -> servicio.crear(cliente,
                pedido("YAPE", null, null, item(1, 8), item(2, 8), item(3, 8), item(4, 8))));
        assertTrue(mensaje.contains("30"));
    }

    @Test
    void unPuestoCerradoNoRecibePedidos() {
        negocio.setAbierto(false);
        String mensaje = mensajeDe(() -> servicio.crear(cliente, pedido("YAPE", null, null, item(1, 1))));
        assertTrue(mensaje.contains("cerró"));
    }

    @Test
    void unPuestoMuyLejosNoRecibePedidos() {
        negocio.setLatitud(-12.0464);
        negocio.setLongitud(-77.0428);
        String mensaje = mensajeDe(() -> servicio.crear(cliente, pedido("YAPE", -12.2, -77.2, item(1, 1))));
        assertTrue(mensaje.contains("muy lejos"));
    }

    @Test
    void unPedidoQueNoSeRecogeSeMarcaYSumaUnaFalta() {
        Pedido listo = new Pedido();
        listo.setUsuario(cliente);
        listo.setNegocio(negocio);
        listo.setEstado(EstadoPedido.LISTO_PARA_RECOGER);
        listo.setLimiteRecoger(LocalDateTime.now().minusMinutes(1));
        Pago pago = new Pago();
        pago.setMetodo("YAPE");
        listo.setPago(pago);
        when(pedidoRepository.findByEstadoAndLimiteRecogerBefore(any(), any())).thenReturn(List.of(listo));

        servicio.vencerNoRecogidos();

        assertEquals(EstadoPedido.NO_RECOGIDO, listo.getEstado());
        assertEquals(1, cliente.getFaltas());
        verify(usuarioRepository).save(cliente);

        ArgumentCaptor<String> mensajes = ArgumentCaptor.forClass(String.class);
        verify(notificacionService, times(2)).crear(any(), any(), anyString(), mensajes.capture());
        assertTrue(mensajes.getAllValues().get(0).contains("no se devuelve"));
    }

    @Test
    void sinPedidosVencidosNadieRecibeFaltas() {
        when(pedidoRepository.findByEstadoAndLimiteRecogerBefore(any(), any())).thenReturn(List.of());
        servicio.vencerNoRecogidos();
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    void conUnCodigoIncorrectoNoSeEntregaElPedido() {
        Usuario admin = new Usuario();
        Pedido listo = new Pedido();
        listo.setUsuario(cliente);
        listo.setNegocio(negocio);
        listo.setEstado(EstadoPedido.LISTO_PARA_RECOGER);
        listo.setCodigo("1234");
        when(pedidoRepository.findById(5L)).thenReturn(Optional.of(listo));
        when(usuarioActualService.esAdmin(admin)).thenReturn(true);

        String mensaje = mensajeDe(() -> servicio.marcarRecogido(admin, 5L, "0000"));

        assertTrue(mensaje.contains("código"));
        assertEquals(EstadoPedido.LISTO_PARA_RECOGER, listo.getEstado());
    }

    @Test
    void conElCodigoCorrectoSeEntregaElPedido() {
        Usuario admin = new Usuario();
        Pedido listo = new Pedido();
        listo.setUsuario(cliente);
        listo.setNegocio(negocio);
        listo.setEstado(EstadoPedido.LISTO_PARA_RECOGER);
        listo.setCodigo("1234");
        when(pedidoRepository.findById(5L)).thenReturn(Optional.of(listo));
        when(usuarioActualService.esAdmin(admin)).thenReturn(true);

        servicio.marcarRecogido(admin, 5L, "1234");

        assertEquals(EstadoPedido.RECOGIDO, listo.getEstado());
    }
}
