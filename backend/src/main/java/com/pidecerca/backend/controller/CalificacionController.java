package com.pidecerca.backend.controller;

import com.pidecerca.backend.entity.Calificacion;
import com.pidecerca.backend.service.CalificacionService;
import com.pidecerca.backend.service.UsuarioActualService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
public class CalificacionController {

    public record CalificarRequest(Integer estrellas, String comentario) {
    }

    private final CalificacionService calificacionService;
    private final UsuarioActualService usuarioActualService;

    public CalificacionController(CalificacionService calificacionService, UsuarioActualService usuarioActualService) {
        this.calificacionService = calificacionService;
        this.usuarioActualService = usuarioActualService;
    }

    @PostMapping("/pedidos/{id}/calificar")
    @ResponseStatus(HttpStatus.CREATED)
    public Calificacion calificar(@PathVariable Long id, @RequestBody CalificarRequest request) {
        return calificacionService.calificar(usuarioActualService.obtener(), id, request.estrellas(), request.comentario());
    }

    @GetMapping("/pedidos/{id}/calificacion")
    public Calificacion calificacion(@PathVariable Long id) {
        return calificacionService.delPedido(usuarioActualService.obtener(), id);
    }

    @GetMapping("/favoritos")
    public List<Long> favoritos() {
        return calificacionService.favoritosDe(usuarioActualService.obtener());
    }

    @PutMapping("/favoritos/{negocioId}")
    public List<Long> agregarFavorito(@PathVariable Long negocioId) {
        calificacionService.marcarFavorito(usuarioActualService.obtener(), negocioId, true);
        return calificacionService.favoritosDe(usuarioActualService.obtener());
    }

    @DeleteMapping("/favoritos/{negocioId}")
    public List<Long> quitarFavorito(@PathVariable Long negocioId) {
        calificacionService.marcarFavorito(usuarioActualService.obtener(), negocioId, false);
        return calificacionService.favoritosDe(usuarioActualService.obtener());
    }
}
