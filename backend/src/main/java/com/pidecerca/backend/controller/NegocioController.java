package com.pidecerca.backend.controller;

import com.pidecerca.backend.dto.CrearNegocioRequest;
import com.pidecerca.backend.entity.Negocio;
import com.pidecerca.backend.service.NegocioService;
import com.pidecerca.backend.service.RegistroAccionService;
import com.pidecerca.backend.service.UsuarioActualService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/negocios")
public class NegocioController {

    private final NegocioService negocioService;
    private final UsuarioActualService usuarioActualService;
    private final RegistroAccionService registroAccionService;

    public NegocioController(
            NegocioService negocioService,
            UsuarioActualService usuarioActualService,
            RegistroAccionService registroAccionService) {

        this.negocioService = negocioService;
        this.usuarioActualService = usuarioActualService;
        this.registroAccionService = registroAccionService;
    }

    private void anotar(String accion, String detalle) {
        registroAccionService.registrar(usuarioActualService.obtener(), accion, detalle);
    }

    @GetMapping
    public List<Negocio> buscar(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String tipo,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng) {

        return negocioService.buscar(q, tipo, lat, lng);
    }

    @GetMapping("/todos")
    public List<Negocio> listarTodos() {

        if (!usuarioActualService.esAdmin(usuarioActualService.obtener())) {
            return negocioService.buscar(null, null, null, null);
        }

        return negocioService.listarTodos();
    }

    @GetMapping("/{id}")
    public Negocio obtenerPorId(@PathVariable Long id) {
        return negocioService.obtenerPorId(id);
    }

    @GetMapping("/mio")
    public Negocio miNegocio() {
        return negocioService.obtenerDelPropietario(usuarioActualService.obtener());
    }

    @PutMapping("/mio")
    public Negocio actualizarMiNegocio(@RequestBody Negocio negocio) {
        return negocioService.actualizarMio(usuarioActualService.obtener(), negocio);
    }

    @PutMapping("/mio/abierto")
    public Negocio cambiarAbierto(@RequestParam boolean valor) {
        return negocioService.cambiarAbierto(usuarioActualService.obtener(), valor);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Negocio crear(@RequestBody CrearNegocioRequest request) {
        Negocio negocio = negocioService.crear(request);
        anotar("CREAR_NEGOCIO", "Registraste el puesto " + negocio.getNombre());
        return negocio;
    }

    @PutMapping("/{id}")
    public Negocio actualizar(
            @PathVariable Long id,
            @RequestBody Negocio negocio,
            @RequestParam(required = false) Long propietarioId) {

        Negocio actualizado = negocioService.actualizarComoAdmin(id, negocio, propietarioId);
        anotar("EDITAR_NEGOCIO", "Editaste el puesto " + actualizado.getNombre());
        return actualizado;
    }

    @PostMapping("/{id}/habilitar")
    public Negocio habilitar(@PathVariable Long id) {
        Negocio negocio = negocioService.cambiarActivo(id, true);
        anotar("HABILITAR_NEGOCIO", "Habilitaste el puesto " + negocio.getNombre());
        return negocio;
    }

    @PostMapping("/{id}/deshabilitar")
    public Negocio deshabilitar(@PathVariable Long id) {
        Negocio negocio = negocioService.cambiarActivo(id, false);
        anotar("SUSPENDER_NEGOCIO", "Suspendiste el puesto " + negocio.getNombre());
        return negocio;
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminar(@PathVariable Long id) {
        String nombre = negocioService.obtenerPorId(id).getNombre();
        negocioService.eliminar(id);
        anotar("ELIMINAR_NEGOCIO", "Eliminaste el puesto " + nombre);
    }
}
