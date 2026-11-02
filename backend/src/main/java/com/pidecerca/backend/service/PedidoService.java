package com.pidecerca.backend.service;

import com.pidecerca.backend.dto.CrearPedidoRequest;
import com.pidecerca.backend.dto.ItemPedidoRequest;
import com.pidecerca.backend.entity.*;
import com.pidecerca.backend.exception.ApiException;
import com.pidecerca.backend.repository.NegocioRepository;
import com.pidecerca.backend.repository.PagoRepository;
import com.pidecerca.backend.repository.ReclamoRepository;
import com.pidecerca.backend.repository.PedidoRepository;
import com.pidecerca.backend.repository.ProductoRepository;
import com.pidecerca.backend.repository.UsuarioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.EnumSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class PedidoService {


    private static final Set<String> METODOS_PAGO = new java.util.HashSet<>(List.of("EFECTIVO"));

    static {
        METODOS_PAGO.addAll(MetodosDigitales.NOMBRES.keySet());
    }

    private static final Set<EstadoPedido> ESTADOS_ACTIVOS = EnumSet.of(
            EstadoPedido.PENDIENTE,
            EstadoPedido.ESPERANDO_PAGO,
            EstadoPedido.ACEPTADO,
            EstadoPedido.EN_PREPARACION,
            EstadoPedido.LISTO_PARA_RECOGER
    );

    private final PedidoRepository pedidoRepository;
    private final PagoRepository pagoRepository;
    private final ProductoRepository productoRepository;
    private final NegocioRepository negocioRepository;
    private final NegocioService negocioService;
    private final NotificacionService notificacionService;
    private final UsuarioActualService usuarioActualService;
    private final UsuarioRepository usuarioRepository;
    private final AjustesService ajustesService;
    private final ReclamoRepository reclamoRepository;

    public PedidoService(
            PedidoRepository pedidoRepository,
            PagoRepository pagoRepository,
            ProductoRepository productoRepository,
            NegocioRepository negocioRepository,
            NegocioService negocioService,
            NotificacionService notificacionService,
            UsuarioActualService usuarioActualService,
            UsuarioRepository usuarioRepository,
            AjustesService ajustesService,
            ReclamoRepository reclamoRepository) {

        this.reclamoRepository = reclamoRepository;
        this.usuarioRepository = usuarioRepository;
        this.ajustesService = ajustesService;
        this.pedidoRepository = pedidoRepository;
        this.pagoRepository = pagoRepository;
        this.productoRepository = productoRepository;
        this.negocioRepository = negocioRepository;
        this.negocioService = negocioService;
        this.notificacionService = notificacionService;
        this.usuarioActualService = usuarioActualService;
    }

    public List<Pedido> listarTodos(EstadoPedido estado) {

        if (estado != null) {
            return pedidoRepository.findByEstadoOrderByFechaDesc(estado);
        }

        return pedidoRepository.findAllByOrderByFechaDesc();
    }

    public List<Pedido> listarDelCliente(Usuario cliente) {
        return pedidoRepository.findByUsuarioIdOrderByFechaDesc(cliente.getId());
    }

    public List<Pedido> listarDelNegocio(Usuario usuario, boolean soloActivos) {

        Negocio negocio = negocioService.obtenerDelPropietario(usuario);
        negocio.setUltimaConexion(LocalDateTime.now());
        negocioRepository.save(negocio);

        if (soloActivos) {
            return pedidoRepository.findByNegocioIdAndEstadoInOrderByFechaAsc(
                    negocio.getId(), ESTADOS_ACTIVOS);
        }

        return pedidoRepository.findByNegocioIdOrderByFechaDesc(negocio.getId());
    }

    public Pedido obtener(Usuario usuario, Long id) {

        Pedido pedido = buscar(id);

        if (usuarioActualService.esAdmin(usuario)) {
            return pedido;
        }

        if (pedido.getUsuario() != null && pedido.getUsuario().getId().equals(usuario.getId())) {
            return pedido;
        }

        if (esDuenoDelNegocio(usuario, pedido)) {
            return pedido;
        }

        throw ApiException.prohibido("No tienes acceso a este pedido");
    }

    private static String textoDevolucion(Pedido pedido, boolean yaDevuelto) {
        if (pedido.getPago() == null || "EFECTIVO".equals(pedido.getPago().getMetodo())
                || pedido.getPago().getEstado() != EstadoPago.PAGADO) {
            return "No se te cobró nada";
        }
        return yaDevuelto ? "Te devolvimos tu dinero" : "Te devolveremos tu dinero";
    }

    @Transactional
    public Pedido crear(Usuario cliente, CrearPedidoRequest request) {

        if (request == null || request.negocioId() == null) {
            throw ApiException.solicitudInvalida("Selecciona un negocio");
        }

        if (request.items() == null || request.items().isEmpty()) {
            throw ApiException.solicitudInvalida("Tu carrito está vacío");
        }

        Ajustes ajustes = ajustesService.obtener();

        Negocio negocio = negocioRepository.findById(request.negocioId())
                .orElseThrow(() -> ApiException.noEncontrado("Negocio no encontrado"));

        if (!Boolean.TRUE.equals(negocio.getActivo()) || !negocio.estaAprobado()) {
            throw ApiException.solicitudInvalida("Este negocio no está disponible");
        }

        if (!Boolean.TRUE.equals(negocio.getAbierto())) {
            throw ApiException.solicitudInvalida("Este puesto cerró. No se te cobró nada");
        }

        if (request.latitud() != null && request.longitud() != null
                && negocio.getLatitud() != null && negocio.getLongitud() != null
                && NegocioService.distanciaMetros(request.latitud(), request.longitud(),
                        negocio.getLatitud(), negocio.getLongitud()) > ajustes.getDistanciaMaximaMetros()) {
            throw ApiException.solicitudInvalida("Este puesto está muy lejos de ti. Pide en uno a menos de "
                    + (ajustes.getDistanciaMaximaMetros() / 1000.0) + " km");
        }

        String metodo = request.metodoPago() == null
                ? "YAPE"
                : request.metodoPago().trim().toUpperCase();

        if (!METODOS_PAGO.contains(metodo)) {
            throw ApiException.solicitudInvalida("Método de pago no válido");
        }

        boolean recibe = "EFECTIVO".equals(metodo) ? negocio.getAceptaEfectivo() : negocio.aceptaMetodo(metodo);

        if (!recibe) {
            throw ApiException.solicitudInvalida("Este puesto no recibe pagos con "
                    + ("EFECTIVO".equals(metodo) ? "efectivo" : MetodosDigitales.nombre(metodo)));
        }

        if ("EFECTIVO".equals(metodo) && cliente.getFaltas() >= ajustes.getFaltasBloqueanEfectivo()) {
            throw ApiException.solicitudInvalida("Con efectivo no puedes pedir porque no recogiste pedidos antes. Usa Yape, Plin o tarjeta");
        }

        Map<Long, Integer> cantidades = new LinkedHashMap<>();

        for (ItemPedidoRequest item : request.items()) {
            if (item.productoId() == null) {
                throw ApiException.solicitudInvalida("Hay un producto inválido en el carrito");
            }
            if (item.cantidad() == null || item.cantidad() <= 0 || item.cantidad() > ajustes.getMaxPorProducto()) {
                throw ApiException.solicitudInvalida("La cantidad debe estar entre 1 y " + ajustes.getMaxPorProducto());
            }
            cantidades.merge(item.productoId(), item.cantidad(), Integer::sum);
        }

        if (cantidades.values().stream().anyMatch(cantidad -> cantidad > ajustes.getMaxPorProducto())) {
            throw ApiException.solicitudInvalida("Máximo " + ajustes.getMaxPorProducto() + " unidades por producto");
        }

        if (cantidades.values().stream().mapToInt(Integer::intValue).sum() > ajustes.getMaxPorPedido()) {
            throw ApiException.solicitudInvalida("Máximo " + ajustes.getMaxPorPedido() + " productos por pedido");
        }

        Pedido pedido = new Pedido();
        pedido.setCodigo(nuevoCodigo());
        pedido.setFecha(LocalDateTime.now());
        pedido.setEstado(EstadoPedido.PENDIENTE);
        pedido.setUsuario(cliente);
        pedido.setNegocio(negocio);
        pedido.setNotas(AuthService.texto(request.notas()));
        pedido.setTiempoPreparacion(negocio.getTiempoEstimado());

        double total = 0;

        for (Map.Entry<Long, Integer> entrada : cantidades.entrySet()) {

            Producto producto = productoRepository.findById(entrada.getKey())
                    .orElseThrow(() -> ApiException.noEncontrado("Un producto del carrito ya no existe"));

            if (producto.getNegocio() == null || !producto.getNegocio().getId().equals(negocio.getId())) {
                throw ApiException.solicitudInvalida("Todos los productos deben ser del mismo negocio");
            }

            if (!Boolean.TRUE.equals(producto.getDisponible())) {
                throw ApiException.solicitudInvalida(producto.getNombre() + " ya no está disponible");
            }

            DetallePedido detalle = new DetallePedido();
            detalle.setPedido(pedido);
            detalle.setProducto(producto);
            detalle.setCantidad(entrada.getValue());
            detalle.setPrecioUnitario(producto.getPrecio());
            detalle.setSubtotal(redondear(producto.getPrecio() * entrada.getValue()));

            pedido.getDetalles().add(detalle);
            total += detalle.getSubtotal();
        }

        pedido.setTotal(redondear(total));

        Pedido guardado = pedidoRepository.save(pedido);

        Pago pago = new Pago();
        pago.setPedido(guardado);
        pago.setMonto(guardado.getTotal());
        pago.setMetodo(metodo);
        pago.setFecha(LocalDateTime.now());
        pago.setEstado("EFECTIVO".equals(metodo) ? EstadoPago.PAGADO : EstadoPago.PENDIENTE);
        guardado.setPago(pagoRepository.save(pago));

        notificacionService.crear(
                negocio.getPropietario(),
                guardado,
                "Nuevo pedido #" + guardado.getId(),
                resumenProductos(guardado) + " · S/ " + String.format("%.2f", guardado.getTotal())
        );

        notificacionService.crear(
                cliente,
                guardado,
                "Pedido enviado",
                "Tu pedido #" + guardado.getId() + " fue enviado a " + negocio.getNombre()
                        + ". Te avisaremos cuando lo acepten"
        );

        return guardado;
    }

    @Transactional
    public Pedido aceptar(Usuario usuario, Long id, Integer minutos) {

        Pedido pedido = obtenerParaNegocio(usuario, id);
        validarEstado(pedido, EstadoPedido.PENDIENTE, "Solo puedes aceptar pedidos nuevos");

        Pago pago = pagoRepository.findByPedidoId(id).orElse(null);

        if (pago == null) {
            throw ApiException.solicitudInvalida("El pedido no tiene un pago registrado");
        }

        if (minutos != null) {
            validarMinutos(minutos);
            pedido.setTiempoPreparacion(minutos);
        }

        if (pedido.getTiempoPreparacion() == null) {
            pedido.setTiempoPreparacion(15);
        }

        boolean porPagar = pago.getEstado() == EstadoPago.PENDIENTE;

        if (porPagar) {
            pedido.setEstado(EstadoPedido.ESPERANDO_PAGO);
            pedido.setLimitePago(LocalDateTime.now().plusMinutes(ajustesService.obtener().getMinutosParaPagar()));
        } else {
            pedido.setEstado(EstadoPedido.ACEPTADO);
            pedido.setFechaAceptado(LocalDateTime.now());
        }

        pedido.getNegocio().setPedidosSinResponder(0);
        negocioRepository.save(pedido.getNegocio());

        Pedido guardado = pedidoRepository.save(pedido);

        if (porPagar) {
            notificarCliente(guardado, "Paga tu pedido",
                    "Tu pedido #" + guardado.getId() + " fue aceptado. Paga S/ " + String.format("%.2f", guardado.getTotal())
                            + " por " + MetodosDigitales.nombre(pago.getMetodo()) + " en los próximos "
                            + ajustesService.obtener().getMinutosParaPagar() + " minutos para que lo preparen");
        } else {
            notificarCliente(guardado, "Pedido aceptado",
                    "Tu pedido #" + guardado.getId() + " fue aceptado. Estará listo en unos "
                            + guardado.getTiempoPreparacion() + " minutos");
        }

        return guardado;
    }

    @Transactional
    public Pedido avisarPago(Usuario cliente, Long id, String referencia) {

        Pedido pedido = buscar(id);

        if (pedido.getUsuario() == null || !pedido.getUsuario().getId().equals(cliente.getId())) {
            throw ApiException.prohibido("Este pedido no es tuyo");
        }

        validarEstado(pedido, EstadoPedido.ESPERANDO_PAGO, "Este pedido no está esperando tu pago");

        if (pedido.getFechaAvisoPago() != null) {
            throw ApiException.conflicto("Ya avisaste que pagaste. Espera a que el puesto lo confirme");
        }

        String codigo = AuthService.texto(referencia);

        if (codigo == null || !codigo.matches("[A-Za-z0-9-]{4,20}")) {
            throw ApiException.solicitudInvalida(
                    "Escribe el número de operación que te muestra tu billetera, de 4 a 20 letras o números");
        }

        LocalDateTime ahora = LocalDateTime.now();
        pedido.setReferenciaPago(codigo);
        pedido.setFechaAvisoPago(ahora);
        pedido.setLimitePago(ahora.plusMinutes(ajustesService.obtener().getMinutosRevisionPago()));

        Pedido guardado = pedidoRepository.save(pedido);

        notificacionService.crear(
                guardado.getNegocio().getPropietario(),
                guardado,
                "Revisa tu pago",
                guardado.getUsuario().getNombre() + " dice que pagó S/ " + String.format("%.2f", guardado.getTotal())
                        + " por el pedido #" + guardado.getId() + ". Número de operación: " + codigo + ". Revísalo en tu "
                        + MetodosDigitales.nombre(guardado.getPago().getMetodo()));

        return guardado;
    }

    @Transactional
    public Pedido confirmarPago(Usuario usuario, Long id) {

        Pedido pedido = obtenerParaNegocio(usuario, id);
        validarEstado(pedido, EstadoPedido.ESPERANDO_PAGO, "Este pedido no está esperando pago");

        Pago pago = pagoRepository.findByPedidoId(id)
                .orElseThrow(() -> ApiException.solicitudInvalida("El pedido no tiene un pago registrado"));

        pago.setEstado(EstadoPago.PAGADO);
        pago.setFecha(LocalDateTime.now());
        pagoRepository.save(pago);

        pedido.setEstado(EstadoPedido.ACEPTADO);
        pedido.setFechaAceptado(LocalDateTime.now());
        pedido.setLimitePago(null);

        Pedido guardado = pedidoRepository.save(pedido);

        notificarCliente(guardado, "Pago confirmado",
                "Recibimos tu pago. Tu pedido #" + guardado.getId() + " se prepara y estará listo en unos "
                        + guardado.getTiempoPreparacion() + " minutos");

        return guardado;
    }

    @Transactional
    public Pedido pagoNoLlego(Usuario usuario, Long id) {

        Pedido pedido = obtenerParaNegocio(usuario, id);
        validarEstado(pedido, EstadoPedido.ESPERANDO_PAGO, "Este pedido no está esperando pago");

        if (pedido.getFechaAvisoPago() == null) {
            throw ApiException.solicitudInvalida("El cliente todavía no avisó que pagó");
        }

        if (pedido.getFechaPagoObservado() != null) {
            throw ApiException.conflicto("Ya marcaste que el pago no llegó");
        }

        LocalDateTime ahora = LocalDateTime.now();
        pedido.setFechaPagoObservado(ahora);
        pedido.setLimitePago(ahora.plusMinutes(ajustesService.obtener().getMinutosRevisionPago()));

        Pedido guardado = pedidoRepository.save(pedido);

        notificarCliente(guardado, "El puesto no encontró tu pago",
                "Si ya pagaste el pedido #" + guardado.getId() + ", muestra tu comprobante en "
                        + guardado.getNegocio().getNombre() + ". Si el puesto lo confirma, tu pedido sigue; si no, lo revisará el administrador");

        return guardado;
    }

    @Transactional
    public void vencerPagos() {

        Ajustes ajustes = ajustesService.obtener();

        for (Pedido pedido : pedidoRepository.findByEstadoAndLimitePagoBefore(EstadoPedido.ESPERANDO_PAGO, LocalDateTime.now())) {

            boolean avisado = pedido.getFechaAvisoPago() != null;
            boolean observado = pedido.getFechaPagoObservado() != null;

            pagoRepository.findByPedidoId(pedido.getId()).ifPresent(pago -> {
                pago.setEstado(EstadoPago.FALLIDO);
                pagoRepository.save(pago);
            });

            pedido.setEstado(EstadoPedido.CANCELADO);
            pedido.setLimitePago(null);
            pedido.setMotivoCancelacion(avisado ? Limites.MOTIVO_PAGO_NO_CONFIRMADO : "No pagaste a tiempo");
            Pedido guardado = pedidoRepository.save(pedido);

            if (avisado) {
                crearReclamoDePago(guardado, observado);

                notificarCliente(guardado, "Pedido cancelado",
                        "Cancelamos el pedido #" + guardado.getId() + " porque el puesto no confirmó tu pago. "
                                + "Ya enviamos tu caso al administrador con tu número de operación");

                notificacionService.crear(guardado.getNegocio().getPropietario(), guardado, "Pedido cancelado",
                        "El pedido #" + guardado.getId() + " se canceló porque no confirmaste el pago. El administrador lo revisará");
                continue;
            }

            Usuario cliente = guardado.getUsuario();
            String aviso = "";

            if (ajustes.getFaltaPorNoPagar() > 0) {
                cliente.setFaltas(cliente.getFaltas() + 1);
                usuarioRepository.save(cliente);
                aviso = " Tienes " + cliente.getFaltas() + (cliente.getFaltas() == 1 ? " falta." : " faltas.");
            }

            notificarCliente(guardado, "Pedido cancelado",
                    "No pagaste el pedido #" + guardado.getId() + " a tiempo y se canceló." + aviso);

            notificacionService.crear(guardado.getNegocio().getPropietario(), guardado, "Pedido cancelado",
                    "El cliente no pagó el pedido #" + guardado.getId() + " a tiempo y se canceló");
        }
    }

    private void crearReclamoDePago(Pedido pedido, boolean observado) {

        Reclamo reclamo = new Reclamo();
        reclamo.setUsuario(pedido.getUsuario());
        reclamo.setPedidoId(pedido.getId());
        reclamo.setTipo("PAGO");
        reclamo.setMensaje("Pago en disputa del pedido #" + pedido.getId() + " en " + pedido.getNegocio().getNombre()
                + ": S/ " + String.format("%.2f", pedido.getTotal()) + " por "
                + MetodosDigitales.nombre(pedido.getPago() == null ? null : pedido.getPago().getMetodo())
                + ". Número de operación: " + pedido.getReferenciaPago() + ". "
                + (observado ? "El puesto dijo que no recibió el pago." : "El puesto no respondió."));
        reclamo.setEstado(Reclamo.ABIERTO);
        reclamo.setFecha(LocalDateTime.now());
        reclamoRepository.save(reclamo);
    }

    @Transactional
    public Pedido iniciarPreparacion(Usuario usuario, Long id) {

        Pedido pedido = obtenerParaNegocio(usuario, id);
        validarEstado(pedido, EstadoPedido.ACEPTADO, "El pedido debe estar aceptado para prepararlo");

        pedido.setEstado(EstadoPedido.EN_PREPARACION);

        Pedido guardado = pedidoRepository.save(pedido);

        notificarCliente(guardado, "En preparación",
                "Tu pedido #" + guardado.getId() + " se está preparando");

        return guardado;
    }

    @Transactional
    public void vencerNoRecogidos() {

        int limite = ajustesService.obtener().getFaltasBloqueanEfectivo();

        for (Pedido pedido : pedidoRepository.findByEstadoAndLimiteRecogerBefore(EstadoPedido.LISTO_PARA_RECOGER, LocalDateTime.now())) {

            pedido.setEstado(EstadoPedido.NO_RECOGIDO);
            Pedido guardado = pedidoRepository.save(pedido);

            Usuario cliente = guardado.getUsuario();
            int faltas = cliente.getFaltas() + 1;
            cliente.setFaltas(faltas);
            usuarioRepository.save(cliente);

            boolean digital = guardado.getPago() != null && !"EFECTIVO".equals(guardado.getPago().getMetodo());
            String aviso = faltas >= limite
                    ? "Ya no puedes pagar en efectivo. Usa Yape, Plin o tarjeta."
                    : "Si llegas a " + limite + " faltas, no podrás pagar en efectivo.";

            notificacionService.crear(cliente, guardado, "Pedido no recogido",
                    "No recogiste tu pedido #" + guardado.getId() + " a tiempo. Tienes " + faltas
                            + (faltas == 1 ? " falta. " : " faltas. ") + aviso + (digital ? " El pago no se devuelve." : ""));

            notificacionService.crear(guardado.getNegocio().getPropietario(), guardado, "Pedido no recogido",
                    "El cliente no recogió el pedido #" + guardado.getId() + ". Puedes ofrecerlo a otro cliente.");
        }
    }

    @Transactional
    public Pedido marcarListo(Usuario usuario, Long id) {

        Pedido pedido = obtenerParaNegocio(usuario, id);

        if (pedido.getEstado() != EstadoPedido.EN_PREPARACION
                && pedido.getEstado() != EstadoPedido.ACEPTADO) {
            throw ApiException.solicitudInvalida("El pedido debe estar en preparación");
        }

        pedido.setEstado(EstadoPedido.LISTO_PARA_RECOGER);
        pedido.setLimiteRecoger(LocalDateTime.now().plusMinutes(ajustesService.obtener().getMinutosParaRecoger()));
        pedido.setFechaListo(LocalDateTime.now());

        Pedido guardado = pedidoRepository.save(pedido);

        notificarCliente(guardado, "¡Tu pedido está listo!",
                "Acércate a " + guardado.getNegocio().getNombre() + " y di el número #"
                        + guardado.getId() + " para recogerlo");

        return guardado;
    }

    private static final SecureRandom AZAR = new SecureRandom();

    public static String nuevoCodigo() {
        return String.format("%04d", AZAR.nextInt(10000));
    }

    @Transactional
    public Pedido marcarRecogido(Usuario usuario, Long id, String codigo) {

        Pedido pedido = obtenerParaNegocio(usuario, id);
        validarEstado(pedido, EstadoPedido.LISTO_PARA_RECOGER, "El pedido todavía no está listo");

        if (pedido.codigoReal() != null && !pedido.codigoReal().equals(codigo == null ? null : codigo.trim())) {
            throw ApiException.solicitudInvalida("El código no coincide. Pídeselo otra vez al cliente");
        }

        pedido.setEstado(EstadoPedido.RECOGIDO);
        pedido.setFechaRecogido(LocalDateTime.now());

        Pedido guardado = pedidoRepository.save(pedido);

        notificarCliente(guardado, "Pedido entregado",
                "Gracias por tu compra en " + guardado.getNegocio().getNombre() + ". ¡Buen provecho!");

        return guardado;
    }

    @Transactional
    public Pedido rechazar(Usuario usuario, Long id, String motivo) {

        Pedido pedido = obtenerParaNegocio(usuario, id);

        if (pedido.getEstado() != EstadoPedido.PENDIENTE
                && pedido.getEstado() != EstadoPedido.ACEPTADO) {
            throw ApiException.solicitudInvalida("Solo puedes rechazar pedidos nuevos o aceptados");
        }

        String razon = AuthService.texto(motivo);
        cancelarConReembolso(pedido, razon == null ? "Rechazado por el negocio" : razon);

        Pedido guardado = pedidoRepository.save(pedido);

        notificarCliente(guardado, "Pedido rechazado",
                "El negocio no pudo atender tu pedido #" + guardado.getId()
                        + (razon == null ? "" : " (" + razon + ")")
                        + ". " + textoDevolucion(guardado, false));

        return guardado;
    }

    @Transactional
    public Pedido cancelar(Usuario usuario, Long id) {

        Pedido pedido = buscar(id);

        boolean esAdmin = usuarioActualService.esAdmin(usuario);
        boolean esCliente = pedido.getUsuario() != null
                && pedido.getUsuario().getId().equals(usuario.getId());

        if (!esAdmin && !esCliente) {
            throw ApiException.prohibido("No puedes cancelar este pedido");
        }

        boolean sinPagar = pedido.getEstado() == EstadoPedido.ESPERANDO_PAGO && pedido.getFechaAvisoPago() == null;

        if (pedido.getEstado() != EstadoPedido.PENDIENTE && !sinPagar) {
            throw ApiException.solicitudInvalida(
                    "Solo puedes cancelar antes de pagar o mientras el negocio no haya aceptado el pedido");
        }

        cancelarConReembolso(pedido, esAdmin ? "Cancelado por el administrador" : "Cancelado por el cliente");

        Pedido guardado = pedidoRepository.save(pedido);

        if (guardado.getNegocio() != null) {
            notificacionService.crear(
                    guardado.getNegocio().getPropietario(),
                    guardado,
                    "Pedido cancelado",
                    "El pedido #" + guardado.getId() + " fue cancelado"
            );
        }

        if (esAdmin) {
            notificarCliente(guardado, "Pedido cancelado",
                    "Tu pedido #" + guardado.getId() + " fue cancelado. " + textoDevolucion(guardado, false));
        }

        return guardado;
    }

    @Transactional
    public Pedido actualizarTiempo(Usuario usuario, Long id, Integer minutos) {

        Pedido pedido = obtenerParaNegocio(usuario, id);

        if (!ESTADOS_ACTIVOS.contains(pedido.getEstado())
                || pedido.getEstado() == EstadoPedido.LISTO_PARA_RECOGER) {
            throw ApiException.solicitudInvalida("Ya no se puede cambiar el tiempo de este pedido");
        }

        validarMinutos(minutos);
        pedido.setTiempoPreparacion(minutos);

        Pedido guardado = pedidoRepository.save(pedido);

        if (guardado.getEstado() != EstadoPedido.PENDIENTE) {
            notificarCliente(guardado, "Tiempo actualizado",
                    "Tu pedido #" + guardado.getId() + " estará listo en unos " + minutos + " minutos");
        }

        return guardado;
    }

    @Transactional
    public void vencerPendientes() {

        LocalDateTime limite = LocalDateTime.now().minusMinutes(Limites.MINUTOS_PARA_ACEPTAR);

        for (Pedido pedido : pedidoRepository.findByEstadoAndFechaBefore(EstadoPedido.PENDIENTE, limite)) {

            cancelarConReembolso(pedido, Limites.MOTIVO_SIN_RESPUESTA);
            Pedido guardado = pedidoRepository.save(pedido);

            notificarCliente(guardado, "El puesto no respondió",
                    "Tu pedido #" + guardado.getId() + " no fue aceptado a tiempo. " + textoDevolucion(guardado, true));

            Negocio negocio = guardado.getNegocio();
            int sinResponder = (negocio.getPedidosSinResponder() == null ? 0 : negocio.getPedidosSinResponder()) + 1;
            negocio.setPedidosSinResponder(sinResponder);

            if (sinResponder >= Limites.PEDIDOS_SIN_RESPUESTA && Boolean.TRUE.equals(negocio.getAbierto())) {
                negocioService.cerrarAutomatico(negocio, "Cerramos tu puesto porque no respondiste "
                        + sinResponder + " pedidos");
            } else {
                negocioRepository.save(negocio);
            }
        }
    }

    private void cancelarConReembolso(Pedido pedido, String motivo) {

        pedido.setEstado(EstadoPedido.CANCELADO);
        pedido.setMotivoCancelacion(motivo);

        pagoRepository.findByPedidoId(pedido.getId()).ifPresent(pago -> {
            if (pago.getEstado() == EstadoPago.PAGADO) {
                pago.setEstado(EstadoPago.REEMBOLSADO);
                pagoRepository.save(pago);
            } else if (pago.getEstado() == EstadoPago.PENDIENTE) {
                pago.setEstado(EstadoPago.FALLIDO);
                pagoRepository.save(pago);
            }
        });
    }

    private Pedido obtenerParaNegocio(Usuario usuario, Long id) {

        Pedido pedido = buscar(id);

        if (usuarioActualService.esAdmin(usuario) || esDuenoDelNegocio(usuario, pedido)) {
            return pedido;
        }

        throw ApiException.prohibido("Este pedido no pertenece a tu negocio");
    }

    private boolean esDuenoDelNegocio(Usuario usuario, Pedido pedido) {
        return pedido.getNegocio() != null
                && pedido.getNegocio().getPropietario() != null
                && pedido.getNegocio().getPropietario().getId().equals(usuario.getId());
    }

    private Pedido buscar(Long id) {
        return pedidoRepository.findById(id)
                .orElseThrow(() -> ApiException.noEncontrado("Pedido no encontrado"));
    }

    private void validarEstado(Pedido pedido, EstadoPedido esperado, String mensaje) {
        if (pedido.getEstado() != esperado) {
            throw ApiException.solicitudInvalida(mensaje);
        }
    }

    private void validarMinutos(Integer minutos) {
        if (minutos == null || minutos < 1 || minutos > 240) {
            throw ApiException.solicitudInvalida("El tiempo debe estar entre 1 y 240 minutos");
        }
    }

    private void notificarCliente(Pedido pedido, String titulo, String mensaje) {
        notificacionService.crear(pedido.getUsuario(), pedido, titulo, mensaje);
    }

    private String resumenProductos(Pedido pedido) {

        StringBuilder texto = new StringBuilder();

        for (DetallePedido detalle : pedido.getDetalles()) {
            if (!texto.isEmpty()) {
                texto.append(", ");
            }
            texto.append(detalle.getCantidad()).append("x ").append(detalle.getProducto().getNombre());
        }

        return texto.toString();
    }

    private static double redondear(double valor) {
        return Math.round(valor * 100.0) / 100.0;
    }
}
