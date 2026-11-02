package com.pidecerca.backend.controller;

import com.pidecerca.backend.dto.AjustesRequest;
import com.pidecerca.backend.dto.ComunicadoRequest;
import com.pidecerca.backend.dto.MotivoRequest;
import com.pidecerca.backend.dto.UsuarioResponse;
import com.pidecerca.backend.entity.Ajustes;
import com.pidecerca.backend.entity.Comunicado;
import com.pidecerca.backend.entity.Reclamo;
import com.pidecerca.backend.entity.Usuario;
import com.pidecerca.backend.service.AjustesService;
import com.pidecerca.backend.service.ComunicadoService;
import com.pidecerca.backend.service.ControlAdminService;
import com.pidecerca.backend.service.RegistroAccionService;
import com.pidecerca.backend.service.ReclamoService;
import com.pidecerca.backend.service.UsuarioActualService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminControlController {

    private final ControlAdminService controlService;
    private final AjustesService ajustesService;
    private final ComunicadoService comunicadoService;
    private final ReclamoService reclamoService;
    private final RegistroAccionService registroAccionService;
    private final UsuarioActualService usuarioActualService;

    public AdminControlController(
            ControlAdminService controlService,
            AjustesService ajustesService,
            ComunicadoService comunicadoService,
            ReclamoService reclamoService,
            RegistroAccionService registroAccionService,
            UsuarioActualService usuarioActualService) {
        this.controlService = controlService;
        this.ajustesService = ajustesService;
        this.comunicadoService = comunicadoService;
        this.reclamoService = reclamoService;
        this.registroAccionService = registroAccionService;
        this.usuarioActualService = usuarioActualService;
    }

    @GetMapping("/ranking")
    public List<ControlAdminService.FilaRanking> ranking(@RequestParam(defaultValue = "hoy") String periodo) {
        return controlService.ranking(periodo);
    }

    @GetMapping("/problemas")
    public Map<String, List<ControlAdminService.Problema>> problemas() {
        return controlService.problemas();
    }

    @GetMapping("/clientes")
    public List<ControlAdminService.FilaCliente> clientes() {
        return controlService.clientes();
    }

    @GetMapping("/clientes/{id}/ficha")
    public Map<String, Object> fichaCliente(@PathVariable Long id) {
        Map<String, Object> ficha = controlService.fichaCliente(id);
        registroAccionService.registrar(usuarioActualService.obtener(), "VER_FICHA_CLIENTE", "Viste la ficha de " + ficha.get("nombre"));
        return ficha;
    }

    @GetMapping("/dinero")
    public Map<String, Object> dinero() {
        return controlService.dinero();
    }

    @GetMapping("/seguridad")
    public Map<String, Object> seguridad() {
        return controlService.seguridad();
    }

    @GetMapping("/reporte")
    public ResponseEntity<byte[]> reporte(@RequestParam String tipo) {
        byte[] datos = controlService.reporte(tipo).getBytes(StandardCharsets.UTF_8);
        registroAccionService.registrar(usuarioActualService.obtener(), "DESCARGAR_REPORTE", "Descargaste el reporte de " + tipo);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"pidecerca-" + tipo + ".csv\"")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(datos);
    }

    @PutMapping("/ajustes")
    public Ajustes guardarAjustes(@RequestBody AjustesRequest request) {
        Ajustes ajustes = ajustesService.actualizar(request);
        registroAccionService.registrar(usuarioActualService.obtener(), "CAMBIAR_REGLAS", "Cambiaste las reglas de la plataforma");
        return ajustes;
    }

    @GetMapping("/comunicados")
    public List<Comunicado> comunicados() {
        return comunicadoService.recientes();
    }

    @PostMapping("/comunicados")
    public Comunicado enviarComunicado(@RequestBody ComunicadoRequest request) {
        Comunicado comunicado = comunicadoService.enviar(request.destino(), request.negocioId(), request.titulo(), request.mensaje());
        registroAccionService.registrar(usuarioActualService.obtener(), "ENVIAR_COMUNICADO",
                "Mandaste un comunicado a " + comunicado.getDestinatario());
        return comunicado;
    }

    @GetMapping("/reclamos")
    public List<Reclamo> reclamos() {
        return reclamoService.todos();
    }

    @PutMapping("/reclamos/{id}/resolver")
    public Reclamo resolver(@PathVariable Long id, @RequestBody(required = false) MotivoRequest request) {
        Reclamo reclamo = reclamoService.resolver(id, request == null ? null : request.motivo());
        registroAccionService.registrar(usuarioActualService.obtener(), "RESOLVER_RECLAMO", "Resolviste el reclamo #" + id);
        return reclamo;
    }

    @PutMapping("/usuarios/{id}/perdonar-faltas")
    public UsuarioResponse perdonarFaltas(@PathVariable Long id) {
        Usuario usuario = controlService.perdonarFaltas(id);
        registroAccionService.registrar(usuarioActualService.obtener(), "PERDONAR_FALTAS", "Perdonaste las faltas de " + usuario.getNombre());
        return UsuarioResponse.protegido(usuario);
    }

    @PutMapping("/usuarios/{id}/cerrar-sesion")
    public UsuarioResponse cerrarSesion(@PathVariable Long id) {
        Usuario usuario = controlService.cerrarSesion(id);
        registroAccionService.registrar(usuarioActualService.obtener(), "CERRAR_SESION", "Cerraste la sesión de " + usuario.getNombre());
        return UsuarioResponse.protegido(usuario);
    }
}
