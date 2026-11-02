package com.pidecerca.backend.service;

import com.pidecerca.backend.dto.CrearNegocioRequest;
import com.pidecerca.backend.dto.RegistroNegocioRequest;
import com.pidecerca.backend.dto.FichaNegocioResponse;
import com.pidecerca.backend.entity.EstadoAprobacion;
import com.pidecerca.backend.entity.EstadoPedido;
import com.pidecerca.backend.entity.Limites;
import com.pidecerca.backend.entity.Negocio;
import com.pidecerca.backend.entity.Pedido;
import com.pidecerca.backend.entity.Rol;
import com.pidecerca.backend.entity.Usuario;
import com.pidecerca.backend.exception.ApiException;
import com.pidecerca.backend.repository.CalificacionRepository;
import com.pidecerca.backend.repository.NegocioRepository;
import com.pidecerca.backend.repository.PedidoRepository;
import com.pidecerca.backend.repository.ProductoRepository;
import com.pidecerca.backend.repository.UsuarioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class NegocioService {

    private final NegocioRepository negocioRepository;
    private final UsuarioRepository usuarioRepository;
    private final PedidoRepository pedidoRepository;
    private final ProductoRepository productoRepository;
    private final AuthService authService;
    private final CalificacionRepository calificacionRepository;

    private static final ZoneId ZONA = ZoneId.of("America/Lima");

    public NegocioService(
            NegocioRepository negocioRepository,
            UsuarioRepository usuarioRepository,
            PedidoRepository pedidoRepository,
            ProductoRepository productoRepository,
            AuthService authService,
            CalificacionRepository calificacionRepository) {

        this.calificacionRepository = calificacionRepository;
        this.negocioRepository = negocioRepository;
        this.usuarioRepository = usuarioRepository;
        this.pedidoRepository = pedidoRepository;
        this.productoRepository = productoRepository;
        this.authService = authService;
    }

    public List<Negocio> listarTodos() {
        return negocioRepository.findAllByOrderByIdDesc();
    }

    public List<Negocio> buscar(String texto, String tipo, Double latitud, Double longitud) {
        return buscar(texto, tipo, latitud, longitud, null);
    }

    public List<Negocio> buscar(String texto, String tipo, Double latitud, Double longitud, Double radio) {

        String filtro = normalizar(texto);
        String filtroTipo = normalizar(tipo);

        List<Negocio> negocios = completar(negocioRepository.findByActivoTrueAndEstadoAprobacion(EstadoAprobacion.APROBADO)).stream()
                .filter(n -> filtro == null
                        || contiene(n.getNombre(), filtro)
                        || contiene(n.getTipoComida(), filtro)
                        || contiene(n.getDescripcion(), filtro)
                        || contiene(n.getDireccion(), filtro))
                .filter(n -> filtroTipo == null || contiene(n.getTipoComida(), filtroTipo))
                .toList();

        if (latitud != null && longitud != null) {
            negocios.forEach(n -> {
                if (n.getLatitud() != null && n.getLongitud() != null) {
                    n.setDistanciaMetros((double) Math.round(
                            distanciaMetros(latitud, longitud, n.getLatitud(), n.getLongitud())));
                }
            });

            return negocios.stream()
                    .filter(n -> radio == null || radio <= 0
                            || (n.getDistanciaMetros() != null && n.getDistanciaMetros() <= radio))
                    .sorted(Comparator
                            .comparing((Negocio n) -> !Boolean.TRUE.equals(n.getAbierto()))
                            .thenComparing(n -> n.getDistanciaMetros() == null
                                    ? Double.MAX_VALUE
                                    : n.getDistanciaMetros()))
                    .toList();
        }

        return negocios.stream()
                .sorted(Comparator
                        .comparing((Negocio n) -> !Boolean.TRUE.equals(n.getAbierto()))
                        .thenComparing(Negocio::getNombre, Comparator.nullsLast(String::compareToIgnoreCase)))
                .toList();
    }

    public Negocio obtenerPorId(Long id) {
        Negocio negocio = negocioRepository.findById(id)
                .orElseThrow(() -> ApiException.noEncontrado("Negocio no encontrado"));
        completar(List.of(negocio));
        return negocio;
    }

    private List<Negocio> completar(List<Negocio> negocios) {
        Map<Long, Object[]> resumen = new HashMap<>();
        for (Object[] fila : calificacionRepository.resumenPorNegocio()) {
            resumen.put((Long) fila[0], fila);
        }
        for (Negocio negocio : negocios) {
            Object[] fila = resumen.get(negocio.getId());
            if (fila != null) {
                negocio.setPromedioCalificacion(Math.round(((Number) fila[1]).doubleValue() * 10.0) / 10.0);
                negocio.setTotalCalificaciones(((Number) fila[2]).longValue());
            }
        }
        return negocios;
    }

    public Negocio obtenerDelPropietario(Usuario usuario) {
        Negocio negocio = negocioRepository.findFirstByPropietarioId(usuario.getId())
                .orElseThrow(() -> ApiException.noEncontrado(
                        "Tu cuenta todavía no tiene un negocio asignado. Pídele al administrador que lo registre"));
        completar(List.of(negocio));
        return negocio;
    }

    @Transactional
    public Negocio crear(CrearNegocioRequest request) {

        if (request == null || request.negocio() == null) {
            throw ApiException.solicitudInvalida("Faltan los datos del negocio");
        }

        Usuario propietario = null;

        if (request.propietarioId() != null) {
            propietario = usuarioRepository.findById(request.propietarioId())
                    .orElseThrow(() -> ApiException.noEncontrado("Propietario no encontrado"));

            if (negocioRepository.findFirstByPropietarioId(propietario.getId()).isPresent()) {
                throw ApiException.conflicto("Ese usuario ya tiene un negocio asignado");
            }

            if (!Rol.NEGOCIO.equals(propietario.getRol())) {
                propietario.setRol(Rol.NEGOCIO);
                propietario = usuarioRepository.save(propietario);
            }

        } else if (request.nuevoPropietario() != null) {
            propietario = authService.crearUsuario(request.nuevoPropietario(), Rol.NEGOCIO);
        }

        Negocio negocio = new Negocio();
        copiarDatos(request.negocio(), negocio);
        negocio.setPropietario(propietario);
        negocio.setActivo(request.negocio().getActivo() == null || request.negocio().getActivo());
        negocio.setAbierto(Boolean.TRUE.equals(request.negocio().getAbierto()));
        negocio.setEstadoAprobacion(EstadoAprobacion.APROBADO);
        negocio.setFechaSolicitud(LocalDateTime.now());

        return negocioRepository.save(negocio);
    }

    @Transactional
    public Negocio registrarSolicitud(RegistroNegocioRequest request) {

        if (request == null || request.propietario() == null || request.negocio() == null) {
            throw ApiException.solicitudInvalida("Faltan tus datos o los datos de tu puesto");
        }

        if (AuthService.texto(request.negocio().getNombre()) == null) {
            throw ApiException.solicitudInvalida("Escribe el nombre de tu puesto");
        }

        authService.exigirPrivacidad(request.propietario());
        Usuario propietario = authService.crearUsuario(request.propietario(), Rol.NEGOCIO);

        Negocio negocio = new Negocio();
        copiarDatos(request.negocio(), negocio);
        negocio.setPropietario(propietario);
        negocio.setActivo(true);
        negocio.setAbierto(false);
        negocio.setEstadoAprobacion(EstadoAprobacion.PENDIENTE);
        negocio.setFechaSolicitud(LocalDateTime.now());

        return negocioRepository.save(negocio);
    }

    public List<Negocio> listarSolicitudes() {
        return negocioRepository.findByEstadoAprobacionOrderByFechaSolicitudAsc(EstadoAprobacion.PENDIENTE);
    }

    public Negocio aprobar(Long id) {

        Negocio negocio = obtenerPorId(id);

        if (negocio.estaAprobado()) {
            throw ApiException.solicitudInvalida("Este puesto ya está aprobado");
        }

        negocio.setEstadoAprobacion(EstadoAprobacion.APROBADO);
        negocio.setFechaAprobacion(LocalDateTime.now());
        negocio.setMotivoRechazo(null);
        negocio.setActivo(true);

        return negocioRepository.save(negocio);
    }

    public FichaNegocioResponse ficha(Long id) {

        Negocio negocio = obtenerPorId(id);
        List<Pedido> pedidos = pedidoRepository.findByNegocioIdOrderByFechaDesc(id);

        double ventas = pedidos.stream()
                .filter(p -> p.getEstado() != EstadoPedido.CANCELADO && p.getTotal() != null)
                .mapToDouble(Pedido::getTotal)
                .sum();

        long sinResponder = pedidos.stream()
                .filter(p -> Limites.MOTIVO_SIN_RESPUESTA.equals(p.getMotivoCancelacion()))
                .count();

        return FichaNegocioResponse.de(negocio, pedidos.size(), ventas, sinResponder);
    }

    public Negocio rechazar(Long id, String motivo) {

        Negocio negocio = obtenerPorId(id);
        String razon = AuthService.texto(motivo);

        negocio.setEstadoAprobacion(EstadoAprobacion.RECHAZADO);
        negocio.setMotivoRechazo(razon == null ? "No cumple los requisitos de la plataforma" : razon);
        negocio.setAbierto(false);

        return negocioRepository.save(negocio);
    }

    @Transactional
    public Negocio actualizarComoAdmin(Long id, Negocio datos, Long propietarioId) {

        Negocio negocio = obtenerPorId(id);
        copiarDatos(datos, negocio);

        if (datos.getActivo() != null) {
            negocio.setActivo(datos.getActivo());
        }

        if (datos.getAbierto() != null) {
            negocio.setAbierto(datos.getAbierto());
        }

        if (propietarioId != null) {
            Usuario propietario = usuarioRepository.findById(propietarioId)
                    .orElseThrow(() -> ApiException.noEncontrado("Propietario no encontrado"));

            negocioRepository.findFirstByPropietarioId(propietarioId)
                    .filter(otro -> !otro.getId().equals(negocio.getId()))
                    .ifPresent(otro -> {
                        throw ApiException.conflicto("Ese usuario ya tiene otro negocio asignado");
                    });

            if (!Rol.NEGOCIO.equals(propietario.getRol())) {
                propietario.setRol(Rol.NEGOCIO);
                usuarioRepository.save(propietario);
            }

            negocio.setPropietario(propietario);
        }

        return negocioRepository.save(negocio);
    }

    public Negocio actualizarMio(Usuario usuario, Negocio datos) {

        Negocio negocio = obtenerDelPropietario(usuario);
        String nombreNuevo = AuthService.texto(datos.getNombre());
        boolean cambiaNombre = nombreNuevo != null && !nombreNuevo.equals(negocio.getNombre());

        if (cambiaNombre) {
            LocalDateTime proximo = Limites.proximoCambio(negocio.getFechaCambioNombre());
            if (proximo != null) {
                throw ApiException.solicitudInvalida(
                        "Ya cambiaste el nombre hace poco. Podrás cambiarlo desde el " + Limites.fechaLegible(proximo));
            }
            negocio.setFechaCambioNombre(LocalDateTime.now());
        }
        copiarDatos(datos, negocio);

        if (datos.getAbierto() != null) {
            negocio.setAbierto(datos.getAbierto());
        }

        return negocioRepository.save(negocio);
    }

    public Negocio cambiarAbierto(Usuario usuario, boolean abierto) {

        Negocio negocio = obtenerDelPropietario(usuario);

        if (abierto && !negocio.estaAprobado()) {
            throw ApiException.prohibido("Tu puesto todavía no fue aprobado por el administrador");
        }

        if (abierto && !Boolean.TRUE.equals(negocio.getActivo())) {
            throw ApiException.prohibido("Tu negocio está deshabilitado por el administrador");
        }

        negocio.setAbierto(abierto);
        negocio.setMotivoCierre(null);
        negocio.setAbiertoPorHorario(false);

        if (!abierto) {
            negocio.setCerradoManualFecha(fechaDeVentana(negocio));
        }

        if (abierto) {
            negocio.setUltimaConexion(LocalDateTime.now());
            negocio.setPedidosSinResponder(0);
        } else {
            negocio.setUbicacionEnVivo(false);
        }

        return negocioRepository.save(negocio);
    }

    public void cerrarAutomatico(Negocio negocio, String motivo) {
        negocio.setAbierto(false);
        negocio.setAbiertoPorHorario(false);
        negocio.setCerradoManualFecha(fechaDeVentana(negocio));
        negocio.setUbicacionEnVivo(false);
        negocio.setMotivoCierre(motivo);
        negocioRepository.save(negocio);
    }

    public Negocio cambiarAperturaAutomatica(Usuario usuario, boolean activa) {

        Negocio negocio = obtenerDelPropietario(usuario);

        if (activa && (negocio.getHoraApertura() == null || negocio.getHoraCierre() == null
                || negocio.getDiasAtencion() == null || !negocio.getDiasAtencion().contains("1"))) {
            throw ApiException.solicitudInvalida("Primero configura los días y las horas de tu horario");
        }

        negocio.setAperturaAutomatica(activa);
        return negocioRepository.save(negocio);
    }

    private LocalDate fechaDeVentana(Negocio negocio) {
        LocalDate ventana = ventanaActual(negocio, ZonedDateTime.now(ZONA));
        return ventana != null ? ventana : LocalDate.now(ZONA);
    }

    static LocalDate ventanaActual(Negocio negocio, ZonedDateTime ahora) {

        String dias = negocio.getDiasAtencion();

        if (dias == null || dias.length() < 7 || negocio.getHoraApertura() == null || negocio.getHoraCierre() == null) {
            return null;
        }

        LocalTime apertura;
        LocalTime cierre;

        try {
            apertura = LocalTime.parse(negocio.getHoraApertura());
            cierre = LocalTime.parse(negocio.getHoraCierre());
        } catch (Exception e) {
            return null;
        }

        LocalDateTime instante = ahora.toLocalDateTime();

        for (int atras = 0; atras <= 1; atras++) {
            LocalDate dia = ahora.toLocalDate().minusDays(atras);
            DayOfWeek semana = dia.getDayOfWeek();
            if (dias.charAt(semana.getValue() - 1) != '1') {
                continue;
            }
            LocalDateTime inicio = dia.atTime(apertura);
            LocalDateTime fin = cierre.isAfter(apertura) ? dia.atTime(cierre) : dia.plusDays(1).atTime(cierre);
            if (!instante.isBefore(inicio) && instante.isBefore(fin)) {
                return dia;
            }
        }

        return null;
    }

    @Transactional
    public void aplicarHorarios() {

        ZonedDateTime ahora = ZonedDateTime.now(ZONA);
        LocalDateTime hace5 = LocalDateTime.now().minusMinutes(5);

        for (Negocio negocio : negocioRepository.findByActivoTrueAndEstadoAprobacion(EstadoAprobacion.APROBADO)) {

            if (!negocio.getAperturaAutomatica()) {
                continue;
            }

            LocalDate ventana = ventanaActual(negocio, ahora);
            boolean abierto = Boolean.TRUE.equals(negocio.getAbierto());

            if (ventana != null && !abierto) {
                boolean conectada = negocio.getUltimaConexion() != null && negocio.getUltimaConexion().isAfter(hace5);
                if (conectada && !ventana.equals(negocio.getCerradoManualFecha())) {
                    negocio.setAbierto(true);
                    negocio.setAbiertoPorHorario(true);
                    negocio.setMotivoCierre(null);
                    negocio.setUltimaConexion(LocalDateTime.now());
                    negocio.setPedidosSinResponder(0);
                    negocioRepository.save(negocio);
                }
            } else if (ventana == null && abierto && negocio.getAbiertoPorHorario()) {
                negocio.setAbierto(false);
                negocio.setAbiertoPorHorario(false);
                negocio.setUbicacionEnVivo(false);
                negocioRepository.save(negocio);
            }
        }
    }

    @Transactional
    public void cerrarSinConexion() {

        LocalDateTime ahora = LocalDateTime.now();
        LocalDateTime limite = ahora.minusMinutes(Limites.MINUTOS_SIN_CONEXION);

        for (Negocio negocio : negocioRepository.findByAbiertoTrue()) {
            if (negocio.getUltimaConexion() == null) {
                negocio.setUltimaConexion(ahora);
                negocioRepository.save(negocio);
            } else if (negocio.getUltimaConexion().isBefore(limite)) {
                cerrarAutomatico(negocio, "Cerramos tu puesto porque estuviste "
                        + Limites.MINUTOS_SIN_CONEXION + " minutos sin conexión");
            }
        }
    }

    public Negocio actualizarUbicacion(Usuario usuario, Double latitud, Double longitud, Boolean enVivo) {

        Negocio negocio = obtenerDelPropietario(usuario);

        if (latitud != null || longitud != null) {
            if (latitud == null || longitud == null
                    || latitud < -90 || latitud > 90 || longitud < -180 || longitud > 180) {
                throw ApiException.solicitudInvalida("La ubicación no es válida");
            }
            negocio.setLatitud(latitud);
            negocio.setLongitud(longitud);
            negocio.setUbicacionActualizada(LocalDateTime.now());
        }

        if (enVivo != null) {
            negocio.setUbicacionEnVivo(enVivo);
        }

        return negocioRepository.save(negocio);
    }

    @Transactional
    public Negocio cambiarActivo(Long id, boolean activo) {

        Negocio negocio = obtenerPorId(id);
        negocio.setActivo(activo);

        if (!activo) {
            negocio.setAbierto(false);
            negocio.setUbicacionEnVivo(false);
        }

        Usuario propietario = negocio.getPropietario();
        if (propietario != null && Rol.NEGOCIO.equals(propietario.getRol())) {
            propietario.setActivo(activo);
            usuarioRepository.save(propietario);
        }

        return negocioRepository.save(negocio);
    }

    @Transactional
    public void eliminar(Long id) {

        Negocio negocio = obtenerPorId(id);

        if (pedidoRepository.existsByNegocioId(id)) {
            throw ApiException.conflicto(
                    "El negocio tiene pedidos registrados. Deshabilítalo en lugar de eliminarlo");
        }

        if (productoRepository.countByNegocioId(id) > 0) {
            throw ApiException.conflicto(
                    "El negocio tiene productos registrados. Elimínalos primero o deshabilita el negocio");
        }

        negocioRepository.delete(negocio);
    }

    private static String valido(String valor, String patron) {
        return valor != null && valor.matches(patron) ? valor : null;
    }

    private void copiarDatos(Negocio origen, Negocio destino) {

        String nombre = AuthService.texto(origen.getNombre());

        if (nombre == null && destino.getNombre() == null) {
            throw ApiException.solicitudInvalida("El nombre del negocio es obligatorio");
        }

        if (nombre != null) {
            destino.setNombre(nombre);
        }

        destino.setDescripcion(AuthService.texto(origen.getDescripcion()));
        destino.setTipoComida(AuthService.texto(origen.getTipoComida()));
        destino.setDireccion(AuthService.texto(origen.getDireccion()));
        destino.setTelefono(AuthService.texto(origen.getTelefono()));
        destino.setImagen(AuthService.texto(origen.getImagen()));
        destino.setHorario(AuthService.texto(origen.getHorario()));
        destino.setDiasAtencion(valido(origen.getDiasAtencion(), "[01]{7}"));
        destino.setHoraApertura(valido(origen.getHoraApertura(), "([01][0-9]|2[0-3]):[0-5][0-9]"));
        destino.setHoraCierre(valido(origen.getHoraCierre(), "([01][0-9]|2[0-3]):[0-5][0-9]"));

        if ("0000000".equals(destino.getDiasAtencion())) {
            throw ApiException.solicitudInvalida("Elige al menos un día de atención");
        }

        if (destino.getHoraApertura() != null && destino.getHoraApertura().equals(destino.getHoraCierre())) {
            throw ApiException.solicitudInvalida("La hora de cierre tiene que ser distinta a la de apertura");
        }

        if (origen.getLatitud() != null) {
            if (origen.getLatitud() < -90 || origen.getLatitud() > 90) {
                throw ApiException.solicitudInvalida("La latitud no es válida");
            }
            destino.setLatitud(origen.getLatitud());
        }

        if (origen.getLongitud() != null) {
            if (origen.getLongitud() < -180 || origen.getLongitud() > 180) {
                throw ApiException.solicitudInvalida("La longitud no es válida");
            }
            destino.setLongitud(origen.getLongitud());
        }

        if (origen.getTiempoEstimado() != null) {
            if (origen.getTiempoEstimado() < 1 || origen.getTiempoEstimado() > 240) {
                throw ApiException.solicitudInvalida("El tiempo estimado debe estar entre 1 y 240 minutos");
            }
            destino.setTiempoEstimado(origen.getTiempoEstimado());
        }
    }

    public static double distanciaMetros(double lat1, double lon1, double lat2, double lon2) {

        double radioTierra = 6371000;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);

        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);

        return radioTierra * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    private static String normalizar(String valor) {
        String limpio = AuthService.texto(valor);
        return limpio == null ? null : limpio.toLowerCase(Locale.ROOT);
    }

    private static boolean contiene(String valor, String filtro) {
        return valor != null && valor.toLowerCase(Locale.ROOT).contains(filtro);
    }
}
