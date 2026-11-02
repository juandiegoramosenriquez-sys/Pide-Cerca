package com.pidecerca.backend.service;

import com.pidecerca.backend.entity.Reclamo;
import com.pidecerca.backend.entity.Usuario;
import com.pidecerca.backend.exception.ApiException;
import com.pidecerca.backend.repository.ReclamoRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Set;

@Service
public class ReclamoService {

    private static final ZoneId ZONA = ZoneId.of("America/Lima");

    private static final Set<String> TIPOS = Set.of("PEDIDO", "PUESTO", "PAGO", "APP", "OTRO");

    private final ReclamoRepository reclamoRepository;
    private final NotificacionService notificacionService;
    private final AjustesService ajustesService;

    public ReclamoService(ReclamoRepository reclamoRepository, NotificacionService notificacionService, AjustesService ajustesService) {
        this.ajustesService = ajustesService;
        this.reclamoRepository = reclamoRepository;
        this.notificacionService = notificacionService;
    }

    public Reclamo crear(Usuario usuario, String tipo, String mensaje, Long pedidoId) {

        String texto = AuthService.texto(mensaje);

        if (texto == null || texto.length() < 5) {
            throw ApiException.solicitudInvalida("Cuéntanos qué pasó con unas palabras más");
        }

        if (texto.length() > 600) {
            throw ApiException.solicitudInvalida("El mensaje es muy largo. Usa menos de 600 letras");
        }

        int permitidos = ajustesService.obtener().getReclamosPorDia();

        if (reclamoRepository.countByUsuarioIdAndFechaAfter(usuario.getId(), LocalDate.now(ZONA).atStartOfDay().minusSeconds(1)) >= permitidos) {
            throw ApiException.solicitudInvalida(permitidos == 1
                    ? "Ya enviaste un reclamo hoy. Puedes enviar otro mañana"
                    : "Ya enviaste " + permitidos + " reclamos hoy. Puedes enviar más mañana");
        }

        String clase = tipo == null ? "OTRO" : tipo.trim().toUpperCase();

        Reclamo reclamo = new Reclamo();
        reclamo.setUsuario(usuario);
        reclamo.setPedidoId(pedidoId);
        reclamo.setTipo(TIPOS.contains(clase) ? clase : "OTRO");
        reclamo.setMensaje(texto);
        reclamo.setEstado(Reclamo.ABIERTO);
        reclamo.setFecha(LocalDateTime.now(ZONA));

        return reclamoRepository.save(reclamo);
    }

    public List<Reclamo> mios(Usuario usuario) {
        return reclamoRepository.findByUsuarioIdOrderByFechaDesc(usuario.getId());
    }

    public List<Reclamo> todos() {
        return reclamoRepository.findAllByOrderByFechaDesc();
    }

    public Reclamo resolver(Long id, String respuesta) {

        Reclamo reclamo = reclamoRepository.findById(id)
                .orElseThrow(() -> ApiException.noEncontrado("Reclamo no encontrado"));

        String texto = AuthService.texto(respuesta);

        reclamo.setEstado(Reclamo.RESUELTO);
        reclamo.setRespuesta(texto);
        reclamo.setFechaResolucion(LocalDateTime.now());

        Reclamo guardado = reclamoRepository.save(reclamo);

        notificacionService.crear(guardado.getUsuario(), null, "Respondimos tu reclamo",
                texto == null ? "Tu reclamo fue marcado como resuelto" : texto);

        return guardado;
    }
}
