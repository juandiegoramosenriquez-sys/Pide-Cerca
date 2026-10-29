package com.pidecerca.backend.controller;

import com.pidecerca.backend.dto.MotivoRequest;
import com.pidecerca.backend.dto.SolicitudNegocioResponse;
import com.pidecerca.backend.entity.Negocio;
import com.pidecerca.backend.entity.RegistroAccion;
import com.pidecerca.backend.service.NegocioService;
import com.pidecerca.backend.service.RegistroAccionService;
import com.pidecerca.backend.service.ResumenService;
import com.pidecerca.backend.service.UsuarioActualService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final ResumenService resumenService;
    private final NegocioService negocioService;
    private final RegistroAccionService registroAccionService;
    private final UsuarioActualService usuarioActualService;

    public AdminController(
            ResumenService resumenService,
            NegocioService negocioService,
            RegistroAccionService registroAccionService,
            UsuarioActualService usuarioActualService) {

        this.resumenService = resumenService;
        this.negocioService = negocioService;
        this.registroAccionService = registroAccionService;
        this.usuarioActualService = usuarioActualService;
    }

    @GetMapping("/resumen")
    public Map<String, Object> resumen() {
        return resumenService.obtener();
    }

    @GetMapping("/solicitudes")
    public List<SolicitudNegocioResponse> solicitudes() {
        return negocioService.listarSolicitudes().stream().map(SolicitudNegocioResponse::de).toList();
    }

    @GetMapping("/negocios")
    public List<SolicitudNegocioResponse> negocios() {
        return negocioService.listarTodos().stream().map(SolicitudNegocioResponse::de).toList();
    }

    @PostMapping("/negocios/{id}/aprobar")
    public SolicitudNegocioResponse aprobar(@PathVariable Long id) {
        Negocio negocio = negocioService.aprobar(id);
        registroAccionService.registrar(usuarioActualService.obtener(), "APROBAR_NEGOCIO",
                "Aprobaste el puesto " + negocio.getNombre());
        return SolicitudNegocioResponse.de(negocio);
    }

    @PostMapping("/negocios/{id}/rechazar")
    public SolicitudNegocioResponse rechazar(@PathVariable Long id, @RequestBody(required = false) MotivoRequest request) {
        Negocio negocio = negocioService.rechazar(id, request == null ? null : request.motivo());
        registroAccionService.registrar(usuarioActualService.obtener(), "RECHAZAR_NEGOCIO",
                "Rechazaste el puesto " + negocio.getNombre() + ": " + negocio.getMotivoRechazo());
        return SolicitudNegocioResponse.de(negocio);
    }

    @GetMapping("/registro")
    public List<RegistroAccion> registro() {
        return registroAccionService.listarRecientes();
    }
}
