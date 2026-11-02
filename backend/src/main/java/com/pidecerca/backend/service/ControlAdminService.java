package com.pidecerca.backend.service;

import com.pidecerca.backend.dto.Privacidad;
import com.pidecerca.backend.entity.Ajustes;
import com.pidecerca.backend.entity.EstadoAprobacion;
import com.pidecerca.backend.entity.EstadoPago;
import com.pidecerca.backend.entity.EstadoPedido;
import com.pidecerca.backend.entity.IntentoLogin;
import com.pidecerca.backend.entity.Limites;
import com.pidecerca.backend.entity.Negocio;
import com.pidecerca.backend.entity.Pedido;
import com.pidecerca.backend.entity.Rol;
import com.pidecerca.backend.entity.Usuario;
import com.pidecerca.backend.exception.ApiException;
import com.pidecerca.backend.repository.IntentoLoginRepository;
import com.pidecerca.backend.repository.NegocioRepository;
import com.pidecerca.backend.repository.ReclamoRepository;
import com.pidecerca.backend.repository.PedidoRepository;
import com.pidecerca.backend.repository.UsuarioRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ControlAdminService {

    public record FilaRanking(Long id, String nombre, double ventas, int pedidos, int cancelados, int noRecogidos) {
    }

    public record FilaCliente(Long id, String nombre, String correo, boolean activo, int faltas, int pedidos, int cancelados, int noRecogidos, int disputas) {
    }

    public record Problema(Long id, String nombre, String detalle) {
    }

    private final PedidoRepository pedidoRepository;
    private final NegocioRepository negocioRepository;
    private final UsuarioRepository usuarioRepository;
    private final IntentoLoginRepository intentoLoginRepository;
    private final AjustesService ajustesService;
    private final ReclamoRepository reclamoRepository;

    public ControlAdminService(
            PedidoRepository pedidoRepository,
            NegocioRepository negocioRepository,
            UsuarioRepository usuarioRepository,
            IntentoLoginRepository intentoLoginRepository,
            AjustesService ajustesService,
            ReclamoRepository reclamoRepository) {
        this.reclamoRepository = reclamoRepository;
        this.pedidoRepository = pedidoRepository;
        this.negocioRepository = negocioRepository;
        this.usuarioRepository = usuarioRepository;
        this.intentoLoginRepository = intentoLoginRepository;
        this.ajustesService = ajustesService;
    }

    private static boolean efectivo(Pedido pedido) {
        return pedido.getPago() != null && "EFECTIVO".equals(pedido.getPago().getMetodo());
    }

    private static boolean ingresa(Pedido pedido) {
        return pedido.getEstado() == EstadoPedido.RECOGIDO
                || (pedido.getEstado() == EstadoPedido.NO_RECOGIDO && !efectivo(pedido));
    }

    private static double total(Pedido pedido) {
        return pedido.getTotal() == null ? 0 : pedido.getTotal();
    }

    private static double redondear(double valor) {
        return Math.round(valor * 100.0) / 100.0;
    }

    private static boolean delNegocio(Pedido pedido, Negocio negocio) {
        return pedido.getNegocio() != null && negocio.getId().equals(pedido.getNegocio().getId());
    }

    private List<Negocio> aprobados() {
        return negocioRepository.findAll().stream()
                .filter(n -> n.getEstadoAprobacion() == EstadoAprobacion.APROBADO)
                .toList();
    }

    public List<FilaRanking> ranking(String periodo) {

        String clave = periodo == null ? "hoy" : periodo;

        LocalDateTime desde = switch (clave) {
            case "semana" -> LocalDate.now().minusDays(6).atStartOfDay();
            case "mes" -> LocalDate.now().withDayOfMonth(1).atStartOfDay();
            default -> LocalDate.now().atStartOfDay();
        };

        List<Pedido> pedidos = pedidoRepository.findByFechaAfter(desde.minusSeconds(1));

        return aprobados().stream()
                .map(negocio -> {
                    List<Pedido> suyos = pedidos.stream().filter(p -> delNegocio(p, negocio)).toList();
                    double ventas = suyos.stream().filter(ControlAdminService::ingresa).mapToDouble(ControlAdminService::total).sum();
                    int entregados = (int) suyos.stream().filter(ControlAdminService::ingresa).count();
                    int cancelados = (int) suyos.stream().filter(p -> p.getEstado() == EstadoPedido.CANCELADO).count();
                    int noRecogidos = (int) suyos.stream().filter(p -> p.getEstado() == EstadoPedido.NO_RECOGIDO).count();
                    return new FilaRanking(negocio.getId(), negocio.getNombre(), redondear(ventas), entregados, cancelados, noRecogidos);
                })
                .sorted(Comparator.comparingDouble(FilaRanking::ventas).reversed())
                .toList();
    }

    public Map<String, List<Problema>> problemas() {

        List<Pedido> recientes = pedidoRepository.findByFechaAfter(LocalDateTime.now().minusDays(7));

        List<Problema> conProblemas = aprobados().stream()
                .map(negocio -> {
                    List<String> detalles = new java.util.ArrayList<>();
                    int sinResponder = negocio.getPedidosSinResponder() == null ? 0 : negocio.getPedidosSinResponder();
                    long porFalta = recientes.stream()
                            .filter(p -> delNegocio(p, negocio)
                                    && p.getEstado() == EstadoPedido.CANCELADO
                                    && Limites.MOTIVO_SIN_RESPUESTA.equals(p.getMotivoCancelacion()))
                            .count();
                    if (sinResponder > 0) {
                        detalles.add(sinResponder + " pedidos seguidos sin responder");
                    }
                    long sinConfirmar = recientes.stream()
                            .filter(p -> delNegocio(p, negocio)
                                    && Limites.MOTIVO_PAGO_NO_CONFIRMADO.equals(p.getMotivoCancelacion()))
                            .count();
                    if (sinConfirmar > 0) {
                        detalles.add(sinConfirmar + " pagos sin confirmar en 7 días");
                    }
                    if (porFalta > 0) {
                        detalles.add(porFalta + " cancelados por no responder en 7 días");
                    }
                    if (!Boolean.TRUE.equals(negocio.getAbierto()) && negocio.getMotivoCierre() != null) {
                        detalles.add("Cerrado solo: " + negocio.getMotivoCierre());
                    }
                    return new Problema(negocio.getId(), negocio.getNombre(), String.join(" · ", detalles));
                })
                .filter(p -> !p.detalle().isEmpty())
                .toList();

        List<Problema> inactivos = aprobados().stream()
                .filter(n -> Boolean.TRUE.equals(n.getActivo()))
                .filter(n -> recientes.stream().noneMatch(p -> delNegocio(p, n) && ingresa(p)))
                .map(n -> new Problema(n.getId(), n.getNombre(), "Sin ventas en 7 días"))
                .toList();

        Map<String, List<Problema>> resultado = new LinkedHashMap<>();
        resultado.put("conProblemas", conProblemas);
        resultado.put("inactivos", inactivos);
        return resultado;
    }

    public List<FilaCliente> clientes() {

        List<Pedido> todos = pedidoRepository.findAll();

        return usuarioRepository.findByRol(Rol.CLIENTE).stream()
                .map(usuario -> {
                    List<Pedido> suyos = todos.stream()
                            .filter(p -> p.getUsuario() != null && usuario.getId().equals(p.getUsuario().getId()))
                            .toList();
                    String nombre = ((usuario.getNombre() == null ? "" : usuario.getNombre()) + " "
                            + (usuario.getApellido() == null ? "" : usuario.getApellido())).trim();
                    return new FilaCliente(
                            usuario.getId(),
                            nombre,
                            Privacidad.ocultarCorreo(usuario.getCorreo()),
                            !Boolean.FALSE.equals(usuario.getActivo()),
                            usuario.getFaltas(),
                            suyos.size(),
                            (int) suyos.stream().filter(p -> p.getEstado() == EstadoPedido.CANCELADO).count(),
                            (int) suyos.stream().filter(p -> p.getEstado() == EstadoPedido.NO_RECOGIDO).count(),
                            (int) suyos.stream().filter(p -> Limites.MOTIVO_PAGO_NO_CONFIRMADO.equals(p.getMotivoCancelacion())).count());
                })
                .sorted(Comparator.comparingInt(FilaCliente::faltas).thenComparingInt(FilaCliente::cancelados).reversed())
                .toList();
    }

    public Map<String, Object> dinero() {

        List<Pedido> todos = pedidoRepository.findAll();

        Map<String, Double> porMetodo = new LinkedHashMap<>();
        for (Pedido pedido : todos) {
            if (ingresa(pedido) && pedido.getPago() != null) {
                porMetodo.merge(pedido.getPago().getMetodo(), redondear(total(pedido)), Double::sum);
            }
        }

        List<Pedido> reembolsados = todos.stream()
                .filter(p -> p.getPago() != null && p.getPago().getEstado() == EstadoPago.REEMBOLSADO)
                .toList();

        List<Pedido> noRecogidosPagados = todos.stream()
                .filter(p -> p.getEstado() == EstadoPedido.NO_RECOGIDO && !efectivo(p))
                .toList();

        Map<String, Object> resultado = new LinkedHashMap<>();
        resultado.put("porMetodo", porMetodo);
        resultado.put("reembolsos", reembolsados.size());
        resultado.put("reembolsado", redondear(reembolsados.stream().mapToDouble(ControlAdminService::total).sum()));
        resultado.put("noRecogidosPagados", noRecogidosPagados.size());
        resultado.put("noRecogidosPagadosMonto", redondear(noRecogidosPagados.stream().mapToDouble(ControlAdminService::total).sum()));
        resultado.put("noRecogidosEfectivo", todos.stream().filter(p -> p.getEstado() == EstadoPedido.NO_RECOGIDO && efectivo(p)).count());
        return resultado;
    }

    public Map<String, Object> seguridad() {

        Ajustes ajustes = ajustesService.obtener();
        LocalDateTime ventana = LocalDateTime.now().minusMinutes(ajustes.getMinutosBloqueoLogin());

        Map<String, Long> fallos = intentoLoginRepository.findByExitoFalseAndFechaAfter(ventana).stream()
                .collect(Collectors.groupingBy(i -> i.getCorreo().toLowerCase(), Collectors.counting()));

        List<Map<String, Object>> sospechosos = fallos.entrySet().stream()
                .filter(e -> e.getValue() >= ajustes.getIntentosLoginMaximos())
                .map(e -> {
                    Map<String, Object> fila = new LinkedHashMap<>();
                    fila.put("correo", Privacidad.ocultarCorreo(e.getKey()));
                    fila.put("fallos", e.getValue());
                    return fila;
                })
                .toList();

        List<Map<String, Object>> intentos = intentoLoginRepository.findTop100ByOrderByFechaDesc().stream()
                .map(i -> {
                    Map<String, Object> fila = new LinkedHashMap<>();
                    fila.put("correo", Privacidad.ocultarCorreo(i.getCorreo()));
                    fila.put("ip", i.getIp());
                    fila.put("exito", i.getExito());
                    fila.put("fecha", i.getFecha());
                    return fila;
                })
                .toList();

        Map<String, Object> resultado = new LinkedHashMap<>();
        resultado.put("bloqueados", sospechosos);
        resultado.put("intentos", intentos);
        return resultado;
    }

    public Map<String, Object> fichaCliente(Long id) {

        Usuario usuario = usuarioRepository.findById(id)
                .filter(u -> Rol.CLIENTE.equals(u.getRol()))
                .orElseThrow(() -> ApiException.noEncontrado("Cliente no encontrado"));

        List<Pedido> suyos = pedidoRepository.findByUsuarioIdOrderByFechaDesc(id);
        List<Pedido> pagados = suyos.stream().filter(ControlAdminService::ingresa).toList();
        double gastado = pagados.stream().mapToDouble(ControlAdminService::total).sum();

        String puestoFavorito = pagados.stream()
                .filter(p -> p.getNegocio() != null)
                .collect(Collectors.groupingBy(p -> p.getNegocio().getNombre(), Collectors.counting()))
                .entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse(null);

        String nombre = ((usuario.getNombre() == null ? "" : usuario.getNombre()) + " "
                + (usuario.getApellido() == null ? "" : usuario.getApellido())).trim();

        Map<String, Object> ficha = new LinkedHashMap<>();
        ficha.put("id", usuario.getId());
        ficha.put("nombre", nombre);
        ficha.put("correo", Privacidad.ocultarCorreo(usuario.getCorreo()));
        ficha.put("telefono", Privacidad.ocultarTelefono(usuario.getTelefono()));
        ficha.put("activo", !Boolean.FALSE.equals(usuario.getActivo()));
        ficha.put("fechaRegistro", usuario.getFechaRegistro());
        ficha.put("faltas", usuario.getFaltas());
        ficha.put("pedidos", suyos.size());
        ficha.put("entregados", pagados.size());
        ficha.put("cancelados", suyos.stream().filter(p -> p.getEstado() == EstadoPedido.CANCELADO).count());
        ficha.put("noRecogidos", suyos.stream().filter(p -> p.getEstado() == EstadoPedido.NO_RECOGIDO).count());
        ficha.put("gastado", redondear(gastado));
        ficha.put("ticketPromedio", pagados.isEmpty() ? 0.0 : redondear(gastado / pagados.size()));
        ficha.put("puestoFavorito", puestoFavorito);
        ficha.put("ultimoPedido", suyos.isEmpty() ? null : suyos.get(0).getFecha());

        ficha.put("ultimos", suyos.stream().limit(10).map(p -> {
            Map<String, Object> fila = new LinkedHashMap<>();
            fila.put("id", p.getId());
            fila.put("fecha", p.getFecha());
            fila.put("puesto", p.getNegocio() == null ? "" : p.getNegocio().getNombre());
            fila.put("estado", p.getEstado());
            fila.put("pago", p.getPago() == null ? "" : p.getPago().getMetodo());
            fila.put("total", total(p));
            return fila;
        }).toList());

        ficha.put("reclamos", reclamoRepository.findByUsuarioIdOrderByFechaDesc(id).stream().map(r -> {
            Map<String, Object> fila = new LinkedHashMap<>();
            fila.put("id", r.getId());
            fila.put("tipo", r.getTipo());
            fila.put("estado", r.getEstado());
            fila.put("mensaje", r.getMensaje());
            fila.put("fecha", r.getFecha());
            return fila;
        }).toList());

        return ficha;
    }

    public Usuario perdonarFaltas(Long id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> ApiException.noEncontrado("Usuario no encontrado"));
        usuario.setFaltas(0);
        return usuarioRepository.save(usuario);
    }

    public Usuario cerrarSesion(Long id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> ApiException.noEncontrado("Usuario no encontrado"));
        usuario.setSesionesDesde(LocalDateTime.now());
        return usuarioRepository.save(usuario);
    }

    public String reporte(String tipo) {

        StringBuilder csv = new StringBuilder("\uFEFF");
        String clase = tipo == null ? "" : tipo;

        switch (clase) {
            case "pedidos" -> {
                csv.append("Pedido;Fecha;Puesto;Cliente;Estado;Pago;Total\n");
                for (Pedido p : pedidoRepository.findAllByOrderByFechaDesc()) {
                    fila(csv, p.getId(), p.getFecha(),
                            p.getNegocio() == null ? "" : p.getNegocio().getNombre(),
                            p.getUsuario() == null ? "" : p.getUsuario().getNombre(),
                            p.getEstado(),
                            p.getPago() == null ? "" : p.getPago().getMetodo(),
                            total(p));
                }
            }
            case "puestos" -> {
                csv.append("Puesto;Estado;Activo;Abierto\n");
                for (Negocio n : negocioRepository.findAll()) {
                    fila(csv, n.getNombre(), n.getEstadoAprobacion(), n.getActivo(), n.getAbierto());
                }
            }
            case "usuarios" -> {
                csv.append("Nombre;Rol;Activo;Faltas;Registro\n");
                for (Usuario u : usuarioRepository.findAllByOrderByIdDesc()) {
                    fila(csv, u.getNombre(), u.getRol(), u.getActivo(), u.getFaltas(), u.getFechaRegistro());
                }
            }
            default -> throw ApiException.solicitudInvalida("Reporte no válido");
        }

        return csv.toString();
    }

    private static void fila(StringBuilder csv, Object... celdas) {
        for (int i = 0; i < celdas.length; i++) {
            if (i > 0) {
                csv.append(';');
            }
            String texto = celdas[i] == null ? "" : celdas[i].toString().replace('T', ' ');
            csv.append('"').append(texto.replace("\"", "\"\"")).append('"');
        }
        csv.append('\n');
    }
}
