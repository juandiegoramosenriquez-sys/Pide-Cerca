package com.pidecerca.backend.controller;

import com.pidecerca.backend.dto.ReclamoRequest;
import com.pidecerca.backend.entity.Reclamo;
import com.pidecerca.backend.service.ReclamoService;
import com.pidecerca.backend.service.UsuarioActualService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/reclamos")
public class ReclamoController {

    private final ReclamoService reclamoService;
    private final UsuarioActualService usuarioActualService;

    public ReclamoController(ReclamoService reclamoService, UsuarioActualService usuarioActualService) {
        this.reclamoService = reclamoService;
        this.usuarioActualService = usuarioActualService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Reclamo crear(@RequestBody ReclamoRequest request) {
        return reclamoService.crear(usuarioActualService.obtener(), request.tipo(), request.mensaje(), request.pedidoId());
    }

    @GetMapping("/mios")
    public List<Reclamo> mios() {
        return reclamoService.mios(usuarioActualService.obtener());
    }
}
