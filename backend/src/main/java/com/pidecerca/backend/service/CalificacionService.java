package com.pidecerca.backend.service;

import com.pidecerca.backend.entity.Calificacion;
import com.pidecerca.backend.entity.EstadoPedido;
import com.pidecerca.backend.entity.Favorito;
import com.pidecerca.backend.entity.Negocio;
import com.pidecerca.backend.entity.Pedido;
import com.pidecerca.backend.entity.Usuario;
import com.pidecerca.backend.exception.ApiException;
import com.pidecerca.backend.repository.CalificacionRepository;
import com.pidecerca.backend.repository.FavoritoRepository;
import com.pidecerca.backend.repository.NegocioRepository;
import com.pidecerca.backend.repository.PedidoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class CalificacionService {

    private final CalificacionRepository calificacionRepository;
    private final FavoritoRepository favoritoRepository;
    private final PedidoRepository pedidoRepository;
    private final NegocioRepository negocioRepository;

    public CalificacionService(
            CalificacionRepository calificacionRepository,
            FavoritoRepository favoritoRepository,
            PedidoRepository pedidoRepository,
            NegocioRepository negocioRepository) {
        this.calificacionRepository = calificacionRepository;
        this.favoritoRepository = favoritoRepository;
        this.pedidoRepository = pedidoRepository;
        this.negocioRepository = negocioRepository;
    }

    @Transactional
    public Calificacion calificar(Usuario usuario, Long pedidoId, Integer estrellas, String comentario) {

        Pedido pedido = pedidoRepository.findById(pedidoId)
                .orElseThrow(() -> ApiException.noEncontrado("Pedido no encontrado"));

        if (pedido.getUsuario() == null || !pedido.getUsuario().getId().equals(usuario.getId())) {
            throw ApiException.prohibido("Este pedido no es tuyo");
        }

        if (pedido.getEstado() != EstadoPedido.RECOGIDO) {
            throw ApiException.solicitudInvalida("Solo puedes calificar un pedido que ya recogiste");
        }

        if (estrellas == null || estrellas < 1 || estrellas > 5) {
            throw ApiException.solicitudInvalida("Elige de 1 a 5 estrellas");
        }

        if (calificacionRepository.findByPedidoId(pedidoId).isPresent()) {
            throw ApiException.conflicto("Ya calificaste este pedido");
        }

        String texto = AuthService.texto(comentario);

        if (texto != null && texto.length() > 300) {
            throw ApiException.solicitudInvalida("El comentario es muy largo. Usa menos de 300 letras");
        }

        Calificacion calificacion = new Calificacion();
        calificacion.setPedidoId(pedidoId);
        calificacion.setUsuario(usuario);
        calificacion.setNegocio(pedido.getNegocio());
        calificacion.setEstrellas(estrellas);
        calificacion.setComentario(texto);
        calificacion.setFecha(LocalDateTime.now());

        return calificacionRepository.save(calificacion);
    }

    public Calificacion delPedido(Usuario usuario, Long pedidoId) {

        Pedido pedido = pedidoRepository.findById(pedidoId)
                .orElseThrow(() -> ApiException.noEncontrado("Pedido no encontrado"));

        if (pedido.getUsuario() == null || !pedido.getUsuario().getId().equals(usuario.getId())) {
            throw ApiException.prohibido("Este pedido no es tuyo");
        }

        return calificacionRepository.findByPedidoId(pedidoId).orElse(null);
    }

    public List<Long> favoritosDe(Usuario usuario) {
        return favoritoRepository.findByUsuarioId(usuario.getId()).stream()
                .map(f -> f.getNegocio().getId())
                .toList();
    }

    @Transactional
    public void marcarFavorito(Usuario usuario, Long negocioId, boolean favorito) {

        Negocio negocio = negocioRepository.findById(negocioId)
                .orElseThrow(() -> ApiException.noEncontrado("Puesto no encontrado"));

        var existente = favoritoRepository.findByUsuarioIdAndNegocioId(usuario.getId(), negocioId);

        if (favorito && existente.isEmpty()) {
            Favorito nuevo = new Favorito();
            nuevo.setUsuario(usuario);
            nuevo.setNegocio(negocio);
            favoritoRepository.save(nuevo);
        } else if (!favorito) {
            existente.ifPresent(favoritoRepository::delete);
        }
    }
}
