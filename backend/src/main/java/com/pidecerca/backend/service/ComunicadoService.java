package com.pidecerca.backend.service;

import com.pidecerca.backend.entity.Comunicado;
import com.pidecerca.backend.entity.Negocio;
import com.pidecerca.backend.entity.Rol;
import com.pidecerca.backend.entity.Usuario;
import com.pidecerca.backend.exception.ApiException;
import com.pidecerca.backend.repository.ComunicadoRepository;
import com.pidecerca.backend.repository.NegocioRepository;
import com.pidecerca.backend.repository.UsuarioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class ComunicadoService {

    private final ComunicadoRepository comunicadoRepository;
    private final UsuarioRepository usuarioRepository;
    private final NegocioRepository negocioRepository;
    private final NotificacionService notificacionService;

    public ComunicadoService(
            ComunicadoRepository comunicadoRepository,
            UsuarioRepository usuarioRepository,
            NegocioRepository negocioRepository,
            NotificacionService notificacionService) {
        this.comunicadoRepository = comunicadoRepository;
        this.usuarioRepository = usuarioRepository;
        this.negocioRepository = negocioRepository;
        this.notificacionService = notificacionService;
    }

    public List<Comunicado> recientes() {
        return comunicadoRepository.findTop50ByOrderByFechaDesc();
    }

    @Transactional
    public Comunicado enviar(String destino, Long negocioId, String titulo, String mensaje) {

        String asunto = AuthService.texto(titulo);
        String texto = AuthService.texto(mensaje);

        if (asunto == null || texto == null) {
            throw ApiException.solicitudInvalida("Escribe el título y el mensaje");
        }

        if (asunto.length() > 80 || texto.length() > 600) {
            throw ApiException.solicitudInvalida("El título o el mensaje son muy largos");
        }

        String clase = destino == null ? "" : destino.trim().toUpperCase();
        List<Usuario> receptores = new ArrayList<>();
        String nombreDestino;

        switch (clase) {
            case "CLIENTES" -> {
                receptores.addAll(usuarioRepository.findByRol(Rol.CLIENTE));
                nombreDestino = "Todos los clientes";
            }
            case "NEGOCIOS" -> {
                receptores.addAll(usuarioRepository.findByRol(Rol.NEGOCIO));
                nombreDestino = "Todas las tías";
            }
            case "TODOS" -> {
                receptores.addAll(usuarioRepository.findByRol(Rol.CLIENTE));
                receptores.addAll(usuarioRepository.findByRol(Rol.NEGOCIO));
                nombreDestino = "Todos";
            }
            case "PUESTO" -> {
                Negocio negocio = negocioRepository.findById(negocioId == null ? -1L : negocioId)
                        .orElseThrow(() -> ApiException.noEncontrado("Puesto no encontrado"));
                receptores.add(negocio.getPropietario());
                nombreDestino = negocio.getNombre();
            }
            default -> throw ApiException.solicitudInvalida("Elige a quién se lo mandas");
        }

        int enviados = 0;

        for (Usuario receptor : receptores) {
            if (receptor != null && !Boolean.FALSE.equals(receptor.getActivo())) {
                notificacionService.crear(receptor, null, asunto, texto);
                enviados++;
            }
        }

        Comunicado comunicado = new Comunicado();
        comunicado.setTitulo(asunto);
        comunicado.setMensaje(texto);
        comunicado.setDestino(clase);
        comunicado.setDestinatario(nombreDestino);
        comunicado.setEnviados(enviados);
        comunicado.setFecha(LocalDateTime.now());

        return comunicadoRepository.save(comunicado);
    }
}
