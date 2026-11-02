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
import com.pidecerca.backend.entity.Reclamo;
import com.pidecerca.backend.repository.ProductoRepository;
import com.pidecerca.backend.repository.ReclamoRepository;
import com.pidecerca.backend.repository.UsuarioRepository;
import com.pidecerca.backend.service.AjustesService;
import com.pidecerca.backend.service.NegocioService;
import com.pidecerca.backend.service.NotificacionService;
import com.pidecerca.backend.service.PedidoService;
import com.pidecerca.backend.service.UsuarioActualService;
import com.pidecerca.backend.entity.EstadoPago;
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
    private PagoRepository pagoRepository;
    private ReclamoRepository reclamoRepository;
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
        pagoRepository = mock(PagoRepository.class);
        reclamoRepository = mock(ReclamoRepository.class);
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
                pagoRepository,
                productoRepository,
                negocioRepository,
                mock(NegocioService.class),
                notificacionService,
                usuarioActualService,
                usuarioRepository,
                ajustesService,
                reclamoRepository);

        Usuario duena = new Usuario();
        duena.setCorreo("tia@correo.com");

        negocio = new Negocio();
        negocio.setActivo(true);
        negocio.setAbierto(true);
        negocio.setEstadoAprobacion(EstadoAprobacion.APROBADO);
        negocio.setPropietario(duena);
        negocio.agregarCobro("YAPE", "987654321");
        negocio.agregarCobro("PLIN", "987654322");
        negocio.setNombreCobro("Rosa Pérez");
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

    private Pedido pedidoPorPagar() {
        Usuario admin = new Usuario();
        Pago pago = new Pago();
        pago.setMetodo("YAPE");
        pago.setEstado(EstadoPago.PENDIENTE);
        Pedido pedido = new Pedido();
        pedido.setUsuario(cliente);
        pedido.setNegocio(negocio);
        pedido.setEstado(EstadoPedido.PENDIENTE);
        pedido.setPago(pago);
        when(pedidoRepository.findById(7L)).thenReturn(Optional.of(pedido));
        when(pagoRepository.findByPedidoId(any())).thenReturn(Optional.of(pago));
        when(usuarioActualService.esAdmin(any())).thenReturn(true);
        return pedido;
    }

    @Test
    void unPuestoSinYapeNoRecibePagosPorYape() {
        negocio.getCobros().clear();
        String mensaje = mensajeDe(() -> servicio.crear(cliente, pedido("YAPE", null, null, item(1, 1))));
        assertTrue(mensaje.contains("Yape"));
    }

    @Test
    void unPuestoSinEfectivoNoRecibeEfectivo() {
        negocio.setAceptaEfectivo(false);
        String mensaje = mensajeDe(() -> servicio.crear(cliente, pedido("EFECTIVO", null, null, item(1, 1))));
        assertTrue(mensaje.contains("efectivo"));
    }

    @Test
    void alAceptarUnPedidoDigitalEsperaElPago() {
        Pedido pedido = pedidoPorPagar();
        servicio.aceptar(new Usuario(), 7L, 10);
        assertEquals(EstadoPedido.ESPERANDO_PAGO, pedido.getEstado());
        assertTrue(pedido.getLimitePago() != null);
    }

    @Test
    void alConfirmarElPagoElPedidoSePrepara() {
        Pedido pedido = pedidoPorPagar();
        pedido.setEstado(EstadoPedido.ESPERANDO_PAGO);
        pedido.setTiempoPreparacion(10);
        servicio.confirmarPago(new Usuario(), 7L);
        assertEquals(EstadoPedido.ACEPTADO, pedido.getEstado());
        assertEquals(EstadoPago.PAGADO, pedido.getPago().getEstado());
        assertTrue(pedido.getFechaAceptado() != null);
    }

    @Test
    void elClienteDebeEscribirElNumeroDeOperacionAlAvisarQuePago() {
        Pedido pedido = pedidoPorPagar();
        pedido.setEstado(EstadoPedido.ESPERANDO_PAGO);
        cliente.setId(3L);
        String mensaje = mensajeDe(() -> servicio.avisarPago(cliente, 7L, "  "));
        assertTrue(mensaje.contains("número de operación"));
        assertTrue(!pedido.getPagoAvisado());
    }

    @Test
    void alAvisarElPagoSeGuardaElNumeroDeOperacionYSeDaTiempoDeRevision() {
        Pedido pedido = pedidoPorPagar();
        pedido.setEstado(EstadoPedido.ESPERANDO_PAGO);
        cliente.setId(3L);
        servicio.avisarPago(cliente, 7L, "12345678");
        assertEquals("12345678", pedido.getReferenciaPago());
        assertTrue(pedido.getPagoAvisado());
        assertTrue(pedido.getLimitePago().isAfter(LocalDateTime.now().plusMinutes(25)));
    }

    @Test
    void laTiaSoloPuedeDecirQueNoLlegoSiElClienteAvisoQuePago() {
        Pedido pedido = pedidoPorPagar();
        pedido.setEstado(EstadoPedido.ESPERANDO_PAGO);
        String mensaje = mensajeDe(() -> servicio.pagoNoLlego(new Usuario(), 7L));
        assertTrue(mensaje.contains("todavía no avisó"));
    }

    @Test
    void siLaTiaDiceQueNoLlegoElPedidoQuedaEnRevisionYNoSeCancela() {
        Pedido pedido = pedidoPorPagar();
        pedido.setEstado(EstadoPedido.ESPERANDO_PAGO);
        pedido.setFechaAvisoPago(LocalDateTime.now());
        servicio.pagoNoLlego(new Usuario(), 7L);
        assertEquals(EstadoPedido.ESPERANDO_PAGO, pedido.getEstado());
        assertTrue(pedido.getPagoObservado());
        assertEquals(EstadoPago.PENDIENTE, pedido.getPago().getEstado());
    }

    @Test
    void despuesDeLaRevisionLaTiaPuedeConfirmarElPagoSiElClienteMuestraSuComprobante() {
        Pedido pedido = pedidoPorPagar();
        pedido.setEstado(EstadoPedido.ESPERANDO_PAGO);
        pedido.setFechaAvisoPago(LocalDateTime.now());
        pedido.setFechaPagoObservado(LocalDateTime.now());
        pedido.setTiempoPreparacion(10);
        servicio.confirmarPago(new Usuario(), 7L);
        assertEquals(EstadoPedido.ACEPTADO, pedido.getEstado());
        assertEquals(EstadoPago.PAGADO, pedido.getPago().getEstado());
    }

    @Test
    void siLaRevisionVenceSinResolverseSeCancelaYSeCreaUnReclamoParaElAdmin() {
        Pedido pedido = pedidoPorPagar();
        pedido.setEstado(EstadoPedido.ESPERANDO_PAGO);
        pedido.setReferenciaPago("12345678");
        pedido.setFechaAvisoPago(LocalDateTime.now().minusMinutes(40));
        pedido.setFechaPagoObservado(LocalDateTime.now().minusMinutes(35));
        pedido.setLimitePago(LocalDateTime.now().minusMinutes(1));
        pedido.setTotal(18.0);
        when(pedidoRepository.findByEstadoAndLimitePagoBefore(any(), any())).thenReturn(List.of(pedido));

        servicio.vencerPagos();

        assertEquals(EstadoPedido.CANCELADO, pedido.getEstado());
        assertEquals("Pago no confirmado", pedido.getMotivoCancelacion());
        assertEquals(0, cliente.getFaltas());

        ArgumentCaptor<Reclamo> reclamo = ArgumentCaptor.forClass(Reclamo.class);
        verify(reclamoRepository).save(reclamo.capture());
        assertTrue(reclamo.getValue().getMensaje().contains("12345678"));
        assertEquals("PAGO", reclamo.getValue().getTipo());
    }

    @Test
    void sinPagarATiempoElPedidoSeCancelaYSumaUnaFalta() {
        Pedido pedido = pedidoPorPagar();
        pedido.setEstado(EstadoPedido.ESPERANDO_PAGO);
        pedido.setLimitePago(LocalDateTime.now().minusMinutes(1));
        when(pedidoRepository.findByEstadoAndLimitePagoBefore(any(), any())).thenReturn(List.of(pedido));

        servicio.vencerPagos();

        assertEquals(EstadoPedido.CANCELADO, pedido.getEstado());
        assertEquals(1, cliente.getFaltas());
    }

    @Test
    void siElPuestoNuncaRespondeAlAvisoDePagoSeCancelaConUnReclamoSinFaltaParaElCliente() {
        Pedido pedido = pedidoPorPagar();
        pedido.setEstado(EstadoPedido.ESPERANDO_PAGO);
        pedido.setReferenciaPago("98765432");
        pedido.setFechaAvisoPago(LocalDateTime.now().minusMinutes(40));
        pedido.setLimitePago(LocalDateTime.now().minusMinutes(1));
        pedido.setTotal(18.0);
        when(pedidoRepository.findByEstadoAndLimitePagoBefore(any(), any())).thenReturn(List.of(pedido));

        servicio.vencerPagos();

        assertEquals(EstadoPedido.CANCELADO, pedido.getEstado());
        assertEquals(0, cliente.getFaltas());
        verify(reclamoRepository).save(any(Reclamo.class));
    }
}
